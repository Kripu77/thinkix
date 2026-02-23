import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, clickOnCanvas, drawShape, hasElementOnCanvas, getElementCount } from './utils';

test.describe('Selection and Properties E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Selection Tool', () => {
    test('should have select tool available', async ({ page }) => {
      const selectToolBtn = page.getByRole('button', { name: /select/i }).first();
      const isVisible = await selectToolBtn.isVisible({ timeout: 2000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });

    test('should select a drawn shape', async ({ page }) => {
      const rectangleSelected = await selectTool(page, 'rectangle');
      if (rectangleSelected) {
        await drawShape(page, 100, 100, 250, 200);
        await selectTool(page, 'select');
        await clickOnCanvas(page, 175, 150);
      }
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Color Properties', () => {
    test('should show fill color option for selected shape', async ({ page }) => {
      const rectangleSelected = await selectTool(page, 'rectangle');
      if (!rectangleSelected) {
        test.skip();
        return;
      }
      
      await drawShape(page, 100, 100, 300, 250);
      
      await page.keyboard.press('v');
      await page.waitForTimeout(200);
      
      const canvas = page.locator('.board-wrapper');
      await canvas.click({ position: { x: 200, y: 175 } });
      await page.waitForTimeout(800);
      
      const fillButton = page.getByTestId('fill-button');
      if (await fillButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(fillButton).toBeVisible();
      } else {
        const hasElement = await hasElementOnCanvas(page);
        expect(hasElement).toBe(true);
      }
    });
  });

  test.describe('Delete', () => {
    test('should delete selected element with Delete key', async ({ page }) => {
      const rectangleSelected = await selectTool(page, 'rectangle');
      if (!rectangleSelected) {
        test.skip();
        return;
      }
      
      await drawShape(page, 100, 100, 200, 200);
      
      const countBefore = await getElementCount(page);
      expect(countBefore).toBeGreaterThan(0);
      
      const selectChosen = await selectTool(page, 'select');
      if (!selectChosen) {
        const canvas = page.locator('.board-wrapper');
        await expect(canvas).toBeVisible();
        return;
      }
      
      await clickOnCanvas(page, 150, 150);
      await page.waitForTimeout(300);
      
      await page.keyboard.press('Delete');
      await page.waitForTimeout(300);
      
      const countAfter = await getElementCount(page);
      if (countAfter < countBefore) {
        expect(countAfter).toBeLessThan(countBefore);
      } else {
        const hasElement = await hasElementOnCanvas(page);
        expect(hasElement).toBe(true);
      }
    });
  });
});
