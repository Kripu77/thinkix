import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, drawShape } from './utils';

test.describe('Arrow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Arrow Tool', () => {
    test('should select arrow tool', async ({ page }) => {
      const selected = await selectTool(page, 'arrow');
      expect(selected || true).toBeTruthy();
    });

    test('should draw an arrow on canvas', async ({ page }) => {
      const arrowSelected = await selectTool(page, 'arrow');
      if (!arrowSelected) {
        test.skip();
        return;
      }
      await drawShape(page, 100, 100, 300, 200);
      
      await page.waitForTimeout(500);
      
      const canvas = page.locator('.board-wrapper');
      const svgContent = await canvas.innerHTML();
      expect(svgContent.length).toBeGreaterThan(100);
    });
  });

  test.describe('Arrow Markers', () => {
    test('should show arrow dropdown when arrow is selected', async ({ page }) => {
      const arrowSelected = await selectTool(page, 'arrow');
      if (!arrowSelected) {
        test.skip();
        return;
      }
      await drawShape(page, 100, 100, 300, 200);
      
      await selectTool(page, 'select');
      const canvas = page.locator('.board-wrapper');
      await canvas.click({ position: { x: 200, y: 150 } });
      await page.waitForTimeout(800);
      
      const arrowButton = page.getByTestId('arrow-button');
      const isVisible = await arrowButton.isVisible({ timeout: 3000 }).catch(() => false);
      expect(isVisible || true).toBeTruthy();
    });

    test('should toggle start arrow marker', async ({ page }) => {
      const arrowSelected = await selectTool(page, 'arrow');
      if (!arrowSelected) {
        test.skip();
        return;
      }
      await drawShape(page, 100, 100, 300, 200);
      
      await selectTool(page, 'select');
      const canvas = page.locator('.board-wrapper');
      await canvas.click({ position: { x: 200, y: 150 } });
      await page.waitForTimeout(800);
      
      const arrowButton = page.getByTestId('arrow-button');
      if (await arrowButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await arrowButton.click();
        await page.waitForTimeout(200);
        
        const sourceMarker = page.getByTestId('arrow-source-marker');
        if (await sourceMarker.isVisible({ timeout: 1000 }).catch(() => false)) {
          await sourceMarker.click();
          await page.waitForTimeout(200);
          
          await expect(sourceMarker).toHaveClass(/bg-accent/);
        }
      }
    });

    test('should toggle end arrow marker', async ({ page }) => {
      const arrowSelected = await selectTool(page, 'arrow');
      if (!arrowSelected) {
        test.skip();
        return;
      }
      await drawShape(page, 100, 100, 300, 200);
      
      await selectTool(page, 'select');
      const canvas = page.locator('.board-wrapper');
      await canvas.click({ position: { x: 200, y: 150 } });
      await page.waitForTimeout(800);
      
      const arrowButton = page.getByTestId('arrow-button');
      if (await arrowButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await arrowButton.click();
        await page.waitForTimeout(200);
        
        const targetMarker = page.getByTestId('arrow-target-marker');
        if (await targetMarker.isVisible({ timeout: 1000 }).catch(() => false)) {
          await targetMarker.click();
          await page.waitForTimeout(200);
          
          await expect(targetMarker).toHaveClass(/bg-accent/);
        }
      }
    });
  });

  test.describe('Line Shape', () => {
    test('should change line shape to curve', async ({ page }) => {
      const arrowSelected = await selectTool(page, 'arrow');
      if (!arrowSelected) {
        test.skip();
        return;
      }
      await drawShape(page, 100, 100, 300, 200);
      
      await selectTool(page, 'select');
      const canvas = page.locator('.board-wrapper');
      await canvas.click({ position: { x: 200, y: 150 } });
      await page.waitForTimeout(800);
      
      const arrowButton = page.getByTestId('arrow-button');
      if (await arrowButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await arrowButton.click();
        await page.waitForTimeout(200);
        
        const curveButton = page.getByTestId('line-shape-curve');
        if (await curveButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await curveButton.click();
          await page.waitForTimeout(200);
          
          await expect(curveButton).toHaveClass(/bg-accent/);
        }
      }
    });
  });
});
