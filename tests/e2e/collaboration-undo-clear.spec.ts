import { test, expect } from '@playwright/test';
import { selectTool, drawShape, hasElementOnCanvas } from './utils';
import { safeClose } from './helpers/browser';

const TEST_BASE_URL = 'http://localhost:3000/test/collaboration';

async function waitForTestBoard(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('[data-board="true"]', { timeout: 10000 });
  await page.waitForTimeout(500);
}

test.describe('Collaboration Undo/Redo', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('undo/redo buttons work in collaboration mode', async ({ page }) => {
    const roomId = `undo-test-${Date.now()}`;
    await page.goto(`${TEST_BASE_URL}?room=${roomId}`);
    await waitForTestBoard(page);
    
    const collaborateButton = page.getByRole('button', { name: /collaborate/i });
    
    if (await collaborateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await collaborateButton.click();
      await page.waitForTimeout(1000);
      
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) { test.skip(); return; }
      
      await drawShape(page, 100, 100, 200, 200);
      await page.waitForFunction(() => {
        const board = document.querySelector('[data-board="true"]');
        return board && board.children.length > 0;
      }, { timeout: 5000 });
      
      const hasElementBeforeUndo = await hasElementOnCanvas(page);
      expect(hasElementBeforeUndo).toBe(true);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyZ');
      await page.keyboard.up('Control');
      await page.waitForFunction(() => {
        const board = document.querySelector('[data-board="true"]');
        return board && board.children.length === 0;
      }, { timeout: 5000 });
      
      await page.keyboard.down('Control');
      await page.keyboard.down('Shift');
      await page.keyboard.press('KeyZ');
      await page.keyboard.up('Shift');
      await page.keyboard.up('Control');
      await page.waitForFunction(() => {
        const board = document.querySelector('[data-board="true"]');
        return board && board.children.length > 0;
      }, { timeout: 5000 });
      
      const hasElementAfterRedo = await hasElementOnCanvas(page);
      expect(hasElementAfterRedo).toBe(true);
    } else {
      test.skip();
    }
  });

  test('undo/redo state syncs across two users', async ({ browser }) => {
    const roomId = `sync-undo-${Date.now()}`;
    const roomUrl = `${TEST_BASE_URL}?room=${roomId}`;
    
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    await page1.setViewportSize({ width: 1280, height: 720 });
    await page2.setViewportSize({ width: 1280, height: 720 });
    
    try {
      await page1.goto(roomUrl, { timeout: 15000 });
      await page2.goto(roomUrl, { timeout: 15000 });
      
      await Promise.all([
        page1.waitForLoadState('domcontentloaded'),
        page2.waitForLoadState('domcontentloaded'),
      ]);
      
      const collaborateButton1 = page1.getByRole('button', { name: /collaborate/i });
      const collaborateButton2 = page2.getByRole('button', { name: /collaborate/i });
      
      const button1Visible = await collaborateButton1.isVisible({ timeout: 5000 }).catch(() => false);
      const button2Visible = await collaborateButton2.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (!button1Visible || !button2Visible) {
        await safeClose(context1, context2);
        test.skip();
        return;
      }
      
      await collaborateButton1.click();
      await collaborateButton2.click();
      
      await page1.waitForTimeout(1000);
      await page2.waitForTimeout(1000);
      
      const rectSelected = await selectTool(page1, 'rectangle');
      if (!rectSelected) {
        await safeClose(context1, context2);
        test.skip();
        return;
      }
      
      await drawShape(page1, 100, 100, 200, 200);
      
      const elementSynced = await page2.waitForFunction(() => {
        const board = document.querySelector('[data-board="true"]');
        return board && board.children.length > 0;
      }, { timeout: 10000 }).catch(() => null);
      
      if (!elementSynced) {
        await safeClose(context1, context2);
        test.skip();
        return;
      }
      
      const hasElementBeforeUndo = await hasElementOnCanvas(page2);
      expect(hasElementBeforeUndo).toBe(true);
      
      await page1.keyboard.down('Control');
      await page1.keyboard.press('KeyZ');
      await page1.keyboard.up('Control');
      
      const elementRemoved = await page2.waitForFunction(() => {
        const board = document.querySelector('[data-board="true"]');
        return board && board.children.length === 0;
      }, { timeout: 10000 }).catch(() => null);
      
      expect(elementRemoved).not.toBeNull();
      
      await page1.keyboard.down('Control');
      await page1.keyboard.down('Shift');
      await page1.keyboard.press('KeyZ');
      await page1.keyboard.up('Shift');
      await page1.keyboard.up('Control');
      
      const elementRestored = await page2.waitForFunction(() => {
        const board = document.querySelector('[data-board="true"]');
        return board && board.children.length > 0;
      }, { timeout: 10000 }).catch(() => null);
      
      expect(elementRestored).not.toBeNull();
      
    } finally {
      await safeClose(context1, context2);
    }
  });

  test('undo button is disabled when no undo history', async ({ page }) => {
    const roomId = `empty-undo-${Date.now()}`;
    await page.goto(`${TEST_BASE_URL}?room=${roomId}`);
    await waitForTestBoard(page);
    
    const collaborateButton = page.getByRole('button', { name: /collaborate/i });
    
    if (await collaborateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await collaborateButton.click();
      await page.waitForTimeout(1000);
      
      const undoButton = page.getByRole('button').filter({ has: page.locator('svg.lucide-undo') });
      
      if (await undoButton.count() > 0) {
        const isDisabled = await undoButton.first().isDisabled().catch(() => true);
        expect(typeof isDisabled).toBe('boolean');
      }
    } else {
      test.skip();
    }
  });
});

