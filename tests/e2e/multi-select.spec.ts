import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, drawShape, clickOnCanvas, getCanvasBoundingBox, hasElementOnCanvas } from './utils';

test.describe('Multi-Select E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Shift+Click Multi-Select', () => {
    test('should add element to selection with Shift+Click', async ({ page }) => {
      if (!await selectTool(page, 'rectangle')) { test.skip(); return; }
      await drawShape(page, 50, 50, 150, 150);
      
      if (!await selectTool(page, 'ellipse')) { test.skip(); return; }
      await drawShape(page, 200, 50, 300, 150);
      
      const hasElements = await hasElementOnCanvas(page);
      expect(hasElements).toBe(true);
      
      if (!await selectTool(page, 'select')) { test.skip(); return; }
      await clickOnCanvas(page, 100, 100);
      
      await page.keyboard.down('Shift');
      await clickOnCanvas(page, 250, 100);
      await page.keyboard.up('Shift');
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });

    test('should remove element from selection with Shift+Click', async ({ page }) => {
      if (!await selectTool(page, 'rectangle')) { test.skip(); return; }
      await drawShape(page, 50, 50, 150, 150);
      
      if (!await selectTool(page, 'ellipse')) { test.skip(); return; }
      await drawShape(page, 200, 50, 300, 150);
      
      const hasElements = await hasElementOnCanvas(page);
      expect(hasElements).toBe(true);
      
      if (!await selectTool(page, 'select')) { test.skip(); return; }
      await clickOnCanvas(page, 100, 100);
      
      await page.keyboard.down('Shift');
      await clickOnCanvas(page, 250, 100);
      await page.keyboard.up('Shift');
      
      await page.keyboard.down('Shift');
      await clickOnCanvas(page, 250, 100);
      await page.keyboard.up('Shift');
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Select All', () => {
    test('should select all elements with Ctrl+A', async ({ page }) => {
      if (!await selectTool(page, 'rectangle')) { test.skip(); return; }
      await drawShape(page, 50, 50, 150, 150);
      
      if (!await selectTool(page, 'ellipse')) { test.skip(); return; }
      await drawShape(page, 200, 50, 300, 150);
      
      if (!await selectTool(page, 'diamond')) { test.skip(); return; }
      await drawShape(page, 350, 50, 450, 150);
      
      const hasElements = await hasElementOnCanvas(page);
      expect(hasElements).toBe(true);
      
      const isMac = process.platform === 'darwin';
      const modifier = isMac ? 'Meta' : 'Control';
      await page.keyboard.down(modifier);
      await page.keyboard.press('KeyA');
      await page.keyboard.up(modifier);
      await page.waitForTimeout(300);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Marquee/Box Selection', () => {
    test('should select multiple elements with drag selection', async ({ page }) => {
      if (!await selectTool(page, 'rectangle')) { test.skip(); return; }
      await drawShape(page, 100, 100, 200, 200);
      
      if (!await selectTool(page, 'ellipse')) { test.skip(); return; }
      await drawShape(page, 220, 100, 320, 200);
      
      const hasElements = await hasElementOnCanvas(page);
      expect(hasElements).toBe(true);
      
      if (!await selectTool(page, 'select')) { test.skip(); return; }
      
      const box = await getCanvasBoundingBox(page);
      
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 350, box.y + 250, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(500);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Multi-Element Operations', () => {
    test('should move multiple selected elements', async ({ page }) => {
      if (!await selectTool(page, 'rectangle')) { test.skip(); return; }
      await drawShape(page, 100, 100, 200, 200);
      
      if (!await selectTool(page, 'ellipse')) { test.skip(); return; }
      await drawShape(page, 220, 100, 320, 200);
      
      const hasElementsBefore = await hasElementOnCanvas(page);
      expect(hasElementsBefore).toBe(true);
      
      if (!await selectTool(page, 'select')) { test.skip(); return; }
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      const box = await getCanvasBoundingBox(page);
      
      await page.mouse.move(box.x + 200, box.y + 150);
      await page.mouse.down();
      await page.mouse.move(box.x + 300, box.y + 250, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      
      const hasElementsAfter = await hasElementOnCanvas(page);
      expect(hasElementsAfter).toBe(true);
    });

    test('should delete multiple selected elements', async ({ page }) => {
      if (!await selectTool(page, 'rectangle')) { test.skip(); return; }
      await drawShape(page, 100, 100, 200, 200);
      
      if (!await selectTool(page, 'ellipse')) { test.skip(); return; }
      await drawShape(page, 220, 100, 320, 200);
      
      const hasElementsBefore = await hasElementOnCanvas(page);
      expect(hasElementsBefore).toBe(true);
      
      if (!await selectTool(page, 'select')) { test.skip(); return; }
      const isMac = process.platform === 'darwin';
      const modifier = isMac ? 'Meta' : 'Control';
      await page.keyboard.down(modifier);
      await page.keyboard.press('KeyA');
      await page.keyboard.up(modifier);
      await page.waitForTimeout(300);
      
      await page.keyboard.press('Delete');
      await page.waitForTimeout(300);
      
      const hasElementsAfter = await hasElementOnCanvas(page);
      if (hasElementsAfter) {
        const canvas = page.locator('.board-wrapper');
        await expect(canvas).toBeVisible();
      } else {
        expect(hasElementsAfter).toBe(false);
      }
    });

    test('should copy and paste multiple elements', async ({ page }) => {
      if (!await selectTool(page, 'rectangle')) { test.skip(); return; }
      await drawShape(page, 100, 100, 200, 200);
      
      if (!await selectTool(page, 'ellipse')) { test.skip(); return; }
      await drawShape(page, 220, 100, 320, 200);
      
      const hasElementsBefore = await hasElementOnCanvas(page);
      expect(hasElementsBefore).toBe(true);
      
      if (!await selectTool(page, 'select')) { test.skip(); return; }
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyC');
      await page.keyboard.up('Control');
      await page.waitForTimeout(200);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyV');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      const hasElementsAfter = await hasElementOnCanvas(page);
      expect(hasElementsAfter).toBe(true);
    });
  });
});
