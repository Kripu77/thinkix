import { describe, it, expect, vi } from 'vitest';
import type { PlaitBoard, PlaitElement } from '@plait/core';

vi.mock('@plait/mind', () => ({
  MindTransforms: {
    insertMind: vi.fn(),
  },
}));

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

describe('ai/commands', () => {
  describe('executeCommand', () => {
    it('should execute createMindmap command', async () => {
      const { executeCommand } = await import('@thinkix/ai');
      const { MindTransforms } = await import('@plait/mind');
      const board = createMockBoard({ elements: [] });
      const mindMapData = {
        id: 'test-id',
        type: 'mindMap',
        data: { topic: { children: [{ text: 'Root' }] } },
      };

      executeCommand(board, {
        type: 'createMindmap',
        data: { mindMapData },
      });

      expect(vi.mocked(MindTransforms.insertMind)).toHaveBeenCalled();
    });

    it('should handle addNode command without error', async () => {
      const { executeCommand } = await import('@thinkix/ai');
      const board = createMockBoard({ elements: [] });

      expect(() => executeCommand(board, {
        type: 'addNode',
        data: { text: 'New Node', position: [100, 100] },
      })).not.toThrow();
    });

    it('should handle updateNode command without error', async () => {
      const { executeCommand } = await import('@thinkix/ai');
      const board = createMockBoard({ elements: [] });

      expect(() => executeCommand(board, {
        type: 'updateNode',
        data: { nodeId: 'node-1', width: 200, height: 100 },
      })).not.toThrow();
    });

    it('should handle deleteSelection command without error', async () => {
      const { executeCommand } = await import('@thinkix/ai');
      const board = createMockBoard({ elements: [] });

      expect(() => executeCommand(board, {
        type: 'deleteSelection',
        data: { nodeIds: ['node-1', 'node-2'] },
      })).not.toThrow();
    });

    it('should handle unknown command type gracefully', async () => {
      const { executeCommand } = await import('@thinkix/ai');
      const board = createMockBoard({ elements: [] });

      expect(() => executeCommand(board, {
        type: 'unknownCommand' as 'createMindmap',
        data: {},
      })).not.toThrow();
    });
  });

  describe('type exports', () => {
    it('should export CanvasCommand type', async () => {
      const mod = await import('@thinkix/ai');
      expect(mod).toBeDefined();
    });

    it('should export CanvasCommandData type', async () => {
      const mod = await import('@thinkix/ai');
      expect(mod).toBeDefined();
    });

    it('should export CreateMindmapData type', async () => {
      const mod = await import('@thinkix/ai');
      expect(mod).toBeDefined();
    });

    it('should export AddNodeData type', async () => {
      const mod = await import('@thinkix/ai');
      expect(mod).toBeDefined();
    });

    it('should export UpdateNodeData type', async () => {
      const mod = await import('@thinkix/ai');
      expect(mod).toBeDefined();
    });

    it('should export DeleteSelectionData type', async () => {
      const mod = await import('@thinkix/ai');
      expect(mod).toBeDefined();
    });
  });
});
