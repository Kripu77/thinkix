import type { Point } from './path';
import { getTransformAttr as getTransformAttrFromUtils, type TransformResult } from '../utils';

export interface ParsedPath {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  reflectionPoints: Point[];
}

export const getTransformAttr = (element: SVGElement): TransformResult => getTransformAttrFromUtils(element);

function safeParseFloat(value: string, context: string): number {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    throw new Error(`Invalid coordinate for ${context}: "${value}" is not a valid number`);
  }
  return parsed;
}

export function computeEdgePositions(
  pathElement: SVGPathElement,
  offset: Point = { x: 0, y: 0 }
): ParsedPath {
  if (pathElement.tagName.toLowerCase() !== 'path') {
    throw new Error(`Expected path element, got ${pathElement.tagName}`);
  }

  const d = pathElement.getAttribute('d');
  if (!d) {
    throw new Error('Path element does not have a d attribute');
  }

  const commands = d.split(/(?=[LM])/);

  if (commands.length === 0) {
    throw new Error('Path has no valid commands');
  }

  const firstCommand = commands[0];
  if (!firstCommand || firstCommand.length < 2) {
    throw new Error('Path first command is malformed');
  }

  const startPosition = firstCommand
    .substring(1)
    .split(',')
    .map((coord, i) => safeParseFloat(coord, `startPosition[${i}]`));

  const lastCommand = commands[commands.length - 1];
  if (!lastCommand || lastCommand.length < 2) {
    throw new Error('Path last command is malformed');
  }

  const endPosition = lastCommand
    .substring(1)
    .split(',')
    .map((coord, i) => safeParseFloat(coord, `endPosition[${i}]`));

  const rawPoints = commands.map((command, cmdIndex) => {
    const coords = command
      .substring(1)
      .split(',')
      .map((coord, i) => safeParseFloat(coord, `command[${cmdIndex}][${i}]`));
    return { x: coords[0], y: coords[1] };
  });

  const reflectionPoints = rawPoints
    .filter((point, index, array) => {
      if (index === 0 || index === array.length - 1) {
        return true;
      }

      if (point.x === array[index - 1].x && point.y === array[index - 1].y) {
        return false;
      }

      if (
        index === array.length - 2 &&
        (array[index - 1].x === point.x || array[index - 1].y === point.y)
      ) {
        const lastPoint = array[array.length - 1];
        const distance = Math.hypot(
          lastPoint.x - point.x,
          lastPoint.y - point.y
        );
        return distance > 20;
      }

      return point.x !== array[index - 1].x || point.y !== array[index - 1].y;
    })
    .map((p) => ({
      x: p.x + offset.x,
      y: p.y + offset.y,
    }));

  return {
    startX: startPosition[0] + offset.x,
    startY: startPosition[1] + offset.y,
    endX: endPosition[0] + offset.x,
    endY: endPosition[1] + offset.y,
    reflectionPoints,
  };
}

export { extractPathPoints, filterRedundantPoints } from './path';
