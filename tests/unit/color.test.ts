import { describe, it, expect } from 'vitest';
import {
  hexAlphaToOpacity,
  removeHexAlpha,
  applyOpacityToHex,
  isDefaultStroke,
  isNoColor,
  isValidColor,
  isFullyOpaque,
  splitRows,
} from '@thinkix/ui/lib/color';

describe('color utilities', () => {
  describe('hexAlphaToOpacity', () => {
    it('should return 1 for 6-character hex without alpha', () => {
      expect(hexAlphaToOpacity('#ff0000')).toBe(1);
      expect(hexAlphaToOpacity('#00ff00')).toBe(1);
      expect(hexAlphaToOpacity('#0000ff')).toBe(1);
    });

    it('should extract opacity from 8-character hex with alpha', () => {
      expect(hexAlphaToOpacity('#ff0000ff')).toBe(1);
      expect(hexAlphaToOpacity('#ff000000')).toBe(0);
      expect(hexAlphaToOpacity('#ff000080')).toBeCloseTo(0.502, 2);
    });

    it('should handle hex without # prefix', () => {
      expect(hexAlphaToOpacity('ff0000')).toBe(1);
      expect(hexAlphaToOpacity('ff000080')).toBeCloseTo(0.502, 2);
    });

    it('should return 1 for invalid length hex', () => {
      expect(hexAlphaToOpacity('#fff')).toBe(1);
      expect(hexAlphaToOpacity('#ffff')).toBe(1);
    });
  });

  describe('removeHexAlpha', () => {
    it('should remove alpha from 8-character hex', () => {
      expect(removeHexAlpha('#ff000080')).toBe('#ff0000');
      expect(removeHexAlpha('#00ff00ff')).toBe('#00ff00');
    });

    it('should return unchanged for 6-character hex', () => {
      expect(removeHexAlpha('#ff0000')).toBe('#ff0000');
      expect(removeHexAlpha('#00ff00')).toBe('#00ff00');
    });

    it('should handle hex without # prefix', () => {
      expect(removeHexAlpha('ff000080')).toBe('#ff0000');
    });

    it('should return unchanged for invalid length', () => {
      expect(removeHexAlpha('#fff')).toBe('#fff');
      expect(removeHexAlpha('#ffff')).toBe('#ffff');
    });
  });

  describe('applyOpacityToHex', () => {
    it('should apply opacity to 6-character hex', () => {
      expect(applyOpacityToHex('#ff0000', 1)).toBe('#ff0000ff');
      expect(applyOpacityToHex('#ff0000', 0)).toBe('#ff000000');
      expect(applyOpacityToHex('#00ff00', 0.5)).toBe('#00ff0080');
    });

    it('should return unchanged for non-6-character hex', () => {
      expect(applyOpacityToHex('#fff', 0.5)).toBe('#fff');
      expect(applyOpacityToHex('#ff000080', 0.5)).toBe('#ff000080');
    });

    it('should handle hex without # prefix', () => {
      expect(applyOpacityToHex('ff0000', 1)).toBe('#ff0000ff');
    });

    it('should handle boundary opacity values', () => {
      expect(applyOpacityToHex('#ff0000', 1)).toBe('#ff0000ff');
      expect(applyOpacityToHex('#ff0000', 0)).toBe('#ff000000');
      expect(applyOpacityToHex('#ff0000', 0.001)).toBe('#ff000000');
      expect(applyOpacityToHex('#ff0000', 0.999)).toBe('#ff0000ff');
      expect(applyOpacityToHex('#ff0000', 0.5)).toBe('#ff000080');
    });
  });

  describe('isDefaultStroke', () => {
    it('should return true for black hex', () => {
      expect(isDefaultStroke('#000000')).toBe(true);
    });

    it('should return true for black rgb', () => {
      expect(isDefaultStroke('rgb(0, 0, 0)')).toBe(true);
    });

    it('should return false for other colors', () => {
      expect(isDefaultStroke('#ff0000')).toBe(false);
      expect(isDefaultStroke('rgb(255, 0, 0)')).toBe(false);
      expect(isDefaultStroke('#ffffff')).toBe(false);
    });
  });

  describe('isNoColor', () => {
    it('should return true for empty string', () => {
      expect(isNoColor('')).toBe(true);
    });

    it('should return true for transparent', () => {
      expect(isNoColor('transparent')).toBe(true);
    });

    it('should return true for rgba transparent', () => {
      expect(isNoColor('rgba(0, 0, 0, 0)')).toBe(true);
    });

    it('should return true for falsy values', () => {
      expect(isNoColor(null as unknown as string)).toBe(true);
      expect(isNoColor(undefined as unknown as string)).toBe(true);
    });

    it('should return false for valid colors', () => {
      expect(isNoColor('#ff0000')).toBe(false);
      expect(isNoColor('rgb(255, 0, 0)')).toBe(false);
    });
  });

  describe('isValidColor', () => {
    it('should return true for valid 6-character hex', () => {
      expect(isValidColor('#ff0000')).toBe(true);
      expect(isValidColor('#00ff00')).toBe(true);
      expect(isValidColor('#0000ff')).toBe(true);
      expect(isValidColor('#ABCDEF')).toBe(true);
    });

    it('should return true for valid 8-character hex with alpha', () => {
      expect(isValidColor('#ff000080')).toBe(true);
      expect(isValidColor('#00ff00ff')).toBe(true);
    });

    it('should return false for invalid hex formats', () => {
      expect(isValidColor('#fff')).toBe(false);
      expect(isValidColor('ff0000')).toBe(false);
      expect(isValidColor('#gggggg')).toBe(false);
    });

    it('should return false for no-color values', () => {
      expect(isValidColor('')).toBe(false);
      expect(isValidColor('transparent')).toBe(false);
      expect(isValidColor(null)).toBe(false);
      expect(isValidColor(undefined)).toBe(false);
    });

    it('should return false for rgb/rgba formats', () => {
      expect(isValidColor('rgb(255, 0, 0)')).toBe(false);
      expect(isValidColor('rgba(255, 0, 0, 0.5)')).toBe(false);
    });
  });

  describe('isFullyOpaque', () => {
    it('should return true for opacity 1', () => {
      expect(isFullyOpaque(1)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isFullyOpaque(undefined)).toBe(true);
    });

    it('should return true for null', () => {
      expect(isFullyOpaque(null)).toBe(true);
    });

    it('should return false for other opacity values', () => {
      expect(isFullyOpaque(0)).toBe(false);
      expect(isFullyOpaque(0.5)).toBe(false);
      expect(isFullyOpaque(0.99)).toBe(false);
    });
  });

  describe('splitRows', () => {
    it('should split array into rows of specified size', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      expect(splitRows(arr, 3)).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
    });

    it('should handle incomplete last row', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7];
      expect(splitRows(arr, 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    });

    it('should handle empty array', () => {
      expect(splitRows([], 3)).toEqual([]);
    });

    it('should handle single element', () => {
      expect(splitRows([1], 3)).toEqual([[1]]);
    });

    it('should handle row size larger than array', () => {
      const arr = [1, 2];
      expect(splitRows(arr, 5)).toEqual([[1, 2]]);
    });

    it('should handle row size of 1', () => {
      const arr = [1, 2, 3];
      expect(splitRows(arr, 1)).toEqual([[1], [2], [3]]);
    });

    it('should work with objects', () => {
      const arr = [{ a: 1 }, { b: 2 }, { c: 3 }];
      expect(splitRows(arr, 2)).toEqual([[{ a: 1 }, { b: 2 }], [{ c: 3 }]]);
    });
  });
});
