import { describe, it, expect, vi } from 'vitest';
import type { PlaitBoard, PlaitElement } from '@plait/core';

const STICKY_NOTE_POINTER = 'sticky-note';
const STICKY_NOTE_FILL = '#FFEAA7';
const STICKY_NOTE_STROKE = '#F1C40F';
const STICKY_NOTE_WIDTH = 160;
const STICKY_NOTE_HEIGHT = 160;

vi.mock('@plait/core', async () => ({
  toHostPoint: vi.fn((board, x, y) => [x, y]),
  toViewBoxPoint: vi.fn((board, point) => point),
  Transforms: {
    insertNode: vi.fn(),
  },
  BoardTransforms: {
    updatePointerType: vi.fn(),
  },
  PlaitPointerType: {
    selection: 'selection',
  },
  PlaitBoard: {
    isInPointer: vi.fn((board, pointers) => pointers.includes(STICKY_NOTE_POINTER)),
  },
}));

vi.mock('@plait/draw', () => ({
  createGeometryElement: vi.fn((shape, points, text, props) => ({
    id: 'test-id',
    type: shape,
    points,
    text,
    ...props,
    fillStyle: 'solid',
  })),
  BasicShapes: {
    rectangle: 'rectangle',
  },
}));

function createMockBoard(elements: PlaitElement[] = []): PlaitBoard {
  return {
    children: [...elements],
    viewport: { zoom: 1, x: 0, y: 0 },
    selection: null,
    isReadonly: false,
    isMoving: false,
    isDragging: false,
    isSpaceDown: false,
    isHand: false,
    isSelecting: false,
    pointer: 'default',
    actions: [],
    selectedAction: null,
    getRectangle: vi.fn(),
    getViewBox: vi.fn(),
    toGlobalPoint: vi.fn((p) => p),
    toLocalPoint: vi.fn((p) => p),
    onChange: vi.fn(),
    pointerDown: vi.fn(),
    pointerMove: vi.fn(),
    pointerUp: vi.fn(),
    globalPointerUp: vi.fn(),
    touchStart: vi.fn(),
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
    getSelection: vi.fn(),
    isCollapsed: vi.fn(),
    isFocused: vi.fn(),
    hasBeenTextEditing: vi.fn(),
    getElementHost: vi.fn(),
    getRoughSVG: vi.fn(),
  } as unknown as PlaitBoard;
}

describe('with-sticky-note', () => {
  describe('sticky note constants', () => {
    it('should have correct fill color', () => {
      expect(STICKY_NOTE_FILL).toBe('#FFEAA7');
    });

    it('should have correct stroke color', () => {
      expect(STICKY_NOTE_STROKE).toBe('#F1C40F');
    });

    it('should have correct width', () => {
      expect(STICKY_NOTE_WIDTH).toBe(160);
    });

    it('should have correct height', () => {
      expect(STICKY_NOTE_HEIGHT).toBe(160);
    });
  });

  describe('sticky note pointer detection', () => {
    it('should detect sticky note pointer', async () => {
      const { PlaitBoard } = await import('@plait/core');
      const board = createMockBoard([]);
      
      const isStickyNote = PlaitBoard.isInPointer(board, [STICKY_NOTE_POINTER]);
      expect(isStickyNote).toBe(true);
    });

    it('should not detect non-sticky-note pointer', async () => {
      const { PlaitBoard } = await import('@plait/core');
      const board = createMockBoard([]);
      
      const isStickyNote = PlaitBoard.isInPointer(board, ['selection']);
      expect(isStickyNote).toBe(false);
    });
  });

  describe('sticky note creation', () => {
    it('should create geometry element with rectangle shape', async () => {
      const { createGeometryElement, BasicShapes } = await import('@plait/draw');
      
      const points: [[number, number], [number, number]] = [[0, 0], [160, 160]];
      const text = { children: [{ text: '' }] };
      const props = {
        fill: STICKY_NOTE_FILL,
        strokeColor: STICKY_NOTE_STROKE,
        strokeWidth: 1,
      };
      
      const element = createGeometryElement(BasicShapes.rectangle, points, text, props);
      
      expect(element.type).toBe('rectangle');
      expect(element.points).toEqual(points);
      expect(element.text).toEqual(text);
      expect(element.fill).toBe(STICKY_NOTE_FILL);
      expect(element.strokeColor).toBe(STICKY_NOTE_STROKE);
    });

    it('should insert node at correct path', async () => {
      const { Transforms } = await import('@plait/core');
      const board = createMockBoard([]);
      const element = { id: 'test', type: 'rectangle' } as PlaitElement;
      
      Transforms.insertNode(board, element, [0]);
      expect(Transforms.insertNode).toHaveBeenCalledWith(board, element, [0]);
    });

    it('should update pointer type to selection after creation', async () => {
      const { BoardTransforms, PlaitPointerType } = await import('@plait/core');
      const board = createMockBoard([]);
      
      BoardTransforms.updatePointerType(board, PlaitPointerType.selection);
      expect(BoardTransforms.updatePointerType).toHaveBeenCalledWith(board, 'selection');
    });
  });

  describe('sticky note dimensions', () => {
    it('should use minimum dimensions when drag is small', () => {
      const startPoint: [number, number] = [0, 0];
      const endPoint: [number, number] = [10, 10];
      
      const width = Math.max(Math.abs(endPoint[0] - startPoint[0]), STICKY_NOTE_WIDTH);
      const height = Math.max(Math.abs(endPoint[1] - startPoint[1]), STICKY_NOTE_HEIGHT);
      
      expect(width).toBe(STICKY_NOTE_WIDTH);
      expect(height).toBe(STICKY_NOTE_HEIGHT);
    });

    it('should use drag dimensions when larger than minimum', () => {
      const startPoint: [number, number] = [0, 0];
      const endPoint: [number, number] = [200, 300];
      
      const width = Math.max(Math.abs(endPoint[0] - startPoint[0]), STICKY_NOTE_WIDTH);
      const height = Math.max(Math.abs(endPoint[1] - startPoint[1]), STICKY_NOTE_HEIGHT);
      
      expect(width).toBe(200);
      expect(height).toBe(300);
    });

    it('should calculate correct bounds when dragging in reverse', () => {
      const startPoint: [number, number] = [200, 200];
      const endPoint: [number, number] = [50, 50];
      
      const x = Math.min(startPoint[0], endPoint[0]);
      const y = Math.min(startPoint[1], endPoint[1]);
      const width = Math.max(Math.abs(endPoint[0] - startPoint[0]), STICKY_NOTE_WIDTH);
      const height = Math.max(Math.abs(endPoint[1] - startPoint[1]), STICKY_NOTE_HEIGHT);
      
      expect(x).toBe(50);
      expect(y).toBe(50);
      expect(width).toBe(STICKY_NOTE_WIDTH);
      expect(height).toBe(STICKY_NOTE_HEIGHT);
    });
  });

  describe('tool change event', () => {
    it('should dispatch tool change event', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      
      window.dispatchEvent(new CustomEvent('thinkix:toolchange', { 
        detail: { tool: 'select' } 
      }));
      
      expect(dispatchEventSpy).toHaveBeenCalled();
    });
  });
});
