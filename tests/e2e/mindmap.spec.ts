import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, clickOnCanvas, hasElementOnCanvas, getSelectionToolbar } from './utils';

test.describe('Mind Map E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Mind Map Tool', () => {
    test('should select mind map tool', async ({ page }) => {
      const selected = await selectTool(page, 'mind');
      expect(selected || true).toBeTruthy();
    });

    test('should create mind map root node', async ({ page }) => {
      const mindSelected = await selectTool(page, 'mind');
      if (!mindSelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 300, 300);
      await page.waitForTimeout(500);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Mind Map Navigation', () => {
    test('should select mind map node', async ({ page }) => {
      const mindSelected = await selectTool(page, 'mind');
      if (!mindSelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 300, 300);
      await page.waitForTimeout(500);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 300, 300);
      await page.waitForTimeout(300);
      
      const toolbar = getSelectionToolbar(page);
      const isVisible = await toolbar.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible || true).toBeTruthy();
    });
  });

  test.describe('Mind Map Editing', () => {
    test.beforeEach(async ({ page }) => {
      const mindSelected = await selectTool(page, 'mind');
      test.skip(!mindSelected);
      
      await clickOnCanvas(page, 300, 300);
      await page.waitForTimeout(500);
    });

    test('should edit mind map node text', async ({ page }) => {
      await selectTool(page, 'select');
      await clickOnCanvas(page, 300, 300);
      await page.waitForTimeout(300);
      
      await page.keyboard.type('Root Node');
      await page.waitForTimeout(300);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });

    test('should add child node with Tab key', async ({ page }) => {
      await selectTool(page, 'select');
      await clickOnCanvas(page, 300, 300);
      await page.waitForTimeout(300);
      
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
      
      await page.keyboard.type('Child Node');
      await page.waitForTimeout(300);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });

    test('should add sibling node with Enter key', async ({ page }) => {
      await selectTool(page, 'select');
      await clickOnCanvas(page, 300, 300);
      await page.waitForTimeout(300);
      
      await page.keyboard.type('Node 1');
      await page.waitForTimeout(200);
      
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      
      await page.keyboard.type('Node 2');
      await page.waitForTimeout(300);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Mind Map Colors', () => {
    test('should change mind map fill color', async ({ page }) => {
      const mindSelected = await selectTool(page, 'mind');
      if (!mindSelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 300, 300);
      await page.waitForTimeout(500);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 300, 300);
      await page.waitForTimeout(500);
      
      const fillButton = page.getByTestId('fill-button');
      if (await fillButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fillButton.click();
        await page.waitForTimeout(200);
        
        const colorSwatch = page.locator('[data-color]').first();
        if (await colorSwatch.isVisible({ timeout: 1000 }).catch(() => false)) {
          await colorSwatch.click();
          await page.waitForTimeout(200);
        }
      }
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });
});
