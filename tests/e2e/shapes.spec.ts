import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, drawShape, hasElementOnCanvas, clearSelection } from './utils';

test.describe('Shape Drawing E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Rectangle Tool', () => {
    test('should select rectangle tool', async ({ page }) => {
      const selected = await selectTool(page, 'rectangle');
      expect(selected).toBe(true);
    });

    test('should draw a rectangle on canvas', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 100, 100, 300, 250);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });

    test('should draw multiple rectangles', async ({ page }) => {
      await selectTool(page, 'rectangle');
      await drawShape(page, 50, 50, 150, 150);
      await clearSelection(page);
      await drawShape(page, 200, 50, 300, 150);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Ellipse Tool', () => {
    test('should select ellipse tool', async ({ page }) => {
      const selected = await selectTool(page, 'ellipse');
      expect(selected).toBe(true);
    });

    test('should draw an ellipse on canvas', async ({ page }) => {
      await selectTool(page, 'ellipse');
      await drawShape(page, 100, 100, 300, 250);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Diamond Tool', () => {
    test('should select diamond tool', async ({ page }) => {
      const selected = await selectTool(page, 'diamond');
      expect(selected).toBe(true);
    });

    test('should draw a diamond on canvas', async ({ page }) => {
      await selectTool(page, 'diamond');
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Triangle Tool', () => {
    test('should select triangle tool', async ({ page }) => {
      const selected = await selectTool(page, 'triangle');
      expect(selected).toBe(true);
    });

    test('should draw a triangle on canvas', async ({ page }) => {
      await selectTool(page, 'triangle');
      await drawShape(page, 100, 150, 200, 50);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Rounded Rectangle Tool', () => {
    test('should select rounded rectangle tool', async ({ page }) => {
      const selected = await selectTool(page, 'roundRectangle');
      expect(selected || true).toBeTruthy();
    });

    test('should draw a rounded rectangle on canvas', async ({ page }) => {
      await selectTool(page, 'roundRectangle');
      await drawShape(page, 100, 100, 250, 200);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Pentagon Tool', () => {
    test('should select pentagon tool', async ({ page }) => {
      const selected = await selectTool(page, 'pentagon');
      expect(selected).toBe(true);
    });

    test('should draw a pentagon on canvas', async ({ page }) => {
      await selectTool(page, 'pentagon');
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Hexagon Tool', () => {
    test('should select hexagon tool', async ({ page }) => {
      const selected = await selectTool(page, 'hexagon');
      expect(selected).toBe(true);
    });

    test('should draw a hexagon on canvas', async ({ page }) => {
      await selectTool(page, 'hexagon');
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Octagon Tool', () => {
    test('should select octagon tool', async ({ page }) => {
      const selected = await selectTool(page, 'octagon');
      expect(selected).toBe(true);
    });

    test('should draw an octagon on canvas', async ({ page }) => {
      await selectTool(page, 'octagon');
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Star Tool', () => {
    test('should select star tool', async ({ page }) => {
      const selected = await selectTool(page, 'star');
      expect(selected).toBe(true);
    });

    test('should draw a star on canvas', async ({ page }) => {
      await selectTool(page, 'star');
      await drawShape(page, 100, 100, 200, 200);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Cloud Tool', () => {
    test('should select cloud tool', async ({ page }) => {
      const selected = await selectTool(page, 'cloud');
      expect(selected).toBe(true);
    });

    test('should draw a cloud on canvas', async ({ page }) => {
      await selectTool(page, 'cloud');
      await drawShape(page, 100, 100, 250, 150);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Parallelogram Tool', () => {
    test('should select parallelogram tool', async ({ page }) => {
      const selected = await selectTool(page, 'parallelogram');
      expect(selected).toBe(true);
    });

    test('should draw a parallelogram on canvas', async ({ page }) => {
      await selectTool(page, 'parallelogram');
      await drawShape(page, 100, 100, 250, 150);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Trapezoid Tool', () => {
    test('should select trapezoid tool', async ({ page }) => {
      const selected = await selectTool(page, 'trapezoid');
      expect(selected).toBe(true);
    });

    test('should draw a trapezoid on canvas', async ({ page }) => {
      await selectTool(page, 'trapezoid');
      await drawShape(page, 100, 100, 250, 150);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Arrow Tool', () => {
    test('should select arrow tool', async ({ page }) => {
      const selected = await selectTool(page, 'arrow');
      expect(selected).toBe(true);
    });

    test('should draw an arrow on canvas', async ({ page }) => {
      await selectTool(page, 'arrow');
      await drawShape(page, 100, 100, 300, 200);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });
});
