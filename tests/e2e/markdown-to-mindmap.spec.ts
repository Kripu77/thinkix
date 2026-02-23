import { test, expect } from '@playwright/test';
import { waitForBoard } from './utils';

test.describe('Markdown to Mind Map', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test('should open markdown dialog from app menu', async ({ page }) => {
    // Close any error overlays by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Click the app menu button
    const menuButton = page.getByTestId('app-menu-button');
    await menuButton.click({ force: true });
    await page.waitForTimeout(300);

    // Click the markdown menu item
    const markdownOption = page.getByRole('menuitem', { name: /markdown to mind map/i });
    await markdownOption.click();
    await page.waitForTimeout(300);

    // Verify dialog is visible
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText(/markdown to mind map/i)).toBeVisible();
  });

  test('should show preview and insert button', async ({ page }) => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    const menuButton = page.getByTestId('app-menu-button');
    await menuButton.click({ force: true });
    await page.waitForTimeout(300);

    const markdownOption = page.getByRole('menuitem', { name: /markdown to mind map/i });
    await markdownOption.click();
    await page.waitForTimeout(500);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Check for preview label
    const previewLabel = page.getByText(/preview/i);
    await expect(previewLabel.first()).toBeVisible({ timeout: 3000 });

    // Check insert button is enabled
    const insertButton = page.getByRole('button', { name: /insert/i });
    await expect(insertButton).toBeEnabled({ timeout: 3000 });
  });

  test('should close dialog on cancel', async ({ page }) => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    const menuButton = page.getByTestId('app-menu-button');
    await menuButton.click({ force: true });
    await page.waitForTimeout(300);

    const markdownOption = page.getByRole('menuitem', { name: /markdown to mind map/i });
    await markdownOption.click();
    await page.waitForTimeout(300);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const cancelButton = page.getByRole('button', { name: /cancel/i });
    await cancelButton.click();
    await page.waitForTimeout(300);

    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });

  test('should insert mind map to board', async ({ page }) => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    const menuButton = page.getByTestId('app-menu-button');
    await menuButton.click({ force: true });
    await page.waitForTimeout(300);

    const markdownOption = page.getByRole('menuitem', { name: /markdown to mind map/i });
    await markdownOption.click();
    await page.waitForTimeout(500);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const insertButton = page.getByRole('button', { name: /insert/i });
    await expect(insertButton).toBeEnabled({ timeout: 3000 });
    await insertButton.click();
    await page.waitForTimeout(500);

    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });
});
