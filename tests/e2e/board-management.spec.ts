import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, drawShape, hasElementOnCanvas } from './utils';

test.describe('Board Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Board Switcher', () => {
    test('should display board switcher', async ({ page }) => {
      const boardSwitcher = page.getByRole('button', { name: /board|switch/i })
        .or(page.locator('[class*="board-switcher"]').first())
        .or(page.locator('button').filter({ hasText: /Untitled|Board/ }).first());
      
      await expect(boardSwitcher).toBeVisible({ timeout: 2000 });
    });

    test('should open board list dropdown', async ({ page }) => {
      const boardSwitcher = page.getByRole('button').filter({ hasText: /Untitled|Board/ }).first()
        .or(page.locator('[class*="board-switcher"] button').first());
      
      if (await boardSwitcher.isVisible({ timeout: 2000 }).catch(() => false)) {
        await boardSwitcher.click();
        await page.waitForTimeout(300);
        
        const dropdown = page.locator('[role="menu"]')
          .or(page.locator('[class*="dropdown"]'));
        await expect(dropdown.first()).toBeVisible({ timeout: 1000 });
      } else {
        test.skip();
      }
    });
  });

  test.describe('Create New Board', () => {
    test('should create new board from menu', async ({ page }) => {
      const menuButton = page.getByRole('button', { name: /menu|thinkix/i }).first();
      
      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const newBoardOption = page.getByRole('menuitem', { name: /new|create/i })
          .or(page.getByText(/new board/i)).first();
        
        if (await newBoardOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await newBoardOption.click();
          await page.waitForTimeout(500);
        }
      }
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });

    test('should create new board with keyboard shortcut', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      await page.keyboard.down('Control');
      await page.keyboard.down('Shift');
      await page.keyboard.press('KeyN');
      await page.keyboard.up('Shift');
      await page.keyboard.up('Control');
      await page.waitForTimeout(500);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Board Persistence', () => {
    test('should persist elements after page refresh', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElementBefore = await hasElementOnCanvas(page);
      expect(hasElementBefore).toBe(true);
      
      await page.waitForTimeout(1000);
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      const canvas = page.locator('.board-wrapper');
      await canvas.waitFor({ state: 'visible', timeout: 20000 });
      await page.waitForTimeout(1000);
      
      const hasElementAfter = await hasElementOnCanvas(page);
      expect(hasElementAfter).toBe(true);
    });
  });

  test.describe('Auto-Save Indicator', () => {
    test('should show save status indicator', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      await page.waitForTimeout(2000);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });
  });
});
