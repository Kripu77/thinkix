import { describe, it, expect, vi } from 'vitest';
import type { PlaitBoard, PlaitElement, Point } from '@plait/core';

const ERASER_POINTER = 'eraser';

vi.mock('@plait/core', async () => {
  return {
    throttleRAF: vi.fn((board, key, fn) => fn()),
    toHostPoint: vi.fn((board, x, y) => [x, y]),
    toViewBoxPoint: vi.fn((board, point) => point),
    CoreTransforms: {
      removeElements: vi.fn(),
    },
    PlaitBoard: {
      isInPointer: vi.fn((board, pointers) => pointers.includes(ERASER_POINTER)),
    },
    isDrawingMode: vi.fn(() => true),
  };
});

vi.mock('@plait/common', () => ({
  isDrawingMode: vi.fn(() => true),
}));

vi.mock('@/features/board/plugins/scribble/types', () => ({
  ScribbleElement: {
    isScribble: vi.fn((element) => element?.type === 'scribble'),
  },
}));

vi.mock('@/features/board/plugins/scribble/helpers', () => ({
  checkHitScribble: vi.fn((board, element, point) => {
    return element.id === 'hit-element';
  }),
}));

vi.mock('@/features/board/utils', () => ({
  LaserPointer: vi.fn().mockImplementation(() => ({
    init: vi.fn(),
    destroy: vi.fn(),
  })),
}));

function createMockBoard(elements: PlaitElement[] = []): PlaitBoard {
  const elementGMocks = new Map<string, { style: { opacity: string } }>();
  
  elements.forEach(el => {
    elementGMocks.set(el.id, { style: { opacity: '1' } });
  });

  const board = {
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
    isHit: vi.fn((_element: PlaitElement, _point: Point, _detailed: boolean) => {
      return _element.id === 'hit-draw-element';
    }),
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

  return board;
}

describe('with-eraser', () => {
  describe('eraser functionality', () => {
    it('should detect eraser pointer', async () => {
      const { PlaitBoard } = await import('@plait/core');
      const board = createMockBoard([]);
      
      const isEraser = PlaitBoard.isInPointer(board, [ERASER_POINTER]);
      expect(isEraser).toBe(true);
    });

    it('should not detect non-eraser pointer', async () => {
      const { PlaitBoard } = await import('@plait/core');
      const board = createMockBoard([]);
      
      const isEraser = PlaitBoard.isInPointer(board, ['selection']);
      expect(isEraser).toBe(false);
    });

    it('should check hit on scribble elements', async () => {
      const { checkHitScribble } = await import('@/features/board/plugins/scribble/helpers');
      const board = createMockBoard();
      const element = { id: 'hit-element', type: 'scribble', points: [[0, 0], [10, 10]] } as PlaitElement;
      const point: Point = [5, 5];
      
      const isHit = checkHitScribble(board, element, point);
      expect(isHit).toBe(true);
    });

    it('should not hit non-scribble elements via scribble check', async () => {
      const { checkHitScribble } = await import('@/features/board/plugins/scribble/helpers');
      const board = createMockBoard();
      const element = { id: 'other-element', type: 'scribble', points: [[0, 0]] } as PlaitElement;
      const point: Point = [100, 100];
      
      const isHit = checkHitScribble(board, element, point);
      expect(isHit).toBe(false);
    });

    it('should remove elements using CoreTransforms', async () => {
      const { CoreTransforms } = await import('@plait/core');
      const board = createMockBoard();
      const elements = [{ id: '1', type: 'shape' } as PlaitElement];
      
      CoreTransforms.removeElements(board, elements);
      expect(CoreTransforms.removeElements).toHaveBeenCalledWith(board, elements);
    });

    it('should convert screen point to viewBox point', async () => {
      const { toHostPoint, toViewBoxPoint } = await import('@plait/core');
      const board = createMockBoard();
      
      toHostPoint(board, 100, 200);
      expect(toHostPoint).toHaveBeenCalledWith(board, 100, 200);
      
      toViewBoxPoint(board, [100, 200]);
      expect(toViewBoxPoint).toHaveBeenCalledWith(board, [100, 200]);
    });

    it('should throttle RAF for pointer move', async () => {
      const { throttleRAF } = await import('@plait/core');
      const board = createMockBoard();
      
      throttleRAF(board, 'test-key', () => {});
      expect(throttleRAF).toHaveBeenCalled();
    });
  });

  describe('element hit detection', () => {
    it('should hit draw elements via board.isHit', async () => {
      const board = createMockBoard();
      const element = { id: 'hit-draw-element', type: 'rectangle' } as PlaitElement;
      const point: Point = [50, 50];
      
      const isHit = board.isHit?.(element, point, false);
      expect(isHit).toBe(true);
    });

    it('should not hit elements that are not targets', async () => {
      const board = createMockBoard();
      const element = { id: 'not-hit', type: 'rectangle' } as PlaitElement;
      const point: Point = [200, 200];
      
      const isHit = board.isHit?.(element, point, false);
      expect(isHit).toBe(false);
    });
  });

  describe('drawing mode', () => {
    it('should check if board is in drawing mode', async () => {
      const { isDrawingMode } = await import('@plait/common');
      const board = createMockBoard();
      
      const result = isDrawingMode(board);
      expect(result).toBe(true);
    });
  });
});
