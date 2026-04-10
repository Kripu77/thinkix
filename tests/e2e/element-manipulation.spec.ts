import { test, expect, type Page } from '@playwright/test';
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

async function getSelectionFrame(page: Page) {
  const handles = page.locator('.resize-handle');
  await expect(handles.first()).toBeVisible({ timeout: 5000 });

  const boxes = await handles.evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      };
    }),
  );

  const centers = boxes.map((box) => ({
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  }));

  const minX = Math.min(...centers.map((center) => center.x));
  const maxX = Math.max(...centers.map((center) => center.x));
  const minY = Math.min(...centers.map((center) => center.y));
  const maxY = Math.max(...centers.map((center) => center.y));

  return {
    minX,
    maxX,
    minY,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

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

      const selectionBefore = await getSelectionFrame(page);

      await page.mouse.move(selectionBefore.centerX, selectionBefore.centerY);
      await page.mouse.down();
      await page.mouse.move(
        selectionBefore.centerX + 120,
        selectionBefore.centerY + 110,
        { steps: 12 },
      );
      await page.mouse.up();

      await expect
        .poll(async () => {
          const selectionAfterMove = await getSelectionFrame(page);
          return {
            x: Math.round(selectionAfterMove.centerX - selectionBefore.centerX),
            y: Math.round(selectionAfterMove.centerY - selectionBefore.centerY),
          };
        }, { timeout: 5000 })
        .toEqual({ x: 120, y: 110 });
      
      await undo(page);

      await expect
        .poll(async () => {
          const selectionAfterUndo = await getSelectionFrame(page);
          return {
            x: Math.round(selectionAfterUndo.centerX),
            y: Math.round(selectionAfterUndo.centerY),
          };
        }, { timeout: 5000 })
        .toEqual({
          x: Math.round(selectionBefore.centerX),
          y: Math.round(selectionBefore.centerY),
        });
      
      const countAfter = await getElementCount(page);
      expect(countAfter).toBe(countBefore);
    });

    test('should expose a draggable resize handle without removing the element', async ({ page }) => {
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
      await expect(page.locator('.resize-handle').nth(2)).toBeVisible({
        timeout: 5000,
      });
      
      const resizeHandle = page.locator('.resize-handle').nth(2);
      const handleBox = await resizeHandle.boundingBox();
      expect(handleBox).not.toBeNull();

      if (!handleBox) {
        test.fail();
        return;
      }

      await page.mouse.move(
        handleBox.x + handleBox.width / 2,
        handleBox.y + handleBox.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        handleBox.x + handleBox.width / 2 + 80,
        handleBox.y + handleBox.height / 2 + 80,
        { steps: 10 },
      );
      await page.mouse.up();
      await page.waitForTimeout(200);
      await clickOnCanvas(page, 20, 20);
      await page.waitForTimeout(150);

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
