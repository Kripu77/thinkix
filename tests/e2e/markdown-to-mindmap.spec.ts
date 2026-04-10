import { test, expect } from '@playwright/test';
import { waitForBoard } from './utils';

async function selectCanvasTheme(
  page: import('@playwright/test').Page,
  theme: 'default' | 'dark' | 'soft' | 'retro' | 'starry' | 'colorful',
): Promise<void> {
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.getByTestId('app-menu-button').click({ force: true });
  await expect(page.getByTestId('app-menu-content')).toBeVisible({ timeout: 5000 });
  const themeTrigger = page.getByTestId('app-menu-theme-trigger');
  await expect(themeTrigger).toBeVisible({ timeout: 5000 });
  await themeTrigger.hover();
  await themeTrigger.click();
  const themeOption = page.getByTestId(`app-menu-theme-${theme}`);
  await expect(themeOption).toBeVisible({ timeout: 5000 });
  await themeOption.click();
  await expect(page.getByTestId('app-menu-content')).not.toBeVisible({ timeout: 5000 });
}

async function getMindRootFillByText(
  page: import('@playwright/test').Page,
  text: string,
): Promise<string | null> {
  return page.evaluate((targetText) => {
    const matches = Array.from(document.querySelectorAll('[plait-data-id]'));
    const target = matches.find((element) => element.textContent?.includes(targetText));
    if (!target) {
      return null;
    }
    const paintedNode = Array.from(target.querySelectorAll('[fill]')).find((node) => {
      const fill = node.getAttribute('fill');
      const stroke = node.getAttribute('stroke');
      return fill && fill !== 'none' && fill !== 'transparent' && stroke === 'none';
    });
    return paintedNode?.getAttribute('fill') ?? null;
  }, text);
}

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

  test('should insert a themed mind map when the board is already dark', async ({ page }) => {
    await selectCanvasTheme(page, 'dark');

    const menuButton = page.getByTestId('app-menu-button');
    await menuButton.click({ force: true });
    await page.waitForTimeout(300);

    const markdownOption = page.getByRole('menuitem', { name: /markdown to mind map/i });
    await markdownOption.click();
    await page.waitForTimeout(500);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const textarea = page.getByLabel('Markdown input');
    await textarea.fill('# 2026 Tech Trends\n- Agentic AI\n- Security');

    const insertButton = page.getByRole('button', { name: /insert/i });
    await expect(insertButton).toBeEnabled({ timeout: 3000 });
    await insertButton.click();
    await expect(dialog).not.toBeVisible({ timeout: 3000 });

    await expect
      .poll(() => getMindRootFillByText(page, '2026 Tech Trends'), { timeout: 5000 })
      .toBe('#1f2937');
  });

  test('should remap the root node fill when switching from dark or starry back to lighter themes', async ({ page }) => {
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

    const textarea = page.getByLabel('Markdown input');
    await textarea.fill('# 2026 Tech Trends\n- Agentic AI\n- Security');

    const insertButton = page.getByRole('button', { name: /insert/i });
    await expect(insertButton).toBeEnabled({ timeout: 3000 });
    await insertButton.click();
    await expect(dialog).not.toBeVisible({ timeout: 3000 });

    await expect
      .poll(() => getMindRootFillByText(page, '2026 Tech Trends'), { timeout: 5000 })
      .toBeTruthy();

    await selectCanvasTheme(page, 'dark');
    await expect
      .poll(() => getMindRootFillByText(page, '2026 Tech Trends'), { timeout: 5000 })
      .toBe('#1f2937');

    await selectCanvasTheme(page, 'default');
    await expect
      .poll(() => getMindRootFillByText(page, '2026 Tech Trends'), { timeout: 5000 })
      .toBe('#f5f5f5');

    await selectCanvasTheme(page, 'soft');
    await expect
      .poll(() => getMindRootFillByText(page, '2026 Tech Trends'), { timeout: 5000 })
      .toBe('#ffffff');

    await selectCanvasTheme(page, 'starry');
    await expect
      .poll(() => getMindRootFillByText(page, '2026 Tech Trends'), { timeout: 5000 })
      .toBe('#17344b');

    await selectCanvasTheme(page, 'colorful');
    await expect
      .poll(() => getMindRootFillByText(page, '2026 Tech Trends'), { timeout: 5000 })
      .toBe('#e0f7ff');
  });
});
