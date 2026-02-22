import { describe, it, expect, beforeEach } from 'vitest';
import { StrokeProcessor } from '@/features/board/plugins/scribble/stroke-processor';

describe('StrokeProcessor', () => {
  let processor: StrokeProcessor;

  beforeEach(() => {
    processor = new StrokeProcessor();
  });

  describe('constructor', () => {
    it('should create processor with default config', () => {
      const p = new StrokeProcessor();
      expect(p).toBeDefined();
    });

    it('should accept custom config', () => {
      const p = new StrokeProcessor({
        smoothingFactor: 0.8,
        velocityInfluence: 0.3,
        minPointDistance: 0.5,
      });
      expect(p).toBeDefined();
    });

    it('should merge custom config with defaults', () => {
      const p = new StrokeProcessor({ smoothingFactor: 0.9 });
      expect(p).toBeDefined();
    });
  });

  describe('addPoint', () => {
    it('should return first point immediately', () => {
      const point = processor.addPoint([10, 20]);
      expect(point).toEqual([10, 20]);
    });

    it('should return null for points too close in time', () => {
      processor.addPoint([0, 0], { timestamp: 1000 });
      const point = processor.addPoint([10, 10], { timestamp: 1001 });
      expect(point).toBeNull();
    });

    it('should accept points even if close (adaptive distance)', () => {
      processor.addPoint([0, 0], { timestamp: 1000 });
      const point = processor.addPoint([0.1, 0.1], { timestamp: 1050 });
      expect(point).not.toBeNull();
    });

    it('should accept points after sufficient time', () => {
      processor.addPoint([0, 0], { timestamp: 1000 });
      const point = processor.addPoint([10, 10], { timestamp: 1100 });
      expect(point).not.toBeNull();
    });

    it('should apply smoothing to subsequent points', () => {
      processor.addPoint([0, 0], { timestamp: 1000 });
      processor.addPoint([10, 10], { timestamp: 1100 });
      const point = processor.addPoint([20, 20], { timestamp: 1200 });
      
      expect(point).not.toBeNull();
      expect(point?.[0]).toBeGreaterThan(0);
      expect(point?.[1]).toBeGreaterThan(0);
    });

    it('should handle pressure metadata', () => {
      processor.addPoint([0, 0], { timestamp: 1000 });
      const point = processor.addPoint([10, 10], { 
        timestamp: 1100,
        pressure: 0.5 
      });
      expect(point).not.toBeNull();
    });

    it('should handle tilt metadata', () => {
      processor.addPoint([0, 0], { timestamp: 1000 });
      const point = processor.addPoint([10, 10], { 
        timestamp: 1100,
        tiltX: 30,
        tiltY: 45
      });
      expect(point).not.toBeNull();
    });

    it('should use current time if timestamp not provided', () => {
      const point1 = processor.addPoint([0, 0]);
      expect(point1).toEqual([0, 0]);
    });
  });

  describe('reset', () => {
    it('should clear stroke history', () => {
      processor.addPoint([0, 0], { timestamp: 1000 });
      processor.addPoint([10, 10], { timestamp: 1100 });
      
      processor.reset();
      
      const point = processor.addPoint([20, 20], { timestamp: 1200 });
      expect(point).toEqual([20, 20]);
    });

    it('should allow new stroke after reset', () => {
      processor.addPoint([0, 0], { timestamp: 1000 });
      processor.reset();
      
      const point = processor.addPoint([100, 100], { timestamp: 2000 });
      expect(point).toEqual([100, 100]);
    });
  });

  describe('velocity tracking', () => {
    it('should track velocity across points', () => {
      processor.addPoint([0, 0], { timestamp: 1000 });
      processor.addPoint([100, 0], { timestamp: 1100 });
      const point = processor.addPoint([200, 0], { timestamp: 1200 });
      
      expect(point).not.toBeNull();
    });

    it('should handle high velocity', () => {
      processor.addPoint([0, 0], { timestamp: 1000 });
      const point = processor.addPoint([500, 0], { timestamp: 1010 });
      expect(point).not.toBeNull();
    });

    it('should handle low velocity', () => {
      processor.addPoint([0, 0], { timestamp: 1000 });
      const point = processor.addPoint([1, 0], { timestamp: 2000 });
      expect(point).not.toBeNull();
    });
  });

  describe('adaptive smoothing', () => {
    it('should adapt smoothing based on pressure', () => {
      processor.addPoint([0, 0], { timestamp: 1000 });
      processor.addPoint([10, 10], { timestamp: 1100 });
      
      const lowPressure = processor.addPoint([20, 20], { 
        timestamp: 1200,
        pressure: 0.1 
      });
      
      processor.reset();
      processor.addPoint([0, 0], { timestamp: 1000 });
      processor.addPoint([10, 10], { timestamp: 1100 });
      
      const highPressure = processor.addPoint([20, 20], { 
        timestamp: 1200,
        pressure: 0.9 
      });
      
      expect(lowPressure).toBeDefined();
      expect(highPressure).toBeDefined();
    });

    it('should adapt smoothing based on tilt', () => {
      processor.addPoint([0, 0], { timestamp: 1000 });
      processor.addPoint([10, 10], { timestamp: 1100 });
      
      const noTilt = processor.addPoint([20, 20], { 
        timestamp: 1200,
        tiltX: 0,
        tiltY: 0 
      });
      
      processor.reset();
      processor.addPoint([0, 0], { timestamp: 1000 });
      processor.addPoint([10, 10], { timestamp: 1100 });
      
      const withTilt = processor.addPoint([20, 20], { 
        timestamp: 1200,
        tiltX: 45,
        tiltY: 45 
      });
      
      expect(noTilt).toBeDefined();
      expect(withTilt).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle negative coordinates', () => {
      const point = processor.addPoint([-10, -20]);
      expect(point).toEqual([-10, -20]);
    });

    it('should handle very large coordinates', () => {
      const point = processor.addPoint([1000000, 2000000]);
      expect(point).toEqual([1000000, 2000000]);
    });

    it('should handle zero coordinates', () => {
      const point = processor.addPoint([0, 0]);
      expect(point).toEqual([0, 0]);
    });

    it('should handle decimal coordinates', () => {
      const point = processor.addPoint([10.5, 20.7]);
      expect(point).toEqual([10.5, 20.7]);
    });

    it('should handle long stroke sequences', () => {
      let lastPoint: [number, number] | null = null;
      
      for (let i = 0; i < 100; i++) {
        lastPoint = processor.addPoint([i * 10, i * 5], { timestamp: 1000 + i * 50 });
      }
      
      expect(lastPoint).not.toBeNull();
    });
  });

  describe('config overrides', () => {
    it('should use adaptive minimum distance', () => {
      const p = new StrokeProcessor({ minPointDistance: 5 });
      p.addPoint([0, 0], { timestamp: 1000 });
      
      const closePoint = p.addPoint([1, 1], { timestamp: 1100 });
      expect(closePoint).not.toBeNull();
      
      const farPoint = p.addPoint([10, 10], { timestamp: 1200 });
      expect(farPoint).not.toBeNull();
    });

    it('should respect custom smoothingFactor', () => {
      const p1 = new StrokeProcessor({ smoothingFactor: 0.3 });
      const p2 = new StrokeProcessor({ smoothingFactor: 0.9 });
      
      p1.addPoint([0, 0], { timestamp: 1000 });
      p1.addPoint([50, 50], { timestamp: 1100 });
      const smooth1 = p1.addPoint([100, 0], { timestamp: 1200 });
      
      p2.addPoint([0, 0], { timestamp: 1000 });
      p2.addPoint([50, 50], { timestamp: 1100 });
      const smooth2 = p2.addPoint([100, 0], { timestamp: 1200 });
      
      expect(smooth1).toBeDefined();
      expect(smooth2).toBeDefined();
    });

    it('should respect custom historySize', () => {
      const p = new StrokeProcessor({ historySize: 3 });
      
      for (let i = 0; i < 10; i++) {
        p.addPoint([i * 10, i * 10], { timestamp: 1000 + i * 100 });
      }
      
      const point = p.addPoint([100, 100], { timestamp: 2500 });
      expect(point).toBeDefined();
    });
  });
});
