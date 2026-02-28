import type { GridDensity, GridVisibilityThresholds, GridType } from './types';

export const CANVAS_MODE_LABELS: Record<GridType, string> = {
  blank: 'Focus',
  dot: 'Dots',
  square: 'Lines',
  blueprint: 'Blueprint',
  isometric: 'Isometric',
  ruled: 'Ruled',
} as const;

export const CANVAS_MODE_ORDER: readonly GridType[] = [
  'blank',
  'isometric',
  'blueprint',
  'square',
  'ruled',
  'dot',
] as const;

export const GRID_TYPES_SUPPORTING_MAJOR: readonly GridType[] = [
  'square',
  'blueprint',
  'isometric',
  'ruled',
] as const;

export function supportsMajorGrid(type: GridType): boolean {
  return GRID_TYPES_SUPPORTING_MAJOR.includes(type);
}

export function getCanvasModeLabel(type: GridType): string {
  return CANVAS_MODE_LABELS[type];
}

export const GRID_ZOOM_THRESHOLDS: GridVisibilityThresholds = {
  minorGridMinZoom: 0.25,
  majorGridMinZoom: 0.5,
  minorGridMaxZoom: 5,
  majorGridMaxZoom: 5,
};

export const MAJOR_GRID_INTERVAL = 5;
export const ISOMETRIC_ANGLE_DEG = 30;
export const ISOMETRIC_ANGLE_RAD = (ISOMETRIC_ANGLE_DEG * Math.PI) / 180;
export const GRID_DOT_RADIUS_BASE = 1;
export const GRID_LINE_WIDTH_BASE = 0.75;
export const GRID_MAJOR_LINE_WIDTH_BASE = 1.25;
export const GRID_RULED_MARGIN_OFFSET = 80;
export const GRID_VIEWPORT_PADDING = 200;

export const GRID_OPACITY = {
  minor: 0.5,
  major: 0.7,
  dot: 0.6,
};

export function getDensityValue(density: GridDensity): number {
  return density;
}

export function getMinorGridSpacing(density: GridDensity): number {
  return getDensityValue(density);
}

export function getMajorGridSpacing(density: GridDensity): number {
  return getDensityValue(density) * MAJOR_GRID_INTERVAL;
}
