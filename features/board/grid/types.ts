export type { GridType, GridDensity, BoardBackground } from '@thinkix/shared';
export { GRID_BACKGROUND_COLORS } from '@thinkix/shared';

import type { BoardBackground as BoardBackgroundType, GridDensity } from '@thinkix/shared';

export const DEFAULT_GRID_DENSITY = 16;

export const GRID_DENSITIES: GridDensity[] = [8, 12, 16, 24, 32, 48];

export interface AdvancedSettings {
  snapStrength: number;
  fadeGrid: boolean;
  gridOpacity: number;
}

export const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  snapStrength: 50,
  fadeGrid: false,
  gridOpacity: 100,
};

export interface GridThemeColors {
  primary: string;
  secondary: string;
  major: string;
  background: string;
}

export interface GridVisibilityThresholds {
  minorGridMinZoom: number;
  majorGridMinZoom: number;
  minorGridMaxZoom: number;
  majorGridMaxZoom: number;
}

export interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const DEFAULT_BOARD_BACKGROUND: BoardBackgroundType = {
  type: 'blank',
  density: DEFAULT_GRID_DENSITY,
  showMajor: true,
};
