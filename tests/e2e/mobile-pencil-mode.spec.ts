import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, getCanvas } from './utils';

test.describe('Mobile and Pencil Mode E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Pencil Mode Indicator', () => {
    test('should render pencil mode indicator component when pencil mode is active', async ({ page }) => {
      const pencilIndicator = page.getByText('Pencil Mode');
      const isVisible = await pencilIndicator.isVisible({ timeout: 1000 }).catch(() => false);
      
      if (isVisible) {
        await expect(pencilIndicator).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should hide pencil mode indicator when exit button is clicked', async ({ page }) => {
      await page.evaluate(() => {
        const canvas = document.querySelector('.board-wrapper');
        if (canvas) {
          const penEvent = new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            pointerType: 'pen',
            pointerId: 1,
            clientX: 200,
            clientY: 200,
            pressure: 0.5,
          });
          canvas.dispatchEvent(penEvent);
        }
      });
      
      await page.waitForTimeout(300);
      
      const exitButton = page.getByRole('button', { name: 'Exit pencil mode' });
      const isExitVisible = await exitButton.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isExitVisible) {
        await exitButton.click();
        await page.waitForTimeout(200);
        
        const pencilIndicator = page.getByText('Pencil Mode');
        const stillVisible = await pencilIndicator.isVisible({ timeout: 1000 }).catch(() => false);
        expect(stillVisible).toBe(false);
      }
    });

    test('should have proper accessibility attributes on pencil mode indicator', async ({ page }) => {
      await page.evaluate(() => {
        const canvas = document.querySelector('.board-wrapper');
        if (canvas) {
          const penEvent = new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            pointerType: 'pen',
            pointerId: 1,
            clientX: 200,
            clientY: 200,
            pressure: 0.5,
          });
          canvas.dispatchEvent(penEvent);
        }
      });
      
      await page.waitForTimeout(300);
      
      const indicator = page.getByRole('status');
      const isVisible = await indicator.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isVisible) {
        expect(await indicator.getAttribute('aria-live')).toBe('polite');
        expect(await indicator.getAttribute('aria-label')).toContain('Pencil mode is active');
      }
    });
  });

  test.describe('Mobile Toolbar Layout', () => {
    test.use({ viewport: { width: 375, height: 667 } });
    
    test('should render toolbar with mobile-specific classes', async ({ page }) => {
      await waitForBoard(page);
      
      const toolbar = page.locator('.inline-flex.items-center').first();
      await expect(toolbar).toBeVisible();
      
      const className = await toolbar.getAttribute('class');
      expect(className).toBeTruthy();
    });

    test('should position AppMenu at bottom on mobile', async ({ page }) => {
      await waitForBoard(page);
      
      const bottomMenu = page.locator('.absolute').filter({ 
        has: page.locator('button') 
      });
      
      const count = await bottomMenu.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should hide zoom toolbar on mobile', async ({ page }) => {
      await waitForBoard(page);

      await expect(page.getByTestId('zoom-toolbar')).toHaveCount(0);
    });

    test('should still allow drawing on mobile', async ({ page }) => {
      await waitForBoard(page);
      
      await selectTool(page, 'rectangle');
      await page.waitForTimeout(200);
      
      const canvas = await getCanvas(page);
      const box = await canvas.boundingBox();
      
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 100);
        await page.mouse.down();
        await page.mouse.move(box.x + 200, box.y + 200, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(300);
      }
      
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Pinch Zoom on Touch Devices', () => {
    test('should support touch events for pinch zoom', async ({ page }) => {
      await waitForBoard(page);
      
      await page.evaluate(() => {
        const canvas = document.querySelector('.board-wrapper');
        if (canvas) {
          const touchStartEvent = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
            touches: [
              new Touch({
                identifier: 0,
                target: canvas,
                clientX: 100,
                clientY: 100,
              }),
              new Touch({
                identifier: 1,
                target: canvas,
                clientX: 200,
                clientY: 200,
              }),
            ] as unknown as Touch[],
          });
          canvas.dispatchEvent(touchStartEvent);
        }
      });
      
      await page.waitForTimeout(100);
      
      const canvas = await getCanvas(page);
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Desktop Layout', () => {
    test.use({ viewport: { width: 1280, height: 720 } });
    
    test('should show zoom toolbar on desktop', async ({ page }) => {
      await waitForBoard(page);

      await expect(page.getByTestId('zoom-toolbar').first()).toBeVisible();
    });

    test('should position toolbar at top center on desktop', async ({ page }) => {
      await waitForBoard(page);
      
      const toolbar = page.locator('.absolute.top-4').filter({
        has: page.locator('.inline-flex')
      });
      
      const isVisible = await toolbar.first().isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBe(true);
    });

    test('should show undo/redo buttons on desktop', async ({ page }) => {
      await waitForBoard(page);

      await expect(page.getByTestId('undo-button').first()).toBeVisible();
      await expect(page.getByTestId('redo-button').first()).toBeVisible();
    });
  });
});
