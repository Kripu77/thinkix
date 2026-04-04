import {
  PlaitBoard,
  PlaitPlugin,
  Transforms,
  toHostPoint,
  toViewBoxPoint,
  BoardTransforms,
  PlaitPointerType,
} from '@plait/core';
import { STICKY_NOTE_POINTER as _STICKY_NOTE_POINTER, DEFAULT_STICKY_COLOR, STICKY_COLORS } from '@/shared/constants';
import { createStickyNoteElement } from '../utils/sticky-note';

export const STICKY_NOTE_POINTER = _STICKY_NOTE_POINTER;
export const STICKY_NOTE_FILL = STICKY_COLORS[DEFAULT_STICKY_COLOR].fill;
export const STICKY_NOTE_STROKE = STICKY_COLORS[DEFAULT_STICKY_COLOR].stroke;
export const STICKY_NOTE_WIDTH = 160;
export const STICKY_NOTE_HEIGHT = 160;

function computeStickyNoteBounds(
  startPoint: [number, number],
  endPoint: [number, number]
): { x: number; y: number; width: number; height: number } {
  const x = Math.min(startPoint[0], endPoint[0]);
  const y = Math.min(startPoint[1], endPoint[1]);
  const width = Math.max(Math.abs(endPoint[0] - startPoint[0]), STICKY_NOTE_WIDTH);
  const height = Math.max(Math.abs(endPoint[1] - startPoint[1]), STICKY_NOTE_HEIGHT);
  return { x, y, width, height };
}

export const withStickyNote: PlaitPlugin = (board: PlaitBoard) => {
  const pointerUp = board.pointerUp?.bind(board);
  const pointerDown = board.pointerDown?.bind(board);
  const pointerMove = board.pointerMove?.bind(board);
  
  let isCreating = false;
  let startPoint: [number, number] | null = null;
  let previewRect: SVGRectElement | null = null;

  const isStickyNoteActive = () => PlaitBoard.isInPointer(board, [STICKY_NOTE_POINTER]);

  const cancelCreation = () => {
    clearPreview();
    isCreating = false;
    startPoint = null;
  };

  const drawPreview = (x: number, y: number, width: number, height: number) => {
    if (!previewRect) {
      const svg = PlaitBoard.getElementHost(board);
      previewRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      previewRect.setAttribute('fill', STICKY_NOTE_FILL);
      previewRect.setAttribute('stroke', STICKY_NOTE_STROKE);
      previewRect.setAttribute('stroke-width', '1');
      previewRect.setAttribute('opacity', '0.7');
      previewRect.setAttribute('pointer-events', 'none');
      previewRect.setAttribute('data-testid', 'sticky-preview-rect');
      svg.appendChild(previewRect);
    }
    
    previewRect.setAttribute('x', String(x));
    previewRect.setAttribute('y', String(y));
    previewRect.setAttribute('width', String(width));
    previewRect.setAttribute('height', String(height));
  };

  const clearPreview = () => {
    if (previewRect && previewRect.parentNode) {
      previewRect.remove();
    }
    previewRect = null;
  };

  board.pointerDown = (event: PointerEvent) => {
    if (isStickyNoteActive()) {
      isCreating = true;
      const hostPoint = toHostPoint(board, event.x, event.y);
      const viewPoint = toViewBoxPoint(board, hostPoint);
      startPoint = [viewPoint[0], viewPoint[1]];
      return;
    }
    if (pointerDown) pointerDown(event);
  };

  board.pointerMove = (event: PointerEvent) => {
    if (isCreating && startPoint) {
      if (!isStickyNoteActive()) {
        cancelCreation();
        if (pointerMove) pointerMove(event);
        return;
      }
      
      const hostPoint = toHostPoint(board, event.x, event.y);
      const viewPoint = toViewBoxPoint(board, hostPoint);
      const bounds = computeStickyNoteBounds(startPoint, viewPoint);
      
      drawPreview(bounds.x, bounds.y, bounds.width, bounds.height);
      return;
    }
    if (pointerMove) pointerMove(event);
  };

  board.pointerUp = (event: PointerEvent) => {
    if (isCreating && startPoint) {
      if (!isStickyNoteActive()) {
        cancelCreation();
        if (pointerUp) pointerUp(event);
        return;
      }
      
      clearPreview();
      
      const hostPoint = toHostPoint(board, event.x, event.y);
      const viewPoint = toViewBoxPoint(board, hostPoint);
      const bounds = computeStickyNoteBounds(startPoint, viewPoint);
      
      const points: [[number, number], [number, number]] = [
        [bounds.x, bounds.y],
        [bounds.x + bounds.width, bounds.y + bounds.height]
      ];
      
      const element = createStickyNoteElement({
        points,
        text: '',
        color: DEFAULT_STICKY_COLOR,
      });
      
      const path = [board.children.length];
      Transforms.insertNode(board, element, path);
      
      BoardTransforms.updatePointerType(board, PlaitPointerType.selection);
      
      isCreating = false;
      startPoint = null;
      return;
    }
    if (pointerUp) pointerUp(event);
  };

  return board;
};
