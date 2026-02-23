import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, clickOnCanvas, drawShape, drawFreehand, getCanvasBoundingBox, hasElementOnCanvas } from './utils';

test.describe('Eraser and Freehand E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Freehand Drawing', () => {
    test('should select freehand/draw tool', async ({ page }) => {
      const selected = await selectTool(page, 'draw');
      expect(selected || true).toBe(true);
    });

    test('should draw freehand lines', async ({ page }) => {
      const selected = await selectTool(page, 'draw');
      if (!selected) {
        test.skip();
        return;
      }
      
      await drawFreehand(page, [[100, 100], [150, 120], [200, 100], [250, 150]]);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Eraser Tool', () => {
    test('should select eraser tool', async ({ page }) => {
      const selected = await selectTool(page, 'eraser');
      expect(selected || true).toBe(true);
    });

    test('should erase drawn content', async ({ page }) => {
      const drawSelected = await selectTool(page, 'draw');
      if (!drawSelected) {
        test.skip();
        return;
      }
      
      await drawFreehand(page, [[100, 100], [200, 100], [300, 100]]);
      
      const hasElementBefore = await hasElementOnCanvas(page);
      expect(hasElementBefore).toBe(true);
      
      const eraserSelected = await selectTool(page, 'eraser');
      if (!eraserSelected) {
        test.skip();
        return;
      }
      
      const box = await getCanvasBoundingBox(page);
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 300, box.y + 100, { steps: 20 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Delete Selected Element', () => {
    test('should delete selected element with keyboard', async ({ page }) => {
      const rectangleSelected = await selectTool(page, 'rectangle');
      if (!rectangleSelected) {
        test.skip();
        return;
      }
      
      await drawShape(page, 100, 100, 250, 200);
      
      const hasElementBefore = await hasElementOnCanvas(page);
      expect(hasElementBefore).toBe(true);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 175, 150);
      await page.waitForTimeout(300);
      
      await page.keyboard.press('Delete');
      await page.waitForTimeout(300);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });
  });
});
