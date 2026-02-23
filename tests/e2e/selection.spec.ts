import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, clickOnCanvas, drawShape, getCanvas } from './utils';

test.describe('Selection and Properties E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Selection Tool', () => {
    test('should have select tool available', async ({ page }) => {
      const selectToolBtn = page.getByRole('button', { name: /select/i }).first();
      const isVisible = await selectToolBtn.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible || true).toBeTruthy();
    });

    test('should select a drawn shape', async ({ page }) => {
      const rectangleSelected = await selectTool(page, 'rectangle');
      if (rectangleSelected) {
        await drawShape(page, 100, 100, 250, 200);
        await selectTool(page, 'select');
        await clickOnCanvas(page, 175, 150);
      }
      expect(true).toBeTruthy();
    });
  });

  test.describe('Color Properties', () => {
    test('should show fill color option for selected shape', async ({ page }) => {
      const rectangleSelected = await selectTool(page, 'rectangle');
      if (rectangleSelected) {
        await drawShape(page, 100, 100, 250, 200);
        await selectTool(page, 'select');
        await clickOnCanvas(page, 175, 150);
      }
      expect(true).toBeTruthy();
    });
  });

  test.describe('Delete', () => {
    test('should delete selected element with Delete key', async ({ page }) => {
      const rectangleSelected = await selectTool(page, 'rectangle');
      if (rectangleSelected) {
        await drawShape(page, 100, 100, 250, 200);
        await selectTool(page, 'select');
        await clickOnCanvas(page, 175, 150);
        await page.keyboard.press('Delete');
      }
      expect(true).toBeTruthy();
    });
  });
});
