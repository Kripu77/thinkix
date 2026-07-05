import { PlaitBoard, getViewportOrigination } from '@plait/core';

export interface Viewport {
  zoom: number;
  originationX: number;
  originationY: number;
}

export function getViewport(board: PlaitBoard): Viewport {
  let origination: [number, number] | undefined;
  try {
    origination = getViewportOrigination(board);
  } catch {
    origination = board.viewport?.origination;
  }
  return {
    zoom: board.viewport?.zoom ?? 1,
    originationX: origination?.[0] ?? 0,
    originationY: origination?.[1] ?? 0,
  };
}

export function screenToDocument(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  viewport: Viewport
): { x: number; y: number } {
  const x = (clientX - containerRect.left) / viewport.zoom + viewport.originationX;
  const y = (clientY - containerRect.top) / viewport.zoom + viewport.originationY;
  return { x, y };
}

export function documentToScreen(
  documentX: number,
  documentY: number,
  viewport: Viewport
): { x: number; y: number } {
  const x = (documentX - viewport.originationX) * viewport.zoom;
  const y = (documentY - viewport.originationY) * viewport.zoom;
  return { x, y };
}

export function getViewportContainerElement(board: PlaitBoard | null): Element | null {
  if (board) {
    try {
      const container = PlaitBoard.getViewportContainer(board);
      if (container) return container;
    } catch {
    }
  }
  return (
    document.querySelector('.plait-board-container .viewport-container') ??
    document.querySelector('.plait-board-container')
  );
}
