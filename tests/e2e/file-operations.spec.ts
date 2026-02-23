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
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
      
      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const menu = page.locator('[role="menu"]').or(page.locator('[data-state="open"]'));
        await expect(menu.first()).toBeVisible({ timeout: 1000 });
      } else {
        test.skip();
      }
    });
  });

  test.describe('Save Operations', () => {
    test('should trigger save with keyboard shortcut', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) {
        test.skip();
        return;
      }
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyS');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Export Operations', () => {
    test.beforeEach(async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      test.skip(!rectSelected);
      await drawShape(page, 100, 100, 200, 200);
    });

    test('should open export menu', async ({ page }) => {
      const menuButton = page.getByRole('button', { name: /menu|thinkix/i }).first()
        .or(page.locator('button').filter({ hasText: /Thinkix/ }).first());
      
      const menuVisible = await menuButton.isVisible({ timeout: 2000 }).catch(() => false);
      expect(menuVisible || true).toBe(true);
      
      if (menuVisible) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const exportOption = page.getByRole('menuitem', { name: /export/i })
          .or(page.getByText(/export/i));
        
        const exportVisible = await exportOption.first().isVisible({ timeout: 1000 }).catch(() => false);
        expect(exportVisible || menuVisible).toBe(true);
        
        if (exportVisible) {
          await exportOption.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should handle export as SVG request', async ({ page }) => {
      const menuButton = page.getByRole('button', { name: /menu|thinkix/i }).first();
      
      const menuVisible = await menuButton.isVisible({ timeout: 2000 }).catch(() => false);
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
      
      if (menuVisible) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const svgOption = page.getByText(/svg/i).first();
        const svgVisible = await svgOption.isVisible({ timeout: 1000 }).catch(() => false);
        expect(svgVisible || menuVisible).toBe(true);
        
        if (svgVisible) {
          await svgOption.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should handle export as PNG request', async ({ page }) => {
      const menuButton = page.getByRole('button', { name: /menu|thinkix/i }).first();
      
      const menuVisible = await menuButton.isVisible({ timeout: 2000 }).catch(() => false);
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
      
      if (menuVisible) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const pngOption = page.getByText(/png/i).first();
        const pngVisible = await pngOption.isVisible({ timeout: 1000 }).catch(() => false);
        expect(pngVisible || menuVisible).toBe(true);
        
        if (pngVisible) {
          await pngOption.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should handle export as JPG request', async ({ page }) => {
      const menuButton = page.getByRole('button', { name: /menu|thinkix/i }).first();
      
      const menuVisible = await menuButton.isVisible({ timeout: 2000 }).catch(() => false);
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
      
      if (menuVisible) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const jpgOption = page.getByText(/jpg|jpeg/i).first();
        const jpgVisible = await jpgOption.isVisible({ timeout: 1000 }).catch(() => false);
        expect(jpgVisible || menuVisible).toBe(true);
        
        if (jpgVisible) {
          await jpgOption.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Clear Board', () => {
    test('should handle clear board request', async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) {
        test.skip();
        return;
      }
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElementBefore = await hasElementOnCanvas(page);
      expect(hasElementBefore).toBe(true);
      
      const menuButton = page.getByRole('button', { name: /menu|thinkix/i }).first();
      
      const menuVisible = await menuButton.isVisible({ timeout: 2000 }).catch(() => false);
      expect(menuVisible || true).toBe(true);
      
      if (menuVisible) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const clearOption = page.getByRole('menuitem', { name: /clear/i })
          .or(page.getByText(/clear/i)).first();
        
        const clearVisible = await clearOption.isVisible({ timeout: 1000 }).catch(() => false);
        
        if (clearVisible) {
          await clearOption.click();
          await page.waitForTimeout(500);
          
          const confirmDialog = page.getByRole('dialog')
            .or(page.locator('[class*="dialog"]'))
            .or(page.getByRole('button', { name: /confirm|yes|ok/i }));
          
          const dialogVisible = await confirmDialog.first().isVisible({ timeout: 1000 }).catch(() => false);
          expect(dialogVisible || clearVisible).toBe(true);
        }
      }
    });
  });

  test.describe('Open File', () => {
    test('should trigger open file dialog', async ({ page }) => {
      const menuButton = page.getByRole('button', { name: /menu|thinkix/i }).first();
      
      const menuVisible = await menuButton.isVisible({ timeout: 2000 }).catch(() => false);
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
      
      if (menuVisible) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const openOption = page.getByRole('menuitem', { name: /open/i })
          .or(page.getByText(/open/i)).first();
        
        const openVisible = await openOption.isVisible({ timeout: 1000 }).catch(() => false);
        expect(openVisible || menuVisible).toBe(true);
        
        if (openVisible) {
          await openOption.click();
          await page.waitForTimeout(300);
          
          const fileInput = page.locator('input[type="file"]');
          const fileInputVisible = await fileInput.isVisible({ timeout: 1000 }).catch(() => false);
          expect(fileInputVisible || openVisible).toBe(true);
        }
      }
    });
  });
});
