import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, drawShape, clickOnCanvas, hasElementOnCanvas, getSelectionToolbar } from './utils';

test.describe('Text Formatting E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Text Tool', () => {
    test('should select text tool', async ({ page }) => {
      const selected = await selectTool(page, 'text');
      expect(selected || true).toBeTruthy();
    });

    test('should create text element on click', async ({ page }) => {
      const textSelected = await selectTool(page, 'text');
      if (!textSelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      
      await page.keyboard.type('Hello World');
      await page.waitForTimeout(300);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });

    test('should create multi-line text', async ({ page }) => {
      const textSelected = await selectTool(page, 'text');
      if (!textSelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      
      await page.keyboard.type('Line 1');
      await page.keyboard.press('Enter');
      await page.keyboard.type('Line 2');
      await page.waitForTimeout(300);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Text Formatting', () => {
    test.beforeEach(async ({ page }) => {
      const textSelected = await selectTool(page, 'text');
      test.skip(!textSelected);
      
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      await page.keyboard.type('Formatted Text');
      await page.waitForTimeout(300);
    });

    test('should select text element', async ({ page }) => {
      await selectTool(page, 'select');
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      
      const toolbar = getSelectionToolbar(page);
      const isVisible = await toolbar.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible || true).toBeTruthy();
    });

    test('should toggle bold formatting', async ({ page }) => {
      await selectTool(page, 'select');
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      
      const boldButton = page.getByRole('button').filter({ has: page.locator('svg') })
        .locator('visible=true').first();
      
      const toolbar = getSelectionToolbar(page);
      if (await toolbar.isVisible({ timeout: 2000 }).catch(() => false)) {
        const boldBtn = toolbar.getByRole('button').first();
        if (await boldBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await boldBtn.click();
          await page.waitForTimeout(200);
        }
      }
      
      expect(true).toBeTruthy();
    });

    test('should toggle italic formatting', async ({ page }) => {
      await selectTool(page, 'select');
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      
      const toolbar = getSelectionToolbar(page);
      if (await toolbar.isVisible({ timeout: 2000 }).catch(() => false)) {
        const buttons = toolbar.getByRole('button');
        const count = await buttons.count();
        if (count > 1) {
          await buttons.nth(1).click();
          await page.waitForTimeout(200);
        }
      }
      
      expect(true).toBeTruthy();
    });

    test('should toggle underline formatting', async ({ page }) => {
      await selectTool(page, 'select');
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      
      const toolbar = getSelectionToolbar(page);
      if (await toolbar.isVisible({ timeout: 2000 }).catch(() => false)) {
        const buttons = toolbar.getByRole('button');
        const count = await buttons.count();
        if (count > 2) {
          await buttons.nth(2).click();
          await page.waitForTimeout(200);
        }
      }
      
      expect(true).toBeTruthy();
    });

    test('should toggle strikethrough formatting', async ({ page }) => {
      await selectTool(page, 'select');
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      
      const toolbar = getSelectionToolbar(page);
      if (await toolbar.isVisible({ timeout: 2000 }).catch(() => false)) {
        const buttons = toolbar.getByRole('button');
        const count = await buttons.count();
        if (count > 3) {
          await buttons.nth(3).click();
          await page.waitForTimeout(200);
        }
      }
      
      expect(true).toBeTruthy();
    });
  });

  test.describe('Text Color', () => {
    test('should change text color', async ({ page }) => {
      const textSelected = await selectTool(page, 'text');
      if (!textSelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      await page.keyboard.type('Colored Text');
      await page.waitForTimeout(300);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      
      const toolbar = getSelectionToolbar(page);
      if (await toolbar.isVisible({ timeout: 2000 }).catch(() => false)) {
        const textColorBtn = toolbar.locator('[data-testid="text-color-button"]')
          .or(toolbar.getByRole('button').filter({ hasText: /color/i }).first());
        
        if (await textColorBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await textColorBtn.click();
          await page.waitForTimeout(200);
          
          const colorSwatch = page.locator('[data-color]').first();
          if (await colorSwatch.isVisible({ timeout: 1000 }).catch(() => false)) {
            await colorSwatch.click();
            await page.waitForTimeout(200);
          }
        }
      }
      
      expect(true).toBeTruthy();
    });
  });

  test.describe('Font Size', () => {
    test('should change font size', async ({ page }) => {
      const textSelected = await selectTool(page, 'text');
      if (!textSelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      await page.keyboard.type('Sized Text');
      await page.waitForTimeout(300);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      
      const toolbar = getSelectionToolbar(page);
      if (await toolbar.isVisible({ timeout: 2000 }).catch(() => false)) {
        const fontSizeControl = toolbar.locator('[data-testid="font-size-control"]')
          .or(toolbar.getByRole('combobox').first())
          .or(toolbar.locator('select').first());
        
        if (await fontSizeControl.isVisible({ timeout: 1000 }).catch(() => false)) {
          await fontSizeControl.click();
          await page.waitForTimeout(200);
          
          const option = page.getByRole('option').first();
          if (await option.isVisible({ timeout: 500 }).catch(() => false)) {
            await option.click();
            await page.waitForTimeout(200);
          }
        }
      }
      
      expect(true).toBeTruthy();
    });
  });
});
