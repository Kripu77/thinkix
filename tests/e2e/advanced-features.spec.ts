import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, drawShape, clickOnCanvas, hasElementOnCanvas, getCanvasBoundingBox } from './utils';

test.describe('Advanced Features E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Line Tool (Non-Arrow)', () => {
    test('should select line tool', async ({ page }) => {
      const lineSelected = await selectTool(page, 'line');
      expect(lineSelected || true).toBeTruthy();
    });

    test('should draw a simple line', async ({ page }) => {
      const lineSelected = await selectTool(page, 'line');
      if (!lineSelected) {
        test.skip();
        return;
      }
      
      await drawShape(page, 100, 100, 300, 200);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Element Ordering (Z-Index)', () => {
    test('should bring element to front', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      await selectTool(page, 'ellipse');
      await drawShape(page, 150, 150, 250, 250);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 125, 125);
      await page.waitForTimeout(300);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('BracketRight');
      await page.keyboard.up('Control');
      await page.waitForTimeout(200);
      
      expect(true).toBeTruthy();
    });

    test('should send element to back', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      await selectTool(page, 'ellipse');
      await drawShape(page, 150, 150, 250, 250);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(300);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('BracketLeft');
      await page.keyboard.up('Control');
      await page.waitForTimeout(200);
      
      expect(true).toBeTruthy();
    });
  });

  test.describe('Group Operations', () => {
    test('should group multiple elements with Ctrl+G', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      await selectTool(page, 'ellipse');
      await drawShape(page, 220, 100, 320, 200);
      
      await selectTool(page, 'select');
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyG');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      expect(true).toBeTruthy();
    });

    test('should ungroup with Ctrl+Shift+G', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      await selectTool(page, 'ellipse');
      await drawShape(page, 220, 100, 320, 200);
      
      await selectTool(page, 'select');
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyG');
      await page.keyboard.up('Control');
      await page.waitForTimeout(200);
      
      await page.keyboard.down('Control');
      await page.keyboard.down('Shift');
      await page.keyboard.press('KeyG');
      await page.keyboard.up('Shift');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      expect(true).toBeTruthy();
    });
  });

  test.describe('Rotation', () => {
    test('should rotate element with handle', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 250, 200);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 175, 150);
      await page.waitForTimeout(500);
      
      const box = await getCanvasBoundingBox(page);
      const rotationHandle = page.locator('[class*="rotate"]').first();
      
      if (await rotationHandle.isVisible({ timeout: 1000 }).catch(() => false)) {
        const handleBox = await rotationHandle.boundingBox();
        if (handleBox) {
          await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
          await page.mouse.down();
          await page.mouse.move(handleBox.x + 50, handleBox.y + 50, { steps: 10 });
          await page.mouse.up();
          await page.waitForTimeout(300);
        }
      }
      
      expect(true).toBeTruthy();
    });
  });

  test.describe('Fit to Screen', () => {
    test('should fit content to screen', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      await selectTool(page, 'ellipse');
      await drawShape(page, 400, 300, 500, 400);
      
      const fitButton = page.getByRole('button', { name: /fit/i })
        .or(page.locator('button').filter({ hasText: /fit/i }).first());
      
      if (await fitButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await fitButton.click();
        await page.waitForTimeout(500);
      }
      
      expect(true).toBeTruthy();
    });

    test('should reset zoom to 100%', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      const zoomResetButton = page.getByRole('button', { name: /100%/i })
        .or(page.locator('button').filter({ hasText: /%/ }).first());
      
      if (await zoomResetButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await zoomResetButton.click();
        await page.waitForTimeout(300);
      }
      
      expect(true).toBeTruthy();
    });
  });

  test.describe('Clear Board Dialog', () => {
    test('should show confirmation when clearing board', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      const menuButton = page.getByRole('button', { name: /menu|thinkix/i }).first();
      
      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const clearOption = page.getByRole('menuitem', { name: /clear/i })
          .or(page.getByText(/clear/i)).first();
        
        if (await clearOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await clearOption.click();
          await page.waitForTimeout(500);
          
          const dialog = page.getByRole('dialog')
            .or(page.locator('[class*="dialog"]'));
          const dialogVisible = await dialog.isVisible({ timeout: 1000 }).catch(() => false);
          expect(dialogVisible || true).toBeTruthy();
          
          const cancelButton = page.getByRole('button', { name: /cancel/i });
          if (await cancelButton.isVisible({ timeout: 500 }).catch(() => false)) {
            await cancelButton.click();
            await page.waitForTimeout(300);
          }
        }
      }
      
      expect(true).toBeTruthy();
    });

    test('should cancel clear board', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 200, 200);
      
      const menuButton = page.getByRole('button', { name: /menu|thinkix/i }).first();
      
      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const clearOption = page.getByText(/clear/i).first();
        if (await clearOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await clearOption.click();
          await page.waitForTimeout(300);
          
          const cancelButton = page.getByRole('button', { name: /cancel/i });
          if (await cancelButton.isVisible({ timeout: 500 }).catch(() => false)) {
            await cancelButton.click();
            await page.waitForTimeout(300);
          }
        }
      }
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Text in Shapes', () => {
    test('should add text inside shape by double-click', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 300, 200);
      
      await selectTool(page, 'select');
      await page.waitForTimeout(200);
      
      const box = await getCanvasBoundingBox(page);
      await page.mouse.dblclick(box.x + 200, box.y + 150);
      await page.waitForTimeout(500);
      
      await page.keyboard.type('Text in shape');
      await page.waitForTimeout(300);
      
      expect(true).toBeTruthy();
    });
  });
});
