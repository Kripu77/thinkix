import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, clickOnCanvas, drawShape, getCanvas } from './utils';

test.describe('Board Canvas E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Application Load', () => {
    test('should load the application successfully', async ({ page }) => {
      await expect(page).toHaveTitle(/thinkix/i);
    });

    test('should display the canvas area', async ({ page }) => {
      const canvas = await getCanvas(page);
      await expect(canvas).toBeVisible();
    });

    test('should display the toolbar', async ({ page }) => {
      const toolbar = page.locator('div.absolute.top-4').first();
      await expect(toolbar).toBeVisible({ timeout: 5000 });
    });

    test('should have select tool available', async ({ page }) => {
      const toolbar = page.locator('div.absolute.top-4').first();
      const selectToolButton = toolbar.locator('[aria-label="Select"]').first();
      await expect(selectToolButton).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Tool Selection', () => {
    test('should switch to hand tool', async ({ page }) => {
      await selectTool(page, 'hand');
    });

    test('should switch to freehand draw tool', async ({ page }) => {
      await selectTool(page, 'draw');
    });
  });
});
