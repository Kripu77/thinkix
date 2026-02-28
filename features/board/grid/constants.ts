import type { GridDensity, GridVisibilityThresholds } from './types';

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
export const GRID_RULED_MARGIN_OFFSET = 80
export const GRID_VIEWPORT_PADDING = 200

export const GRID_OPACITY = {
  minor: 0.5,
  major: 0.7,
  dot: 0.6,
};

export function getDensityValue(density: GridDensity): number {
  return density
}

export function getMinorGridSpacing(density: GridDensity): number {
  return getDensityValue(density)
}

export function getMajorGridSpacing(density: GridDensity): number {
  return getDensityValue(density) * MAJOR_GRID_INTERVAL
}
