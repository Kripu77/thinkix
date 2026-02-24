import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PlaitBoard } from '@plait/core';
import { 
  addPenMode, 
  isPenModeActive, 
  setIsPenMode 
} from '@/features/board/plugins/add-pen-mode';

vi.mock('@plait/core', () => ({
  isPencilEvent: vi.fn((event: PointerEvent) => event.pointerType === 'pen'),
}));

function createMockBoard(): PlaitBoard {
  return {
    children: [],
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
    getSelection: vi.fn(),
    isCollapsed: vi.fn(),
    isFocused: vi.fn(),
    hasBeenTextEditing: vi.fn(),
    getElementHost: vi.fn(),
    getRoughSVG: vi.fn(),
  } as unknown as PlaitBoard;
}

function createMockPointerEvent(pointerType: 'pen' | 'touch' | 'mouse' = 'mouse'): { pointerType: string; [key: string]: unknown } {
  return {
    pointerType,
    pointerId: 1,
    clientX: 100,
    clientY: 100,
    pressure: pointerType === 'pen' ? 0.5 : 0,
    isPrimary: true,
    width: 1,
    height: 1,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    tangentialPressure: 0,
    altitudeAngle: 0,
    azimuthAngle: 0,
  } as unknown as PointerEvent;
}

describe('add-pen-mode', () => {
  describe('isPenModeActive', () => {
    it('should return false by default', () => {
      const board = createMockBoard();
      expect(isPenModeActive(board)).toBe(false);
    });

    it('should return true after setIsPenMode is called with true', () => {
      const board = createMockBoard();
      setIsPenMode(board, true);
      expect(isPenModeActive(board)).toBe(true);
    });

    it('should return false after setIsPenMode is called with false', () => {
      const board = createMockBoard();
      setIsPenMode(board, true);
      setIsPenMode(board, false);
      expect(isPenModeActive(board)).toBe(false);
    });
  });

  describe('setIsPenMode', () => {
    it('should set pen mode to enabled', () => {
      const board = createMockBoard();
      setIsPenMode(board, true);
      expect(isPenModeActive(board)).toBe(true);
    });

    it('should set pen mode to disabled', () => {
      const board = createMockBoard();
      setIsPenMode(board, true);
      setIsPenMode(board, false);
      expect(isPenModeActive(board)).toBe(false);
    });
  });

  describe('addPenMode plugin', () => {
    it('should enable pen mode when pencil event is detected', async () => {
      const { isPencilEvent } = await import('@plait/core');
      vi.mocked(isPencilEvent).mockImplementation((e) => (e as { pointerType: string }).pointerType === 'pen');
      
      const board = createMockBoard();
      const callback = vi.fn();
      const enhancedBoard = addPenMode(board, callback);
      
      const penEvent = createMockPointerEvent('pen');
      enhancedBoard.pointerDown(penEvent as PointerEvent);
      
      expect(isPenModeActive(board)).toBe(true);
      expect(callback).toHaveBeenCalledWith(true);
    });

    it('should call original pointerDown for pencil events', async () => {
      const { isPencilEvent } = await import('@plait/core');
      vi.mocked(isPencilEvent).mockImplementation((e) => (e as { pointerType: string }).pointerType === 'pen');
      
      const board = createMockBoard();
      const originalPointerDown = vi.fn();
      board.pointerDown = originalPointerDown;
      
      const enhancedBoard = addPenMode(board);
      
      const penEvent = createMockPointerEvent('pen');
      enhancedBoard.pointerDown(penEvent as PointerEvent);
      
      expect(originalPointerDown).toHaveBeenCalledWith(penEvent);
    });

    it('should block touch events when in pen mode', async () => {
      const { isPencilEvent } = await import('@plait/core');
      vi.mocked(isPencilEvent).mockImplementation((e) => (e as { pointerType: string }).pointerType === 'pen');
      
      const board = createMockBoard();
      const originalPointerDown = vi.fn();
      board.pointerDown = originalPointerDown;
      
      const enhancedBoard = addPenMode(board);
      
      // First, enable pen mode with pen event
      const penEvent = createMockPointerEvent('pen');
      enhancedBoard.pointerDown(penEvent as PointerEvent);
      expect(isPenModeActive(board)).toBe(true);
      
      // Reset mock
      originalPointerDown.mockClear();
      
      // Try touch event - should be blocked
      const touchEvent = createMockPointerEvent('touch');
      enhancedBoard.pointerDown(touchEvent as PointerEvent);
      
      expect(originalPointerDown).not.toHaveBeenCalled();
    });

    it('should allow mouse events when in pen mode', async () => {
      const { isPencilEvent } = await import('@plait/core');
      vi.mocked(isPencilEvent).mockImplementation((e) => (e as { pointerType: string }).pointerType === 'pen');
      
      const board = createMockBoard();
      const originalPointerDown = vi.fn();
      board.pointerDown = originalPointerDown;
      
      const enhancedBoard = addPenMode(board);
      
      // First, enable pen mode with pen event
      const penEvent = createMockPointerEvent('pen');
      enhancedBoard.pointerDown(penEvent as PointerEvent);
      expect(isPenModeActive(board)).toBe(true);
      
      // Reset mock
      originalPointerDown.mockClear();
      
      // Try mouse event - should be allowed
      const mouseEvent = createMockPointerEvent('mouse');
      enhancedBoard.pointerDown(mouseEvent as PointerEvent);
      
      expect(originalPointerDown).toHaveBeenCalledWith(mouseEvent);
    });

    it('should allow touch events when not in pen mode', async () => {
      const { isPencilEvent } = await import('@plait/core');
      vi.mocked(isPencilEvent).mockImplementation((e) => (e as { pointerType: string }).pointerType === 'pen');
      
      const board = createMockBoard();
      const originalPointerDown = vi.fn();
      board.pointerDown = originalPointerDown;
      
      const enhancedBoard = addPenMode(board);
      
      // Touch event without pen mode - should be allowed
      const touchEvent = createMockPointerEvent('touch');
      enhancedBoard.pointerDown(touchEvent as PointerEvent);
      
      expect(originalPointerDown).toHaveBeenCalledWith(touchEvent);
    });

    it('should continue to allow pen events after pen mode is enabled', async () => {
      const { isPencilEvent } = await import('@plait/core');
      vi.mocked(isPencilEvent).mockImplementation((e) => (e as { pointerType: string }).pointerType === 'pen');
      
      const board = createMockBoard();
      const originalPointerDown = vi.fn();
      board.pointerDown = originalPointerDown;
      
      const enhancedBoard = addPenMode(board);
      
      // First pen event
      const penEvent1 = createMockPointerEvent('pen');
      enhancedBoard.pointerDown(penEvent1 as PointerEvent);
      
      // Reset mock
      originalPointerDown.mockClear();
      
      // Second pen event should still work
      const penEvent2 = createMockPointerEvent('pen');
      enhancedBoard.pointerDown(penEvent2 as PointerEvent);
      
      expect(originalPointerDown).toHaveBeenCalledWith(penEvent2);
    });

    it('should call callback only when pen mode changes', async () => {
      const { isPencilEvent } = await import('@plait/core');
      vi.mocked(isPencilEvent).mockImplementation((e) => (e as { pointerType: string }).pointerType === 'pen');
      
      const board = createMockBoard();
      const callback = vi.fn();
      const enhancedBoard = addPenMode(board, callback);
      
      // First pen event - callback should be called
      const penEvent1 = createMockPointerEvent('pen');
      enhancedBoard.pointerDown(penEvent1 as PointerEvent);
      expect(callback).toHaveBeenCalledTimes(1);
      
      // Second pen event - callback should NOT be called again
      const penEvent2 = createMockPointerEvent('pen');
      enhancedBoard.pointerDown(penEvent2 as PointerEvent);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should work without callback', async () => {
      const { isPencilEvent } = await import('@plait/core');
      vi.mocked(isPencilEvent).mockImplementation((e) => (e as { pointerType: string }).pointerType === 'pen');
      
      const board = createMockBoard();
      const originalPointerDown = vi.fn();
      board.pointerDown = originalPointerDown;
      
      // Should not throw when no callback provided
      const enhancedBoard = addPenMode(board);
      
      const penEvent = createMockPointerEvent('pen');
      expect(() => enhancedBoard.pointerDown(penEvent as PointerEvent)).not.toThrow();
      expect(isPenModeActive(board)).toBe(true);
    });
  });
});
