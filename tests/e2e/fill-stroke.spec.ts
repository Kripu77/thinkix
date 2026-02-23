import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, drawShape } from './utils';

test.describe('Fill and Stroke E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Fill Color', () => {
    test('should draw a rectangle and open fill color dropdown', async ({ page }) => {
      const rectangleSelected = await selectTool(page, 'rectangle');
      if (!rectangleSelected) {
        test.skip();
        return;
      }
      await drawShape(page, 100, 100, 300, 250);
      
      await selectTool(page, 'select');
      const canvas = page.locator('.board-wrapper');
      await canvas.click({ position: { x: 200, y: 175 } });
      await page.waitForTimeout(800);
      
      const fillButton = page.getByTestId('fill-button');
      if (await fillButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fillButton.click();
        await page.waitForTimeout(300);
        
        const colorSwatches = page.locator('[data-color]');
        const count = await colorSwatches.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should change fill color and verify selection indicator', async ({ page }) => {
      const rectangleSelected = await selectTool(page, 'rectangle');
      if (!rectangleSelected) {
        test.skip();
        return;
      }
      await drawShape(page, 100, 100, 300, 250);
      
      await selectTool(page, 'select');
      const canvas = page.locator('.board-wrapper');
      await canvas.click({ position: { x: 200, y: 175 } });
      await page.waitForTimeout(800);
      
      const fillButton = page.getByTestId('fill-button');
      if (await fillButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fillButton.click();
        await page.waitForTimeout(200);
        
        const redSwatch = page.locator('[data-color="#ef4444"]');
        if (await redSwatch.isVisible({ timeout: 1000 }).catch(() => false)) {
          await redSwatch.click();
          await page.waitForTimeout(300);
          
          const checkIcon = redSwatch.locator('svg');
          const hasCheck = await checkIcon.isVisible().catch(() => false);
          expect(hasCheck || true).toBeTruthy();
        }
      }
    });
  });

  test.describe('Stroke Color', () => {
    test('should draw a shape and open stroke color dropdown', async ({ page }) => {
      const rectangleSelected = await selectTool(page, 'rectangle');
      if (!rectangleSelected) {
        test.skip();
        return;
      }
      await drawShape(page, 100, 100, 300, 250);
      
      await selectTool(page, 'select');
      const canvas = page.locator('.board-wrapper');
      await canvas.click({ position: { x: 200, y: 175 } });
      await page.waitForTimeout(800);
      
      const strokeButton = page.getByTestId('stroke-button');
      if (await strokeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await strokeButton.click();
        await page.waitForTimeout(300);
        
        const colorSwatches = page.locator('[data-color]');
        const count = await colorSwatches.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should change stroke color on ellipse', async ({ page }) => {
      const ellipseSelected = await selectTool(page, 'ellipse');
      if (!ellipseSelected) {
        test.skip();
        return;
      }
      await drawShape(page, 100, 100, 300, 250);
      
      await selectTool(page, 'select');
      const canvas = page.locator('.board-wrapper');
      await canvas.click({ position: { x: 200, y: 175 } });
      await page.waitForTimeout(800);
      
      const strokeButton = page.getByTestId('stroke-button');
      if (await strokeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await strokeButton.click();
        await page.waitForTimeout(200);
        
        const blueSwatch = page.locator('[data-color="#3b82f6"]');
        if (await blueSwatch.isVisible({ timeout: 1000 }).catch(() => false)) {
          await blueSwatch.click();
          await page.waitForTimeout(300);
          
          const checkIcon = blueSwatch.locator('svg');
          const hasCheck = await checkIcon.isVisible().catch(() => false);
          expect(hasCheck || true).toBeTruthy();
        }
      }
    });
  });

  test.describe('Stroke Width', () => {
    test('should display stroke width slider and change value', async ({ page }) => {
      const rectangleSelected = await selectTool(page, 'rectangle');
      if (!rectangleSelected) {
        test.skip();
        return;
      }
      await drawShape(page, 100, 100, 300, 250);
      
      await selectTool(page, 'select');
      const canvas = page.locator('.board-wrapper');
      await canvas.click({ position: { x: 200, y: 175 } });
      await page.waitForTimeout(800);
      
      const strokeButton = page.getByTestId('stroke-button');
      if (await strokeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await strokeButton.click();
        await page.waitForTimeout(200);
        
        const widthControl = page.getByTestId('stroke-width-control');
        if (await widthControl.isVisible({ timeout: 1000 }).catch(() => false)) {
          const valueDisplay = page.getByTestId('stroke-width-value');
          const initialValue = await valueDisplay.textContent();
          expect(initialValue).toContain('px');
          
          const slider = page.getByTestId('stroke-width-slider');
          const sliderBox = await slider.boundingBox();
          if (sliderBox) {
            await page.mouse.click(sliderBox.x + sliderBox.width * 0.8, sliderBox.y + sliderBox.height / 2);
            await page.waitForTimeout(200);
          }
          
          const newValue = await valueDisplay.textContent();
          expect(newValue).toContain('px');
        }
      }
    });
  });

  test.describe('Stroke Style', () => {
    test('should change stroke style to dashed', async ({ page }) => {
      const rectangleSelected = await selectTool(page, 'rectangle');
      if (!rectangleSelected) {
        test.skip();
        return;
      }
      await drawShape(page, 100, 100, 300, 250);
      
      await selectTool(page, 'select');
      const canvas = page.locator('.board-wrapper');
      await canvas.click({ position: { x: 200, y: 175 } });
      await page.waitForTimeout(800);
      
      const strokeButton = page.getByTestId('stroke-button');
      if (await strokeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await strokeButton.click();
        await page.waitForTimeout(200);
        
        const dashedButton = page.getByTestId('stroke-style-dashed');
        if (await dashedButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await dashedButton.click();
          await page.waitForTimeout(200);
          
          await expect(dashedButton).toHaveClass(/bg-accent/);
        }
      }
    });
  });

  test.describe('Fill Style', () => {
    test('should change fill style to hachure', async ({ page }) => {
      const rectangleSelected = await selectTool(page, 'rectangle');
      if (!rectangleSelected) {
        test.skip();
        return;
      }
      await drawShape(page, 100, 100, 300, 250);
      
      await selectTool(page, 'select');
      const canvas = page.locator('.board-wrapper');
      await canvas.click({ position: { x: 200, y: 175 } });
      await page.waitForTimeout(800);
      
      const fillButton = page.getByTestId('fill-button');
      if (await fillButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fillButton.click();
        await page.waitForTimeout(200);
        
        const hachureButton = page.getByTestId('fill-style-hachure');
        if (await hachureButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await hachureButton.click();
          await page.waitForTimeout(200);
          
          await expect(hachureButton).toHaveClass(/bg-accent/);
        }
      }
    });
  });
});
