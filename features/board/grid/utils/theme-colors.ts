import { ThemeColorMode } from '@plait/core';
import type { GridThemeColors } from '../types';
import { GRID_BACKGROUND_COLORS } from '@thinkix/shared';

const LIGHT_GRID_COLORS: GridThemeColors = {
  primary: '#d0d0d0',
  secondary: '#e8e8e8',
  major: '#a0a0a0',
  background: GRID_BACKGROUND_COLORS.light,
};

const DARK_GRID_COLORS: GridThemeColors = {
  primary: '#404040',
  secondary: '#333333',
  major: '#555555',
  background: GRID_BACKGROUND_COLORS.dark,
};

const BLUEPRINT_COLORS: GridThemeColors = {
  primary: '#a8c8d8',
  secondary: '#c8e0f0',
  major: '#7aa8c0',
  background: GRID_BACKGROUND_COLORS.blueprint.light,
};

const SOFT_GRID_COLORS: GridThemeColors = {
  primary: '#c8c8c8',
  secondary: '#d8d8d8',
  major: '#a0a0a0',
  background: '#f5f5f5',
};

const RETRO_GRID_COLORS: GridThemeColors = {
  primary: '#c4b998',
  secondary: '#d4ccb8',
  major: '#a09070',
  background: '#f9f8ed',
};

const STARRY_GRID_COLORS: GridThemeColors = {
  primary: '#2a4a5d',
  secondary: '#1a3a4d',
  major: '#3a6a8d',
  background: '#0d2537',
};

const COLORFUL_GRID_COLORS: GridThemeColors = {
  primary: '#a0d0e0',
  secondary: '#c0e0f0',
  major: '#70b0c8',
  background: '#ffffff',
};

export function getGridThemeColors(theme: ThemeColorMode): GridThemeColors {
  switch (theme) {
    case ThemeColorMode.dark:
      return DARK_GRID_COLORS;
    case ThemeColorMode.soft:
      return SOFT_GRID_COLORS;
    case ThemeColorMode.retro:
      return RETRO_GRID_COLORS;
    case ThemeColorMode.starry:
      return STARRY_GRID_COLORS;
    case ThemeColorMode.colorful:
      return COLORFUL_GRID_COLORS;
    case ThemeColorMode.default:
    default:
      return LIGHT_GRID_COLORS;
  }
}

export function getBlueprintColors(theme: ThemeColorMode): GridThemeColors {
  switch (theme) {
    case ThemeColorMode.dark:
    case ThemeColorMode.starry:
      return {
        primary: '#3a6080',
        secondary: '#2a4a60',
        major: '#4a80a0',
        background: GRID_BACKGROUND_COLORS.blueprint.dark,
      };
    default:
      return BLUEPRINT_COLORS;
  }
}

export function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
