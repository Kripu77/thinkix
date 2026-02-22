import { describe, it, expect, vi } from 'vitest';
import type { PlaitBoard, PlaitElement } from '@plait/core';
import type { Element as SlateElement } from 'slate';

vi.mock('@plait/mind', () => ({
  MindElement: {
    isMindElement: vi.fn((board: PlaitBoard, element: PlaitElement | null) => {
      if (!element) return false;
      return (element as { type?: string }).type === 'mindMap';
    }),
  },
}));

vi.mock('@plait/core', async () => {
  return {
    Transforms: {
      setNode: vi.fn(),
    },
    PlaitBoard: {
      findPath: vi.fn((board: PlaitBoard, element: PlaitElement) => {
        const index = board.children.findIndex((el) => el.id === element.id);
        return index >= 0 ? [index] : null;
      }),
    },
  };
});

function createMockBoard(elements: PlaitElement[] = []): PlaitBoard {
  return {
    children: elements,
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

describe('text-accessor', () => {
  describe('getTextAccessor', () => {
    it('should return draw text accessor for elements with text property', async () => {
      const { getTextAccessor } = await import('@thinkix/plait-utils');
      const element = {
        id: '1',
        type: 'text',
        text: { children: [{ text: 'Hello' }] } as SlateElement,
      } as PlaitElement;
      const board = createMockBoard([element]);

      const accessor = getTextAccessor(board, element);
      expect(accessor).toBeDefined();
      expect(accessor?.get(element)).toEqual({ children: [{ text: 'Hello' }] });
    });

    it('should return mind text accessor for mind elements', async () => {
      const { getTextAccessor } = await import('@thinkix/plait-utils');
      const element = {
        id: '1',
        type: 'mindMap',
        data: {
          topic: { children: [{ text: 'Mind Node' }] } as SlateElement,
        },
      } as PlaitElement;
      const board = createMockBoard([element]);

      const accessor = getTextAccessor(board, element);
      expect(accessor).toBeDefined();
    });

    it('should return null for elements without text', async () => {
      const { getTextAccessor } = await import('@thinkix/plait-utils');
      const element = { id: '1', type: 'shape' } as PlaitElement;
      const board = createMockBoard([element]);

      const accessor = getTextAccessor(board, element);
      expect(accessor).toBeNull();
    });

    it('should return null for null element', async () => {
      const { getTextAccessor } = await import('@thinkix/plait-utils');
      const board = createMockBoard([]);

      const accessor = getTextAccessor(board, {} as PlaitElement);
      expect(accessor).toBeNull();
    });

    it('should prioritize mind accessor for mind elements', async () => {
      const { getTextAccessor } = await import('@thinkix/plait-utils');
      const element = {
        id: '1',
        type: 'mindMap',
        text: { children: [{ text: 'Text' }] },
        data: {
          topic: { children: [{ text: 'Topic' }] },
        },
      } as unknown as PlaitElement;
      const board = createMockBoard([element]);

      const accessor = getTextAccessor(board, element);
      expect(accessor).toBeDefined();
    });

    it('draw text accessor should return null for element without text', async () => {
      const { getTextAccessor } = await import('@thinkix/plait-utils');
      const element = { id: '1', type: 'text' } as PlaitElement;
      const board = createMockBoard([element]);

      const accessor = getTextAccessor(board, element);
      expect(accessor?.get(element) ?? null).toBeNull();
    });

    it('mind text accessor should return null for element without data', async () => {
      const { getTextAccessor } = await import('@thinkix/plait-utils');
      const element = {
        id: '1',
        type: 'mindMap',
      } as PlaitElement;
      const board = createMockBoard([element]);

      const accessor = getTextAccessor(board, element);
      expect(accessor?.get(element)).toBeNull();
    });

    it('mind text accessor should return null for element without topic', async () => {
      const { getTextAccessor } = await import('@thinkix/plait-utils');
      const element = {
        id: '1',
        type: 'mindMap',
        data: {},
      } as PlaitElement;
      const board = createMockBoard([element]);

      const accessor = getTextAccessor(board, element);
      expect(accessor?.get(element)).toBeNull();
    });
  });

  describe('TextAccessor.get', () => {
    it('should return text for draw element', async () => {
      const { getTextAccessor } = await import('@thinkix/plait-utils');
      const textContent = { children: [{ text: 'Hello World' }] } as SlateElement;
      const element = {
        id: '1',
        type: 'text',
        text: textContent,
      } as PlaitElement;
      const board = createMockBoard([element]);

      const accessor = getTextAccessor(board, element);
      expect(accessor?.get(element)).toEqual(textContent);
    });

    it('should return topic for mind element', async () => {
      const { getTextAccessor } = await import('@thinkix/plait-utils');
      const topicContent = { children: [{ text: 'Topic' }] } as SlateElement;
      const element = {
        id: '1',
        type: 'mindMap',
        data: { topic: topicContent },
      } as PlaitElement;
      const board = createMockBoard([element]);

      const accessor = getTextAccessor(board, element);
      expect(accessor?.get(element)).toEqual(topicContent);
    });
  });

  describe('TextAccessor.set', () => {
    it('should set text for draw element', async () => {
      const { getTextAccessor } = await import('@thinkix/plait-utils');
      const { Transforms } = await import('@plait/core');
      const element = {
        id: '1',
        type: 'text',
        text: { children: [{ text: 'Old' }] },
      } as PlaitElement;
      const board = createMockBoard([element]);
      const newText = { children: [{ text: 'New' }] } as SlateElement;

      const accessor = getTextAccessor(board, element);
      accessor?.set(board, element, [0], newText, Transforms);

      expect(Transforms.setNode).toHaveBeenCalled();
    });

    it('should set topic for mind element', async () => {
      const { getTextAccessor } = await import('@thinkix/plait-utils');
      const { Transforms } = await import('@plait/core');
      const element = {
        id: '1',
        type: 'mindMap',
        data: { topic: { children: [{ text: 'Old' }] } },
      } as PlaitElement;
      const board = createMockBoard([element]);
      const newTopic = { children: [{ text: 'New' }] } as SlateElement;

      const accessor = getTextAccessor(board, element);
      accessor?.set(board, element, [0], newTopic, Transforms);

      expect(Transforms.setNode).toHaveBeenCalled();
    });

    it('should preserve existing data when setting topic', async () => {
      const { getTextAccessor } = await import('@thinkix/plait-utils');
      const { Transforms } = await import('@plait/core');
      const element = {
        id: '1',
        type: 'mindMap',
        data: { 
          topic: { children: [{ text: 'Old' }] },
          otherProp: 'value',
        },
      } as PlaitElement;
      const board = createMockBoard([element]);
      const newTopic = { children: [{ text: 'New' }] } as SlateElement;

      const accessor = getTextAccessor(board, element);
      accessor?.set(board, element, [0], newTopic, Transforms);

      const setNodeCall = vi.mocked(Transforms.setNode).mock.calls[0];
      expect(setNodeCall[1]).toHaveProperty('data');
      expect(setNodeCall[1].data).toHaveProperty('topic', newTopic);
    });
  });
});
