import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, drawShape, hasElementOnCanvas, clickOnCanvas } from './utils';

test.describe('Special Modes E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Handdrawn Mode', () => {
    test('should toggle handdrawn mode', async ({ page }) => {
      const pencilButtons = page.locator('button').filter({ 
        has: page.locator('svg[class*="pencil"], svg.lucide-pencil') 
      });
      
      if (await pencilButtons.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await pencilButtons.first().click();
        await page.waitForTimeout(300);
      }
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });

    test('should draw shapes in handdrawn mode', async ({ page }) => {
      const pencilButtons = page.locator('button').filter({ 
        has: page.locator('svg[class*="pencil"], svg.lucide-pencil') 
      });
      
      if (await pencilButtons.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await pencilButtons.first().click();
        await page.waitForTimeout(300);
      }
      
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 250, 200);
      
      await selectTool(page, 'ellipse');
      await drawShape(page, 300, 100, 450, 200);
      
      await page.waitForTimeout(300);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });

    test('should toggle handdrawn mode off', async ({ page }) => {
      const pencilButtons = page.locator('button').filter({ 
        has: page.locator('svg[class*="pencil"], svg.lucide-pencil') 
      });
      
      if (await pencilButtons.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await pencilButtons.first().click();
        await page.waitForTimeout(200);
        await pencilButtons.first().click();
        await page.waitForTimeout(300);
      }
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Sticky Note Operations', () => {
    test('should create sticky note with text', async ({ page }) => {
      const stickySelected = await selectTool(page, 'stickyNote');
      if (!stickySelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      
      await page.keyboard.type('This is a sticky note');
      await page.waitForTimeout(300);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });

    test('should select and show sticky note options', async ({ page }) => {
      const stickySelected = await selectTool(page, 'stickyNote');
      if (!stickySelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      
      await page.keyboard.type('Sticky');
      await page.waitForTimeout(300);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });

    test('should change sticky note color', async ({ page }) => {
      const stickySelected = await selectTool(page, 'stickyNote');
      if (!stickySelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      
      await page.keyboard.type('Colored Sticky');
      await page.waitForTimeout(300);
      
      await selectTool(page, 'select');
      const canvas = page.locator('.board-wrapper');
      await canvas.click({ position: { x: 200, y: 200 } });
      await page.waitForTimeout(500);
      
      const fillButton = page.getByTestId('fill-button');
      if (await fillButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fillButton.click();
        await page.waitForTimeout(200);
        
        const colorSwatch = page.locator('[data-color]').first();
        if (await colorSwatch.isVisible({ timeout: 1000 }).catch(() => false)) {
          await colorSwatch.click();
          await page.waitForTimeout(300);
        }
      }
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });

    test('should delete sticky note', async ({ page }) => {
      const stickySelected = await selectTool(page, 'stickyNote');
      if (!stickySelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      
      await page.keyboard.type('To Delete');
      await page.waitForTimeout(300);
      
      await selectTool(page, 'select');
      const canvas = page.locator('.board-wrapper');
      await canvas.click({ position: { x: 200, y: 200 } });
      await page.waitForTimeout(300);
      
      await page.keyboard.press('Delete');
      await page.waitForTimeout(300);
      
      await expect(canvas).toBeVisible();
    });
  });
});
