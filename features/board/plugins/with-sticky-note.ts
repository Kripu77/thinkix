import {
  PlaitBoard,
  PlaitPlugin,
  Transforms,
  toHostPoint,
  toViewBoxPoint,
  BoardTransforms,
  PlaitPointerType,
} from '@plait/core';
import { createGeometryElement, BasicShapes } from '@plait/draw';
import { STICKY_NOTE_POINTER } from '@/shared/constants';

const STICKY_NOTE_FILL = '#FFEAA7';
const STICKY_NOTE_STROKE = '#F1C40F';
const STICKY_NOTE_WIDTH = 160;
const STICKY_NOTE_HEIGHT = 160;

export const withStickyNote: PlaitPlugin = (board: PlaitBoard) => {
  const pointerUp = board.pointerUp?.bind(board);
  const pointerDown = board.pointerDown?.bind(board);
  
  let isCreating = false;
  let startPoint: [number, number] | null = null;

  board.pointerDown = (event: PointerEvent) => {
    if (PlaitBoard.isInPointer(board, [STICKY_NOTE_POINTER])) {
      isCreating = true;
      const hostPoint = toHostPoint(board, event.x, event.y);
      const viewPoint = toViewBoxPoint(board, hostPoint);
      startPoint = [viewPoint[0], viewPoint[1]];
      return;
    }
    if (pointerDown) pointerDown(event);
  };

  board.pointerUp = (event: PointerEvent) => {
    if (isCreating && startPoint) {
      const hostPoint = toHostPoint(board, event.x, event.y);
      const viewPoint = toViewBoxPoint(board, hostPoint);
      
      const x = Math.min(startPoint[0], viewPoint[0]);
      const y = Math.min(startPoint[1], viewPoint[1]);
      const width = Math.max(Math.abs(viewPoint[0] - startPoint[0]), STICKY_NOTE_WIDTH);
      const height = Math.max(Math.abs(viewPoint[1] - startPoint[1]), STICKY_NOTE_HEIGHT);
      
      const points: [[number, number], [number, number]] = [
        [x, y],
        [x + width, y + height]
      ];
      
      const text = { children: [{ text: '' }] };
      
      const element = createGeometryElement(
        BasicShapes.rectangle,
        points,
        text,
        {
          fill: STICKY_NOTE_FILL,
          strokeColor: STICKY_NOTE_STROKE,
          strokeWidth: 1,
        }
      );
      
      element.fillStyle = 'solid';
      
      const path = [board.children.length];
      Transforms.insertNode(board, element, path);
      
      BoardTransforms.updatePointerType(board, PlaitPointerType.selection);
      
      window.dispatchEvent(new CustomEvent('thinkix:toolchange', { 
        detail: { tool: 'select' } 
      }));
      
      isCreating = false;
      startPoint = null;
      return;
    }
    if (pointerUp) pointerUp(event);
  };

  return board;
};
