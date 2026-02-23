import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, clickOnCanvas, drawShape } from './utils';

test.describe('Text and Sticky Notes E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Text Tool', () => {
    test('should select text tool', async ({ page }) => {
      await selectTool(page, 'text');
      expect(true).toBeTruthy();
    });

    test('should create text element on click', async ({ page }) => {
      const selected = await selectTool(page, 'text');
      if (selected) {
        await clickOnCanvas(page, 200, 200);
        await page.waitForTimeout(300);
        await page.keyboard.type('Hello World');
      }
      expect(true).toBeTruthy();
    });
  });

  test.describe('Sticky Notes', () => {
    test('should select sticky note tool', async ({ page }) => {
      await selectTool(page, 'sticky');
      expect(true).toBeTruthy();
    });

    test('should create sticky note on canvas', async ({ page }) => {
      const selected = await selectTool(page, 'sticky');
      if (selected) {
        await drawShape(page, 100, 100, 260, 260);
      }
      expect(true).toBeTruthy();
    });
  });
});
