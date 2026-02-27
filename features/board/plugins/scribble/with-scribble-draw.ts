import {
  PlaitBoard,
  Point,
  Transforms,
  distanceBetweenPointAndPoint,
  toHostPoint,
  toViewBoxPoint,
} from '@plait/core';
import { isDrawingMode } from '@plait/common';
import {
  createScribbleElement,
  getScribbleToolPointers,
} from './helpers';
import { ScribbleElement, ScribbleTool } from './types';
import { ScribbleRenderer } from './scribble-renderer';
import { StrokeProcessor } from './stroke-processor';

export const withScribbleDraw = (board: PlaitBoard) => {
  const {
    pointerDown,
    pointerMove,
    pointerUp,
    globalPointerUp,
    touchStart,
  } = board;

  let isDrawingActive = false;
  let shouldCloseLoop = false;
  let currentPath: Point[] = [];
  let startScreenPoint: Point | null = null;

  const pathRenderer = new ScribbleRenderer(board);
  const processor = new StrokeProcessor({
    smoothingFactor: 0.7,
    pressureSensitivity: 0.6,
  });

  let tempElement: ScribbleElement | null = null;

  const finishDrawing = (cancel = false) => {
    if (isDrawingActive) {
      const currentTool = PlaitBoard.getPointer(board) as ScribbleTool;
      if (shouldCloseLoop && currentPath.length > 0) {
        currentPath.push(currentPath[0]);
      }
      tempElement = createScribbleElement(currentTool, currentPath);
    }
    if (tempElement && !cancel) {
      Transforms.insertNode(board, tempElement, [board.children.length]);
    }
    pathRenderer?.destroy();
    tempElement = null;
    isDrawingActive = false;
    currentPath = [];
    processor.reset();
  };

  board.touchStart = (event: TouchEvent) => {
    const toolPointers = getScribbleToolPointers();
    const isScribbleTool = PlaitBoard.isInPointer(board, toolPointers);
    if (isScribbleTool && isDrawingMode(board)) {
      return event.preventDefault();
    }
    touchStart(event);
  };

  board.pointerDown = (event: PointerEvent) => {
    const toolPointers = getScribbleToolPointers();
    const isScribbleTool = PlaitBoard.isInPointer(board, toolPointers);

    if (isScribbleTool && isDrawingMode(board)) {
      isDrawingActive = true;
      startScreenPoint = [event.x, event.y];
      const processed = processor.addPoint(startScreenPoint, {
        pressure: event.pressure,
        tiltX: event.tiltX,
        tiltY: event.tiltY,
      }) as Point;
      const viewPoint = toViewBoxPoint(
        board,
        toHostPoint(board, processed[0], processed[1])
      );
      currentPath.push(viewPoint);
    }
    pointerDown(event);
  };

  board.pointerMove = (event: PointerEvent) => {
    if (isDrawingActive) {
      const currentScreen: Point = [event.x, event.y];

      if (
        startScreenPoint &&
        distanceBetweenPointAndPoint(
          startScreenPoint[0],
          startScreenPoint[1],
          currentScreen[0],
          currentScreen[1]
        ) < 8
      ) {
        shouldCloseLoop = true;
      } else {
        shouldCloseLoop = false;
      }

      const processed = processor.addPoint(currentScreen, {
        pressure: event.pressure,
        tiltX: event.tiltX,
        tiltY: event.tiltY,
      });
      if (processed) {
        pathRenderer?.destroy();
        const newViewPoint = toViewBoxPoint(
          board,
          toHostPoint(board, processed[0], processed[1])
        );
        currentPath.push(newViewPoint);

        const currentTool = PlaitBoard.getPointer(board) as ScribbleTool;
        tempElement = createScribbleElement(currentTool, currentPath);
        pathRenderer.processDrawing(
          tempElement,
          PlaitBoard.getElementTopHost(board)
        );
      }
      return;
    }
    pointerMove(event);
  };

  board.pointerUp = (event: PointerEvent) => {
    finishDrawing();
    pointerUp(event);
  };

  board.globalPointerUp = (event: PointerEvent) => {
    finishDrawing(true);
    globalPointerUp(event);
  };

  return board;
};
