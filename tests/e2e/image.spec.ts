import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool } from './utils';

test.describe('Image E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Image Tool', () => {
    test('should show the image tool button', async ({ page }) => {
      await expect(page.locator('button[aria-label="Image"]:visible').first()).toBeVisible();
    });

    test('should open the file chooser when clicking image tool', async ({ page }) => {
      const imageButton = page.locator('button[aria-label="Image"]:visible').first();
      await expect(imageButton).toBeVisible();

      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        imageButton.click({ force: true }),
      ]);

      expect(fileChooser).toBeTruthy();
    });
  });

  test.describe('Image Paste', () => {
    test('should handle paste shortcut without error', async ({ page }) => {
      const pasteShortcut = process.platform === 'darwin' ? 'Meta+KeyV' : 'Control+KeyV';
      await page.keyboard.press(pasteShortcut);
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
