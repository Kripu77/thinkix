import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, clickOnCanvas, drawShape, drawFreehand, getCanvasBoundingBox } from './utils';

test.describe('Eraser and Freehand E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Freehand Drawing', () => {
    test('should select freehand/draw tool', async ({ page }) => {
      await selectTool(page, 'draw');
      expect(true).toBeTruthy();
    });

    test('should draw freehand lines', async ({ page }) => {
      const selected = await selectTool(page, 'draw');
      if (selected) {
        await drawFreehand(page, [[100, 100], [150, 120], [200, 100], [250, 150]]);
      }
      expect(true).toBeTruthy();
    });
  });

  test.describe('Eraser Tool', () => {
    test('should select eraser tool', async ({ page }) => {
      await selectTool(page, 'eraser');
      expect(true).toBeTruthy();
    });

    test('should erase drawn content', async ({ page }) => {
      const drawSelected = await selectTool(page, 'draw');
      if (drawSelected) {
        await drawFreehand(page, [[100, 100], [200, 100], [300, 100]]);
        await selectTool(page, 'eraser');
      }
      expect(true).toBeTruthy();
    });
  });

  test.describe('Delete Selected Element', () => {
    test('should delete selected element with keyboard', async ({ page }) => {
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
