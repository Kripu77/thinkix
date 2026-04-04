import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PlaitBoard, PlaitElement } from '@plait/core';

const mockGetBoundingRectangle = vi.fn();
const mockGetRectangleByElements = vi.fn();
const mockGetViewportOrigination = vi.fn(() => [0, 0]);
const mockUpdateViewport = vi.fn();

vi.mock('@plait/core', () => ({
  getBoundingRectangleByElements: (...args: unknown[]) => mockGetBoundingRectangle(...args),
  getRectangleByElements: (...args: unknown[]) => mockGetRectangleByElements(...args),
  getViewportOrigination: (...args: unknown[]) => mockGetViewportOrigination(...args),
  BoardTransforms: {
    updateViewport: (...args: unknown[]) => mockUpdateViewport(...args),
  },
  PlaitBoard: {
    getBoardContainer: vi.fn(() => ({
      getBoundingClientRect: () => ({ width: 800, height: 600 }),
    })),
    getElementHost: vi.fn(),
  },
  PlaitElement: {
    getContainerG: vi.fn(() => null),
    hasMounted: vi.fn(() => false),
  },
  WritableClipboardOperationType: {
    copy: 'copy',
    cut: 'cut',
    paste: 'paste',
  },
}));

function createMockBoard(children: PlaitElement[] = []): PlaitBoard {
  return {
    children,
    viewport: { zoom: 1 },
    insertFragment: vi.fn(),
  } as unknown as PlaitBoard;
}

