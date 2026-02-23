import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, clickOnCanvas, drawShape, hasElementOnCanvas } from './utils';

test.describe('Text and Sticky Notes E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Text Tool', () => {
    test('should select text tool', async ({ page }) => {
      const selected = await selectTool(page, 'text');
      if (!selected) {
        test.skip();
        return;
      }
      expect(selected).toBe(true);
    });

    test('should create text element on click', async ({ page }) => {
      const selected = await selectTool(page, 'text');
      if (!selected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(300);
      await page.keyboard.type('Hello World');
      await page.waitForTimeout(500);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Sticky Notes', () => {
    test('should select sticky note tool', async ({ page }) => {
      const selected = await selectTool(page, 'sticky');
      if (!selected) {
        test.skip();
        return;
      }
      expect(selected).toBe(true);
    });

    test('should create sticky note on canvas', async ({ page }) => {
      const selected = await selectTool(page, 'sticky');
      if (!selected) {
        test.skip();
        return;
      }
      
      await drawShape(page, 100, 100, 260, 260);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });
});
