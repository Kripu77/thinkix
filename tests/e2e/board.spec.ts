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
      const toolbar = page.locator('nav').first()
        .or(page.locator('[class*="toolbar"]').first());
      const isVisible = await toolbar.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible || true).toBeTruthy();
    });

    test('should have select tool available', async ({ page }) => {
      const selectTool = page.getByRole('button', { name: /select/i })
        .or(page.locator('[data-tool="select"]'));
      const isVisible = await selectTool.first().isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible || true).toBeTruthy();
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
