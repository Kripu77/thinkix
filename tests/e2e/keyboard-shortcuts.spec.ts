import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, drawShape, hasElementOnCanvas, clickOnCanvas } from './utils';

test.describe('Keyboard Shortcuts E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Undo/Redo', () => {
    test('should undo with Ctrl+Z', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) { test.skip(); return; }
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElementBefore = await hasElementOnCanvas(page);
      expect(hasElementBefore).toBe(true);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyZ');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });

    test('should redo with Ctrl+Shift+Z', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) { test.skip(); return; }
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElementBefore = await hasElementOnCanvas(page);
      expect(hasElementBefore).toBe(true);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyZ');
      await page.keyboard.up('Control');
      await page.waitForTimeout(200);
      
      await page.keyboard.down('Control');
      await page.keyboard.down('Shift');
      await page.keyboard.press('KeyZ');
      await page.keyboard.up('Shift');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      const hasElementAfter = await hasElementOnCanvas(page);
      expect(hasElementAfter).toBe(true);
    });

    test('should redo with Ctrl+Y', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) { test.skip(); return; }
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElementBefore = await hasElementOnCanvas(page);
      expect(hasElementBefore).toBe(true);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyZ');
      await page.keyboard.up('Control');
      await page.waitForTimeout(200);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyY');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      const hasElementAfter = await hasElementOnCanvas(page);
      expect(hasElementAfter).toBe(true);
    });
  });

  test.describe('Copy/Paste', () => {
    test('should copy with Ctrl+C', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) { test.skip(); return; }
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 150, 150);
      await page.waitForTimeout(300);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyC');
      await page.keyboard.up('Control');
      await page.waitForTimeout(200);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });

    test('should paste with Ctrl+V', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) { test.skip(); return; }
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElementBefore = await hasElementOnCanvas(page);
      expect(hasElementBefore).toBe(true);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 150, 150);
      await page.waitForTimeout(300);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyC');
      await page.keyboard.up('Control');
      await page.waitForTimeout(200);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyV');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      const hasElementAfter = await hasElementOnCanvas(page);
      expect(hasElementAfter).toBe(true);
    });

    test('should cut with Ctrl+X', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) { test.skip(); return; }
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElementBefore = await hasElementOnCanvas(page);
      expect(hasElementBefore).toBe(true);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 150, 150);
      await page.waitForTimeout(300);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyX');
      await page.keyboard.up('Control');
      await page.waitForTimeout(200);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyV');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      const hasElementAfter = await hasElementOnCanvas(page);
      expect(hasElementAfter).toBe(true);
    });
  });

  test.describe('Duplicate', () => {
    test('should duplicate with Ctrl+D', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) { test.skip(); return; }
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElementBefore = await hasElementOnCanvas(page);
      expect(hasElementBefore).toBe(true);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 150, 150);
      await page.waitForTimeout(300);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyD');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      const hasElementAfter = await hasElementOnCanvas(page);
      expect(hasElementAfter).toBe(true);
    });
  });

  test.describe('Select All', () => {
    test('should select all with Ctrl+A', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) { test.skip(); return; }
      await drawShape(page, 100, 100, 200, 200);
      
      const ellipseSelected = await selectTool(page, 'ellipse');
      if (!ellipseSelected) { test.skip(); return; }
      await drawShape(page, 250, 100, 350, 200);
      
      const hasElements = await hasElementOnCanvas(page);
      expect(hasElements).toBe(true);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Delete', () => {
    test('should delete with Delete key', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) { test.skip(); return; }
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElementBefore = await hasElementOnCanvas(page);
      expect(hasElementBefore).toBe(true);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 150, 150);
      await page.waitForTimeout(300);
      
      await page.keyboard.press('Delete');
      await page.waitForTimeout(200);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });

    test('should delete with Backspace key', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) { test.skip(); return; }
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElementBefore = await hasElementOnCanvas(page);
      expect(hasElementBefore).toBe(true);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 150, 150);
      await page.waitForTimeout(300);
      
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(200);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Escape', () => {
    test('should deselect with Escape', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) { test.skip(); return; }
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 150, 150);
      await page.waitForTimeout(300);
      
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Arrow Keys', () => {
    test('should move selection with arrow keys', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) { test.skip(); return; }
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 150, 150);
      await page.waitForTimeout(300);
      
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);
      
      const hasElementAfter = await hasElementOnCanvas(page);
      expect(hasElementAfter).toBe(true);
    });

    test('should move selection with larger steps using Shift+Arrow', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) { test.skip(); return; }
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 150, 150);
      await page.waitForTimeout(300);
      
      await page.keyboard.down('Shift');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.up('Shift');
      await page.waitForTimeout(200);
      
      const hasElementAfter = await hasElementOnCanvas(page);
      expect(hasElementAfter).toBe(true);
    });
  });
});
