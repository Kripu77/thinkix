import type { PlaitBoard } from '@plait/core';

export interface Viewport {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export function getViewport(board: PlaitBoard): Viewport {
  return {
    zoom: board.viewport?.zoom ?? 1,
    offsetX: board.viewport?.offsetX ?? 0,
    offsetY: board.viewport?.offsetY ?? 0,
  };
}

export function screenToDocument(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  viewport: Viewport
): { x: number; y: number } {
  const x = (clientX - containerRect.left - viewport.offsetX) / viewport.zoom;
  const y = (clientY - containerRect.top - viewport.offsetY) / viewport.zoom;
  return { x, y };
}

export function documentToScreen(
  documentX: number,
  documentY: number,
  viewport: Viewport
): { x: number; y: number } {
  const x = documentX * viewport.zoom + viewport.offsetX;
  const y = documentY * viewport.zoom + viewport.offsetY;
  return { x, y };
}
