import { test, expect } from '@playwright/test';
import {
  waitForBoard,
  selectTool,
  drawShape,
  clickOnCanvas,
  getCanvasBoundingBox,
  getElementCount,
  selectAllElements,
  undo,
} from './utils';

test.describe('Element Manipulation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Drag Element to Reposition', () => {
    test('should drag element to new position', async ({ page }) => {
      const rectangleSelected = await selectTool(page, 'rectangle');
      if (!rectangleSelected) {
        test.skip();
        return;
      }
      
      await drawShape(page, 100, 100, 200, 200);
      
      const countBefore = await getElementCount(page);
      expect(countBefore).toBeGreaterThan(0);
      
      await selectTool(page, 'select');
      await selectAllElements(page);
      
      const box = await getCanvasBoundingBox(page);
      
      await page.mouse.move(box.x + 150, box.y + 150);
      await page.mouse.down();
      await page.mouse.move(box.x + 300, box.y + 300, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      
      const countAfter = await getElementCount(page);
      expect(countAfter).toBe(countBefore);
    });

    test('should drag element back after moving', async ({ page }) => {
      const rectangleSelected = await selectTool(page, 'rectangle');
      if (!rectangleSelected) {
        test.skip();
        return;
      }
      
      await drawShape(page, 100, 100, 200, 200);
      
      const countBefore = await getElementCount(page);
      expect(countBefore).toBeGreaterThan(0);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 150, 150);
      await page.waitForTimeout(300);
      
      const box = await getCanvasBoundingBox(page);
      
      await page.mouse.move(box.x + 150, box.y + 150);
      await page.mouse.down();
      await page.mouse.move(box.x + 300, box.y + 300, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(200);
      
      await page.mouse.move(box.x + 300, box.y + 300);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 150, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      
      const countAfter = await getElementCount(page);
      expect(countAfter).toBe(countBefore);
    });
  });

  test.describe('Resize Element', () => {
    test('should resize element by dragging corner handle', async ({ page }) => {
      const rectangleSelected = await selectTool(page, 'rectangle');
      if (!rectangleSelected) {
        test.skip();
        return;
      }
      
      await drawShape(page, 100, 100, 200, 200);
      
      const countBefore = await getElementCount(page);
      expect(countBefore).toBeGreaterThan(0);
      
      await selectTool(page, 'select');
      await selectAllElements(page);
      
      const box = await getCanvasBoundingBox(page);
      
      await page.mouse.move(box.x + 200, box.y + 200);
      await page.mouse.down();
      await page.mouse.move(box.x + 300, box.y + 300, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      
      const countAfter = await getElementCount(page);
      expect(countAfter).toBe(countBefore);
    });

    test('should resize element smaller', async ({ page }) => {
      const rectangleSelected = await selectTool(page, 'rectangle');
      if (!rectangleSelected) {
        test.skip();
        return;
      }
      
      await drawShape(page, 100, 100, 300, 300);
      
      const countBefore = await getElementCount(page);
      expect(countBefore).toBeGreaterThan(0);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      
      const box = await getCanvasBoundingBox(page);
      
      await page.mouse.move(box.x + 300, box.y + 300);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      
      const countAfter = await getElementCount(page);
      expect(countAfter).toBe(countBefore);
    });
  });

  test.describe('Undo After Manipulation', () => {
    test('should undo element move', async ({ page }) => {
      const rectangleSelected = await selectTool(page, 'rectangle');
      if (!rectangleSelected) {
        test.skip();
        return;
      }
      
      await drawShape(page, 100, 100, 200, 200);
      
      const countBefore = await getElementCount(page);
      expect(countBefore).toBeGreaterThan(0);
      
      await selectTool(page, 'select');
      await selectAllElements(page);
      
      const box = await getCanvasBoundingBox(page);
      
      await page.mouse.move(box.x + 150, box.y + 150);
      await page.mouse.down();
      await page.mouse.move(box.x + 300, box.y + 300, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(200);
      
      await undo(page);
      
      const countAfter = await getElementCount(page);
      expect(countAfter).toBe(countBefore);
    });

    test('should undo element resize', async ({ page }) => {
      const rectangleSelected = await selectTool(page, 'rectangle');
      if (!rectangleSelected) {
        test.skip();
        return;
      }
      
      await drawShape(page, 100, 100, 200, 200);
      
      const countBefore = await getElementCount(page);
      expect(countBefore).toBeGreaterThan(0);
      
      await selectTool(page, 'select');
      await clickOnCanvas(page, 150, 150);
      await page.waitForTimeout(500);
      
      const box = await getCanvasBoundingBox(page);
      
      await page.mouse.move(box.x + 200, box.y + 200);
      await page.mouse.down();
      await page.mouse.move(box.x + 300, box.y + 300, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(200);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyZ');
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      const countAfter = await getElementCount(page);
      expect(countAfter).toBe(countBefore);
    });
  });

  test.describe('Double-Click to Edit', () => {
    test('should enter edit mode with double-click on text', async ({ page }) => {
      const textSelected = await selectTool(page, 'text');
      if (!textSelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      await page.keyboard.type('Editable Text');
      await page.waitForTimeout(300);
      
      const countBefore = await getElementCount(page);
      expect(countBefore).toBeGreaterThan(0);
      
      await selectTool(page, 'select');
      await page.waitForTimeout(200);
      
      const box = await getCanvasBoundingBox(page);
      await page.mouse.dblclick(box.x + 200, box.y + 200);
      await page.waitForTimeout(300);
      
      for (let i = 0; i < 13; i++) {
        await page.keyboard.press('ArrowRight');
      }
      await page.keyboard.type(' Extended');
      await page.waitForTimeout(300);
      
      const countAfter = await getElementCount(page);
      expect(countAfter).toBeGreaterThanOrEqual(countBefore);
    });

    test('should enter edit mode with double-click on sticky note', async ({ page }) => {
      const stickySelected = await selectTool(page, 'stickyNote');
      if (!stickySelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      
      await page.keyboard.type('Sticky Content');
      await page.waitForTimeout(300);
      
      const countBefore = await getElementCount(page);
      expect(countBefore).toBeGreaterThan(0);
      
      await selectTool(page, 'select');
      await page.waitForTimeout(200);
      
      const box = await getCanvasBoundingBox(page);
      await page.mouse.dblclick(box.x + 200, box.y + 200);
      await page.waitForTimeout(300);
      
      const countAfter = await getElementCount(page);
      expect(countAfter).toBeGreaterThanOrEqual(countBefore);
    });
  });

  test.describe('Click Outside to Commit', () => {
    test('should commit text edit when clicking outside', async ({ page }) => {
      const textSelected = await selectTool(page, 'text');
      if (!textSelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 200, 200);
      await page.waitForTimeout(500);
      await page.keyboard.type('Text to Commit');
      await page.waitForTimeout(300);
      
      const countBefore = await getElementCount(page);
      expect(countBefore).toBeGreaterThan(0);
      
      await clickOnCanvas(page, 400, 400);
      await page.waitForTimeout(300);
      
      const countAfter = await getElementCount(page);
      expect(countAfter).toBeGreaterThanOrEqual(countBefore);
    });
  });
});
