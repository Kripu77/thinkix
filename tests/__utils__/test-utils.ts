import { vi } from 'vitest';
import type { PlaitBoard, PlaitElement, Viewport, PlaitTheme } from '@plait/core';

export interface MockViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MockBoardOptions {
  elements?: PlaitElement[];
  viewport?: Viewport;
  viewBox?: MockViewBox;
  theme?: PlaitTheme;
  selection?: string[] | null;
}

export function createMockBoard(options: MockBoardOptions = {}): PlaitBoard {
  const { 
    elements = [], 
    viewport = { zoom: 1, x: 0, y: 0 }, 
    viewBox = { x: 0, y: 0, width: 800, height: 600 },
    theme, 
    selection = null 
  } = options;

  return {
    children: elements,
    viewport,
    theme,
    selection,
    isReadonly: false,
    isMoving: false,
    isDragging: false,
    isSpaceDown: false,
    isHand: false,
    isSelecting: false,
    pointer: 'default',
    actions: [],
    selectedAction: null,
    getRectangle: vi.fn().mockReturnValue({ x: 0, y: 0, width: 800, height: 600 }),
    getViewBox: vi.fn().mockReturnValue(viewBox),
    toGlobalPoint: vi.fn((point) => point),
    toLocalPoint: vi.fn((point) => point),
    onChange: vi.fn(),
    apply: vi.fn(),
    pointerDown: vi.fn(),
    pointerMove: vi.fn(),
    pointerUp: vi.fn(),
    touchStart: vi.fn(),
    touchMove: vi.fn(),
    touchEnd: vi.fn(),
    wheel: vi.fn(),
    keydown: vi.fn(),
    keyup: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    fitViewport: vi.fn(),
    setViewport: vi.fn(),
    setSelection: vi.fn(),
    clearSelection: vi.fn(),
    deleteFragment: vi.fn(),
    insertFragment: vi.fn(),
    getSelection: vi.fn().mockReturnValue(selection),
    isCollapsed: vi.fn().mockReturnValue(true),
    isFocused: vi.fn().mockReturnValue(true),
    hasBeenTextEditing: vi.fn().mockReturnValue(false),
    getElementHost: vi.fn().mockReturnValue(document.createElement('div')),
    getRoughSVG: vi.fn().mockReturnValue({
      curve: vi.fn(),
      line: vi.fn(),
      circle: vi.fn(),
      rectangle: vi.fn(),
    }),
  } as unknown as PlaitBoard;
}

export function createMockFile(content: string, name: string, type: string = 'application/json'): File {
  return new File([content], name, { type });
}

export function createMockThinkixFile(elements: PlaitElement[] = [], name: string = 'test.thinkix'): File {
  const content = JSON.stringify({
    type: 'thinkix',
    version: 1,
    source: 'web',
    elements,
    viewport: { zoom: 1, x: 0, y: 0 },
  });
  return createMockFile(content, name, 'application/json');
}

export function createMockBlob(data: string, type: string = 'image/png'): Blob {
  return new Blob([data], { type });
}

export function createMockEvent<T extends Event>(type: string, props: Partial<T> = {}): T {
  const event = new Event(type) as T;
  Object.assign(event, props);
  return event;
}

export function createMockPointerEvent(
  type: string,
  props: Partial<PointerEventInit> = {}
): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: 0,
    clientY: 0,
    pointerId: 1,
    pointerType: 'mouse',
    pressure: 0,
    ...props,
  });
}

export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockImage(width: number = 100, height: number = 100): HTMLImageElement {
  const img = document.createElement('img');
  Object.defineProperty(img, 'naturalWidth', { value: width });
  Object.defineProperty(img, 'naturalHeight', { value: height });
  Object.defineProperty(img, 'complete', { value: true });
  return img;
}

export interface Point {
  x: number;
  y: number;
}

