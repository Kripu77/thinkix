import { expect, test, type Page } from '@playwright/test';
import {
  E2E_BASE_URL,
  openAppMenu,
  waitForCollaborationBoard,
} from './utils';

const TEST_BASE_URL = `${E2E_BASE_URL}/test/collaboration`;

async function enableCollaboration(page: Page) {
  const statusBar = page.getByTestId('collaboration-status-bar');
  const alreadyEnabled = await statusBar.isVisible({ timeout: 1500 }).catch(() => false);

  if (alreadyEnabled) {
    return;
  }

  const collaborateButton = page.getByTestId('collaborate-button');
  await expect(collaborateButton).toBeVisible({ timeout: 10000 });
  await collaborateButton.click();
  await expect(statusBar).toBeVisible({
    timeout: 10000,
  });
}

test.describe('Collaboration Flow', () => {
  test('displays collaborate button on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await waitForCollaborationBoard(page, TEST_BASE_URL);
    await expect(page.getByTestId('collaborate-button')).toBeVisible();
  });

  test('hides collaborate button on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await waitForCollaborationBoard(page, TEST_BASE_URL);
    await expect(page.getByTestId('collaborate-button')).toBeHidden();
  });

  test('keeps collaborate button in the top-right area', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await waitForCollaborationBoard(page, TEST_BASE_URL);

    const collaborateButton = page.getByTestId('collaborate-button');
    const boundingBox = await collaborateButton.boundingBox();
    expect(boundingBox).not.toBeNull();

    if (boundingBox) {
      expect(boundingBox.x).toBeGreaterThan(500);
      expect(boundingBox.y).toBeLessThan(100);
    }
  });
});

test.describe('Multi-User Collaboration', () => {
  test('two users can join the same room via URL', async ({ browser }) => {
    const roomId = `test-room-${Date.now()}`;
    const roomUrl = `${TEST_BASE_URL}?room=${roomId}`;

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.setViewportSize({ width: 1280, height: 720 });
    await page2.setViewportSize({ width: 1280, height: 720 });

    try {
      await waitForCollaborationBoard(page1, roomUrl);
      await waitForCollaborationBoard(page2, roomUrl);

      await expect(page1).toHaveURL(new RegExp(`room=${roomId}`));
      await expect(page2).toHaveURL(new RegExp(`room=${roomId}`));
      await expect(page1.locator('[data-board="true"]')).toBeVisible();
      await expect(page2.locator('[data-board="true"]')).toBeVisible();
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('shows collaborating status when enabled', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await waitForCollaborationBoard(page, `${TEST_BASE_URL}?room=test-status-room`);
    await enableCollaboration(page);
    await expect(page.getByTestId('collaboration-status-text')).toHaveText(
      /Just you|online/i,
    );
  });

  test('can leave collaboration', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await waitForCollaborationBoard(page, `${TEST_BASE_URL}?room=leave-room`);
    await enableCollaboration(page);
    await page.getByTestId('collaboration-leave-button').click();
    await expect(page.getByTestId('collaborate-button')).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Collaboration Status Bar', () => {
  test('shows connection status when collaboration is active', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const roomId = `status-test-${Date.now()}`;
    await waitForCollaborationBoard(page, `${TEST_BASE_URL}?room=${roomId}`);
    await enableCollaboration(page);
    await expect(page.getByTestId('collaboration-status-text')).toHaveText(
      /Just you|online/i,
    );
  });
});

test.describe('User Presence', () => {
  test('accepts cursor movement over the board', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await waitForCollaborationBoard(page, TEST_BASE_URL);

    const canvas = page.locator('.board-wrapper');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    }
  });
});

test.describe('Board Sharing', () => {
  test('share button copies the room URL to the clipboard', async ({
    context,
    page,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.setViewportSize({ width: 1280, height: 720 });

    const roomId = `share-test-${Date.now()}`;
    await waitForCollaborationBoard(page, `${TEST_BASE_URL}?room=${roomId}`);
    await enableCollaboration(page);

    await page.getByTestId('collaboration-share-button').click();

    await expect(async () => {
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toContain(roomId);
    }).toPass({ timeout: 5000 });
  });
});

test.describe('Error Handling', () => {
  test('handles an empty room ID gracefully', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await waitForCollaborationBoard(page, `${TEST_BASE_URL}?room=`);
    await expect(page.locator('.board-wrapper')).toBeVisible();
  });

  test('shows disconnected or reconnecting state when offline', async ({
    context,
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const roomId = `network-test-${Date.now()}`;
    await waitForCollaborationBoard(page, `${TEST_BASE_URL}?room=${roomId}`);
    await enableCollaboration(page);

    await context.setOffline(true);
    await expect(page.getByTestId('collaboration-status-text')).toHaveText(
      /Disconnected|Reconnecting/i,
      { timeout: 10000 },
    );
    await context.setOffline(false);
  });
});

test.describe('Mobile Responsiveness', () => {
  test('shows collaboration controls in the app menu on mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await waitForCollaborationBoard(page, TEST_BASE_URL);

    const menu = await openAppMenu(page);
    await expect(menu).toBeVisible();
    await expect(page.getByTestId('app-menu-start-collaboration')).toBeVisible();
  });
});
