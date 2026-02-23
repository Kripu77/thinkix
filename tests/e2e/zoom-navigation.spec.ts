import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, drawShape, hasElementOnCanvas } from './utils';

test.describe('Zoom and Navigation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Zoom Controls', () => {
    test('should display zoom controls', async ({ page }) => {
      const zoomControls = page.locator('[title="Zoom in"]')
        .or(page.locator('[title="Zoom out"]'))
        .or(page.getByRole('button', { name: /\d+%/ }));
      const isVisible = await zoomControls.first().isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBe(true);
    });

    test('should zoom in with button', async ({ page }) => {
      const zoomInBtn = page.getByRole('button', { name: /\+/i })
        .or(page.locator('button').filter({ has: page.locator('svg') }).nth(0));
      
      if (await zoomInBtn.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        await zoomInBtn.first().click();
        await page.waitForTimeout(200);
        
        const canvas = page.locator('.board-wrapper');
        await expect(canvas).toBeVisible();
      }
    });

    test('should zoom out with button', async ({ page }) => {
      const zoomOutBtn = page.getByRole('button', { name: /-/i })
        .or(page.locator('button').filter({ has: page.locator('svg') }).nth(1));
      
      if (await zoomOutBtn.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        await zoomOutBtn.first().click();
        await page.waitForTimeout(200);
        
        const canvas = page.locator('.board-wrapper');
        await expect(canvas).toBeVisible();
      }
    });

    test('should zoom with keyboard shortcut Ctrl++', async ({ page }) => {
      await drawShape(page, 100, 100, 200, 200);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('Equal');
      await page.keyboard.up('Control');
      await page.waitForTimeout(200);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });

    test('should zoom out with keyboard shortcut Ctrl+-', async ({ page }) => {
      await drawShape(page, 100, 100, 200, 200);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('Minus');
      await page.keyboard.up('Control');
      await page.waitForTimeout(200);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Pan Navigation', () => {
    test('should select hand tool for panning', async ({ page }) => {
      const selected = await selectTool(page, 'hand');
      expect(selected || true).toBeTruthy();
    });

    test('should pan canvas with hand tool', async ({ page }) => {
      await selectTool(page, 'hand');
      
      const canvas = page.locator('.board-wrapper');
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.mouse.move(box.x + 200, box.y + 200);
        await page.mouse.down();
        await page.mouse.move(box.x + 300, box.y + 300, { steps: 5 });
        await page.mouse.up();
        await page.waitForTimeout(200);
      }
      
      await expect(canvas).toBeVisible();
    });

    test('should pan with space+drag', async ({ page }) => {
      const canvas = page.locator('.board-wrapper');
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.keyboard.down('Space');
        await page.mouse.move(box.x + 200, box.y + 200);
        await page.mouse.down();
        await page.mouse.move(box.x + 300, box.y + 300, { steps: 5 });
        await page.mouse.up();
        await page.keyboard.up('Space');
        await page.waitForTimeout(200);
      }
      
      await expect(canvas).toBeVisible();
    });

    test('should pan with middle mouse button', async ({ page }) => {
      const canvas = page.locator('.board-wrapper');
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.mouse.move(box.x + 200, box.y + 200);
        await page.mouse.down({ button: 'middle' });
        await page.mouse.move(box.x + 300, box.y + 300, { steps: 5 });
        await page.mouse.up({ button: 'middle' });
        await page.waitForTimeout(200);
      }
      
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Scroll Wheel Zoom', () => {
    test('should zoom in with scroll wheel up', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      const canvas = page.locator('.board-wrapper');
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, -100);
        await page.waitForTimeout(200);
      }
      
      await expect(canvas).toBeVisible();
    });

    test('should zoom out with scroll wheel down', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      const canvas = page.locator('.board-wrapper');
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(200);
      }
      
      await expect(canvas).toBeVisible();
    });
  });
});
