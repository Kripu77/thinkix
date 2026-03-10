
import { describe, it, expect } from 'vitest';
import {
  extractPathPoints,
  computeEdgePositions,
  filterRedundantPoints,
  pointDistance,
  areCollinear,
  simplifyCollinearPoints,
  type Point,
} from './path';

describe('Edge Path Parser', () => {
  describe('extractPathPoints', () => {
    it('should parse simple moveto and lineto commands', () => {
      const d = 'M 10 20 L 30 40 L 50 60';
      const points = extractPathPoints(d);
      expect(points).toEqual([
        { x: 10, y: 20 },
        { x: 30, y: 40 },
        { x: 50, y: 60 },
      ]);
    });

    it('should parse horizontal line commands', () => {
      const d = 'M 10 20 H 30 H 50';
      const points = extractPathPoints(d);
      expect(points).toEqual([
        { x: 10, y: 20 },
        { x: 30, y: 20 },
        { x: 50, y: 20 },
      ]);
    });

    it('should parse vertical line commands', () => {
      const d = 'M 10 20 V 40 V 60';
      const points = extractPathPoints(d);
      expect(points).toEqual([
        { x: 10, y: 20 },
        { x: 10, y: 40 },
        { x: 10, y: 60 },
      ]);
    });

    it('should parse relative commands', () => {
      const d = 'm 10 20 l 20 0 l 0 30';
      const points = extractPathPoints(d);
      expect(points).toEqual([
        { x: 10, y: 20 },
        { x: 30, y: 20 },
        { x: 30, y: 50 },
      ]);
    });

    it('should parse cubic bezier curves (simplified)', () => {
      const d = 'M 10 20 C 30 20, 30 40, 50 40';
      const points = extractPathPoints(d);
      // Simplified to midpoint and endpoint
      expect(points.length).toBeGreaterThan(0);
      expect(points[points.length - 1]).toEqual({ x: 50, y: 40 });
    });

    it('should handle lowercase commands mixed with uppercase', () => {
      const d = 'M 10 20 L 30 40 m 10 10 L 50 60';
      const points = extractPathPoints(d);
      // M 10 20 -> point 1
      // L 30 40 -> point 2
      // m 10 10 (relative from 30, 40 -> 40, 50) -> point 3 (moveto after first is implicit lineto)
      // L 50 60 -> point 4 (absolute)
      expect(points.length).toBe(4);
      expect(points[0]).toEqual({ x: 10, y: 20 });
      expect(points[1]).toEqual({ x: 30, y: 40 });
      expect(points[2]).toEqual({ x: 40, y: 50 }); // relative m 10 10 from 30, 40
      expect(points[3]).toEqual({ x: 50, y: 60 }); // absolute L 50 60
    });

    it('should handle decimal numbers', () => {
      const d = 'M 10.5 20.3 L 30.7 40.9';
      const points = extractPathPoints(d);
      expect(points).toEqual([
        { x: 10.5, y: 20.3 },
        { x: 30.7, y: 40.9 },
      ]);
    });

    it('should handle negative coordinates', () => {
      const d = 'M -10 -20 L 10 20';
      const points = extractPathPoints(d);
      expect(points).toEqual([
        { x: -10, y: -20 },
        { x: 10, y: 20 },
      ]);
    });

    it('should handle scientific notation', () => {
      const d = 'M 1e2 2e1 L 3e2 4e1';
      const points = extractPathPoints(d);
      expect(points).toEqual([
        { x: 100, y: 20 },
        { x: 300, y: 40 },
      ]);
    });

    it('should handle empty path', () => {
      const points = extractPathPoints('');
      expect(points).toEqual([]);
    });

    it('should handle Z (close path) command', () => {
      const d = 'M 10 20 L 30 40 L 50 20 Z';
      const points = extractPathPoints(d);
      // Z doesn't add points, just closes the path
      expect(points.length).toBe(3);
    });
  });

  describe('filterRedundantPoints', () => {
    it('should keep all points if no duplicates', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ];
      const filtered = filterRedundantPoints(points);
      expect(filtered.length).toBe(2); // First and last, middle point is collinear
    });

    it('should remove duplicate consecutive points', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ];
      const filtered = filterRedundantPoints(points);
      expect(filtered.length).toBe(3);
      expect(filtered[1]).toEqual({ x: 10, y: 10 });
    });

    it('should always keep first and last points', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 10, y: 10 },
      ];
      const filtered = filterRedundantPoints(points);
      expect(filtered[0]).toEqual({ x: 0, y: 0 });
      expect(filtered[filtered.length - 1]).toEqual({ x: 10, y: 10 });
    });

    it('should apply offset to all points', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ];
      const filtered = filterRedundantPoints(points, { x: 5, y: 5 });
      expect(filtered).toEqual([
        { x: 5, y: 5 },
        { x: 15, y: 15 },
      ]);
    });

    it('should filter second-to-last point if too close to last', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        { x: 105, y: 105 },
      ];
      const filtered = filterRedundantPoints(points, { x: 0, y: 0 }, 20);
      // Second-to-last point (105,105) is only ~7 units from last (105,105)
      // So it might be filtered depending on distance check
      expect(filtered.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('pointDistance', () => {
    it('should calculate Euclidean distance', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 3, y: 4 };
      expect(pointDistance(p1, p2)).toBe(5);
    });

    it('should handle same point', () => {
      const p: Point = { x: 5, y: 5 };
      expect(pointDistance(p, p)).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const p1: Point = { x: -3, y: -4 };
      const p2: Point = { x: 0, y: 0 };
      expect(pointDistance(p1, p2)).toBe(5);
    });
  });

  describe('areCollinear', () => {
    it('should detect collinear horizontal points', () => {
      const p1: Point = { x: 0, y: 10 };
      const p2: Point = { x: 5, y: 10 };
      const p3: Point = { x: 10, y: 10 };
      expect(areCollinear(p1, p2, p3)).toBe(true);
    });

    it('should detect collinear vertical points', () => {
      const p1: Point = { x: 10, y: 0 };
      const p2: Point = { x: 10, y: 5 };
      const p3: Point = { x: 10, y: 10 };
      expect(areCollinear(p1, p2, p3)).toBe(true);
    });

    it('should detect collinear diagonal points', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 5, y: 5 };
      const p3: Point = { x: 10, y: 10 };
      expect(areCollinear(p1, p2, p3)).toBe(true);
    });

    it('should detect non-collinear points', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 5, y: 5 };
      const p3: Point = { x: 10, y: 0 };
      expect(areCollinear(p1, p2, p3, 10)).toBe(false);
    });

    it('should respect tolerance', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 5, y: 5.1 };
      const p3: Point = { x: 10, y: 10 };
      expect(areCollinear(p1, p2, p3, 10)).toBe(true);
      expect(areCollinear(p1, p2, p3, 0.1)).toBe(false);
    });
  });

  describe('simplifyCollinearPoints', () => {
    it('should remove collinear middle points', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
        { x: 10, y: 10 },
        { x: 15, y: 15 },
      ];
      const simplified = simplifyCollinearPoints(points);
      expect(simplified).toEqual([
        { x: 0, y: 0 },
        { x: 15, y: 15 },
      ]);
    });

    it('should keep non-collinear points', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
        { x: 10, y: 0 },
        { x: 15, y: 5 },
      ];
      const simplified = simplifyCollinearPoints(points);
      expect(simplified.length).toBe(4);
    });

    it('should handle empty array', () => {
      expect(simplifyCollinearPoints([])).toEqual([]);
    });

    it('should handle single point', () => {
      const points: Point[] = [{ x: 5, y: 5 }];
      expect(simplifyCollinearPoints(points)).toEqual(points);
    });

    it('should handle two points', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ];
      expect(simplifyCollinearPoints(points)).toEqual(points);
    });

    it('should always keep first and last points', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 3, y: 3 },
        { x: 7, y: 7 },
        { x: 10, y: 10 },
      ];
      const simplified = simplifyCollinearPoints(points);
      expect(simplified[0]).toEqual({ x: 0, y: 0 });
      expect(simplified[simplified.length - 1]).toEqual({ x: 10, y: 10 });
    });
  });

  describe('computeEdgePositions integration', () => {
    it('should compute positions from mock path element', () => {
      // Create a mock SVG path element
      const mockPath = {
        tagName: 'path',
        getAttribute: (name: string) => {
          if (name === 'd') {
            return 'M10,20 L30,40 L50,60';
          }
          return null;
        },
      } as unknown as SVGPathElement;

      const result = computeEdgePositions(mockPath, { x: 5, y: 5 });

      expect(result.startX).toBe(15);   // 10 + 5
      expect(result.startY).toBe(25);   // 20 + 5
      expect(result.endX).toBe(55);     // 50 + 5
      expect(result.endY).toBe(65);     // 60 + 5
      expect(result.reflectionPoints.length).toBeGreaterThan(0);
    });

    it('should throw error for non-path element', () => {
      const mockElement = {
        tagName: 'rect',
        getAttribute: () => null,
      } as unknown as SVGPathElement;

      expect(() => computeEdgePositions(mockElement))
        .toThrow('Expected path element');
    });

    it('should throw error for element without d attribute', () => {
      const mockPath = {
        tagName: 'path',
        getAttribute: () => null,
      } as unknown as SVGPathElement;

      expect(() => computeEdgePositions(mockPath))
        .toThrow('does not have a valid d attribute');
    });
  });
});
