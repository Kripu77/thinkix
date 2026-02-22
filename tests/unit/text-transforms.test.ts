import { describe, it, expect, vi } from 'vitest';
import type { PlaitBoard, PlaitElement } from '@plait/core';
import type { Element as SlateElement } from 'slate';

vi.mock('@plait/mind', () => ({
  MindElement: {
    isMindElement: vi.fn(() => false),
  },
}));

vi.mock('@plait/core', async () => {
  return {
    getSelectedElements: vi.fn((board: PlaitBoard) => {
      if (!board.selection) return [];
      return board.children.filter((el) => board.selection?.includes(el.id as string));
    }),
    PlaitBoard: {
      findPath: vi.fn((board: PlaitBoard, element: PlaitElement) => {
        const index = board.children.findIndex((el) => el.id === element.id);
        return index >= 0 ? [index] : null;
      }),
    },
    Transforms: {
      setNode: vi.fn(),
    },
  };
});

function createMockBoard(options: {
  elements?: PlaitElement[];
  selection?: string[] | null;
}): PlaitBoard {
  const { elements = [], selection = null } = options;

  return {
    children: elements,
    viewport: { zoom: 1, x: 0, y: 0 },
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

function createTextElement(id: string, textChildren: Array<{ text: string; bold?: boolean; italic?: boolean; underlined?: boolean; strike?: boolean; color?: string; 'font-size'?: string | number }>): PlaitElement {
  return {
    id,
    type: 'text',
    text: {
      children: textChildren,
    } as SlateElement,
  } as unknown as PlaitElement;
}

describe('text-transforms', () => {
  describe('getTextMarks', () => {
    it('should return default marks for element without text', async () => {
      const { getTextMarks } = await import('@thinkix/plait-utils');
      const element = { id: '1', type: 'shape' } as PlaitElement;
      const marks = getTextMarks(element);

      expect(marks).toEqual({
        bold: undefined,
        italic: undefined,
        underlined: undefined,
        strike: undefined,
        color: undefined,
        fontSize: undefined,
      });
    });

    it('should return default marks for element with empty text children', async () => {
      const { getTextMarks } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [{ text: '' }]);
      const marks = getTextMarks(element);

      expect(marks).toEqual({
        bold: undefined,
        italic: undefined,
        underlined: undefined,
        strike: undefined,
        color: undefined,
        fontSize: undefined,
      });
    });

    it('should extract bold mark from text element', async () => {
      const { getTextMarks } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [{ text: 'Hello', bold: true }]);
      const marks = getTextMarks(element);

      expect(marks.bold).toBe(true);
    });

    it('should extract italic mark from text element', async () => {
      const { getTextMarks } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [{ text: 'Hello', italic: true }]);
      const marks = getTextMarks(element);

      expect(marks.italic).toBe(true);
    });

    it('should extract underlined mark from text element', async () => {
      const { getTextMarks } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [{ text: 'Hello', underlined: true }]);
      const marks = getTextMarks(element);

      expect(marks.underlined).toBe(true);
    });

    it('should extract strike mark from text element', async () => {
      const { getTextMarks } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [{ text: 'Hello', strike: true }]);
      const marks = getTextMarks(element);

      expect(marks.strike).toBe(true);
    });

    it('should extract color from text element', async () => {
      const { getTextMarks } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [{ text: 'Hello', color: '#ff0000' }]);
      const marks = getTextMarks(element);

      expect(marks.color).toBe('#ff0000');
    });

    it('should extract fontSize from text element', async () => {
      const { getTextMarks } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [{ text: 'Hello', 'font-size': 24 }]);
      const marks = getTextMarks(element);

      expect(marks.fontSize).toBe(24);
    });

    it('should extract all marks from text element', async () => {
      const { getTextMarks } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [{
        text: 'Hello',
        bold: true,
        italic: true,
        underlined: true,
        strike: true,
        color: '#00ff00',
        'font-size': 18,
      }]);
      const marks = getTextMarks(element);

      expect(marks).toEqual({
        bold: true,
        italic: true,
        underlined: true,
        strike: true,
        color: '#00ff00',
        fontSize: 18,
      });
    });

    it('should handle multiple text children', async () => {
      const { getTextMarks } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [
        { text: 'Hello ', bold: true },
        { text: 'World', italic: true, color: '#0000ff' },
      ]);
      const marks = getTextMarks(element);

      expect(marks.bold).toBe(true);
      expect(marks.italic).toBe(true);
      expect(marks.color).toBe('#0000ff');
    });

    it('should return false for explicit false mark', async () => {
      const { getTextMarks } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [{ text: 'Hello', bold: false }]);
      const marks = getTextMarks(element);

      expect(marks.bold).toBe(false);
    });

    it('should handle undefined text property', async () => {
      const { getTextMarks } = await import('@thinkix/plait-utils');
      const element = { id: '1', type: 'text' } as PlaitElement;
      const marks = getTextMarks(element);

      expect(marks).toEqual({
        bold: undefined,
        italic: undefined,
        underlined: undefined,
        strike: undefined,
        color: undefined,
        fontSize: undefined,
      });
    });

    it('should handle null text property', async () => {
      const { getTextMarks } = await import('@thinkix/plait-utils');
      const element = { id: '1', type: 'text', text: null } as unknown as PlaitElement;
      const marks = getTextMarks(element);

      expect(marks).toEqual({
        bold: undefined,
        italic: undefined,
        underlined: undefined,
        strike: undefined,
        color: undefined,
        fontSize: undefined,
      });
    });

    it('should handle text with non-array children', async () => {
      const { getTextMarks } = await import('@thinkix/plait-utils');
      const element = {
        id: '1',
        type: 'text',
        text: { children: 'not-an-array' },
      } as unknown as PlaitElement;
      const marks = getTextMarks(element);

      expect(marks).toEqual({
        bold: undefined,
        italic: undefined,
        underlined: undefined,
        strike: undefined,
        color: undefined,
        fontSize: undefined,
      });
    });

    it('should handle empty children array', async () => {
      const { getTextMarks } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', []);
      const marks = getTextMarks(element);

      expect(marks).toEqual({
        bold: undefined,
        italic: undefined,
        underlined: undefined,
        strike: undefined,
        color: undefined,
        fontSize: undefined,
      });
    });

    it('should handle children without marks', async () => {
      const { getTextMarks } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [{ text: 'Plain text' }]);
      const marks = getTextMarks(element);

      expect(marks).toEqual({
        bold: undefined,
        italic: undefined,
        underlined: undefined,
        strike: undefined,
        color: undefined,
        fontSize: undefined,
      });
    });

    it('should work with board parameter', async () => {
      const { getTextMarks } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [{ text: 'Hello', bold: true }]);
      const board = createMockBoard({ elements: [element] });

      const marks = getTextMarks(element, board);
      expect(marks.bold).toBe(true);
    });
  });

  describe('applyTextMark', () => {
    it('should apply bold mark to selected elements', async () => {
      const { applyTextMark } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [{ text: 'Hello' }]);
      const board = createMockBoard({ elements: [element], selection: ['1'] });

      expect(() => applyTextMark(board, 'bold', [element])).not.toThrow();
    });

    it('should apply italic mark to selected elements', async () => {
      const { applyTextMark } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [{ text: 'Hello' }]);
      const board = createMockBoard({ elements: [element], selection: ['1'] });

      expect(() => applyTextMark(board, 'italic', [element])).not.toThrow();
    });

    it('should apply underline mark to selected elements', async () => {
      const { applyTextMark } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [{ text: 'Hello' }]);
      const board = createMockBoard({ elements: [element], selection: ['1'] });

      expect(() => applyTextMark(board, 'underlined', [element])).not.toThrow();
    });

    it('should apply strike mark to selected elements', async () => {
      const { applyTextMark } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [{ text: 'Hello' }]);
      const board = createMockBoard({ elements: [element], selection: ['1'] });

      expect(() => applyTextMark(board, 'strike', [element])).not.toThrow();
    });

    it('should handle empty elements array', async () => {
      const { applyTextMark } = await import('@thinkix/plait-utils');
      const board = createMockBoard({ elements: [], selection: [] });

      expect(() => applyTextMark(board, 'bold')).not.toThrow();
    });

    it('should handle element without text accessor', async () => {
      const { applyTextMark } = await import('@thinkix/plait-utils');
      const element = { id: '1', type: 'unknown' } as PlaitElement;
      const board = createMockBoard({ elements: [element] });

      expect(() => applyTextMark(board, 'bold', [element])).not.toThrow();
    });
  });

  describe('applyTextColor', () => {
    it('should apply text color to element', async () => {
      const { applyTextColor } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [{ text: 'Hello' }]);
      const board = createMockBoard({ elements: [element] });

      expect(() => applyTextColor(board, '#ff0000', [element])).not.toThrow();
    });

    it('should remove text color when color is null', async () => {
      const { applyTextColor } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [{ text: 'Hello', color: '#ff0000' }]);
      const board = createMockBoard({ elements: [element] });

      expect(() => applyTextColor(board, null, [element])).not.toThrow();
    });

    it('should handle empty elements array', async () => {
      const { applyTextColor } = await import('@thinkix/plait-utils');
      const board = createMockBoard({ elements: [] });

      expect(() => applyTextColor(board, '#ff0000')).not.toThrow();
    });

    it('should handle element without text', async () => {
      const { applyTextColor } = await import('@thinkix/plait-utils');
      const element = { id: '1', type: 'shape' } as PlaitElement;
      const board = createMockBoard({ elements: [element] });

      expect(() => applyTextColor(board, '#00ff00', [element])).not.toThrow();
    });
  });

  describe('applyFontSize', () => {
    it('should apply font size to element', async () => {
      const { applyFontSize } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [{ text: 'Hello' }]);
      const board = createMockBoard({ elements: [element] });

      expect(() => applyFontSize(board, '24', [element])).not.toThrow();
    });

    it('should handle numeric font size as string', async () => {
      const { applyFontSize } = await import('@thinkix/plait-utils');
      const element = createTextElement('1', [{ text: 'Hello' }]);
      const board = createMockBoard({ elements: [element] });

      expect(() => applyFontSize(board, '18', [element])).not.toThrow();
    });

    it('should handle empty elements array', async () => {
      const { applyFontSize } = await import('@thinkix/plait-utils');
      const board = createMockBoard({ elements: [] });

      expect(() => applyFontSize(board, '16')).not.toThrow();
    });

    it('should handle element without text', async () => {
      const { applyFontSize } = await import('@thinkix/plait-utils');
      const element = { id: '1', type: 'shape' } as PlaitElement;
      const board = createMockBoard({ elements: [element] });

      expect(() => applyFontSize(board, '20', [element])).not.toThrow();
    });
  });
});