export interface MermaidVertex {
  id: string;
  text: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MermaidEdge {
  start: string;
  end: string;
  type: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  reflectionPoints: Point[];
  label?: string;
}

export interface MermaidSubgraph {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  nodeIds: string[];
}

export interface MermaidFlowchartData {
  type: 'flowchart' | 'flowchart-v2';
  vertices: Record<string, MermaidVertex>;
  edges: MermaidEdge[];
  subgraphs: MermaidSubgraph[];
}

export function createMockSVGElement(tagName: string, attrs: Record<string, string>): SVGElement {
  const elem = document.createElementNS('http://www.w3.org/2000/svg', tagName);
  Object.entries(attrs).forEach(([key, value]) => {
    elem.setAttribute(key, value);
  });
  return elem;
}

export function createMockSVGGroup(attrs: Record<string, string> = {}): SVGGElement {
  return createMockSVGElement('g', attrs) as SVGGElement;
}

export function createMockSVGRect(attrs: Record<string, string> = {}): SVGRectElement {
  const rect = createMockSVGElement('rect', attrs) as SVGRectElement;

  rect.getBBox = vi.fn().mockReturnValue({
    x: parseFloat(attrs.x || '0'),
    y: parseFloat(attrs.y || '0'),
    width: parseFloat(attrs.width || '100'),
    height: parseFloat(attrs.height || '50'),
  });

  return rect;
}

export function createMockSVGText(attrs: Record<string, string> = {}, textContent = ''): SVGTextElement {
  const text = createMockSVGElement('text', attrs) as SVGTextElement;
  text.textContent = textContent;

  text.getComputedTextLength = vi.fn().mockReturnValue(textContent.length * 8);

  return text;
}

export function createMockSVGPath(attrs: Record<string, string> = {}): SVGPathElement {
  const path = createMockSVGElement('path', attrs) as SVGPathElement;

  const d = attrs.d || '';
  void d;
  path.getPointAtLength = vi.fn((offset: number) => ({
    x: offset,
    y: offset * 0.5,
  } as DOMPoint));

  path.getTotalLength = vi.fn().mockReturnValue(100);

  return path;
}

export function createMockSVGSVG(attrs: Record<string, string> = {}): SVGSVGElement {
  const svg = createMockSVGElement('svg', attrs) as SVGSVGElement;

  svg.createSVGPoint = vi.fn().mockReturnValue({
    x: 0,
    y: 0,
    matrixTransform: vi.fn().mockReturnValue({ x: 0, y: 0 }),
  });

  return svg;
}

export function createMockMermaidFlowchartData(overrides: Partial<MermaidFlowchartData> = {}): MermaidFlowchartData {
  return {
    type: 'flowchart-v2',
    vertices: {
      A: { id: 'A', text: 'Start', type: 'stadium', x: 100, y: 100, width: 100, height: 50 },
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
    subgraphs: [],
    ...overrides,
  };
}

export function createMockMermaidVertex(overrides: Partial<MermaidVertex> = {}): MermaidVertex {
  return {
    id: 'test-vertex',
    text: 'Test',
    type: 'stadium',
    x: 100,
    y: 100,
    width: 100,
    height: 50,
    ...overrides,
  };
}

export function createMockMermaidEdge(overrides: Partial<MermaidEdge> = {}): MermaidEdge {
  return {
    start: 'A',
    end: 'B',
    type: 'arrow_point',
    startX: 200,
    startY: 125,
    endX: 300,
    endY: 125,
    reflectionPoints: [{ x: 200, y: 125 }, { x: 300, y: 125 }],
    ...overrides,
  };
}

export function expectValidPlaitElement(element: unknown): void {
  expect(element).toBeDefined();
  expect(element).toHaveProperty('id');
  expect(element).toHaveProperty('type');
  expect(element).toHaveProperty('points');
}

export function createMockPlaitElement(overrides: Partial<PlaitElement> = {}): PlaitElement {
  return {
    id: 'test-element',
    type: 'rectangle',
    points: [
      [0, 0],
      [100, 0],
      [100, 50],
      [0, 50],
    ],
    ...overrides,
  } as PlaitElement;
}

export function cleanupDOM(): void {
  if (typeof document !== 'undefined' && document.body) {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  }
}

export function setupDOM(): void {
  cleanupDOM();
  if (typeof document !== 'undefined' && document.body) {
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  }
}
