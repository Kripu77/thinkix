import { entityCodesToText } from './utils';
import { DEFAULT_FONT_SIZE } from './constants';
import type {
  SequenceContainer,
  SequenceLine,
  SequenceText,
  SequenceArrow,
  ClassContainer,
  ClassLine,
  ClassText,
  ClassArrow,
} from './types';
import { StrokeStyle } from '@plait/common';
import { assertSVGGraphicsElement } from './dom-guards';

export function createSequenceArrowFromSVG(
  arrowNode: SVGLineElement | SVGPathElement,
  opts?: {
    label?: string;
    strokeStyle?: StrokeStyle;
    startArrowhead?: SequenceArrow['startArrowhead'];
    endArrowhead?: SequenceArrow['endArrowhead'];
  }
): SequenceArrow {
  const arrow: SequenceArrow = {
    type: 'arrow',
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  };

  if (opts?.label) {
    arrow.label = { text: entityCodesToText(opts.label), fontSize: DEFAULT_FONT_SIZE };
  }

  const tagName = arrowNode.tagName;
  if (tagName === 'line') {
    arrow.startX = Number(arrowNode.getAttribute('x1'));
    arrow.startY = Number(arrowNode.getAttribute('y1'));
    arrow.endX = Number(arrowNode.getAttribute('x2'));
    arrow.endY = Number(arrowNode.getAttribute('y2'));
  } else if (tagName === 'path') {
    const dAttr = arrowNode.getAttribute('d');
    if (!dAttr) {
      throw new Error('Path element does not contain a "d" attribute');
    }

    const commands = dAttr.split(/(?=[LC])/);

    const startPosition = commands[0]
      .substring(1)
      .split(',')
      .map((coord) => parseFloat(coord));

    arrow.startX = startPosition[0];
    arrow.startY = startPosition[1];

    const points: number[][] = [[startPosition[0], startPosition[1]]];
    commands.forEach((command) => {
      const currPoints = command
        .substring(1)
        .trim()
        .split(' ')
        .map((pos) => {
          const [x, y] = pos.split(',');
          return [parseFloat(x), parseFloat(y)];
        });
      points.push(...currPoints);
    });

    const endPosition = points[points.length - 1];
    arrow.endX = endPosition[0];
    arrow.endY = endPosition[1];
    arrow.points = points;
  }

  if (opts?.label) {
    const offset = 10;
    arrow.startY = arrow.startY - offset;
    arrow.endY = arrow.endY - offset;
  }

  arrow.strokeColor = arrowNode.getAttribute('stroke') || undefined;
  arrow.strokeWidth = Number(arrowNode.getAttribute('stroke-width')) || undefined;
  arrow.strokeStyle = (opts?.strokeStyle || StrokeStyle.solid) as SequenceArrow['strokeStyle'];
  arrow.startArrowhead = opts?.startArrowhead || null;
  arrow.endArrowhead = opts?.endArrowhead || null;

  return arrow;
}


