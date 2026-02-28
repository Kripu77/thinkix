// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import type { PlaitBoard, PlaitElement } from '@plait/core';

vi.mock('browser-fs-access', () => ({
  fileOpen: vi.fn(),
  fileSave: vi.fn(),
}));

vi.mock('@plait/core', async () => {
  return {
    toSvgData: vi.fn().mockResolvedValue('<svg></svg>'),
    toImage: vi.fn().mockResolvedValue('data:image/png;base64,mock'),
    getSelectedElements: vi.fn().mockReturnValue([]),
    ThemeColorMode: {
      default: 'default',
      dark: 'dark',
      light: 'light',
      soft: 'soft',
      retro: 'retro',
      starry: 'starry',
      colorful: 'colorful',
    },
  };
});

function createMockBoard(options: {
  elements?: PlaitElement[];
  theme?: { themeColorMode: 'light' | 'dark' };
}): PlaitBoard {
  const { elements = [], theme } = options;

  return {
    children: elements,
    viewport: { zoom: 1, x: 0, y: 0 },
    theme,
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
    getSelection: vi.fn().mockReturnValue(null),
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

describe('board-export', () => {
  describe('getBackgroundColor', () => {
    it('should return white for light theme', async () => {
      const { getBackgroundColor } = await import('@thinkix/file-utils');
      const board = createMockBoard({ theme: { themeColorMode: 'light' } });
      expect(getBackgroundColor(board)).toBe('#ffffff');
    });

    it('should return dark color for dark theme', async () => {
      const { getBackgroundColor } = await import('@thinkix/file-utils');
      const board = createMockBoard({ theme: { themeColorMode: 'dark' } });
      expect(getBackgroundColor(board)).toBe('#1a1a1a');
    });

    it('should return white for undefined theme', async () => {
      const { getBackgroundColor } = await import('@thinkix/file-utils');
      const board = createMockBoard({});
      expect(getBackgroundColor(board)).toBe('#ffffff');
    });

    it('should return white for theme without themeColorMode', async () => {
      const { getBackgroundColor } = await import('@thinkix/file-utils');
      const board = createMockBoard({ theme: undefined });
      expect(getBackgroundColor(board)).toBe('#ffffff');
    });
  });

  describe('saveBoardToFile', () => {
    it('should save board and return file handle', async () => {
      const { saveBoardToFile } = await import('@thinkix/file-utils');
      const { fileSave } = await import('browser-fs-access');
      const mockFileHandle = { name: 'test.thinkix' };
      vi.mocked(fileSave).mockResolvedValue(mockFileHandle as FileSystemFileHandle);

      const board = createMockBoard({ elements: [] });
      const result = await saveBoardToFile(board, 'my-board');

      expect(result).toEqual({ fileHandle: mockFileHandle });
    });

    it('should return null on abort error', async () => {
      const { saveBoardToFile } = await import('@thinkix/file-utils');
      const { fileSave } = await import('browser-fs-access');
      vi.mocked(fileSave).mockRejectedValue(new DOMException('Aborted', 'AbortError'));

      const board = createMockBoard({ elements: [] });
      const result = await saveBoardToFile(board);

      expect(result).toBeNull();
    });

    it('should throw non-abort errors', async () => {
      const { saveBoardToFile } = await import('@thinkix/file-utils');
      const { fileSave } = await import('browser-fs-access');
      vi.mocked(fileSave).mockRejectedValue(new Error('Network error'));

      const board = createMockBoard({ elements: [] });
      await expect(saveBoardToFile(board)).rejects.toThrow('Network error');
    });

    it('should sanitize filename', async () => {
      const { saveBoardToFile } = await import('@thinkix/file-utils');
      const { fileSave } = await import('browser-fs-access');
      const mockFileHandle = { name: 'test.thinkix' };
      vi.mocked(fileSave).mockResolvedValue(mockFileHandle as FileSystemFileHandle);

      const board = createMockBoard({ elements: [] });
      await saveBoardToFile(board, 'My@Board#123!');

      expect(fileSave).toHaveBeenCalled();
    });
  });

  describe('loadBoardFromFile', () => {
    it('should load and parse valid board file', async () => {
      const { loadBoardFromFile } = await import('@thinkix/file-utils');
      const { fileOpen } = await import('browser-fs-access');
      
      const validData = {
        type: 'thinkix',
        version: 1,
        source: 'web',
        elements: [{ id: '1', type: 'shape' }],
        viewport: { zoom: 1, x: 0, y: 0 },
      };
      vi.mocked(fileOpen).mockResolvedValue(
        new File([JSON.stringify(validData)], 'test.thinkix', { type: 'application/json' })
      );

      const result = await loadBoardFromFile();
      expect(result).toEqual(validData);
    });

    it('should return null on abort error', async () => {
      const { loadBoardFromFile } = await import('@thinkix/file-utils');
      const { fileOpen } = await import('browser-fs-access');
      vi.mocked(fileOpen).mockRejectedValue(new DOMException('Aborted', 'AbortError'));

      const result = await loadBoardFromFile();
      expect(result).toBeNull();
    });

    it('should throw error for invalid file format', async () => {
      const { loadBoardFromFile } = await import('@thinkix/file-utils');
      const { fileOpen } = await import('browser-fs-access');
      
      vi.mocked(fileOpen).mockResolvedValue(
        new File([JSON.stringify({ type: 'invalid' })], 'test.json', { type: 'application/json' })
      );

      await expect(loadBoardFromFile()).rejects.toThrow();
    });

    it('should throw error for invalid JSON', async () => {
      const { loadBoardFromFile } = await import('@thinkix/file-utils');
      const { fileOpen } = await import('browser-fs-access');
      
      vi.mocked(fileOpen).mockResolvedValue(
        new File(['not valid json'], 'test.thinkix', { type: 'application/json' })
      );

      await expect(loadBoardFromFile()).rejects.toThrow();
    });
  });

  describe('exportAsSvg', () => {
    it('should create SVG blob and download', async () => {
      const { exportAsSvg } = await import('@thinkix/file-utils');
      const board = createMockBoard({ elements: [] });

      await exportAsSvg(board, 'my-board');
    });

    it('should handle board with elements', async () => {
      const { exportAsSvg } = await import('@thinkix/file-utils');
      const element = { id: '1', type: 'shape' } as PlaitElement;
      const board = createMockBoard({ elements: [element] });

      await exportAsSvg(board);
    });

    it('should handle dark theme background', async () => {
      const { exportAsSvg } = await import('@thinkix/file-utils');
      const board = createMockBoard({ theme: { themeColorMode: 'dark' } });

      await exportAsSvg(board);
    });
  });

  describe('exportAsPng', () => {
    it('should create PNG blob and download', async () => {
      const { exportAsPng } = await import('@thinkix/file-utils');
      const board = createMockBoard({ elements: [] });

      await exportAsPng(board, true, 'my-board');
    });

    it('should handle non-transparent background', async () => {
      const { exportAsPng } = await import('@thinkix/file-utils');
      const board = createMockBoard({ elements: [] });

      await exportAsPng(board, false);
    });

    it('should handle board with elements', async () => {
      const { exportAsPng } = await import('@thinkix/file-utils');
      const element = { id: '1', type: 'shape' } as PlaitElement;
      const board = createMockBoard({ elements: [element] });

      await exportAsPng(board);
    });
  });

  describe('exportAsJpg', () => {
    it('should create JPG blob and download', async () => {
      const { exportAsJpg } = await import('@thinkix/file-utils');
      const board = createMockBoard({ elements: [] });

      await exportAsJpg(board, 'my-board');
    });

    it('should handle board with elements', async () => {
      const { exportAsJpg } = await import('@thinkix/file-utils');
      const element = { id: '1', type: 'shape' } as PlaitElement;
      const board = createMockBoard({ elements: [element] });

      await exportAsJpg(board);
    });

    it('should handle dark theme background', async () => {
      const { exportAsJpg } = await import('@thinkix/file-utils');
      const board = createMockBoard({ theme: { themeColorMode: 'dark' } });

      await exportAsJpg(board);
    });
  });
});
