import { describe, it, expect } from 'vitest';
import {
  isValidThinkixData,
  serializeBoard,
  sanitizeFileName,
  CURRENT_VERSION,
  FILE_EXTENSION,
  MIME_TYPE,
} from '@thinkix/file-utils';
import type { ThinkixExportedData } from '@thinkix/file-utils';
import type { PlaitElement, PlaitTheme } from '@plait/core';
import { createMockBoard } from '../__utils__/test-utils';

describe('file-utils/types', () => {
  describe('constants', () => {
    it('should have correct file extension', () => {
      expect(FILE_EXTENSION).toBe('thinkix');
    });

    it('should have correct mime type', () => {
      expect(MIME_TYPE).toBe('application/json');
    });

    it('should have correct current version', () => {
      expect(CURRENT_VERSION).toBe(1);
    });
  });
});

describe('file-utils/board-export', () => {
  describe('isValidThinkixData', () => {
    it('should return true for valid thinkix data', () => {
      const validData: ThinkixExportedData = {
        type: 'thinkix',
        version: 1,
        source: 'web',
        elements: [],
        viewport: { zoom: 1, x: 0, y: 0 },
      };

      expect(isValidThinkixData(validData)).toBe(true);
    });

    it('should return true for valid thinkix data without optional fields', () => {
      const validData = {
        type: 'thinkix',
        elements: [],
        viewport: { zoom: 1 },
      };

      expect(isValidThinkixData(validData)).toBe(true);
    });

    it('should return false for null data', () => {
      expect(isValidThinkixData(null)).toBe(false);
    });

    it('should return false for undefined data', () => {
      expect(isValidThinkixData(undefined)).toBe(false);
    });

    it('should return false for data with wrong type', () => {
      const invalidData = {
        type: 'other',
        elements: [],
        viewport: { zoom: 1 },
      };

      expect(isValidThinkixData(invalidData)).toBe(false);
    });

    it('should return false for data without elements', () => {
      const invalidData = {
        type: 'thinkix',
        viewport: { zoom: 1 },
      };

      expect(isValidThinkixData(invalidData)).toBe(false);
    });

    it('should return false for data with non-array elements', () => {
      const invalidData = {
        type: 'thinkix',
        elements: 'not-an-array',
        viewport: { zoom: 1 },
      };

      expect(isValidThinkixData(invalidData)).toBe(false);
    });

    it('should return false for data without viewport', () => {
      const invalidData = {
        type: 'thinkix',
        elements: [],
      };

      expect(isValidThinkixData(invalidData)).toBe(false);
    });
  });

  describe('serializeBoard', () => {
    it('should serialize board to JSON string', () => {
      const board = createMockBoard({ elements: [] });

      const result = serializeBoard(board);
      const parsed = JSON.parse(result);

      expect(parsed.type).toBe('thinkix');
      expect(parsed.version).toBe(CURRENT_VERSION);
      expect(parsed.source).toBe('web');
      expect(parsed.elements).toEqual([]);
      expect(parsed.viewport).toBeDefined();
    });

    it('should include theme if present', () => {
      const theme: PlaitTheme = { themeColorMode: 'dark' } as PlaitTheme;
      const board = createMockBoard({
        elements: [],
        theme,
      });

      const result = serializeBoard(board);
      const parsed = JSON.parse(result);

      expect(parsed.theme).toEqual({ themeColorMode: 'dark' });
    });

    it('should include elements in serialization', () => {
      const elements: PlaitElement[] = [
        { id: '1', type: 'shape', points: [[0, 0], [100, 100]] } as PlaitElement,
        { id: '2', type: 'text', text: 'Hello' } as PlaitElement,
      ];
      const board = createMockBoard({ elements });

      const result = serializeBoard(board);
      const parsed = JSON.parse(result);

      expect(parsed.elements).toHaveLength(2);
      expect(parsed.elements[0].id).toBe('1');
      expect(parsed.elements[1].id).toBe('2');
    });
  });

  describe('sanitizeFileName', () => {
    it('should allow alphanumeric characters', () => {
      expect(sanitizeFileName('MyBoard123')).toBe('MyBoard123');
    });

    it('should allow underscores and hyphens', () => {
      expect(sanitizeFileName('my-board_v1')).toBe('my-board_v1');
    });

    it('should allow spaces', () => {
      expect(sanitizeFileName('My Board')).toBe('My Board');
    });

    it('should remove special characters', () => {
      expect(sanitizeFileName('My@Board#123!')).toBe('MyBoard123');
    });

    it('should trim whitespace', () => {
      expect(sanitizeFileName('  MyBoard  ')).toBe('MyBoard');
    });

    it('should return "board" for empty string', () => {
      expect(sanitizeFileName('')).toBe('board');
    });

    it('should return "board" for only special characters', () => {
      expect(sanitizeFileName('@#$%')).toBe('board');
    });
  });
});