export function createContainerFromSVG(
  node: SVGSVGElement | SVGRectElement,
  shape: SequenceContainer['type'],
  opts: {
    id?: string;
    label?: { text: string };
    subtype?: SequenceContainer['subtype'];
    groupId?: string;
  } = {}
): SequenceContainer {
  const container: SequenceContainer = {
    type: shape,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  assertSVGGraphicsElement(node, `Expected SVGGraphicsElement but got ${node.tagName}`);

  const boundingBox = node.getBBox();
  container.x = boundingBox.x;
  container.y = boundingBox.y;
  container.width = boundingBox.width;
  container.height = boundingBox.height;
  container.id = opts.id;
  container.groupId = opts.groupId;
  container.subtype = opts.subtype;

  if (opts.label) {
    container.label = {
      text: entityCodesToText(opts.label.text),
      fontSize: DEFAULT_FONT_SIZE,
    };
  }

  if (opts.subtype === 'note') {
    container.strokeStyle = 'dashed';
  }

  const bgColor = node.getAttribute('fill');
  if (bgColor && opts.subtype === 'highlight') {
    container.bgColor = bgColor;
  }

  return container;
}

/**
 * Creates a line skeleton from SVG
 */
export function createLineFromSVG(
  lineNode: SVGLineElement,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  opts?: { groupId?: string; id?: string }
): SequenceLine {
  const line: SequenceLine = {
    type: 'line',
    startX,
    startY,
    endX,
    endY,
    strokeColor: lineNode.getAttribute('stroke') || undefined,
    strokeWidth: Number(lineNode.getAttribute('stroke-width')) || undefined,
    id: opts?.id,
    groupId: opts?.groupId,
  };
  return line;
}

/**
 * Creates a text skeleton from SVG text element
 */
export function createTextFromSVG(
  textNode: SVGTextElement,
  text: string,
  opts?: { groupId?: string; id?: string }
): SequenceText {
  const x = Number(textNode.getAttribute('x'));
  const y = Number(textNode.getAttribute('y'));
  const boundingBox = textNode.getBBox();

  return {
    type: 'text',
    text: entityCodesToText(text),
    x: x - boundingBox.width / 2,
    y,
    width: boundingBox.width,
    height: boundingBox.height,
    fontSize: parseInt(getComputedStyle(textNode).fontSize, 10) || DEFAULT_FONT_SIZE,
    id: opts?.id,
    groupId: opts?.groupId,
  };
}

/**
 * Creates a standalone text element
 */
export function createText(
  x: number,
  y: number,
  text: string,
  opts?: {
    id?: string;
    width?: number;
    height?: number;
    fontSize?: number;
    groupId?: string;
  }
): SequenceText {
  return {
    type: 'text',
    x,
    y,
    text,
    width: opts?.width || 20,
    height: opts?.height || 20,
    fontSize: opts?.fontSize || DEFAULT_FONT_SIZE,
    id: opts?.id,
    groupId: opts?.groupId,
  };
}

export function createClassArrow(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  opts?: {
    id?: string;
    label?: { text: string };
    strokeColor?: string;
    strokeStyle?: ClassArrow['strokeStyle'];
    startArrowhead?: ClassArrow['startArrowhead'];
    endArrowhead?: ClassArrow['endArrowhead'];
    start?: ClassArrow['start'];
    end?: ClassArrow['end'];
    points?: number[][];
  }
): ClassArrow {
  const arrow: ClassArrow = {
    type: 'arrow',
    startX,
    startY,
    endX,
    endY,
    ...opts,
  };
  return arrow;
}

/**
 * Creates a container skeleton for class diagrams
 */
export function createClassContainerFromSVG(
  node: SVGSVGElement | SVGRectElement,
  type: ClassContainer['type'],
  opts: {
    id?: string;
    label?: { text: string };
    subtype?: ClassContainer['subtype'];
    groupId?: string;
  } = {}
): ClassContainer {
  const container: ClassContainer = {
    type,
    x: 0,
    y: 0,
  };

  assertSVGGraphicsElement(node, `Expected SVGGraphicsElement but got ${node.tagName}`);

  const boundingBox = node.getBBox();
  container.x = boundingBox.x;
  container.y = boundingBox.y;
  container.width = boundingBox.width;
  container.height = boundingBox.height;
  container.id = opts.id;
  container.groupId = opts.groupId;
  container.subtype = opts.subtype;

  if (opts.label) {
    container.label = {
      text: entityCodesToText(opts.label.text),
      fontSize: DEFAULT_FONT_SIZE,
    };
  }

  if (opts.subtype === 'note') {
    container.strokeStyle = 'dashed';
  }

  return container;
}

/**
 * Creates a line skeleton for class diagrams
 */
export function createClassLineFromSVG(
  lineNode: SVGLineElement,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  opts?: { groupId?: string; id?: string }
): ClassLine {
  const line: ClassLine = {
    type: 'line',
    startX,
    startY,
    endX,
    endY,
    strokeColor: lineNode.getAttribute('stroke') || undefined,
    strokeWidth: Number(lineNode.getAttribute('stroke-width')) || undefined,
    id: opts?.id,
    groupId: opts?.groupId,
  };
  return line;
}

/**
 * Creates a text skeleton for class diagrams
 */
export function createClassText(
  x: number,
  y: number,
  text: string,
  opts?: {
    id?: string;
    width?: number;
    height?: number;
    fontSize?: number;
    groupId?: string;
  }
): ClassText {
  return {
    type: 'text',
    x,
    y,
    text,
    width: opts?.width || 20,
    height: opts?.height || 20,
    fontSize: opts?.fontSize || DEFAULT_FONT_SIZE,
    id: opts?.id,
    groupId: opts?.groupId,
  };
}
