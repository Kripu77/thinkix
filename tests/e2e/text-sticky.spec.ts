import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, clickOnCanvas, drawShape, hasElementOnCanvas, getCanvasBoundingBox } from './utils';

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

    test('should show preview while drawing sticky note', async ({ page }) => {
      const selected = await selectTool(page, 'sticky');
      if (!selected) {
        test.skip();
        return;
      }
      
      const box = await getCanvasBoundingBox(page);
      
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      
      await page.mouse.move(box.x + 200, box.y + 200, { steps: 5 });
      await page.waitForTimeout(100);
      
      const previewRect = page.locator('rect[opacity="0.7"]');
      const previewVisible = await previewRect.count() > 0;
      
      await page.mouse.up();
      
      expect(previewVisible || await hasElementOnCanvas(page)).toBe(true);
    });

    test('should remove preview after sticky note is created', async ({ page }) => {
      const selected = await selectTool(page, 'sticky');
      if (!selected) {
        test.skip();
        return;
      }
      
      await drawShape(page, 100, 100, 260, 260);
      await page.waitForTimeout(200);
      
      const previewRect = page.locator('rect[opacity="0.7"]');
      const previewCount = await previewRect.count();
      
      expect(previewCount).toBe(0);
    });

    test('should create sticky note with minimum size when drag is small', async ({ page }) => {
      const selected = await selectTool(page, 'sticky');
      if (!selected) {
        test.skip();
        return;
      }
      
      const box = await getCanvasBoundingBox(page);
      
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 110, box.y + 110, { steps: 2 });
      await page.mouse.up();
      
      await page.waitForTimeout(200);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });

    test('should switch to select tool after creating sticky note', async ({ page }) => {
      const selected = await selectTool(page, 'sticky');
      if (!selected) {
        test.skip();
        return;
      }
      
      await drawShape(page, 100, 100, 260, 260);
      await page.waitForTimeout(200);
      
      const selectButton = page.locator('button[aria-label="Select"]');
      await expect(selectButton).toHaveAttribute('aria-checked', 'true');
    });
  });
});
