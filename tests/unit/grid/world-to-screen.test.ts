import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { worldToScreen, screenToWorld, getViewportBounds, snapToGrid, getGridLines } from '@/features/board/grid/utils/world-to-screen';
import { createMockBoard } from '../../__utils__/test-utils';
import * as PlaitCore from '@plait/core';

describe('world-to-screen', () => {
  let getViewBoxSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getViewBoxSpy = vi.spyOn(PlaitCore, 'getViewBox');
  });

  afterEach(() => {
    getViewBoxSpy.mockRestore();
  });

  describe('worldToScreen', () => {
    it('should convert world coordinates to screen coordinates at zoom 1', () => {
      const board = createMockBoard({ 
        viewport: { zoom: 1 },
        viewBox: { x: 0, y: 0, width: 800, height: 600 }
      });
      getViewBoxSpy.mockReturnValue({ x: 0, y: 0, width: 800, height: 600 } as SVGRect);
      
      const result = worldToScreen(board, 100, 200);
      
      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });

    it('should apply zoom correctly', () => {
      const board = createMockBoard({ 
        viewport: { zoom: 2 },
        viewBox: { x: 0, y: 0, width: 800, height: 600 }
      });
      getViewBoxSpy.mockReturnValue({ x: 0, y: 0, width: 800, height: 600 } as SVGRect);
      
      const result = worldToScreen(board, 100, 200);
      
      expect(result.x).toBe(200);
      expect(result.y).toBe(400);
    });

    it('should apply viewBox offset correctly', () => {
      const board = createMockBoard({ 
        viewport: { zoom: 1 },
        viewBox: { x: 50, y: 100, width: 800, height: 600 }
      });
      getViewBoxSpy.mockReturnValue({ x: 50, y: 100, width: 800, height: 600 } as SVGRect);
      
      const result = worldToScreen(board, 100, 200);
      
      expect(result.x).toBe(50);
      expect(result.y).toBe(100);
    });

    it('should handle zoom and viewBox offset together', () => {
      const board = createMockBoard({ 
        viewport: { zoom: 0.5 },
        viewBox: { x: 100, y: 50, width: 800, height: 600 }
      });
      getViewBoxSpy.mockReturnValue({ x: 100, y: 50, width: 800, height: 600 } as SVGRect);
      
      const result = worldToScreen(board, 200, 100);
      
      expect(result.x).toBe(50);
      expect(result.y).toBe(25);
    });

    it('should handle very small zoom', () => {
      const board = createMockBoard({ 
        viewport: { zoom: 0.1 },
        viewBox: { x: 0, y: 0, width: 800, height: 600 }
      });
      getViewBoxSpy.mockReturnValue({ x: 0, y: 0, width: 800, height: 600 } as SVGRect);
      
      const result = worldToScreen(board, 1000, 1000);
      
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });

    it('should handle very large zoom', () => {
      const board = createMockBoard({ 
        viewport: { zoom: 5 },
        viewBox: { x: 0, y: 0, width: 800, height: 600 }
      });
      getViewBoxSpy.mockReturnValue({ x: 0, y: 0, width: 800, height: 600 } as SVGRect);
      
      const result = worldToScreen(board, 100, 100);
      
      expect(result.x).toBe(500);
      expect(result.y).toBe(500);
    });
  });

  describe('screenToWorld', () => {
    it('should convert screen coordinates to world coordinates at zoom 1', () => {
      const board = createMockBoard({ 
        viewport: { zoom: 1 },
        viewBox: { x: 0, y: 0, width: 800, height: 600 }
      });
      getViewBoxSpy.mockReturnValue({ x: 0, y: 0, width: 800, height: 600 } as SVGRect);
      
      const result = screenToWorld(board, 100, 200);
      
      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });

    it('should reverse zoom correctly', () => {
      const board = createMockBoard({ 
        viewport: { zoom: 2 },
        viewBox: { x: 0, y: 0, width: 800, height: 600 }
      });
      getViewBoxSpy.mockReturnValue({ x: 0, y: 0, width: 800, height: 600 } as SVGRect);
      
      const result = screenToWorld(board, 200, 400);
      
      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });

    it('should reverse viewBox offset correctly', () => {
      const board = createMockBoard({ 
        viewport: { zoom: 1 },
        viewBox: { x: 50, y: 100, width: 800, height: 600 }
      });
      getViewBoxSpy.mockReturnValue({ x: 50, y: 100, width: 800, height: 600 } as SVGRect);
      
      const result = screenToWorld(board, 50, 100);
      
      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });

    it('should be inverse of worldToScreen', () => {
      const board = createMockBoard({ 
        viewport: { zoom: 1.5 },
        viewBox: { x: 200, y: 150, width: 800, height: 600 }
      });
      getViewBoxSpy.mockReturnValue({ x: 200, y: 150, width: 800, height: 600 } as SVGRect);
      
      const worldX = 500;
      const worldY = 300;
      
      const screen = worldToScreen(board, worldX, worldY);
      const world = screenToWorld(board, screen.x, screen.y);
      
      expect(world.x).toBeCloseTo(worldX, 10);
      expect(world.y).toBeCloseTo(worldY, 10);
    });
  });

  describe('getViewportBounds', () => {
    it('should calculate bounds correctly', () => {
      const board = createMockBoard({ 
        viewport: { zoom: 1 },
        viewBox: { x: 0, y: 0, width: 800, height: 600 }
      });
      getViewBoxSpy.mockReturnValue({ x: 0, y: 0, width: 800, height: 600 } as SVGRect);
      
      const bounds = getViewportBounds(board);
      
      expect(bounds.minX).toBeLessThan(0);
      expect(bounds.maxX).toBeGreaterThan(800);
      expect(bounds.minY).toBeLessThan(0);
      expect(bounds.maxY).toBeGreaterThan(600);
    });

    it('should include padding based on zoom', () => {
      const board1 = createMockBoard({ 
        viewport: { zoom: 1 },
        viewBox: { x: 0, y: 0, width: 800, height: 600 }
      });
      const board2 = createMockBoard({ 
        viewport: { zoom: 2 },
        viewBox: { x: 0, y: 0, width: 400, height: 300 }
      });
      
      getViewBoxSpy.mockReturnValue({ x: 0, y: 0, width: 800, height: 600 } as SVGRect);
      const bounds1 = getViewportBounds(board1);
      
      getViewBoxSpy.mockReturnValue({ x: 0, y: 0, width: 400, height: 300 } as SVGRect);
      const bounds2 = getViewportBounds(board2);
      
      const padding1 = 200;
      const padding2 = 100;
      
      expect(bounds1.maxX - bounds1.minX - 800).toBeCloseTo(padding1 * 2, 0);
      expect(bounds2.maxX - bounds2.minX - 400).toBeCloseTo(padding2 * 2, 0);
    });
  });

  describe('snapToGrid', () => {
    it('should snap to nearest grid point', () => {
      expect(snapToGrid(15, 10)).toBe(20);
      expect(snapToGrid(12, 10)).toBe(10);
      expect(snapToGrid(5, 10)).toBe(10);
    });

    it('should handle values already on grid', () => {
      expect(snapToGrid(20, 10)).toBe(20);
      expect(snapToGrid(0, 10)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(snapToGrid(-15, 10)).toBe(-10);
      expect(snapToGrid(-6, 10)).toBe(-10);
      expect(snapToGrid(-25, 10)).toBe(-20);
    });
  });

  describe('getGridLines', () => {
    it('should generate lines at regular intervals', () => {
      const lines = getGridLines(0, 50, 10);
      
      expect(lines).toContain(0);
      expect(lines).toContain(10);
      expect(lines).toContain(20);
      expect(lines).toContain(30);
      expect(lines).toContain(40);
      expect(lines).toContain(50);
    });

    it('should handle non-aligned bounds', () => {
      const lines = getGridLines(5, 45, 10);
      
      expect(lines[0]).toBe(0);
      expect(lines[lines.length - 1]).toBe(50);
    });

    it('should handle negative bounds', () => {
      const lines = getGridLines(-25, 25, 10);
      
      expect(lines).toContain(-30);
      expect(lines).toContain(-20);
      expect(lines).toContain(0);
      expect(lines).toContain(20);
      expect(lines).toContain(30);
    });
  });
});