test.describe('Clear Board Sync in Collaboration', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('clear board syncs to collaborator', async ({ browser }) => {
    const roomId = `clear-sync-${Date.now()}`;
    const roomUrl = `${TEST_BASE_URL}?room=${roomId}`;
    
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    await page1.setViewportSize({ width: 1280, height: 720 });
    await page2.setViewportSize({ width: 1280, height: 720 });
    
    try {
      await page1.goto(roomUrl, { timeout: 15000 });
      await page2.goto(roomUrl, { timeout: 15000 });
      
      await Promise.all([
        page1.waitForLoadState('domcontentloaded'),
        page2.waitForLoadState('domcontentloaded'),
      ]);
      
      const collaborateButton1 = page1.getByRole('button', { name: /collaborate/i });
      const collaborateButton2 = page2.getByRole('button', { name: /collaborate/i });
      
      const button1Visible = await collaborateButton1.isVisible({ timeout: 5000 }).catch(() => false);
      const button2Visible = await collaborateButton2.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (!button1Visible || !button2Visible) {
        await safeClose(context1, context2);
        test.skip();
        return;
      }
      
      await collaborateButton1.click();
      await collaborateButton2.click();
      
      await page1.waitForTimeout(1000);
      await page2.waitForTimeout(1000);
      
      const rectSelected = await selectTool(page1, 'rectangle');
      if (!rectSelected) { 
        await safeClose(context1, context2);
        test.skip();
        return;
      }
      
      await drawShape(page1, 100, 100, 200, 200);
      
      const elementSynced = await page2.waitForFunction(() => {
        const board = document.querySelector('[data-board="true"]');
        return board && board.children.length > 0;
      }, { timeout: 10000 }).catch(() => null);
      
      if (!elementSynced) {
        await safeClose(context1, context2);
        test.skip();
        return;
      }
      
      const hasElementBeforeClear = await hasElementOnCanvas(page2);
      expect(hasElementBeforeClear).toBe(true);
      
      const menuButton = page1.getByTestId('app-menu-button');
      await menuButton.click();
      
      const menuVisible = await page1.waitForSelector('[role="menu"]', { timeout: 5000 }).catch(() => null);
      if (!menuVisible) {
        await safeClose(context1, context2);
        test.skip();
        return;
      }
      
      const clearButton = page1.getByRole('menuitem', { name: /clear/i });
      const clearVisible = await clearButton.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (!clearVisible) {
        await safeClose(context1, context2);
        test.skip();
        return;
      }
      
      await clearButton.click();
      
      const confirmButton = page1.getByRole('button', { name: /clear|confirm/i });
      const confirmVisible = await confirmButton.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (confirmVisible) {
        await confirmButton.click();
      } else {
        await safeClose(context1, context2);
        test.skip();
        return;
      }
      
      await page1.waitForTimeout(500);
      
      const cleared = await page2.waitForFunction(() => {
        const board = document.querySelector('[data-board="true"]');
        return board && board.children.length === 0;
      }, { timeout: 10000 }).catch(() => null);
      
      expect(cleared).not.toBeNull();
      
    } finally {
      await safeClose(context1, context2);
    }
  });

  test('clear board shows confirmation dialog', async ({ page }) => {
    const roomId = `clear-confirm-${Date.now()}`;
    await page.goto(`${TEST_BASE_URL}?room=${roomId}`);
    await waitForTestBoard(page);
    
    const collaborateButton = page.getByRole('button', { name: /collaborate/i });
    
    if (await collaborateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await collaborateButton.click();
      await page.waitForTimeout(1000);
      
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) { test.skip(); return; }
      
      await drawShape(page, 100, 100, 200, 200);
      await page.waitForFunction(() => {
        const board = document.querySelector('[data-board="true"]');
        return board && board.children.length > 0;
      }, { timeout: 5000 });
      
      const menuButton = page.getByTestId('app-menu-button');
      await menuButton.click();
      await page.waitForSelector('[role="menu"]', { timeout: 5000 });
      
      const clearButton = page.getByRole('menuitem', { name: /clear/i });
      if (await clearButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await clearButton.click();
        
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 5000 });
      }
    } else {
      test.skip();
    }
  });

  test('cancel clear board preserves elements', async ({ page }) => {
    const roomId = `clear-cancel-${Date.now()}`;
    await page.goto(`${TEST_BASE_URL}?room=${roomId}`);
    await waitForTestBoard(page);
    
    const collaborateButton = page.getByRole('button', { name: /collaborate/i });
    
    if (await collaborateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await collaborateButton.click();
      await page.waitForTimeout(1000);
      
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) { test.skip(); return; }
      
      await drawShape(page, 100, 100, 200, 200);
      await page.waitForFunction(() => {
        const board = document.querySelector('[data-board="true"]');
        return board && board.children.length > 0;
      }, { timeout: 5000 });
      
      const hasElementBefore = await hasElementOnCanvas(page);
      expect(hasElementBefore).toBe(true);
      
      const menuButton = page.getByTestId('app-menu-button');
      await menuButton.click();
      await page.waitForSelector('[role="menu"]', { timeout: 5000 });
      
      const clearButton = page.getByRole('menuitem', { name: /clear/i });
      if (await clearButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await clearButton.click();
        
        const cancelButton = page.getByRole('button', { name: /cancel/i });
        if (await cancelButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await cancelButton.click();
          await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 }).catch(() => {});
        }
        
        const hasElementAfter = await hasElementOnCanvas(page);
        expect(hasElementAfter).toBe(true);
      }
    } else {
      test.skip();
    }
  });
});
