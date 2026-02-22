import { describe, it, expect, vi } from 'vitest';
import type { PlaitBoard, PlaitElement } from '@plait/core';

vi.mock('@plait/core', async () => {
  return {
    getSelectedElements: vi.fn((board: PlaitBoard) => {
      if (!board.selection) return [];
      return board.children.filter((el) => (board.selection as unknown as string[])?.includes(el.id as string));
    }),
  };
});

function createMockBoard(options: {
  elements?: PlaitElement[];
  selection?: string[] | null;
  theme?: { themeColorMode: 'light' | 'dark' };
}): PlaitBoard {
  const { elements = [], selection = null, theme } = options;

  return {
    children: elements,
    viewport: { zoom: 1, x: 0, y: 0 },
    theme,
    selection: selection as unknown as Selection,
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
    getViewBox: vi.fn().mockReturnValue({ x: 0, y: 0, width: 800, height: 600 }),
    toGlobalPoint: vi.fn((point) => point),
    toLocalPoint: vi.fn((point) => point),
    onChange: vi.fn(),
    pointerDown: vi.fn(),
    pointerMove: vi.fn(),
    pointerUp: vi.fn(),
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

describe('board-utils', () => {
  describe('getSelectedMindElements', () => {
    it('should return selected elements', async () => {
      const { getSelectedMindElements } = await import('@thinkix/plait-utils');
      const element1 = { id: '1', type: 'shape' } as PlaitElement;
      const element2 = { id: '2', type: 'text' } as PlaitElement;
      const board = createMockBoard({ elements: [element1, element2], selection: ['1'] });

      const result = getSelectedMindElements(board);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should return empty array when no selection', async () => {
      const { getSelectedMindElements } = await import('@thinkix/plait-utils');
      const element1 = { id: '1', type: 'shape' } as PlaitElement;
      const board = createMockBoard({ elements: [element1], selection: null });

      const result = getSelectedMindElements(board);
      expect(result).toHaveLength(0);
    });

    it('should return all selected elements', async () => {
      const { getSelectedMindElements } = await import('@thinkix/plait-utils');
      const element1 = { id: '1', type: 'shape' } as PlaitElement;
      const element2 = { id: '2', type: 'text' } as PlaitElement;
      const element3 = { id: '3', type: 'mindMap' } as PlaitElement;
      const board = createMockBoard({ elements: [element1, element2, element3], selection: ['1', '3'] });

      const result = getSelectedMindElements(board);
      expect(result).toHaveLength(2);
    });
  });

  describe('getCanvasContext', () => {
    it('should return JSON string with elements and viewport', async () => {
      const { getCanvasContext } = await import('@thinkix/plait-utils');
      const element1 = { id: '1', type: 'shape' } as PlaitElement;
      const board = createMockBoard({ elements: [element1] });

      const result = getCanvasContext(board);
      const parsed = JSON.parse(result);

      expect(parsed.elements).toHaveLength(1);
      expect(parsed.viewport).toEqual({ zoom: 1, x: 0, y: 0 });
    });

    it('should include selected element ids', async () => {
      const { getCanvasContext } = await import('@thinkix/plait-utils');
      const element1 = { id: '1', type: 'shape' } as PlaitElement;
      const element2 = { id: '2', type: 'text' } as PlaitElement;
      const board = createMockBoard({ elements: [element1, element2], selection: ['1'] });

      const result = getCanvasContext(board);
      const parsed = JSON.parse(result);

      expect(parsed.selected).toEqual(['1']);
    });

    it('should return empty selected array when no selection', async () => {
      const { getCanvasContext } = await import('@thinkix/plait-utils');
      const element1 = { id: '1', type: 'shape' } as PlaitElement;
      const board = createMockBoard({ elements: [element1], selection: null });

      const result = getCanvasContext(board);
      const parsed = JSON.parse(result);

      expect(parsed.selected).toEqual([]);
    });

    it('should handle empty elements', async () => {
      const { getCanvasContext } = await import('@thinkix/plait-utils');
      const board = createMockBoard({ elements: [] });

      const result = getCanvasContext(board);
      const parsed = JSON.parse(result);

      expect(parsed.elements).toEqual([]);
    });

    it('should format JSON with indentation', async () => {
      const { getCanvasContext } = await import('@thinkix/plait-utils');
      const board = createMockBoard({ elements: [] });

      const result = getCanvasContext(board);
      expect(result).toContain('\n');
    });
  });

  describe('findElementById', () => {
    it('should find element by id', async () => {
      const { findElementById } = await import('@thinkix/plait-utils');
      const element1 = { id: '1', type: 'shape' } as PlaitElement;
      const element2 = { id: '2', type: 'text' } as PlaitElement;
      const board = createMockBoard({ elements: [element1, element2] });

      const result = findElementById(board, '1');
      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
    });

    it('should return null for non-existent id', async () => {
      const { findElementById } = await import('@thinkix/plait-utils');
      const element1 = { id: '1', type: 'shape' } as PlaitElement;
      const board = createMockBoard({ elements: [element1] });

      const result = findElementById(board, 'non-existent');
      expect(result).toBeNull();
    });

    it('should return null for empty board', async () => {
      const { findElementById } = await import('@thinkix/plait-utils');
      const board = createMockBoard({ elements: [] });

      const result = findElementById(board, 'any-id');
      expect(result).toBeNull();
    });

    it('should find element by string id', async () => {
      const { findElementById } = await import('@thinkix/plait-utils');
      const element = { id: 'my-element-123', type: 'shape' } as PlaitElement;
      const board = createMockBoard({ elements: [element] });

      const result = findElementById(board, 'my-element-123');
      expect(result).toBeDefined();
    });

    it('should return first matching element', async () => {
      const { findElementById } = await import('@thinkix/plait-utils');
      const element1 = { id: '1', type: 'shape' } as PlaitElement;
      const element2 = { id: '1', type: 'text' } as PlaitElement;
      const board = createMockBoard({ elements: [element1, element2] });

      const result = findElementById(board, '1');
      expect(result?.type).toBe('shape');
    });
  });

  describe('getSelectedElements', () => {
    it('should re-export getSelectedElements from @plait/core', async () => {
      const { getSelectedElements } = await import('@thinkix/plait-utils');
      const element1 = { id: '1', type: 'shape' } as PlaitElement;
      const board = createMockBoard({ elements: [element1], selection: ['1'] });

      const result = getSelectedElements(board);
      expect(result).toBeDefined();
    });
  });
});
