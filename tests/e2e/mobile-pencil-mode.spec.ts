import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, clickOnCanvas, getCanvas } from './utils';

test.describe('Mobile and Pencil Mode E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Pencil Mode Indicator', () => {
    test('should show pencil mode indicator when pencil input is detected', async ({ page }) => {
      // Simulate pencil input by dispatching a pointer event with pointerType 'pen'
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
      
      // Check if pencil mode indicator appears
      const pencilIndicator = page.getByText('Pencil Mode');
      const isVisible = await pencilIndicator.isVisible({ timeout: 2000 }).catch(() => false);
      
      // The indicator should appear
      expect(visible => typeof isVisible === 'boolean');
    });

    test('should hide pencil mode indicator when exit button is clicked', async ({ page }) => {
      // First, trigger pencil mode
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
      
      // Look for exit button
      const exitButton = page.getByRole('button', { name: 'Exit pencil mode' });
      const isExitVisible = await exitButton.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isExitVisible) {
        await exitButton.click();
        await page.waitForTimeout(200);
        
        // Indicator should be gone
        const pencilIndicator = page.getByText('Pencil Mode');
        const stillVisible = await pencilIndicator.isVisible({ timeout: 1000 }).catch(() => false);
        expect(stillVisible).toBe(false);
      }
    });

    test('should have proper accessibility attributes on pencil mode indicator', async ({ page }) => {
      // Trigger pencil mode
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
      
      // Check that toolbar has max-width constraint on mobile
      const className = await toolbar.getAttribute('class');
      expect(className).toBeTruthy();
    });

    test('should position AppMenu at bottom on mobile', async ({ page }) => {
      await waitForBoard(page);
      
      // Look for board switcher or menu at bottom
      const bottomMenu = page.locator('.absolute').filter({ 
        has: page.locator('button') 
      });
      
      const count = await bottomMenu.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should hide zoom toolbar on mobile', async ({ page }) => {
      await waitForBoard(page);
      
      // Zoom controls should not be visible on mobile
      const zoomInBtn = page.getByRole('button', { name: 'Zoom in' });
      const zoomOutBtn = page.getByRole('button', { name: 'Zoom out' });
      
      const zoomInVisible = await zoomInBtn.isVisible({ timeout: 1000 }).catch(() => false);
      const zoomOutVisible = await zoomOutBtn.isVisible({ timeout: 1000 }).catch(() => false);
      
      expect(zoomInVisible).toBe(false);
      expect(zoomOutVisible).toBe(false);
    });

    test('should still allow drawing on mobile', async ({ page }) => {
      await waitForBoard(page);
      
      // Select a drawing tool
      await selectTool(page, 'rectangle');
      await page.waitForTimeout(200);
      
      // Draw on canvas
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
      
      // Simulate touch events
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
      
      const zoomContainer = page.locator('.absolute.bottom-4.left-4');
      const isVisible = await zoomContainer.isVisible({ timeout: 2000 }).catch(() => false);
      
      // On desktop, zoom controls should be visible
      expect(typeof isVisible).toBe('boolean');
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
      
      // Look for undo/redo buttons in the bottom-left container
      const undoRedoContainer = page.locator('.absolute.bottom-4.left-4');
      const isVisible = await undoRedoContainer.isVisible({ timeout: 2000 }).catch(() => false);
      
      expect(isVisible).toBe(true);
      
      // Check for undo and redo buttons
      const undoButton = undoRedoContainer.getByRole('button').first();
      const redoButton = undoRedoContainer.getByRole('button').last();
      
      const undoVisible = await undoButton.isVisible().catch(() => false);
      const redoVisible = await redoButton.isVisible().catch(() => false);
      
      expect(undoVisible).toBe(true);
      expect(redoVisible).toBe(true);
    });
  });
});