describe('insertion utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBoundingRectangle.mockReset();
    mockGetRectangleByElements.mockReset();
    mockGetViewportOrigination.mockReset();
    mockGetViewportOrigination.mockReturnValue([0, 0]);
    mockUpdateViewport.mockReset();
  });

  afterEach(() => {
    mockGetBoundingRectangle.mockReset();
    mockGetRectangleByElements.mockReset();
  });

  describe('getSafeInsertPosition', () => {
    it('should return [0, 0] when board is empty', async () => {
      const { getSafeInsertPosition } = await import('@/features/board/utils/insertion');
      const board = createMockBoard([]);
      const newElements: PlaitElement[] = [{ id: '1', type: 'mind' } as PlaitElement];

      const result = getSafeInsertPosition(board, newElements);

      expect(result).toEqual([0, 0]);
    });

    it('should return position to the right of existing elements with padding', async () => {
      const { getSafeInsertPosition } = await import('@/features/board/utils/insertion');
      const board = createMockBoard([{ id: 'existing', type: 'shape' }]);
      const newElements: PlaitElement[] = [{ id: 'new', type: 'mind' } as PlaitElement];

      mockGetBoundingRectangle
        .mockReturnValueOnce({ x: 0, y: 0, width: 200, height: 100 })
        .mockReturnValueOnce({ x: 0, y: 0, width: 150, height: 80 });

      const result = getSafeInsertPosition(board, newElements);

      expect(result[0]).toBe(300);
      expect(result[1]).toBe(0);
    });

    it('should use custom padding when provided', async () => {
      const { getSafeInsertPosition } = await import('@/features/board/utils/insertion');
      const board = createMockBoard([{ id: 'existing', type: 'shape' }]);
      const newElements: PlaitElement[] = [{ id: 'new', type: 'mind' } as PlaitElement];

      mockGetBoundingRectangle
        .mockReturnValueOnce({ x: 0, y: 50, width: 200, height: 100 })
        .mockReturnValueOnce({ x: 0, y: 0, width: 150, height: 80 });

      const result = getSafeInsertPosition(board, newElements, 50);

      expect(result[0]).toBe(250);
      expect(result[1]).toBe(50);
    });

    it('should return [0, 0] when getBoundingRectangleByElements returns null', async () => {
      const { getSafeInsertPosition } = await import('@/features/board/utils/insertion');
      const board = createMockBoard([{ id: 'existing', type: 'shape' }]);
      const newElements: PlaitElement[] = [{ id: 'new', type: 'mind' } as PlaitElement];

      mockGetBoundingRectangle.mockReturnValue(null);

      const result = getSafeInsertPosition(board, newElements);

      expect(result).toEqual([0, 0]);
    });

    it('should handle elements at negative positions', async () => {
      const { getSafeInsertPosition } = await import('@/features/board/utils/insertion');
      const board = createMockBoard([{ id: 'existing', type: 'shape' }]);
      const newElements: PlaitElement[] = [{ id: 'new', type: 'mind' } as PlaitElement];

      mockGetBoundingRectangle
        .mockReturnValueOnce({ x: -100, y: -50, width: 200, height: 100 })
        .mockReturnValueOnce({ x: 0, y: 0, width: 150, height: 80 });

      const result = getSafeInsertPosition(board, newElements);

      expect(result[0]).toBe(200);
      expect(result[1]).toBe(-50);
    });
  });

  describe('insertElementsSafely', () => {
    it('should not insert when elements array is empty', async () => {
      const { insertElementsSafely } = await import('@/features/board/utils/insertion');
      const board = createMockBoard([]);

      insertElementsSafely(board, []);

      expect(board.insertFragment).not.toHaveBeenCalled();
    });

    it('should call insertFragment with deep cloned elements', async () => {
      const { insertElementsSafely } = await import('@/features/board/utils/insertion');
      const board = createMockBoard([]);
      const element: PlaitElement = { id: '1', type: 'mind', data: { nested: { value: 1 } } } as PlaitElement;

      mockGetBoundingRectangle.mockReturnValue({ x: 0, y: 0, width: 100, height: 100 });

      insertElementsSafely(board, [element]);

      expect(board.insertFragment).toHaveBeenCalledWith(
        { elements: expect.any(Array) },
        [0, 0],
        'paste'
      );

      const calls = (board.insertFragment as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls[0][0].elements[0]).not.toBe(element);
      expect(calls[0][0].elements[0].data).toEqual({ nested: { value: 1 } });
    });

    it('should use provided position instead of calculating safe position', async () => {
      const { insertElementsSafely } = await import('@/features/board/utils/insertion');
      const board = createMockBoard([{ id: 'existing', type: 'shape' }]);
      const elements: PlaitElement[] = [{ id: 'new', type: 'mind' } as PlaitElement];

      insertElementsSafely(board, elements, [500, 300]);

      expect(board.insertFragment).toHaveBeenCalledWith(
        { elements: expect.any(Array) },
        [500, 300],
        'paste'
      );
    });

    it('should calculate safe position when position is not provided', async () => {
      const { insertElementsSafely } = await import('@/features/board/utils/insertion');
      const board = createMockBoard([{ id: 'existing', type: 'shape' }]);
      const elements: PlaitElement[] = [{ id: 'new', type: 'mind' } as PlaitElement];

      mockGetBoundingRectangle
        .mockReturnValueOnce({ x: 100, y: 200, width: 300, height: 150 })
        .mockReturnValueOnce({ x: 0, y: 0, width: 100, height: 100 });

      insertElementsSafely(board, elements);

      expect(board.insertFragment).toHaveBeenCalledWith(
        { elements: expect.any(Array) },
        [500, 200],
        'paste'
      );
    });
  });

  describe('calculateFocusedViewport', () => {
    it('zooms out when bounds exceed the viewport', async () => {
      const { calculateFocusedViewport } = await import('@/features/board/utils/insertion');

      const result = calculateFocusedViewport(
        { x: 100, y: 200, width: 1200, height: 800 },
        { width: 800, height: 600 },
        1,
      );

      expect(result).not.toBeNull();
      expect(result!.zoom).toBeLessThan(1);
      expect(result!.origination[0]).toBeGreaterThan(0);
      expect(result!.origination[1]).toBeGreaterThan(0);
    });

    it('keeps the current zoom when the inserted diagram already fits', async () => {
      const { calculateFocusedViewport } = await import('@/features/board/utils/insertion');

      const result = calculateFocusedViewport(
        { x: 40, y: 60, width: 240, height: 180 },
        { width: 1200, height: 800 },
        0.8,
      );

      expect(result).not.toBeNull();
      expect(result!.zoom).toBe(0.8);
    });

    it('returns null for invalid bounds', async () => {
      const { calculateFocusedViewport } = await import('@/features/board/utils/insertion');

      const result = calculateFocusedViewport(
        { x: 0, y: 0, width: 0, height: 180 },
        { width: 1200, height: 800 },
        1,
      );

      expect(result).toBeNull();
    });
  });
});
