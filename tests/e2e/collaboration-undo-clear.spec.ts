import { expect, test, type Page } from '@playwright/test';
import {
  clickOnCanvas,
  E2E_BASE_URL,
  getElementCount,
  hasElementOnCanvas,
  openAppMenu,
  selectTool,
  waitForCollaborationBoard,
} from './utils';
import { safeClose } from './helpers/browser';

const TEST_BASE_URL = `${E2E_BASE_URL}/test/collaboration`;
const MODIFIER = process.platform === 'darwin' ? 'Meta' : 'Control';

async function enableCollaboration(page: Page, roomUrl: string) {
  await waitForCollaborationBoard(page, roomUrl);
  const statusBar = page.getByTestId('collaboration-status-bar');
  const alreadyEnabled = await statusBar.isVisible({ timeout: 1500 }).catch(() => false);

  if (alreadyEnabled) {
    return;
  }

  await expect(page.getByTestId('collaborate-button')).toBeVisible({
    timeout: 10000,
  });
  await page.getByTestId('collaborate-button').click();
  await expect(statusBar).toBeVisible({
    timeout: 10000,
  });
}

async function drawCollaborativeRectangle(page: Page) {
  await expect(selectTool(page, 'stickyNote')).resolves.toBe(true);
  await clickOnCanvas(page, 180, 180);
  await page.keyboard.type('Collaboration note');
  await page.keyboard.press('Escape');
  await expect.poll(() => getElementCount(page)).toBeGreaterThan(0);
}

test.describe('Collaboration Undo/Redo', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('undo and redo work in collaboration mode', async ({ page }) => {
    const roomId = `undo-test-${Date.now()}`;
    await enableCollaboration(page, `${TEST_BASE_URL}?room=${roomId}`);
    await drawCollaborativeRectangle(page);

    await page.keyboard.press(`${MODIFIER}+KeyZ`);
    await expect.poll(() => getElementCount(page)).toBe(0);

    await page.keyboard.press(`${MODIFIER}+Shift+KeyZ`);
    await expect.poll(() => getElementCount(page)).toBeGreaterThan(0);
  });

  test('undo and redo sync across two users', async ({ browser }) => {
    const roomId = `sync-undo-${Date.now()}`;
    const roomUrl = `${TEST_BASE_URL}?room=${roomId}`;

    const context = await browser.newContext();
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await page1.setViewportSize({ width: 1280, height: 720 });
    await page2.setViewportSize({ width: 1280, height: 720 });

    try {
      await enableCollaboration(page1, roomUrl);
      await enableCollaboration(page2, roomUrl);

      await drawCollaborativeRectangle(page1);
      await expect.poll(() => getElementCount(page2), { timeout: 10000 }).toBeGreaterThan(0);

      await expect(page1.getByTestId('undo-button')).toBeEnabled({ timeout: 10000 });
      await page1.getByTestId('undo-button').click();
      await expect.poll(() => getElementCount(page2), { timeout: 10000 }).toBe(0);

      await expect(page1.getByTestId('redo-button')).toBeEnabled({ timeout: 10000 });
      await page1.getByTestId('redo-button').click();
      await expect.poll(() => getElementCount(page2), { timeout: 10000 }).toBeGreaterThan(0);
    } finally {
      await safeClose(context);
    }
  });

  test('undo button is disabled with no undo history', async ({ page }) => {
    const roomId = `empty-undo-${Date.now()}`;
    await enableCollaboration(page, `${TEST_BASE_URL}?room=${roomId}`);
    await expect(page.getByTestId('undo-button')).toBeDisabled();
  });
});

test.describe('Clear Board Sync in Collaboration', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('clear board syncs to the collaborator', async ({ browser }) => {
    const roomId = `clear-sync-${Date.now()}`;
    const roomUrl = `${TEST_BASE_URL}?room=${roomId}`;

    const context = await browser.newContext();
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await page1.setViewportSize({ width: 1280, height: 720 });
    await page2.setViewportSize({ width: 1280, height: 720 });

    try {
      await enableCollaboration(page1, roomUrl);
      await enableCollaboration(page2, roomUrl);

      await drawCollaborativeRectangle(page1);
      await expect.poll(() => getElementCount(page2), { timeout: 10000 }).toBeGreaterThan(0);

      await openAppMenu(page1);
      await page1.getByTestId('app-menu-clear-board').click();
      await expect(page1.getByRole('dialog')).toBeVisible();
      await page1.getByTestId('clear-board-confirm').click();

      await expect.poll(() => getElementCount(page2), { timeout: 10000 }).toBe(0);
    } finally {
      await safeClose(context);
    }
  });

  test('clear board shows the confirmation dialog', async ({ page }) => {
    const roomId = `clear-confirm-${Date.now()}`;
    await enableCollaboration(page, `${TEST_BASE_URL}?room=${roomId}`);
    await drawCollaborativeRectangle(page);

    await openAppMenu(page);
    await page.getByTestId('app-menu-clear-board').click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByTestId('clear-board-confirm')).toBeVisible();
  });

  test('cancel clear board preserves elements', async ({ page }) => {
    const roomId = `clear-cancel-${Date.now()}`;
    await enableCollaboration(page, `${TEST_BASE_URL}?room=${roomId}`);
    await drawCollaborativeRectangle(page);
    expect(await hasElementOnCanvas(page)).toBe(true);

    await openAppMenu(page);
    await page.getByTestId('app-menu-clear-board').click();
    await page.getByTestId('clear-board-cancel').click();

    await expect.poll(() => hasElementOnCanvas(page)).toBe(true);
  });
});
