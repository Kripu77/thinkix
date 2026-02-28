import {
  PlaitBoard,
  PlaitElement,
  Point,
  throttleRAF,
  toHostPoint,
  toViewBoxPoint,
  CoreTransforms,
} from '@plait/core';
import { isDrawingMode } from '@plait/common';
import { ScribbleElement } from './scribble/types';
import { checkHitScribble } from './scribble/helpers';
import { LaserPointer } from '../utils';
import { ERASER_POINTER } from '@/shared/constants';
import posthog from 'posthog-js';

export const withEraser = (board: PlaitBoard) => {
  const { pointerDown, pointerMove, pointerUp, globalPointerUp, touchStart } = board;

  const laserPointer = new LaserPointer();

  let isErasing = false;
  const elementsToDelete = new Set<string>();

  const checkAndMarkElementsForDeletion = (point: Point) => {
    const viewBoxPoint = toViewBoxPoint(
      board,
      toHostPoint(board, point[0], point[1])
    );

    board.children.forEach((element) => {
      if (elementsToDelete.has(element.id)) return;

      let isHit = false;

      if (ScribbleElement.isScribble(element)) {
        isHit = checkHitScribble(board, element, viewBoxPoint);
      } else if (board.isHit) {
        isHit = board.isHit(element, viewBoxPoint, false);
      }

      if (isHit) {
        const elementG = PlaitElement.getElementG(element);
        if (elementG) {
          elementG.style.opacity = '0.2';
        }
        elementsToDelete.add(element.id);
      }
    });
  };

  const deleteMarkedElements = () => {
    if (elementsToDelete.size > 0) {
      const elementsToRemove = board.children.filter((element) =>
        elementsToDelete.has(element.id)
      );

      if (elementsToRemove.length > 0) {
        CoreTransforms.removeElements(board, elementsToRemove);
        posthog.capture('elements_deleted', { 
          count: elementsToRemove.length,
          element_types: elementsToRemove.map(e => e.type),
          source: 'eraser_tool',
        });
      }
    }
  };

  const complete = () => {
    if (isErasing) {
      deleteMarkedElements();
      isErasing = false;
      elementsToDelete.clear();
      laserPointer.destroy();
    }
  };

  board.touchStart = (event: TouchEvent) => {
    const isEraserPointer = PlaitBoard.isInPointer(board, [ERASER_POINTER]);
    if (isEraserPointer && isDrawingMode(board)) {
      return event.preventDefault();
    }
    touchStart(event);
  };

  board.pointerDown = (event: PointerEvent) => {
    const isEraserPointer = PlaitBoard.isInPointer(board, [ERASER_POINTER]);

    if (isEraserPointer && isDrawingMode(board)) {
      isErasing = true;
      elementsToDelete.clear();
      const currentPoint: Point = [event.x, event.y];
      checkAndMarkElementsForDeletion(currentPoint);
      laserPointer.init(board);
      return;
    }

    pointerDown(event);
  };

  board.pointerMove = (event: PointerEvent) => {
    if (isErasing) {
      throttleRAF(board, 'with-eraser', () => {
        const currentPoint: Point = [event.x, event.y];
        checkAndMarkElementsForDeletion(currentPoint);
      });
      return;
    }
    pointerMove(event);
  };

  board.pointerUp = (event: PointerEvent) => {
    if (isErasing) {
      complete();
      return;
    }

    pointerUp(event);
  };

  board.globalPointerUp = (event: PointerEvent) => {
    if (isErasing) {
      complete();
      return;
    }

    globalPointerUp(event);
  };

  return board;
};
