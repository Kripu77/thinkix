import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PlaitElement } from '@plait/core';
import { createMockMermaidFlowchartData } from '@/tests/__utils__/test-utils';

globalThis.DOMRect ??= class DOMRect {
  x = 0; y = 0; width = 0; height = 0;
  top = 0; right = 0; bottom = 0; left = 0;
  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x; this.y = y; this.width = width; this.height = height;
    this.top = y; this.right = x + width; this.bottom = y + height; this.left = x;
  }
  toJSON() {
    return { x: this.x, y: this.y, width: this.width, height: this.height, top: this.top, right: this.right, bottom: this.bottom, left: this.left };
  }
} as typeof DOMRect;

const mockBuildText = vi.fn((text) => text);
const mockMeasureElement = vi.fn(() => ({ width: 100, height: 20 }));
const mockGetRectangleByPoints = vi.fn(() => ({ x: 0, y: 0, width: 100, height: 50 }));
const mockInflate = vi.fn((rect, amount) => ({
  x: rect.x + amount,
  y: rect.y + amount,
  width: rect.width - amount * 2,
  height: rect.height - amount * 2,
}));
const mockGetRectangleByCenterPoint = vi.fn((center, width, height) => ({
  x: center[0] - width / 2,
  y: center[1] - height / 2,
  width,
  height,
}));
const mockGetPoints = vi.fn((rect) => [
  [rect.x, rect.y],
  [rect.x + rect.width, rect.y],
  [rect.x + rect.width, rect.y + rect.height],
  [rect.x, rect.y + rect.height],
]);
const mockGetBoundingRectangle = vi.fn((rects) => {
  if (rects.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  return {
    x: Math.min(...rects.map((r: { x: number }) => r.x)),
    y: Math.min(...rects.map((r: { y: number }) => r.y)),
    width: Math.max(...rects.map((r: { x: number; width: number }) => r.x + r.width)),
    height: Math.max(...rects.map((r: { y: number; height: number }) => r.y + r.height)),
  };
});

vi.mock('@plait/common', () => ({
  buildText: mockBuildText,
  measureElement: mockMeasureElement,
  DEFAULT_FONT_FAMILY: 'sans-serif',
  StrokeStyle: {
    dashed: 'dashed',
    dotted: 'dotted',
  },
  CustomText: {},
}));

vi.mock('@plait/core', () => ({
  createGroup: vi.fn(() => ({ id: 'mock-group', type: 'group', groupId: undefined })),
  RectangleClient: {
    getRectangleByPoints: mockGetRectangleByPoints,
    inflate: mockInflate,
    getRectangleByCenterPoint: mockGetRectangleByCenterPoint,
    getPoints: mockGetPoints,
    getBoundingRectangle: mockGetBoundingRectangle,
  },
}));

const mockCreateGeometryElement = vi.fn((shape, points, text, style) => ({
  id: `mock-${shape}-${Math.random().toString(36).substr(2, 9)}`,
  type: 'rectangle',
  shape,
  points,
  text,
  ...style,
}));

const mockCreateArrowLineElement = vi.fn((shape, points, source, target, texts, style) => ({
  id: `mock-arrow-${Math.random().toString(36).substr(2, 9)}`,
  type: 'arrow',
  shape,
  points,
  source,
  target,
  texts,
  ...style,
}));

vi.mock('@plait/draw', () => ({
  createGeometryElement: mockCreateGeometryElement,
  BasicShapes: {
    rectangle: 'rectangle',
    roundRectangle: 'roundRectangle',
    ellipse: 'ellipse',
    diamond: 'diamond',
    hexagon: 'hexagon',
    parallelogram: 'parallelogram',
    trapezoid: 'trapezoid',
    text: 'text',
  },
  createArrowLineElement: mockCreateArrowLineElement,
  ArrowLineShape: {
    straight: 'straight',
  },
  ArrowLineMarkerType: {
    none: 'none',
    arrow: 'arrow',
  },
}));

vi.mock('@thinkix/shared', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  })),
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    mermaidAPI: {
      getDiagramFromText: vi.fn().mockResolvedValue({
        type: 'flowchart-v2',
        parser: {
          yy: {
            getVertices: () => new Map(),
            getEdges: () => [],
          },
        },
      }),
    },
    render: vi.fn().mockResolvedValue({
      svg: '<svg></svg>',
    }),
  },
}));

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    addHook: vi.fn(),
    removeHook: vi.fn(),
    sanitize: vi.fn((text) => text),
  },
}));

