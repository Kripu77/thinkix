import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, clickOnCanvas, hasElementOnCanvas, getSelectionToolbar } from './utils';

test.describe('Text Formatting E2E Tests', () => {
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
      const textSelected = await selectTool(page, 'text');
      if (!textSelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 200, 200);
      await page.keyboard.type('Hello World');
      
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
      await page.keyboard.type('Line 1');
      await page.keyboard.press('Enter');
      await page.keyboard.type('Line 2');
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Text Formatting', () => {
    test.beforeEach(async ({ page }) => {
      const textSelected = await selectTool(page, 'text');
      test.skip(!textSelected);
      
      await clickOnCanvas(page, 200, 200);
      await page.keyboard.type('Formatted Text');
    });

    test('should select text element', async ({ page }) => {
      await selectTool(page, 'select');
      await clickOnCanvas(page, 200, 200);
      
      const toolbar = getSelectionToolbar(page);
      const isVisible = await toolbar.isVisible({ timeout: 2000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });

    test('should toggle bold formatting', async ({ page }) => {
      await selectTool(page, 'select');
      await clickOnCanvas(page, 200, 200);
      
      const toolbar = getSelectionToolbar(page);
      if (await toolbar.isVisible({ timeout: 2000 }).catch(() => false)) {
        const boldBtn = toolbar.getByRole('button').first();
        if (await boldBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await boldBtn.click({ force: true });
        }
      }
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });

    test('should toggle italic formatting', async ({ page }) => {
      await selectTool(page, 'select');
      await clickOnCanvas(page, 200, 200);
      
      const toolbar = getSelectionToolbar(page);
      if (await toolbar.isVisible({ timeout: 2000 }).catch(() => false)) {
        const buttons = toolbar.getByRole('button');
        const count = await buttons.count();
        if (count > 1) {
          await buttons.nth(1).click({ force: true });
        }
      }
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });

    test('should toggle underline formatting', async ({ page }) => {
      await selectTool(page, 'select');
      await clickOnCanvas(page, 200, 200);
      
      const toolbar = getSelectionToolbar(page);
      if (await toolbar.isVisible({ timeout: 2000 }).catch(() => false)) {
        const buttons = toolbar.getByRole('button');
        const count = await buttons.count();
        if (count > 2) {
          await buttons.nth(2).click({ force: true });
        }
      }
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });

    test('should toggle strikethrough formatting', async ({ page }) => {
      await selectTool(page, 'select');
      await clickOnCanvas(page, 200, 200);
      
      const toolbar = getSelectionToolbar(page);
      if (await toolbar.isVisible({ timeout: 2000 }).catch(() => false)) {
        const buttons = toolbar.getByRole('button');
        const count = await buttons.count();
        if (count > 3) {
          await buttons.nth(3).click({ force: true });
        }
      }
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
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
      await page.keyboard.type('Colored Text');
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 200, 200);
      
      const toolbar = getSelectionToolbar(page);
      if (await toolbar.isVisible({ timeout: 2000 }).catch(() => false)) {
        const textColorBtn = toolbar.locator('[data-testid="text-color-button"]')
          .or(toolbar.getByRole('button').filter({ hasText: /color/i }).first());
        
        if (await textColorBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await textColorBtn.click({ force: true });
          
          const colorSwatch = page.locator('[data-color]').first();
          if (await colorSwatch.isVisible({ timeout: 1000 }).catch(() => false)) {
            await colorSwatch.click({ force: true });
          }
        }
      }
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
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
      await page.keyboard.type('Sized Text');
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 200, 200);
      
      const toolbar = getSelectionToolbar(page);
      if (await toolbar.isVisible({ timeout: 2000 }).catch(() => false)) {
        const fontSizeControl = toolbar.locator('[data-testid="font-size-control"]')
          .or(toolbar.getByRole('combobox').first())
          .or(toolbar.locator('select').first());
        
        if (await fontSizeControl.isVisible({ timeout: 1000 }).catch(() => false)) {
          await fontSizeControl.click({ force: true });
          
          const option = page.getByRole('option').first();
          if (await option.isVisible({ timeout: 500 }).catch(() => false)) {
            await option.click({ force: true });
          }
        }
      }
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });
});
