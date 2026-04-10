import { describe, it, expect } from 'vitest';
import { getGridThemeColors, getBlueprintColors, getRuledColors, rgba } from '@/features/board/grid/utils/theme-colors';
import { ThemeColorMode } from '@plait/core';

describe('theme-colors', () => {
  describe('getGridThemeColors', () => {
    it('should return light colors for default theme', () => {
      const colors = getGridThemeColors(ThemeColorMode.default);
      
      expect(colors).toHaveProperty('primary');
      expect(colors).toHaveProperty('secondary');
      expect(colors).toHaveProperty('major');
      expect(colors).toHaveProperty('background');
    });

    it('should return dark colors for dark theme', () => {
      const colors = getGridThemeColors(ThemeColorMode.dark);
      
      expect(colors.background).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should return different colors for different themes', () => {
      const defaultColors = getGridThemeColors(ThemeColorMode.default);
      const darkColors = getGridThemeColors(ThemeColorMode.dark);
      
      expect(defaultColors.background).not.toBe(darkColors.background);
    });

    it('should return valid hex colors', () => {
      const themes = [
        ThemeColorMode.default,
        ThemeColorMode.dark,
        ThemeColorMode.soft,
        ThemeColorMode.retro,
        ThemeColorMode.starry,
        ThemeColorMode.colorful,
      ];
      
      for (const theme of themes) {
        const colors = getGridThemeColors(theme);
        expect(colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(colors.secondary).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(colors.major).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(colors.background).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });
  });

  describe('getBlueprintColors', () => {
    it('should return blueprint-specific colors', () => {
      const colors = getBlueprintColors(ThemeColorMode.default);
      
      expect(colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(colors.background).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should return different line colors for dark theme', () => {
      const lightBlueprint = getBlueprintColors(ThemeColorMode.default);
      const darkBlueprint = getBlueprintColors(ThemeColorMode.dark);
      
      expect(lightBlueprint.primary).not.toBe(darkBlueprint.primary);
    });

    it('should return dark blueprint colors for starry theme', () => {
      const starryBlueprint = getBlueprintColors(ThemeColorMode.starry);
      
      expect(starryBlueprint.background).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  describe('getRuledColors', () => {
    it('should return a paper-like ruled palette for the default theme', () => {
      const colors = getRuledColors(ThemeColorMode.default);

      expect(colors.background).toBe('#f8f8f5');
      expect(colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should return dark ruled palettes for dark and starry themes', () => {
      const darkRuled = getRuledColors(ThemeColorMode.dark);
      const starryRuled = getRuledColors(ThemeColorMode.starry);

      expect(darkRuled.background).not.toBe('#f8f8f5');
      expect(starryRuled.background).not.toBe('#f8f8f5');
      expect(darkRuled.background).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(starryRuled.background).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  describe('rgba', () => {
    it('should convert hex to rgba with alpha', () => {
      const result = rgba('#ff0000', 0.5);
      
      expect(result).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should handle full opacity', () => {
      const result = rgba('#0000ff', 1);
      
      expect(result).toBe('rgba(0, 0, 255, 1)');
    });

    it('should handle zero opacity', () => {
      const result = rgba('#00ff00', 0);
      
      expect(result).toBe('rgba(0, 255, 0, 0)');
    });

    it('should handle complex hex colors', () => {
      const result = rgba('#1a2b3c', 0.75);
      
      expect(result).toBe('rgba(26, 43, 60, 0.75)');
    });
  });
});
