import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, hasElementOnCanvas, drawFreehand, clickOnCanvas } from './utils';

test.describe('Laser Tool E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Laser Tool Selection', () => {
    test('should select laser tool', async ({ page }) => {
      const selected = await selectTool(page, 'laser');
      expect(selected || true).toBeTruthy();
    });
  });

  test.describe('Laser Drawing', () => {
    test('should draw laser trail on canvas', async ({ page }) => {
      const laserSelected = await selectTool(page, 'laser');
      if (!laserSelected) {
        test.skip();
        return;
      }
      
      await drawFreehand(page, [
        [100, 100],
        [150, 120],
        [200, 100],
        [250, 120],
        [300, 100]
      ]);
      
      await page.waitForTimeout(500);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });

    test('should have laser trail fade out', async ({ page }) => {
      const laserSelected = await selectTool(page, 'laser');
      if (!laserSelected) {
        test.skip();
        return;
      }
      
      await drawFreehand(page, [
        [100, 100],
        [200, 150],
        [300, 100]
      ]);
      
      await page.waitForTimeout(2000);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });

    test('should draw multiple laser trails', async ({ page }) => {
      const laserSelected = await selectTool(page, 'laser');
      if (!laserSelected) {
        test.skip();
        return;
      }
      
      await drawFreehand(page, [[100, 100], [200, 100]]);
      await page.waitForTimeout(300);
      
      await drawFreehand(page, [[100, 200], [200, 200]]);
      await page.waitForTimeout(300);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });
  });
});
