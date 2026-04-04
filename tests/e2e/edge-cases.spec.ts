import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, drawShape, hasElementOnCanvas, getCanvasBoundingBox } from './utils';

test.describe('Edge Cases E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Zero-Size Drawing', () => {
    test('should handle click without drag gracefully', async ({ page }) => {
      await selectTool(page, 'rectangle');
      
      const box = await getCanvasBoundingBox(page);
      await page.mouse.click(box.x + 200, box.y + 200);
      await page.waitForTimeout(300);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });

    test('should handle very small shape', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 105, 105);
      
      await page.waitForTimeout(300);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Rapid Element Creation', () => {
    test('should create multiple shapes quickly', async ({ page }) => {
      await selectTool(page, 'rectangle');
      
      for (let i = 0; i < 5; i++) {
        await drawShape(page, 50 + i * 60, 100, 100 + i * 60, 150);
        await page.waitForTimeout(50);
      }
      
      await page.waitForTimeout(500);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Drawing at Canvas Boundaries', () => {
    test('should draw shape at left edge', async ({ page }) => {
      const box = await getCanvasBoundingBox(page);
      
      await selectTool(page, 'rectangle');
      await page.mouse.move(box.x + 5, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 100, box.y + 200, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });

    test('should draw shape at right edge', async ({ page }) => {
      const box = await getCanvasBoundingBox(page);
      
      await selectTool(page, 'rectangle');
      await page.mouse.move(box.x + box.width - 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width - 5, box.y + 200, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });

    test('should draw shape at top edge', async ({ page }) => {
      const box = await getCanvasBoundingBox(page);
      
      await selectTool(page, 'rectangle');
      await page.mouse.move(box.x + 200, box.y + 5);
      await page.mouse.down();
      await page.mouse.move(box.x + 300, box.y + 100, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });

    test('should draw shape at bottom edge', async ({ page }) => {
      const box = await getCanvasBoundingBox(page);
      
      await selectTool(page, 'rectangle');
      await page.mouse.move(box.x + 200, box.y + box.height - 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 300, box.y + box.height - 5, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Very Large Shape', () => {
    test('should draw a shape that spans nearly the full visible canvas', async ({ page }) => {
      await selectTool(page, 'rectangle');
      const box = await getCanvasBoundingBox(page);
      await drawShape(
        page,
        40,
        40,
        Math.max(240, Math.min(900, box.width - 80)),
        Math.max(240, Math.min(520, box.height - 80)),
      );
      
      await page.waitForTimeout(300);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Empty Text Element', () => {
    test('should create text element without typing', async ({ page }) => {
      const textSelected = await selectTool(page, 'text');
      if (!textSelected) {
        test.skip();
        return;
      }
      
      const box = await getCanvasBoundingBox(page);
      await page.mouse.click(box.x + 200, box.y + 200);
      await page.waitForTimeout(500);
      
      await page.mouse.click(box.x + 400, box.y + 400);
      await page.waitForTimeout(300);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Escape During Drawing', () => {
    test('should cancel drawing with Escape', async ({ page }) => {
      await selectTool(page, 'rectangle');
      
      const box = await getCanvasBoundingBox(page);
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 150, { steps: 5 });
      
      await page.keyboard.press('Escape');
      await page.mouse.up();
      await page.waitForTimeout(300);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Drawing Over Elements', () => {
    test('should draw new shape over existing shape', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 300, 300);
      
      await selectTool(page, 'ellipse');
      await drawShape(page, 150, 150, 250, 250);
      
      await page.waitForTimeout(300);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });
});
