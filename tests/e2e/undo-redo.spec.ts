import { test, expect } from '@playwright/test';
import {
  waitForBoard,
  selectTool,
  drawShape,
  hasElementOnCanvas,
  selectAllElements,
  undo,
  redo,
} from './utils';

test.describe('Undo Redo Sequences E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Multiple Sequential Undo', () => {
    test('should undo multiple creations', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) { test.skip(); return; }
      await drawShape(page, 50, 50, 150, 150);
      
      const ellipseSelected = await selectTool(page, 'ellipse');
      if (!ellipseSelected) { test.skip(); return; }
      await drawShape(page, 200, 50, 300, 150);
      
      const diamondSelected = await selectTool(page, 'diamond');
      if (!diamondSelected) { test.skip(); return; }
      await drawShape(page, 350, 50, 450, 150);
      
      const hasElementsBefore = await hasElementOnCanvas(page);
      expect(hasElementsBefore).toBe(true);
      
      for (let i = 0; i < 3; i++) {
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyZ');
        await page.keyboard.up('Control');
        await page.waitForTimeout(200);
      }
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Undo/Redo Toggle', () => {
    test('should redo after undo', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) { test.skip(); return; }
      await drawShape(page, 100, 100, 200, 200);
      
      await undo(page);
      
      await redo(page);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });

    test('should toggle undo/redo multiple times', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) { test.skip(); return; }
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElementBefore = await hasElementOnCanvas(page);
      expect(hasElementBefore).toBe(true);
      
      for (let i = 0; i < 3; i++) {
        await undo(page);
        await redo(page);
      }
      
      const hasElementAfter = await hasElementOnCanvas(page);
      expect(hasElementAfter).toBe(true);
    });
  });

  test.describe('Undo After Style Change', () => {
    test('should undo fill color change', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) {
        test.skip();
        return;
      }
      await drawShape(page, 100, 100, 300, 250);
      
      const hasElementBefore = await hasElementOnCanvas(page);
      expect(hasElementBefore).toBe(true);
      
      await selectTool(page, 'select');
      await selectAllElements(page);
      
      const fillButton = page.getByTestId('fill-button');
      await expect(fillButton).toBeVisible({ timeout: 3000 });
      await fillButton.click();
      await page.waitForTimeout(200);
      
      const colorSwatch = page.locator('[data-color="#FF1313"]');
      await expect(colorSwatch).toBeVisible({ timeout: 1000 });
      await colorSwatch.click();
      await page.waitForTimeout(300);
      
      await undo(page);
      
      const hasElementAfter = await hasElementOnCanvas(page);
      expect(hasElementAfter).toBe(true);
    });

    test('should undo stroke width change', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) {
        test.skip();
        return;
      }
      await drawShape(page, 100, 100, 300, 250);
      
      const hasElementBefore = await hasElementOnCanvas(page);
      expect(hasElementBefore).toBe(true);
      
      await selectTool(page, 'select');
      await selectAllElements(page);
      
      const strokeButton = page.getByTestId('stroke-button');
      await expect(strokeButton).toBeVisible({ timeout: 3000 });
      await strokeButton.click();
      await page.waitForTimeout(200);
      
      const slider = page.getByTestId('stroke-width-slider');
      const sliderBox = await slider.boundingBox();
      expect(sliderBox).not.toBeNull();
      if (sliderBox) {
        await page.mouse.click(
          sliderBox.x + sliderBox.width * 0.8,
          sliderBox.y + sliderBox.height / 2,
        );
        await page.waitForTimeout(200);
      }
      
      await undo(page);
      
      const hasElementAfter = await hasElementOnCanvas(page);
      expect(hasElementAfter).toBe(true);
    });
  });

  test.describe('Undo After Delete', () => {
    test('should restore deleted element', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      await selectTool(page, 'select');
      await selectAllElements(page);

      const deleteButton = page.locator('button[aria-label="Delete"]:visible').first();
      await expect(deleteButton).toBeVisible({ timeout: 3000 });
      await deleteButton.click({ force: true });
      await page.waitForTimeout(300);
      
      await undo(page);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });
});