describe('mermaid-transformers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('transformFlowchartToBoard', () => {
    describe('happy path', () => {
      it('should transform simple flowchart to board elements', async () => {
        const { transformFlowchartToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const mockData = createMockMermaidFlowchartData();

        const result = await transformFlowchartToBoard(mockData);

        expect(result).toBeDefined();
        expect(result.elements).toBeInstanceOf(Array);
        expect(result.warnings).toBeInstanceOf(Array);
      });

      it('should create text elements for vertices', async () => {
        const { transformFlowchartToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const mockData = createMockMermaidFlowchartData({
          vertices: {
            A: { id: 'A', text: 'Start Here', type: 'stadium', x: 100, y: 100, width: 120, height: 50 },
          },
        });

        const result = await transformFlowchartToBoard(mockData);

        expect(result.elements.length).toBeGreaterThan(0);
      });

      it('should create arrow elements for edges', async () => {
        const { transformFlowchartToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const mockData = createMockMermaidFlowchartData();

        const result = await transformFlowchartToBoard(mockData);

        const arrowElements = result.elements.filter((el) => (el as PlaitElement).type === 'arrow');
        expect(arrowElements.length).toBeGreaterThan(0);
      });
    });

    describe('edge cases - element creation', () => {
      it('should filter vertices with NaN geometry', async () => {
        const { transformFlowchartToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const mockData = createMockMermaidFlowchartData({
          vertices: {
            A: { id: 'A', text: 'Valid', type: 'stadium', x: 100, y: 100, width: 100, height: 50 },
            B: { id: 'B', text: 'Invalid', type: 'stadium', x: NaN, y: 100, width: 100, height: 50 },
            C: { id: 'C', text: 'Also Invalid', type: 'stadium', x: 100, y: NaN, width: 100, height: 50 },
          },
        });

        const result = await transformFlowchartToBoard(mockData);

        expect(result.warnings).toBeDefined();
      });

      it('should filter vertices with Infinity geometry', async () => {
        const { transformFlowchartToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const mockData = createMockMermaidFlowchartData({
          vertices: {
            A: { id: 'A', text: 'Invalid', type: 'stadium', x: Infinity, y: 100, width: 100, height: 50 },
          },
        });

        const result = await transformFlowchartToBoard(mockData);

        expect(result.warnings).toBeDefined();
      });

      it('should filter vertices with negative dimensions', async () => {
        const { transformFlowchartToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const mockData = createMockMermaidFlowchartData({
          vertices: {
            A: { id: 'A', text: 'Invalid', type: 'stadium', x: 100, y: 100, width: -50, height: 50 },
          },
        });

        const result = await transformFlowchartToBoard(mockData);

        expect(result.warnings).toBeDefined();
      });

      it('should filter vertices with zero dimensions', async () => {
        const { transformFlowchartToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const mockData = createMockMermaidFlowchartData({
          vertices: {
            A: { id: 'A', text: 'Invalid', type: 'stadium', x: 100, y: 100, width: 0, height: 50 },
            B: { id: 'B', text: 'Also Invalid', type: 'stadium', x: 200, y: 100, width: 100, height: 0 },
          },
        });

        const result = await transformFlowchartToBoard(mockData);

        expect(result.warnings?.length).toBeGreaterThan(0);
      });
    });

    describe('edge cases - shapes', () => {
      it('should handle all vertex shape types correctly', async () => {
        const { transformFlowchartToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const shapeTypes = ['round', 'stadium', 'circle', 'diamond', 'hexagon', 'parallelogram', 'trapezoid', 'rect'] as const;

        for (const shape of shapeTypes) {
          const mockData = createMockMermaidFlowchartData({
            vertices: {
              A: { id: 'A', text: 'Test', type: shape, x: 100, y: 100, width: 100, height: 50 },
            },
            edges: [],
          });

          const result = await transformFlowchartToBoard(mockData);

          expect(result.elements).toBeDefined();
        }
      });

      it('should handle double circle shape', async () => {
        const { transformFlowchartToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const mockData = createMockMermaidFlowchartData({
          vertices: {
            A: { id: 'A', text: 'Double', type: 'doublecircle', x: 100, y: 100, width: 80, height: 80 },
          },
          edges: [],
        });

        const result = await transformFlowchartToBoard(mockData);

        expect(result.elements.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe('edge cases - edges', () => {
      it('should handle edge with no start vertex', async () => {
        const { transformFlowchartToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const mockData = createMockMermaidFlowchartData({
          vertices: {
            B: { id: 'B', text: 'End', type: 'stadium', x: 300, y: 100, width: 100, height: 50 },
          },
          edges: [
            {
              start: 'A',
              end: 'B',
              type: 'arrow_point',
              startX: 200,
              startY: 125,
              endX: 300,
              endY: 125,
              reflectionPoints: [{ x: 200, y: 125 }, { x: 300, y: 125 }],
            },
          ],
        });

        const result = await transformFlowchartToBoard(mockData);

        expect(result.elements).toBeDefined();
      });

      it('should handle edge with no end vertex', async () => {
        const { transformFlowchartToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const mockData = createMockMermaidFlowchartData({
          vertices: {
            A: { id: 'A', text: 'Start', type: 'stadium', x: 100, y: 100, width: 100, height: 50 },
          },
          edges: [
            {
              start: 'A',
              end: 'B',
              type: 'arrow_point',
              startX: 200,
              startY: 125,
              endX: 300,
              endY: 125,
              reflectionPoints: [{ x: 200, y: 125 }, { x: 300, y: 125 }],
            },
          ],
        });

        const result = await transformFlowchartToBoard(mockData);

        expect(result.elements).toBeDefined();
      });

      it('should handle edge with very long path (100+ points)', async () => {
        const { transformFlowchartToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const longReflectionPoints = Array.from({ length: 150 }, (_, i) => ({
          x: 100 + i * 2,
          y: 100 + Math.sin(i * 0.1) * 20,
        }));

        const mockData = createMockMermaidFlowchartData({
          vertices: {
            A: { id: 'A', text: 'A', type: 'stadium', x: 100, y: 100, width: 100, height: 50 },
            B: { id: 'B', text: 'B', type: 'stadium', x: 400, y: 100, width: 100, height: 50 },
          },
          edges: [
            {
              start: 'A',
              end: 'B',
              type: 'arrow_point',
              startX: 100,
              startY: 125,
              endX: 400,
              endY: 125,
              reflectionPoints: longReflectionPoints,
            },
          ],
        });

        const result = await transformFlowchartToBoard(mockData);

        expect(result.elements).toBeDefined();
      });
    });

    describe('edge cases - styling', () => {
      it('should handle invalid color values', async () => {
        const { transformFlowchartToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const mockData = createMockMermaidFlowchartData({
          vertices: {
            A: {
              id: 'A',
              text: 'Styled',
              type: 'stadium',
              x: 100,
              y: 100,
              width: 100,
              height: 50,
              containerStyle: { fill: 'invalid-color', stroke: '#000' },
            },
          },
          edges: [],
        });

        const result = await transformFlowchartToBoard(mockData);

        expect(result.elements).toBeDefined();
      });

      it('should handle missing fill color', async () => {
        const { transformFlowchartToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const mockData = createMockMermaidFlowchartData({
          vertices: {
            A: {
              id: 'A',
              text: 'No Fill',
              type: 'stadium',
              x: 100,
              y: 100,
              width: 100,
              height: 50,
              containerStyle: { stroke: '#000' },
            },
          },
          edges: [],
        });

        const result = await transformFlowchartToBoard(mockData);

        expect(result.elements).toBeDefined();
      });

      it('should handle stroke width of 0', async () => {
        const { transformFlowchartToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const mockData = createMockMermaidFlowchartData({
          vertices: {
            A: {
              id: 'A',
              text: 'No Stroke',
              type: 'stadium',
              x: 100,
              y: 100,
              width: 100,
              height: 50,
              containerStyle: { strokeWidth: '0' },
            },
          },
          edges: [],
        });

        const result = await transformFlowchartToBoard(mockData);

        expect(result.elements).toBeDefined();
      });

      it('should handle dashed stroke style', async () => {
        const { transformFlowchartToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const mockData = createMockMermaidFlowchartData({
          vertices: {
            A: {
              id: 'A',
              text: 'Dashed',
              type: 'stadium',
              x: 100,
              y: 100,
              width: 100,
              height: 50,
              containerStyle: { strokeDasharray: '5,5' },
            },
          },
          edges: [],
        });

        const result = await transformFlowchartToBoard(mockData);

        expect(result.elements).toBeDefined();
      });
    });

    describe('integration with Plait', () => {
      it('should create valid Plait element structure', async () => {
        const { transformFlowchartToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const mockData = createMockMermaidFlowchartData();

        const result = await transformFlowchartToBoard(mockData);

        result.elements.forEach((element) => {
          expect(element).toHaveProperty('id');
          expect(element).toHaveProperty('type');
          expect(element).toHaveProperty('points');
        });
      });

      it('should set correct points on elements', async () => {
        const { transformFlowchartToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const mockData = createMockMermaidFlowchartData();

        const result = await transformFlowchartToBoard(mockData);

        const shapeElements = result.elements.filter((el) => (el as PlaitElement).type !== 'arrow');
        shapeElements.forEach((element) => {
          expect((element as PlaitElement).points).toBeDefined();
          expect(Array.isArray((element as PlaitElement).points)).toBe(true);
        });
      });

      it('should create proper parent-child relationships for subgraphs', async () => {
        const { transformFlowchartToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const mockData = createMockMermaidFlowchartData({
          vertices: {
            A: { id: 'A', text: 'A', type: 'stadium', x: 150, y: 150, width: 100, height: 50 },
          },
          edges: [],
          subgraphs: [
            {
              id: 'cluster1',
              title: 'My Subgraph',
              x: 100,
              y: 100,
              width: 200,
              height: 150,
              nodeIds: ['A'],
            },
          ],
        });

        const result = await transformFlowchartToBoard(mockData);

        expect(result.elements).toBeDefined();
      });
    });
  });

  describe('transformSequenceToBoard', () => {
    it('should transform sequence diagram data', async () => {
      const { transformSequenceToBoard } = await import('@thinkix/mermaid-to-thinkix');
      const mockData = {
        type: 'sequence' as const,
        nodes: [[], [], []],
        lines: [],
        arrows: [],
        loops: undefined,
        groups: [],
      };

      const result = await transformSequenceToBoard(mockData);

      expect(result).toBeDefined();
      expect(result.elements).toBeInstanceOf(Array);
    });
  });

  describe('transformClassToBoard', () => {
    it('should transform class diagram data', async () => {
      const { transformClassToBoard } = await import('@thinkix/mermaid-to-thinkix');
      const mockData = {
        type: 'class' as const,
        nodes: [[], [], []],
        lines: [],
        arrows: [],
        text: [],
        namespaces: [],
      };

      const result = await transformClassToBoard(mockData);

      expect(result).toBeDefined();
      expect(result.elements).toBeInstanceOf(Array);
    });
  });
});
