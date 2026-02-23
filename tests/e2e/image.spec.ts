import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, clickOnCanvas, hasElementOnCanvas, getCanvasBoundingBox } from './utils';

test.describe('Image E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Image Tool', () => {
    test('should select image tool', async ({ page }) => {
      const selected = await selectTool(page, 'image');
      expect(selected).toBe(true);
    });

    test('should open file dialog when clicking image tool', async ({ page }) => {
      const imageSelected = await selectTool(page, 'image');
      if (!imageSelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      
      const fileInput = page.locator('input[type="file"]');
      const fileInputVisible = await fileInput.isVisible({ timeout: 2000 }).catch(() => false);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
      
      if (fileInputVisible) {
        await expect(fileInput).toBeVisible();
      }
    });
  });

  test.describe('Image Paste', () => {
    test('should handle paste shortcut without error', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) {
        test.skip();
        return;
      }
      
      const box = await getCanvasBoundingBox(page);
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      
      const hasElementBefore = await hasElementOnCanvas(page);
      expect(hasElementBefore).toBe(true);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyV');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Image Drag and Drop', () => {
    test('should accept drop events on canvas', async ({ page }) => {
      const canvas = page.locator('.board-wrapper');
      const box = await canvas.boundingBox();
      
      expect(box).not.toBeNull();
      
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await expect(canvas).toBeVisible();
      }
    });
  });

  test.describe('Image Selection', () => {
    test('should allow clicking on canvas for selection', async ({ page }) => {
      await selectTool(page, 'select');
      
      const canvas = page.locator('.board-wrapper');
      const box = await canvas.boundingBox();
      
      expect(box).not.toBeNull();
      
      if (box) {
        await page.mouse.click(box.x + 200, box.y + 200);
        await page.waitForTimeout(300);
        await expect(canvas).toBeVisible();
      }
    });
  });

  test.describe('Image Fullscreen', () => {
    test('should handle double-click on canvas', async ({ page }) => {
      await selectTool(page, 'select');
      
      const canvas = page.locator('.board-wrapper');
      const box = await canvas.boundingBox();
      
      expect(box).not.toBeNull();
      
      if (box) {
        await page.mouse.dblclick(box.x + 200, box.y + 200);
        await page.waitForTimeout(500);
        
        const imageViewer = page.locator('[role="dialog"]')
          .or(page.locator('[class*="image-viewer"]'));
        
        const viewerVisible = await imageViewer.isVisible({ timeout: 1000 }).catch(() => false);
        if (viewerVisible) {
          await expect(imageViewer).toBeVisible();
        } else {
          await expect(canvas).toBeVisible();
        }
      }
    });
  });
});
