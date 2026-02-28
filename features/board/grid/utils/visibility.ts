import type { GridDensity } from '../types';
import {
  GRID_ZOOM_THRESHOLDS,
  GRID_OPACITY,
  getMinorGridSpacing,
} from '../constants';

export function getMinorGridOpacity(zoom: number): number {
  const { minorGridMinZoom } = GRID_ZOOM_THRESHOLDS
  
  if (zoom < minorGridMinZoom) {
    return 0
  }
  
  if (zoom <= 1) {
    const range = 1 - minorGridMinZoom
    const progress = zoom - minorGridMinZoom
    return Math.min(GRID_OPACITY.minor, (progress / range) * GRID_OPACITY.minor)
  }
  
  return GRID_OPACITY.minor
}

export function getMajorGridOpacity(zoom: number): number {
  const { majorGridMinZoom } = GRID_ZOOM_THRESHOLDS
  
  if (zoom < majorGridMinZoom) {
    return 0
  }
  
  if (zoom <= 1) {
    const range = 1 - majorGridMinZoom
    const progress = zoom - majorGridMinZoom
    return Math.min(GRID_OPACITY.major, (progress / range) * GRID_OPACITY.major)
  }
  
  return GRID_OPACITY.major
}

export function getDotGridOpacity(zoom: number): number {
  const { minorGridMinZoom } = GRID_ZOOM_THRESHOLDS
  
  if (zoom < minorGridMinZoom) {
    return 0
  }
  
  if (zoom <= 1) {
    const range = 1 - minorGridMinZoom
    const progress = zoom - minorGridMinZoom
    return Math.min(GRID_OPACITY.dot, (progress / range) * GRID_OPACITY.dot)
  }
  
  return GRID_OPACITY.dot
}

export function shouldRenderMinorGrid(zoom: number): boolean {
  return zoom >= GRID_ZOOM_THRESHOLDS.minorGridMinZoom
}

export function shouldRenderMajorGrid(zoom: number): boolean {
  return zoom >= GRID_ZOOM_THRESHOLDS.majorGridMinZoom
}

export function getOptimalDensity(density: GridDensity, zoom: number): GridDensity {
  const spacing = getMinorGridSpacing(density)
  const screenSpacing = spacing * zoom
  
  if (screenSpacing < 4 && density > 8) {
    return (Math.max(density / 2, 8) as GridDensity)
  }
  
  if (screenSpacing > 60 && density < 48) {
    return (Math.min(density * 2, 48) as GridDensity)
  }
  
  return density
}
