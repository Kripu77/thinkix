import { PlaitBoard, getViewBox } from '@plait/core';
import type { ViewportBounds } from '../types';

export function worldToScreen(
  board: PlaitBoard,
  worldX: number,
  worldY: number
): { x: number; y: number } {
  const { zoom } = board.viewport;
  const viewBox = getViewBox(board);
  return {
    x: (worldX - viewBox.x) * zoom,
    y: (worldY - viewBox.y) * zoom,
  };
}

export function screenToWorld(
  board: PlaitBoard,
  screenX: number,
  screenY: number
): { x: number; y: number } {
  const { zoom } = board.viewport;
  const viewBox = getViewBox(board);
  return {
    x: screenX / zoom + viewBox.x,
    y: screenY / zoom + viewBox.y,
  };
}

export function getViewportBounds(board: PlaitBoard): ViewportBounds {
  const viewBox = getViewBox(board);
  const zoom = Number.isFinite(board.viewport.zoom) && board.viewport.zoom > 0 ? board.viewport.zoom : 1;
  
  const padding = 200 / zoom;
  
  return {
    minX: viewBox.x - padding,
    maxX: viewBox.x + viewBox.width + padding,
    minY: viewBox.y - padding,
    maxY: viewBox.y + viewBox.height + padding,
  };
}

export function snapToGrid(value: number, gridSize: number): number {
  if (!Number.isFinite(gridSize) || gridSize <= 0) {
    return value;
  }
  return Math.round(value / gridSize) * gridSize;
}

export function getGridLines(
  min: number,
  max: number,
  spacing: number
): number[] {
  if (!Number.isFinite(spacing) || spacing <= 0) {
    return [];
  }
  
  const lines: number[] = [];
  const start = Math.floor(min / spacing) * spacing;
  const end = Math.ceil(max / spacing) * spacing;
  
  for (let pos = start; pos <= end; pos += spacing) {
    lines.push(pos);
  }
  
  return lines;
}
