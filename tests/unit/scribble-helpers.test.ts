import { describe, it, expect } from 'vitest';
import {
  getScribbleToolPointers,
  createScribbleElement,
  computeGaussianWeight,
  applyGaussianSmoothing,
} from '@/features/board/plugins/scribble/helpers';
import { ScribbleTool, SCRIBBLE_ELEMENT_TYPE } from '@/features/board/plugins/scribble/types';

describe('scribble helpers', () => {
  describe('getScribbleToolPointers', () => {
    it('should return ink and eraser tool pointers', () => {
      const pointers = getScribbleToolPointers();
      expect(pointers).toContain(ScribbleTool.ink);
      expect(pointers).toContain(ScribbleTool.eraser);
      expect(pointers).toHaveLength(2);
    });
  });

  describe('createScribbleElement', () => {
    it('should create element with ink tool', () => {
      const points = [[0, 0], [10, 10], [20, 20]];
      const element = createScribbleElement(ScribbleTool.ink, points);
      
      expect(element.type).toBe(SCRIBBLE_ELEMENT_TYPE);
      expect(element.shape).toBe(ScribbleTool.ink);
      expect(element.points).toEqual(points);
      expect(element.id).toBeDefined();
      expect(typeof element.id).toBe('string');
    });

    it('should create element with eraser tool', () => {
      const points = [[5, 5], [15, 15]];
      const element = createScribbleElement(ScribbleTool.eraser, points);
      
      expect(element.shape).toBe(ScribbleTool.eraser);
      expect(element.points).toEqual(points);
    });

    it('should generate unique IDs', () => {
      const points = [[0, 0]];
      const element1 = createScribbleElement(ScribbleTool.ink, points);
      const element2 = createScribbleElement(ScribbleTool.ink, points);
      
      expect(element1.id).not.toBe(element2.id);
    });

    it('should handle empty points array', () => {
      const element = createScribbleElement(ScribbleTool.ink, []);
      expect(element.points).toEqual([]);
    });

    it('should handle single point', () => {
      const element = createScribbleElement(ScribbleTool.ink, [[50, 50]]);
      expect(element.points).toEqual([[50, 50]]);
    });

    it('should handle large number of points', () => {
      const points = Array.from({ length: 1000 }, (_, i) => [i, i * 2] as [number, number]);
      const element = createScribbleElement(ScribbleTool.ink, points);
      expect(element.points).toHaveLength(1000);
    });
  });

  describe('computeGaussianWeight', () => {
    it('should return 1 for offset 0', () => {
      expect(computeGaussianWeight(0, 1)).toBe(1);
    });

    it('should decrease as offset increases', () => {
      const sigma = 2;
      const weight0 = computeGaussianWeight(0, sigma);
      const weight1 = computeGaussianWeight(1, sigma);
      const weight2 = computeGaussianWeight(2, sigma);
      
      expect(weight0).toBeGreaterThan(weight1);
      expect(weight1).toBeGreaterThan(weight2);
    });

    it('should return values between 0 and 1', () => {
      for (let offset = 0; offset <= 10; offset++) {
        for (let sigma = 0.5; sigma <= 5; sigma += 0.5) {
          const weight = computeGaussianWeight(offset, sigma);
          expect(weight).toBeGreaterThanOrEqual(0);
          expect(weight).toBeLessThanOrEqual(1);
        }
      }
    });

    it('should handle different sigma values', () => {
      const offset = 2;
      const weightSigma1 = computeGaussianWeight(offset, 1);
      const weightSigma2 = computeGaussianWeight(offset, 2);
      const weightSigma5 = computeGaussianWeight(offset, 5);
      
      expect(weightSigma1).toBeLessThan(weightSigma2);
      expect(weightSigma2).toBeLessThan(weightSigma5);
    });

    it('should return expected formula result', () => {
      const offset = 3;
      const sigma = 2;
      const expected = Math.exp(-(offset * offset) / (2 * sigma * sigma));
      expect(computeGaussianWeight(offset, sigma)).toBeCloseTo(expected, 10);
    });

    it('should handle negative offset (absolute value)', () => {
      expect(computeGaussianWeight(-2, 1)).toBeCloseTo(computeGaussianWeight(2, 1), 10);
    });
  });

  describe('applyGaussianSmoothing', () => {
    it('should return original points for array length < 2', () => {
      const singlePoint = [[10, 20]];
      expect(applyGaussianSmoothing(singlePoint, 1, 3)).toEqual(singlePoint);
      
      expect(applyGaussianSmoothing([], 1, 3)).toEqual([]);
    });

    it('should preserve first and last points', () => {
      const points = [[0, 0], [10, 10], [20, 20], [30, 30], [40, 40]];
      const smoothed = applyGaussianSmoothing(points, 1, 3);
      
      expect(smoothed[0]).toEqual(points[0]);
      expect(smoothed[smoothed.length - 1]).toEqual(points[points.length - 1]);
    });

    it('should return same number of points', () => {
      const points = [[0, 0], [10, 10], [20, 20], [30, 30]];
      const smoothed = applyGaussianSmoothing(points, 1, 3);
      
      expect(smoothed).toHaveLength(points.length);
    });

    it('should smooth middle points', () => {
      const points = [[0, 0], [100, 100], [10, 10]];
      const smoothed = applyGaussianSmoothing(points, 1, 3);
      
      expect(smoothed[0]).toEqual([0, 0]);
      expect(smoothed[2]).toEqual([10, 10]);
      
      expect(smoothed[1][0]).toBeGreaterThan(0);
      expect(smoothed[1][0]).toBeLessThan(100);
    });

    it('should handle horizontal line', () => {
      const points = [[0, 50], [10, 50], [20, 50], [30, 50], [40, 50]];
      const smoothed = applyGaussianSmoothing(points, 1, 3);
      
      for (const pt of smoothed) {
        expect(pt[1]).toBeCloseTo(50, 0);
      }
    });

    it('should handle vertical line', () => {
      const points = [[50, 0], [50, 10], [50, 20], [50, 30], [50, 40]];
      const smoothed = applyGaussianSmoothing(points, 1, 3);
      
      for (const pt of smoothed) {
        expect(pt[0]).toBeCloseTo(50, 0);
      }
    });

    it('should handle different sigma values', () => {
      const points = [[0, 0], [50, 100], [100, 0]];
      
      const smoothedLow = applyGaussianSmoothing(points, 0.5, 3);
      const smoothedHigh = applyGaussianSmoothing(points, 2, 3);
      
      expect(smoothedLow).toHaveLength(3);
      expect(smoothedHigh).toHaveLength(3);
    });

    it('should handle different window sizes', () => {
      const points = [[0, 0], [10, 10], [20, 20], [30, 30], [40, 40]];
      
      const smoothedSmall = applyGaussianSmoothing(points, 1, 3);
      const smoothedLarge = applyGaussianSmoothing(points, 1, 7);
      
      expect(smoothedSmall).toHaveLength(5);
      expect(smoothedLarge).toHaveLength(5);
    });

    it('should handle exactly 2 points', () => {
      const points = [[0, 0], [100, 100]];
      const smoothed = applyGaussianSmoothing(points, 1, 3);
      
      expect(smoothed).toHaveLength(2);
      expect(smoothed[0]).toEqual([0, 0]);
      expect(smoothed[1]).toEqual([100, 100]);
    });

    it('should not modify original array', () => {
      const points = [[0, 0], [10, 10], [20, 20]];
      const originalPoints = points.map(p => [...p]);
      
      applyGaussianSmoothing(points, 1, 3);
      
      expect(points).toEqual(originalPoints);
    });
  });
});
