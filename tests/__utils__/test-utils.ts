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
