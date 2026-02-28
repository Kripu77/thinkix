import { describe, it, expect } from 'vitest';
import { getIsometricPoints, isometricWorldToScreen, screenToIsometricWorld } from '@/features/board/grid/utils/isometric';

describe('isometric', () => {
  describe('getIsometricPoints', () => {
    it('should return arrays of diagonal lines', () => {
      const result = getIsometricPoints(0, 100, 0, 100, 20);
      
      expect(Array.isArray(result.leftDiagonals)).toBe(true);
      expect(Array.isArray(result.rightDiagonals)).toBe(true);
      expect(result.leftDiagonals.length).toBeGreaterThan(0);
      expect(result.rightDiagonals.length).toBeGreaterThan(0);
    });

    it('should generate more lines with smaller spacing', () => {
      const sparse = getIsometricPoints(0, 100, 0, 100, 40);
      const dense = getIsometricPoints(0, 100, 0, 100, 10);
      
      expect(dense.leftDiagonals.length).toBeGreaterThan(sparse.leftDiagonals.length);
      expect(dense.rightDiagonals.length).toBeGreaterThan(sparse.rightDiagonals.length);
    });

    it('should create lines with start and end points', () => {
      const result = getIsometricPoints(0, 100, 0, 100, 20);
      
      const firstLeft = result.leftDiagonals[0];
      expect(firstLeft.start).toHaveProperty('x');
      expect(firstLeft.start).toHaveProperty('y');
      expect(firstLeft.end).toHaveProperty('x');
      expect(firstLeft.end).toHaveProperty('y');
    });

    it('should cover the entire bounds', () => {
      const result = getIsometricPoints(-50, 50, -50, 50, 20);
      
      const allX = [
        ...result.leftDiagonals.flatMap(l => [l.start.x, l.end.x]),
        ...result.rightDiagonals.flatMap(l => [l.start.x, l.end.x]),
      ];
      const allY = [
        ...result.leftDiagonals.flatMap(l => [l.start.y, l.end.y]),
        ...result.rightDiagonals.flatMap(l => [l.start.y, l.end.y]),
      ];
      
      const minX = Math.min(...allX);
      const maxX = Math.max(...allX);
      const minY = Math.min(...allY);
      const maxY = Math.max(...allY);
      
      expect(minX).toBeLessThanOrEqual(-50);
      expect(maxX).toBeGreaterThanOrEqual(50);
      expect(minY).toBeLessThanOrEqual(-50);
      expect(maxY).toBeGreaterThanOrEqual(50);
    });
  });

  describe('isometricWorldToScreen', () => {
    it('should transform world coordinates to screen', () => {
      const result = isometricWorldToScreen(100, 100);
      
      expect(typeof result.x).toBe('number');
      expect(typeof result.y).toBe('number');
    });

    it('should return origin for world origin', () => {
      const result = isometricWorldToScreen(0, 0);
      
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should transform symmetrically for equal coordinates', () => {
      const result = isometricWorldToScreen(50, 50);
      
      expect(result.x).toBeCloseTo(0, 5);
    });

    it('should produce opposite x values for opposite world coordinates', () => {
      const result1 = isometricWorldToScreen(100, 0);
      const result2 = isometricWorldToScreen(0, 100);
      
      expect(result1.x).toBeCloseTo(-result2.x, 5);
    });
  });

  describe('screenToIsometricWorld', () => {
    it('should be inverse of isometricWorldToScreen', () => {
      const worldX = 100;
      const worldY = 50;
      
      const screen = isometricWorldToScreen(worldX, worldY);
      const world = screenToIsometricWorld(screen.x, screen.y);
      
      expect(world.x).toBeCloseTo(worldX, 5);
      expect(world.y).toBeCloseTo(worldY, 5);
    });

    it('should return origin for screen origin', () => {
      const result = screenToIsometricWorld(0, 0);
      
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(0, 5);
    });
  });

  describe('geometric consistency', () => {
    it('should produce consistent transformations', () => {
      const p1 = isometricWorldToScreen(1, 0);
      const p2 = isometricWorldToScreen(0, 1);
      
      expect(p1.x).not.toBe(p2.x);
    });
  });
});
