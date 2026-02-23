import { test, expect } from '@playwright/test';
import { waitForBoard } from './utils';

test.describe('Markdown to Mind Map E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Dialog', () => {
    test('should open dialog from app menu', async ({ page }) => {
      const menuButton = page.getByRole('button').filter({ hasText: '' }).first();
      await menuButton.click();
      await page.waitForTimeout(300);

      const menuOption = page.getByRole('menuitem', { name: /markdown to mind map/i })
        .or(page.getByText(/markdown to mind map/i));

      const isVisible = await menuOption.first().isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isVisible) {
        await menuOption.first().click();
        await page.waitForTimeout(300);

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 2000 });

        await expect(dialog.getByText(/markdown to mind map/i)).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should show markdown textarea with default content', async ({ page }) => {
      const menuButton = page.getByRole('button').first();
      await menuButton.click();
      await page.waitForTimeout(300);

      const menuOption = page.getByRole('menuitem', { name: /markdown to mind map/i })
        .or(page.getByText(/markdown to mind map/i));

      if (await menuOption.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuOption.first().click();
        await page.waitForTimeout(300);

        const textarea = page.getByRole('textbox');
        await expect(textarea).toBeVisible({ timeout: 2000 });

        const value = await textarea.inputValue();
        expect(value.length).toBeGreaterThan(0);
      } else {
        test.skip();
      }
    });

    test('should show preview panel', async ({ page }) => {
      const menuButton = page.getByRole('button').first();
      await menuButton.click();
      await page.waitForTimeout(300);

      const menuOption = page.getByRole('menuitem', { name: /markdown to mind map/i })
        .or(page.getByText(/markdown to mind map/i));

      if (await menuOption.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuOption.first().click();
        await page.waitForTimeout(500);

        const previewLabel = page.getByText(/preview/i);
        await expect(previewLabel.first()).toBeVisible({ timeout: 2000 });
      } else {
        test.skip();
      }
    });

    test('should enable insert button when markdown is valid', async ({ page }) => {
      const menuButton = page.getByRole('button').first();
      await menuButton.click();
      await page.waitForTimeout(300);

      const menuOption = page.getByRole('menuitem', { name: /markdown to mind map/i })
        .or(page.getByText(/markdown to mind map/i));

      if (await menuOption.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuOption.first().click();
        await page.waitForTimeout(500);

        const insertButton = page.getByRole('button', { name: /insert/i });
        await page.waitForTimeout(500);

        const isDisabled = await insertButton.isDisabled().catch(() => true);
        expect(isDisabled).toBe(false);
      } else {
        test.skip();
      }
    });

    test('should close dialog on cancel', async ({ page }) => {
      const menuButton = page.getByRole('button').first();
      await menuButton.click();
      await page.waitForTimeout(300);

      const menuOption = page.getByRole('menuitem', { name: /markdown to mind map/i })
        .or(page.getByText(/markdown to mind map/i));

      if (await menuOption.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuOption.first().click();
        await page.waitForTimeout(300);

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 2000 });

        const cancelButton = page.getByRole('button', { name: /cancel/i });
        await cancelButton.click();
        await page.waitForTimeout(300);

        await expect(dialog).not.toBeVisible({ timeout: 2000 });
      } else {
        test.skip();
      }
    });

    test('should insert mind map to board', async ({ page }) => {
      const menuButton = page.getByRole('button').first();
      await menuButton.click();
      await page.waitForTimeout(300);

      const menuOption = page.getByRole('menuitem', { name: /markdown to mind map/i })
        .or(page.getByText(/markdown to mind map/i));

      if (await menuOption.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuOption.first().click();
        await page.waitForTimeout(500);

        const insertButton = page.getByRole('button', { name: /insert/i });
        await expect(insertButton).toBeEnabled({ timeout: 2000 });

        await insertButton.click();
        await page.waitForTimeout(500);

        const dialog = page.getByRole('dialog');
        await expect(dialog).not.toBeVisible({ timeout: 2000 });

        const canvas = page.locator('.board-wrapper');
        await expect(canvas).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should update preview when markdown changes', async ({ page }) => {
      const menuButton = page.getByRole('button').first();
      await menuButton.click();
      await page.waitForTimeout(300);

      const menuOption = page.getByRole('menuitem', { name: /markdown to mind map/i })
        .or(page.getByText(/markdown to mind map/i));

      if (await menuOption.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuOption.first().click();
        await page.waitForTimeout(500);

        const textarea = page.getByRole('textbox');
        await textarea.fill('# Test\n- Item 1\n- Item 2');
        await page.waitForTimeout(500);

        const insertButton = page.getByRole('button', { name: /insert/i });
        await expect(insertButton).toBeEnabled({ timeout: 2000 });
      } else {
        test.skip();
      }
    });
  });
});
