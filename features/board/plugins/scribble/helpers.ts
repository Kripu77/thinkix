import {
  getSelectedElements,
  idCreator,
  isPointInPolygon,
  PlaitBoard,
  Point,
  RectangleClient,
  rotateAntiPointsByElement,
  Selection,
  ThemeColorMode,
} from '@plait/core';
import {
  ScribbleElement,
  ScribbleTool,
  ScribbleColorPalette,
  SCRIBBLE_ELEMENT_TYPE,
} from './types';
import {
  isClosedPoints,
  isHitPolyLine,
  isRectangleHitRotatedPoints,
  getStrokeColorByElement,
  getFillByElement,
} from '@plait/draw';

export function getScribbleToolPointers() {
  return [ScribbleTool.ink, ScribbleTool.eraser];
}

export const createScribbleElement = (
  tool: ScribbleTool,
  pathPoints: Point[]
): ScribbleElement => {
  const element: ScribbleElement = {
    id: idCreator(),
    type: SCRIBBLE_ELEMENT_TYPE,
    shape: tool,
    points: pathPoints,
  };
  return element;
};

export const checkHitScribble = (
  board: PlaitBoard,
  element: ScribbleElement,
  testPoint: Point
): boolean => {
  const antiPoint =
    rotateAntiPointsByElement(board, testPoint, element) || testPoint;
  const pathPoints = element.points;

  if (isClosedPoints(element.points)) {
    return (
      isPointInPolygon(antiPoint, pathPoints) ||
      isHitPolyLine(pathPoints, antiPoint)
    );
  } else {
    return isHitPolyLine(pathPoints, antiPoint);
  }
};

export const checkRectangleHitScribble = (
  board: PlaitBoard,
  element: ScribbleElement,
  selection: Selection
): boolean => {
  const selectionRect = RectangleClient.getRectangleByPoints([
    selection.anchor,
    selection.focus,
  ]);
  return isRectangleHitRotatedPoints(
    selectionRect,
    element.points,
    element.angle
  );
};

export const getSelectedScribbles = (board: PlaitBoard) => {
  return getSelectedElements(board).filter((ele) =>
    ScribbleElement.isScribble(ele)
  );
};

export const getDefaultStrokeColor = (theme: ThemeColorMode) => {
  return ScribbleColorPalette[theme].stroke;
};

export const getDefaultFill = (theme: ThemeColorMode) => {
  return ScribbleColorPalette[theme].fill;
};

// Use Plait's built-in functions where available
export { getStrokeColorByElement, getFillByElement };

// Gaussian smoothing utilities (not provided by Plait)
export function computeGaussianWeight(offset: number, sigma: number) {
  return Math.exp(-(offset * offset) / (2 * sigma * sigma));
}

export function applyGaussianSmoothing(
  inputPoints: Point[],
  sigma: number,
  windowSize: number
): Point[] {
  if (inputPoints.length < 2) return inputPoints;

  const halfWindow = Math.floor(windowSize / 2);
  const smoothed: Point[] = [];

  const getMirroredPoint = (idx: number): Point => {
    if (idx < 0) {
      const mirrorIdx = -idx - 1;
      if (mirrorIdx < inputPoints.length) {
        return [
          2 * inputPoints[0][0] - inputPoints[mirrorIdx][0],
          2 * inputPoints[0][1] - inputPoints[mirrorIdx][1],
        ];
      }
    } else if (idx >= inputPoints.length) {
      const mirrorIdx = 2 * inputPoints.length - idx - 1;
      if (mirrorIdx >= 0) {
        return [
          2 * inputPoints[inputPoints.length - 1][0] -
            inputPoints[mirrorIdx][0],
          2 * inputPoints[inputPoints.length - 1][1] -
            inputPoints[mirrorIdx][1],
        ];
      }
    }
    return inputPoints[idx];
  };

  const getAdaptiveWindow = (i: number): number => {
    const edgeDist = Math.min(i, inputPoints.length - 1 - i);
    return Math.min(halfWindow, edgeDist + Math.floor(halfWindow / 2));
  };

  for (let i = 0; i < inputPoints.length; i++) {
    let sumX = 0;
    let sumY = 0;
    let weightSum = 0;

    const adaptiveWin = getAdaptiveWindow(i);

    for (let j = -adaptiveWin; j <= adaptiveWin; j++) {
      const idx = i + j;
      const pt = getMirroredPoint(idx);

      let weight = computeGaussianWeight(j, sigma);

      if (i < halfWindow || i >= inputPoints.length - halfWindow) {
        const edgeBoost = 1 + 0.5 * (1 - Math.abs(j) / adaptiveWin);
        weight *= j === 0 ? edgeBoost : 1;
      }

      sumX += pt[0] * weight;
      sumY += pt[1] * weight;
      weightSum += weight;
    }

    if (i === 0 || i === inputPoints.length - 1) {
      smoothed.push([inputPoints[i][0], inputPoints[i][1]]);
    } else {
      smoothed.push([sumX / weightSum, sumY / weightSum]);
    }
  }

  return smoothed;
}
