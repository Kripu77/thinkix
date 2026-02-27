import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, pressEscape } from './utils';

test.describe('Toolbar Selection Indicator E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test('should show selection indicator on Select tool by default', async ({ page }) => {
    const selectButton = page.locator('button[aria-label="Select"]');
    await expect(selectButton).toHaveAttribute('aria-checked', 'true');
  });

  test('should show selection indicator when clicking Hand tool', async ({ page }) => {
    const handButton = page.locator('button[aria-label="Pan"]');
    await handButton.click({ force: true });
    await page.waitForTimeout(100);
    
    await expect(handButton).toHaveAttribute('aria-checked', 'true');
    
    const selectButton = page.locator('button[aria-label="Select"]');
    await expect(selectButton).toHaveAttribute('aria-checked', 'false');
  });

  test('should show selection indicator when clicking Freehand tool', async ({ page }) => {
    const freehandButton = page.locator('button[aria-label="Freehand"]');
    await freehandButton.click({ force: true });
    await page.waitForTimeout(100);
    
    await expect(freehandButton).toHaveAttribute('aria-checked', 'true');
  });

  test('should show selection indicator when clicking Laser tool', async ({ page }) => {
    const laserButton = page.locator('button[aria-label="Laser"]');
    await laserButton.click({ force: true });
    await page.waitForTimeout(100);
    
    await expect(laserButton).toHaveAttribute('aria-checked', 'true');
  });

  test('should show selection indicator when clicking Eraser tool', async ({ page }) => {
    const eraserButton = page.locator('button[aria-label="Eraser"]');
    await eraserButton.click({ force: true });
    await page.waitForTimeout(100);
    
    await expect(eraserButton).toHaveAttribute('aria-checked', 'true');
  });

  test('should show selection indicator when clicking Text tool', async ({ page }) => {
    const textButton = page.locator('button[aria-label="Text"]');
    await textButton.click({ force: true });
    await page.waitForTimeout(100);
    
    await expect(textButton).toHaveAttribute('aria-checked', 'true');
  });

  test('should show selection indicator when clicking Mind Map tool', async ({ page }) => {
    const mindMapButton = page.locator('button[aria-label="Mind Map"]');
    await mindMapButton.click({ force: true });
    await page.waitForTimeout(100);
    
    await expect(mindMapButton).toHaveAttribute('aria-checked', 'true');
  });

  test('should show selection indicator when clicking Sticky Note tool', async ({ page }) => {
    const stickyNoteButton = page.locator('button[aria-label="Sticky Note"]');
    await stickyNoteButton.click({ force: true });
    await page.waitForTimeout(100);
    
    await expect(stickyNoteButton).toHaveAttribute('aria-checked', 'true');
  });

  test('should NOT show selection indicator on Image button', async ({ page }) => {
    const imageButton = page.getByRole('button', { name: /image/i });
    if (await imageButton.count() > 0) {
      await imageButton.first().click({ force: true });
      await page.waitForTimeout(100);
      await expect(imageButton.first()).not.toHaveAttribute('aria-checked', 'true');
    }
  });

  test('should show selection indicator on Arrow button when selected', async ({ page }) => {
    const selected = await selectTool(page, 'arrow');
    expect(selected).toBe(true);
    await page.waitForTimeout(100);
    
    const arrowButton = page.locator('button[aria-label="Arrow"]');
    const className = await arrowButton.getAttribute('class');
    expect(className).toMatch(/bg-primary|bg-accent/);
  });

  test('should show selection indicator on Shape dropdown when shape is selected', async ({ page }) => {
    const selected = await selectTool(page, 'rectangle');
    expect(selected).toBe(true);
    await page.waitForTimeout(200);
    
    const shapesDropdown = page.locator('button[aria-label="Shapes"]');
    const className = await shapesDropdown.getAttribute('class');
    expect(className).toMatch(/bg-primary|bg-accent/);
  });
});
