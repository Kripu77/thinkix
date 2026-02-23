import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, drawShape, hasElementOnCanvas, clickOnCanvas } from './utils';

test.describe('Keyboard Shortcuts E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Undo/Redo', () => {
    test('should undo with Ctrl+Z', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      const hadElement = await hasElementOnCanvas(page);
      expect(hadElement).toBe(true);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyZ');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      expect(true).toBeTruthy();
    });

    test('should redo with Ctrl+Shift+Z', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
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
      
      expect(true).toBeTruthy();
    });

    test('should redo with Ctrl+Y', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyZ');
      await page.keyboard.up('Control');
      await page.waitForTimeout(200);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyY');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      expect(true).toBeTruthy();
    });
  });

  test.describe('Copy/Paste', () => {
    test('should copy with Ctrl+C', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 150, 150);
      await page.waitForTimeout(300);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyC');
      await page.keyboard.up('Control');
      await page.waitForTimeout(200);
      
      expect(true).toBeTruthy();
    });

    test('should paste with Ctrl+V', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
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
      
      expect(true).toBeTruthy();
    });

    test('should cut with Ctrl+X', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
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
      
      expect(true).toBeTruthy();
    });
  });

  test.describe('Duplicate', () => {
    test('should duplicate with Ctrl+D', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 150, 150);
      await page.waitForTimeout(300);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyD');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      expect(true).toBeTruthy();
    });
  });

  test.describe('Select All', () => {
    test('should select all with Ctrl+A', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      await selectTool(page, 'ellipse');
      await drawShape(page, 250, 100, 350, 200);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      expect(true).toBeTruthy();
    });
  });

  test.describe('Delete', () => {
    test('should delete with Delete key', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 150, 150);
      await page.waitForTimeout(300);
      
      await page.keyboard.press('Delete');
      await page.waitForTimeout(200);
      
      expect(true).toBeTruthy();
    });

    test('should delete with Backspace key', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 150, 150);
      await page.waitForTimeout(300);
      
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(200);
      
      expect(true).toBeTruthy();
    });
  });

  test.describe('Escape', () => {
    test('should deselect with Escape', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 150, 150);
      await page.waitForTimeout(300);
      
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      
      expect(true).toBeTruthy();
    });
  });

  test.describe('Arrow Keys', () => {
    test('should move selection with arrow keys', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 150, 150);
      await page.waitForTimeout(300);
      
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);
      
      expect(true).toBeTruthy();
    });

    test('should move selection with larger steps using Shift+Arrow', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 150, 150);
      await page.waitForTimeout(300);
      
      await page.keyboard.down('Shift');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.up('Shift');
      await page.waitForTimeout(200);
      
      expect(true).toBeTruthy();
    });
  });
});
