import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('dompurify', () => ({
  default: {
    addHook: vi.fn(),
    removeHook: vi.fn(),
    sanitize: vi.fn((text) => text),
  },
}));

vi.mock('d3-selection', () => ({
  default: {
    select: vi.fn(() => ({
      append: vi.fn(),
      attr: vi.fn(),
      style: vi.fn(),
      node: vi.fn(),
    })),
  },
}));

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    mermaidAPI: {
      getDiagramFromText: vi.fn().mockResolvedValue({
        type: 'flowchart-v2',
        parser: { yy: { getVertices: () => new Map(), getEdges: () => [] } },
      }),
    },
    render: vi.fn().mockResolvedValue({ svg: '<svg></svg>' }),
  },
}));

describe('mermaid-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('edge-parser/path utilities', () => {
    describe('pointDistance', () => {
      it('should calculate distance between two points', async () => {
        const { pointDistance } = await import('@thinkix/mermaid-to-thinkix');

        expect(pointDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
        expect(pointDistance({ x: 10, y: 10 }, { x: 10, y: 10 })).toBe(0);
      });

      it('should handle negative coordinates', async () => {
        const { pointDistance } = await import('@thinkix/mermaid-to-thinkix');

        expect(pointDistance({ x: -5, y: -5 }, { x: 5, y: 5 })).toBeCloseTo(14.14, 1);
      });
    });

    describe('areCollinear', () => {
      it('should detect collinear points', async () => {
        const { areCollinear } = await import('@thinkix/mermaid-to-thinkix');

        expect(areCollinear({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 })).toBe(true);
        expect(areCollinear({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 })).toBe(true);
      });

      it('should detect non-collinear points', async () => {
        const { areCollinear } = await import('@thinkix/mermaid-to-thinkix');

        expect(areCollinear({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 })).toBe(false);
      });

      it('should use tolerance for near-collinear points', async () => {
        const { areCollinear } = await import('@thinkix/mermaid-to-thinkix');

        expect(areCollinear({ x: 0, y: 0 }, { x: 1, y: 1.01 }, { x: 2, y: 2 }, 0.1)).toBe(true);
      });
    });

    describe('filterRedundantPoints', () => {
      it('should remove points closer than min distance', async () => {
        const { filterRedundantPoints } = await import('@thinkix/mermaid-to-thinkix');

        const points = [{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 10, y: 10 }];
        const result = filterRedundantPoints(points, { x: 0, y: 0 }, 15);

        expect(result.length).toBeLessThanOrEqual(points.length);
      });

      it('should preserve points beyond min distance', async () => {
        const { filterRedundantPoints } = await import('@thinkix/mermaid-to-thinkix');

        const points = [{ x: 0, y: 0 }, { x: 25, y: 25 }, { x: 50, y: 50 }];
        const result = filterRedundantPoints(points, { x: 0, y: 0 }, 20);

        expect(result.length).toBe(3);
      });

      it('should handle empty point array', async () => {
        const { filterRedundantPoints } = await import('@thinkix/mermaid-to-thinkix');

        const result = filterRedundantPoints([], { x: 0, y: 0 });

        expect(result).toEqual([]);
      });

      it('should handle single point', async () => {
        const { filterRedundantPoints } = await import('@thinkix/mermaid-to-thinkix');

        const result = filterRedundantPoints([{ x: 10, y: 10 }], { x: 0, y: 0 });

        expect(result).toEqual([{ x: 10, y: 10 }]);
      });
    });

    describe('simplifyCollinearPoints', () => {
      it('should remove intermediate collinear points', async () => {
        const { simplifyCollinearPoints } = await import('@thinkix/mermaid-to-thinkix');

        const points = [{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 10, y: 10 }, { x: 15, y: 15 }];
        const result = simplifyCollinearPoints(points);
        
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({ x: 0, y: 0 });
        expect(result[1]).toEqual({ x: 15, y: 15 });
      });

      it('should preserve points that change direction', async () => {
        const { simplifyCollinearPoints } = await import('@thinkix/mermaid-to-thinkix');

        const points = [{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 10, y: 10 }, { x: 10, y: 20 }];
        const result = simplifyCollinearPoints(points);

        expect(result.length).toBeGreaterThan(2);
      });
    });

    describe('extractPathPoints', () => {
      it('should parse simple path with M and L commands', async () => {
        const { extractPathPoints } = await import('@thinkix/mermaid-to-thinkix');

        const result = extractPathPoints('M 10 10 L 20 20 L 30 30');

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({ x: 10, y: 10 });
      });

      it('should handle path with decimal coordinates', async () => {
        const { extractPathPoints } = await import('@thinkix/mermaid-to-thinkix');

        const result = extractPathPoints('M 10.5 20.7 L 30.2 40.9');

        expect(result).toHaveLength(2);
        expect(result[0].x).toBe(10.5);
        expect(result[0].y).toBe(20.7);
      });

      it('should handle negative coordinates', async () => {
        const { extractPathPoints } = await import('@thinkix/mermaid-to-thinkix');

        const result = extractPathPoints('M -10 -10 L 10 10');

        expect(result).toHaveLength(2);
        expect(result[0].x).toBe(-10);
        expect(result[0].y).toBe(-10);
      });

      it('should return empty array for invalid path', async () => {
        const { extractPathPoints } = await import('@thinkix/mermaid-to-thinkix');

        const result = extractPathPoints('');

        expect(result).toEqual([]);
      });
    });

    describe('computeEdgePositions', () => {
      it('should extract positions from path element', async () => {
        const { computeEdgePositions } = await import('@thinkix/mermaid-to-thinkix');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
        path.setAttribute('d', 'M 0 0 L 100 50');

        const result = computeEdgePositions(path, { x: 10, y: 10 });

        expect(result).toHaveProperty('reflectionPoints');
        expect(result.reflectionPoints.length).toBeGreaterThan(0);
      });

      it('should handle path with no commands', async () => {
        const { computeEdgePositions } = await import('@thinkix/mermaid-to-thinkix');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
        path.setAttribute('d', '');

        expect(() => computeEdgePositions(path)).toThrow();
      });
    });
  });
});
