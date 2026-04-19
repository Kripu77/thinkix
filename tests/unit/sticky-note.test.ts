import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PlaitBoard, PlaitElement } from '@plait/core';

const MOCK_STICKY_NOTE_POINTER = 'sticky-note';
const MOCK_DEFAULT_STICKY_COLOR = 'yellow';
const MOCK_STICKY_COLORS = {
  yellow: { fill: '#FFEAA7', stroke: '#F1C40F' },
  blue: { fill: '#AED6F1', stroke: '#3498DB' },
  green: { fill: '#ABEBC6', stroke: '#27AE60' },
  pink: { fill: '#F5B7B1', stroke: '#E74C3C' },
  purple: { fill: '#D7BDE2', stroke: '#9B59B6' },
  orange: { fill: '#FAD7A0', stroke: '#E67E22' },
} as const;

vi.mock('@plait/core', async () => {
  const actual = await vi.importActual('@plait/core');
  return {
    ...actual,
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
      isInPointer: vi.fn((board, pointers) => pointers.includes(MOCK_STICKY_NOTE_POINTER)),
      getElementHost: vi.fn(() => ({
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      })),
    },
  };
});

vi.mock('@plait/draw', () => ({
  createGeometryElement: vi.fn((shape, points, text, props) => ({
    id: 'sticky-note-id',
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

vi.mock('@/shared/constants', () => ({
  STICKY_NOTE_POINTER: MOCK_STICKY_NOTE_POINTER,
  DEFAULT_STICKY_COLOR: MOCK_DEFAULT_STICKY_COLOR,
  STICKY_COLORS: MOCK_STICKY_COLORS,
  STICKY_SUBTYPE: 'stickyNote',
  CUSTOM_EVENTS: {
    TOOL_CHANGE: 'thinkix:toolchange',
  },
}));

function createMockBoard(elements: PlaitElement[] = []): PlaitBoard {
  const mockSvgHost = {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  };

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
    pointer: MOCK_STICKY_NOTE_POINTER,
    actions: [],
    selectedAction: null,
    getRectangle: vi.fn(),
    getViewBox: vi.fn(() => ({ x: 0, y: 0, width: 1000, height: 1000 })),
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
    getElementHost: vi.fn(() => mockSvgHost),
    getRoughSVG: vi.fn(),
  } as unknown as PlaitBoard;
}

describe('with-sticky-note', () => {
  let dispatchEventSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    dispatchEventSpy = vi.spyOn(globalThis, 'dispatchEvent').mockImplementation(() => true);
  });

  afterEach(() => {
    if (dispatchEventSpy) {
      dispatchEventSpy.mockRestore();
    }
  });

  describe('exported constants', () => {
    it('should export correct pointer constant', async () => {
      const { STICKY_NOTE_POINTER } = await import('@/features/board/plugins/with-sticky-note');
      expect(STICKY_NOTE_POINTER).toBe('sticky-note');
    });

    it('should export correct fill color', async () => {
      const { STICKY_NOTE_FILL } = await import('@/features/board/plugins/with-sticky-note');
      expect(STICKY_NOTE_FILL).toBe(
        MOCK_STICKY_COLORS[MOCK_DEFAULT_STICKY_COLOR].fill,
      );
    });

    it('should export correct stroke color', async () => {
      const { STICKY_NOTE_STROKE } = await import('@/features/board/plugins/with-sticky-note');
      expect(STICKY_NOTE_STROKE).toBe(
        MOCK_STICKY_COLORS[MOCK_DEFAULT_STICKY_COLOR].stroke,
      );
    });

    it('should export correct width', async () => {
      const { STICKY_NOTE_WIDTH } = await import('@/features/board/plugins/with-sticky-note');
      expect(STICKY_NOTE_WIDTH).toBe(160);
    });

    it('should export correct height', async () => {
      const { STICKY_NOTE_HEIGHT } = await import('@/features/board/plugins/with-sticky-note');
      expect(STICKY_NOTE_HEIGHT).toBe(160);
    });
  });

  describe('sticky sizing', () => {
    it('grows height for multi-line sticky text', async () => {
      const { estimateStickySize } = await import('@/features/board/utils/sticky-note');

      const singleLine = estimateStickySize('Short note');
      const multiLine = estimateStickySize(
        'Line one\nLine two\nLine three\nLine four\nLine five\nLine six',
      );

      expect(multiLine.height).toBeGreaterThan(singleLine.height);
    });

    it('grows width for longer sticky text', async () => {
      const { estimateStickySize } = await import('@/features/board/utils/sticky-note');

      const short = estimateStickySize('Short');
      const long = estimateStickySize(
        'This sticky should reserve more width for a much longer line of text',
      );

      expect(long.width).toBeGreaterThan(short.width);
    });

    it('grows beyond 320px tall when content has many lines', async () => {
      const { estimateStickySize } = await import('@/features/board/utils/sticky-note');

      const longContent = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`).join('\n');
      const result = estimateStickySize(longContent);

      expect(result.height).toBeGreaterThan(320);
    });

    it('keeps width bounded at a sensible post-it max even for very long single lines', async () => {
      const { estimateStickySize } = await import('@/features/board/utils/sticky-note');

      const veryLong = 'a'.repeat(500);
      const result = estimateStickySize(veryLong);

      expect(result.width).toBeLessThanOrEqual(320);
      expect(result.width).toBeGreaterThanOrEqual(220);
    });

    it('returns a square minimum size for empty text', async () => {
      const { estimateStickySize } = await import('@/features/board/utils/sticky-note');

      const result = estimateStickySize('');

      expect(result.width).toBe(result.height);
      expect(result.width).toBeGreaterThanOrEqual(130);
    });

    it('produces enough vertical space for every wrapped line', async () => {
      const { estimateStickySize } = await import('@/features/board/utils/sticky-note');

      const lines = Array.from({ length: 30 }, (_, i) => `Item ${i + 1}: detail`);
      const result = estimateStickySize(lines.join('\n'));

      expect(result.height).toBeGreaterThanOrEqual(lines.length * 18);
    });
  });

  describe('plugin application', () => {
    it('should apply plugin to board without error', async () => {
      const { withStickyNote } = await import('@/features/board/plugins/with-sticky-note');
      const board = createMockBoard();
      
      expect(() => withStickyNote(board)).not.toThrow();
    });

    it('should wrap existing pointerDown handler', async () => {
      const { withStickyNote } = await import('@/features/board/plugins/with-sticky-note');
      const board = createMockBoard();
      const originalPointerDown = vi.fn();
      board.pointerDown = originalPointerDown;
      
      withStickyNote(board);
      
      expect(board.pointerDown).toBeDefined();
      expect(board.pointerDown).not.toBe(originalPointerDown);
    });

    it('should wrap existing pointerUp handler', async () => {
      const { withStickyNote } = await import('@/features/board/plugins/with-sticky-note');
      const board = createMockBoard();
      const originalPointerUp = vi.fn();
      board.pointerUp = originalPointerUp;
      
      withStickyNote(board);
      
      expect(board.pointerUp).toBeDefined();
      expect(board.pointerUp).not.toBe(originalPointerUp);
    });

    it('should wrap existing pointerMove handler', async () => {
      const { withStickyNote } = await import('@/features/board/plugins/with-sticky-note');
      const board = createMockBoard();
      const originalPointerMove = vi.fn();
      board.pointerMove = originalPointerMove;
      
      withStickyNote(board);
      
      expect(board.pointerMove).toBeDefined();
      expect(board.pointerMove).not.toBe(originalPointerMove);
    });
  });

  describe('sticky note creation on pointer events', () => {
    it('should create sticky note on pointerUp after pointerDown', async () => {
      const { withStickyNote } = await import('@/features/board/plugins/with-sticky-note');
      const { Transforms } = await import('@plait/core');
      const board = createMockBoard();
      
      withStickyNote(board);
      
      const pointerDownEvent = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 });
      const pointerUpEvent = new PointerEvent('pointerup', { clientX: 200, clientY: 200 });
      
      await board.pointerDown!(pointerDownEvent);
      await board.pointerUp!(pointerUpEvent);
      
      expect(Transforms.insertNode).toHaveBeenCalled();
    });

    it('should tag created geometry with sticky note subtype', async () => {
      const { withStickyNote } = await import('@/features/board/plugins/with-sticky-note');
      const { Transforms } = await import('@plait/core');
      const board = createMockBoard();

      withStickyNote(board);

      const pointerDownEvent = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 });
      const pointerUpEvent = new PointerEvent('pointerup', { clientX: 200, clientY: 200 });

      await board.pointerDown!(pointerDownEvent);
      await board.pointerUp!(pointerUpEvent);

      expect(Transforms.insertNode).toHaveBeenCalledWith(
        board,
        expect.objectContaining({
          subtype: 'stickyNote',
          fill: MOCK_STICKY_COLORS[MOCK_DEFAULT_STICKY_COLOR].fill,
          strokeColor: MOCK_STICKY_COLORS[MOCK_DEFAULT_STICKY_COLOR].stroke,
        }),
        [0],
      );
    });

    it('should update pointer type to selection after creation', async () => {
      const { withStickyNote } = await import('@/features/board/plugins/with-sticky-note');
      const { BoardTransforms } = await import('@plait/core');
      const board = createMockBoard();
      
      withStickyNote(board);
      
      const pointerDownEvent = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 });
      const pointerUpEvent = new PointerEvent('pointerup', { clientX: 200, clientY: 200 });
      
      await board.pointerDown!(pointerDownEvent);
      await board.pointerUp!(pointerUpEvent);
      
      expect(BoardTransforms.updatePointerType).toHaveBeenCalled();
    });

    it('should dispatch toolchange event after creation', async () => {
      const { withStickyNote } = await import('@/features/board/plugins/with-sticky-note');
      const { withToolSync } = await import('@/features/board/plugins/with-tool-sync');
      const board = createMockBoard();
      
      withToolSync(board);
      withStickyNote(board);
      
      const pointerDownEvent = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 });
      const pointerUpEvent = new PointerEvent('pointerup', { clientX: 200, clientY: 200 });
      
      await board.pointerDown!(pointerDownEvent);
      await board.pointerUp!(pointerUpEvent);
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'thinkix:toolchange',
          detail: { tool: 'select' },
        })
      );
    });

    it('should not create sticky note when pointerDown not called first', async () => {
      const { withStickyNote } = await import('@/features/board/plugins/with-sticky-note');
      const { Transforms } = await import('@plait/core');
      const board = createMockBoard();
      
      withStickyNote(board);
      
      const pointerUpEvent = new PointerEvent('pointerup', { clientX: 200, clientY: 200 });
      await board.pointerUp!(pointerUpEvent);
      
      expect(Transforms.insertNode).not.toHaveBeenCalled();
    });

    it('should call original handler when not in sticky note mode', async () => {
      const { withStickyNote } = await import('@/features/board/plugins/with-sticky-note');
      const { PlaitBoard } = await import('@plait/core');
      
      (PlaitBoard.isInPointer as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);
      
      const board = createMockBoard();
      const originalPointerDown = vi.fn();
      const originalPointerUp = vi.fn();
      board.pointerDown = originalPointerDown;
      board.pointerUp = originalPointerUp;
      
      withStickyNote(board);
      
      const pointerDownEvent = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 });
      const pointerUpEvent = new PointerEvent('pointerup', { clientX: 200, clientY: 200 });
      
      await board.pointerDown!(pointerDownEvent);
      await board.pointerUp!(pointerUpEvent);
      
      expect(originalPointerDown).toHaveBeenCalledWith(pointerDownEvent);
      expect(originalPointerUp).toHaveBeenCalledWith(pointerUpEvent);
    });
  });

  describe('preview functionality', () => {
    it('should create preview element on pointerMove during drawing', async () => {
      const { withStickyNote } = await import('@/features/board/plugins/with-sticky-note');
      const { PlaitBoard } = await import('@plait/core');
      const board = createMockBoard();
      
      withStickyNote(board);
      
      const pointerDownEvent = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 });
      const pointerMoveEvent = new PointerEvent('pointermove', { clientX: 200, clientY: 200 });
      
      await board.pointerDown!(pointerDownEvent);
      await board.pointerMove!(pointerMoveEvent);
      
      expect(PlaitBoard.getElementHost).toHaveBeenCalled();
    });

    it('should not create preview when not drawing', async () => {
      const { withStickyNote } = await import('@/features/board/plugins/with-sticky-note');
      const { PlaitBoard } = await import('@plait/core');
      const board = createMockBoard();
      
      withStickyNote(board);
      
      const pointerMoveEvent = new PointerEvent('pointermove', { clientX: 200, clientY: 200 });
      await board.pointerMove!(pointerMoveEvent);
      
      expect(PlaitBoard.getElementHost).not.toHaveBeenCalled();
    });

    it('should call original pointerMove handler when not in sticky note mode', async () => {
      const { withStickyNote } = await import('@/features/board/plugins/with-sticky-note');
      const { PlaitBoard } = await import('@plait/core');
      
      (PlaitBoard.isInPointer as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);
      
      const board = createMockBoard();
      const originalPointerMove = vi.fn();
      board.pointerMove = originalPointerMove;
      
      withStickyNote(board);
      
      const pointerMoveEvent = new PointerEvent('pointermove', { clientX: 200, clientY: 200 });
      await board.pointerMove!(pointerMoveEvent);
      
      expect(originalPointerMove).toHaveBeenCalledWith(pointerMoveEvent);
    });
  });
});
