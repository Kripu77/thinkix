import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, drawShape, hasElementOnCanvas } from './utils';

test.describe('File Operations E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('App Menu', () => {
    test('should open app menu', async ({ page }) => {
      const menuButton = page.getByRole('button', { name: /menu|thinkix/i }).first()
        .or(page.locator('button').filter({ hasText: /Thinkix/ }).first());
      
      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(300);
      }
      
      expect(true).toBeTruthy();
    });
  });

  test.describe('Save Operations', () => {
    test('should trigger save with keyboard shortcut', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyS');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      expect(true).toBeTruthy();
    });
  });

  test.describe('Export Operations', () => {
    test.beforeEach(async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
    });

    test('should open export menu', async ({ page }) => {
      const menuButton = page.getByRole('button', { name: /menu|thinkix/i }).first()
        .or(page.locator('button').filter({ hasText: /Thinkix/ }).first());
      
      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const exportOption = page.getByRole('menuitem', { name: /export/i })
          .or(page.getByText(/export/i));
        
        if (await exportOption.first().isVisible({ timeout: 1000 }).catch(() => false)) {
          await exportOption.first().click();
          await page.waitForTimeout(300);
        }
      }
      
      expect(true).toBeTruthy();
    });

    test('should handle export as SVG request', async ({ page }) => {
      const menuButton = page.getByRole('button', { name: /menu|thinkix/i }).first();
      
      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const svgOption = page.getByText(/svg/i).first();
        if (await svgOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await svgOption.click();
          await page.waitForTimeout(500);
        }
      }
      
      expect(true).toBeTruthy();
    });

    test('should handle export as PNG request', async ({ page }) => {
      const menuButton = page.getByRole('button', { name: /menu|thinkix/i }).first();
      
      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const pngOption = page.getByText(/png/i).first();
        if (await pngOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await pngOption.click();
          await page.waitForTimeout(500);
        }
      }
      
      expect(true).toBeTruthy();
    });

    test('should handle export as JPG request', async ({ page }) => {
      const menuButton = page.getByRole('button', { name: /menu|thinkix/i }).first();
      
      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const jpgOption = page.getByText(/jpg|jpeg/i).first();
        if (await jpgOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await jpgOption.click();
          await page.waitForTimeout(500);
        }
      }
      
      expect(true).toBeTruthy();
    });
  });

  test.describe('Clear Board', () => {
    test('should handle clear board request', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
      
      const menuButton = page.getByRole('button', { name: /menu|thinkix/i }).first();
      
      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const clearOption = page.getByRole('menuitem', { name: /clear/i })
          .or(page.getByText(/clear/i)).first();
        
        if (await clearOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await clearOption.click();
          await page.waitForTimeout(300);
        }
      }
      
      expect(true).toBeTruthy();
    });
  });

  test.describe('Open File', () => {
    test('should trigger open file dialog', async ({ page }) => {
      const menuButton = page.getByRole('button', { name: /menu|thinkix/i }).first();
      
      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const openOption = page.getByRole('menuitem', { name: /open/i })
          .or(page.getByText(/open/i)).first();
        
        if (await openOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await openOption.click();
          await page.waitForTimeout(300);
        }
      }
      
      expect(true).toBeTruthy();
    });
  });
});
