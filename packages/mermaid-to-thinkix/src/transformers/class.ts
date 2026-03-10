import type {
  MermaidClassData,
  MermaidToBoardResult,
  ClassNode,
  ClassContainer,
  ClassLine,
  ClassText,
  ClassArrow,
  ExtendedPlaitElement,
} from '../types';
import type { PlaitElement, PlaitGroup, Point } from '@plait/core';
import {
  createArrowLineElement,
  createGeometryElement,
  ArrowLineShape,
  ArrowLineMarkerType,
  BasicShapes,
  ArrowLineText,
  PlaitCommonGeometry,
} from '@plait/draw';
import { createGroup, RectangleClient } from '@plait/core';
import { buildText, StrokeStyle, measureElement, DEFAULT_FONT_FAMILY } from '@plait/common';

const PLAIT_DEFAULT_FONT_SIZE = 16;

type ArrowLineStyle = {
  strokeWidth: number;
  strokeColor: string;
  strokeStyle?: StrokeStyle;
  textHeight?: number;
};

function mapArrowhead(
  arrowhead: ClassArrow['startArrowhead'] | ClassArrow['endArrowhead'] | undefined
): ArrowLineMarkerType {
  return arrowhead ? ArrowLineMarkerType.arrow : ArrowLineMarkerType.none;
}

export async function transformClassToBoard(
  data: MermaidClassData
): Promise<MermaidToBoardResult> {
  const elements: PlaitElement[] = [];
  const warnings: string[] = [...(data.warnings || [])];
  const mermaidIdToElementMap: Record<string, PlaitElement> = {};
  const mermaidGroupIdToElementMap: Record<string, PlaitGroup> = {};

  const origins = new WeakMap<PlaitElement, ClassNode>();

  for (const nodeArray of data.nodes) {
    for (const node of nodeArray) {
      const element = transformNode(node, mermaidGroupIdToElementMap, warnings);
      if (element) {
        origins.set(element, node);
        if ('id' in node && node.id) {
          mermaidIdToElementMap[node.id] = element;
        }
        elements.push(element);
      }
    }
  }

  for (const line of data.lines) {
    const element = transformLine(line, mermaidGroupIdToElementMap);
    if (element) {
      origins.set(element, line);
      elements.push(element);
    }
  }

  for (const arrow of data.arrows) {
    const element = transformArrow(arrow, mermaidIdToElementMap, mermaidGroupIdToElementMap, warnings);
    if (element) {
      origins.set(element, arrow);
      elements.push(element);
    }
  }

  for (const text of data.text) {
    const element = transformText(text, mermaidGroupIdToElementMap);
    if (element) {
      origins.set(element, text);
      elements.push(element);
    }
  }

  if (data.namespaces && data.namespaces.length > 0) {
    for (const namespace of data.namespaces) {
      const classIds = Object.keys(namespace.classes);
      if (classIds.length === 0) continue;

      const childrenElements = elements.filter((ele) => {
        const origin = origins.get(ele);
        if (!origin) return false;

        if ('metadata' in origin && origin.metadata?.classId) {
          return classIds.includes(origin.metadata.classId);
        }

        return false;
      });

      if (childrenElements.length === 0) continue;

      const groupElements = transformNamespace(childrenElements as PlaitCommonGeometry[], namespace.id);
      elements.unshift(...groupElements);
    }
  }

  for (const element of elements) {
    const extendedElement = element as ExtendedPlaitElement;
    if (extendedElement.origin) {
      delete extendedElement.origin;
    }
  }

  Object.values(mermaidGroupIdToElementMap).forEach((groupElement) => {
    elements.push(groupElement);
  });

  return { elements, warnings };
}

function transformNode(
  node: ClassNode,
  groupMap: Record<string, PlaitGroup>,
  warnings: string[] = []
): PlaitElement | null {
  switch (node.type) {
    case 'rectangle':
    case 'ellipse':
      return transformContainer(node, groupMap);
    case 'text':
      return transformText(node, groupMap);
    case 'line':
      return transformLine(node, groupMap);
    case 'arrow':
      return transformArrowWithoutBinding(node, groupMap, warnings);
    default:
      return null;
  }
}

function transformContainer(
  container: ClassContainer,
  groupMap: Record<string, PlaitGroup>
): PlaitElement | null {
  const styleOptions = {
    strokeStyle:
      container.strokeStyle === 'dashed' ? StrokeStyle.dashed : StrokeStyle.solid,
    strokeWidth: container.strokeWidth || 1,
    strokeColor: container.strokeColor || '#000',
    fill: container.bgColor || '#ECECFF',
  };

  const textStyle = container.label ? buildText(container.label.text, undefined) : '';

  const textSize = measureElement(null, textStyle || buildText('', undefined), {
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: PLAIT_DEFAULT_FONT_SIZE,
  });

  const containerWidth = container.width || textSize.width + 20;
  const containerHeight = container.height || textSize.height + 10;

  const element = createGeometryElement(
    container.type === 'ellipse' ? BasicShapes.ellipse : BasicShapes.rectangle,
    RectangleClient.getPoints({
      x: container.x,
      y: container.y,
      width: containerWidth,
      height: containerHeight,
    }),
    textStyle,
    styleOptions,
  );

  (element as { textHeight?: number }).textHeight = textSize.height;

  if (container.metadata) {
    (element as ExtendedPlaitElement).metadata = container.metadata;
  }

  if (container.groupId) {
    let groupElement = groupMap[container.groupId];
    if (!groupElement) {
      groupElement = createGroup();
      groupMap[container.groupId] = groupElement;
    }
    element.groupId = groupElement.id;
  }

  return element;
}

function transformLine(
  line: ClassLine,
  groupMap: Record<string, PlaitGroup>
): PlaitElement | null {
  const points: [Point, Point] = [
    [line.startX, line.startY],
    [line.endX, line.endY],
  ];

  const element = createArrowLineElement(
    ArrowLineShape.straight,
    points,
    { marker: ArrowLineMarkerType.none },
    { marker: ArrowLineMarkerType.none },
    [],
    {
      strokeWidth: line.strokeWidth || 1,
      strokeColor: line.strokeColor || '#000',
    }
  );

  if (line.metadata) {
    (element as ExtendedPlaitElement).metadata = line.metadata;
  }

  if (line.groupId) {
    let groupElement = groupMap[line.groupId];
    if (!groupElement) {
      groupElement = createGroup();
      groupMap[line.groupId] = groupElement;
    }
    element.groupId = groupElement.id;
  }

  return element;
}

function transformText(
  text: ClassText,
  groupMap: Record<string, PlaitGroup>
): PlaitElement | null {
  const textContent = buildText(text.text, undefined);

  const textSize = measureElement(null, textContent, {
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: PLAIT_DEFAULT_FONT_SIZE,
  });

  const textRectangle = RectangleClient.getRectangleByCenterPoint(
    [text.x + textSize.width / 2, text.y],
    textSize.width,
    textSize.height
  );

  const element = createGeometryElement(
    BasicShapes.text,
    RectangleClient.getPoints(textRectangle),
    textContent,
  );

  (element as { textHeight?: number }).textHeight = textSize.height;

  if (text.groupId) {
    let groupElement = groupMap[text.groupId];
    if (!groupElement) {
      groupElement = createGroup();
      groupMap[text.groupId] = groupElement;
    }
    element.groupId = groupElement.id;
  }

  return element;
}

function transformArrowWithoutBinding(
  arrow: ClassArrow,
  groupMap: Record<string, PlaitGroup>,
  warnings: string[] = []
): PlaitElement | null {
  const startX = arrow.startX ?? 0;
  const startY = arrow.startY ?? 0;
  const endX = arrow.endX ?? 0;
  const endY = arrow.endY ?? 0;

  const isValidCoordinate = (value: number) => typeof value === 'number' && !isNaN(value) && isFinite(value);
  if (!isValidCoordinate(startX) || !isValidCoordinate(startY) ||
      !isValidCoordinate(endX) || !isValidCoordinate(endY)) {
    warnings.push(`Class arrow with invalid coordinates was skipped: ${JSON.stringify({ startX, startY, endX, endY })}`);
    return null;
  }

  if (startX === endX && startY === endY) {
    warnings.push('Class arrow has zero length, skipping');
    return null;
  }

  let points: Point[];
  if (arrow.points && arrow.points.length > 0) {
    points = arrow.points as Point[];
  } else {
    points = [[startX, startY], [endX, endY]];
  }

  const allPointsValid = points.every(p => isValidCoordinate(p[0]) && isValidCoordinate(p[1]));
  if (!allPointsValid) {
    warnings.push('Class arrow had invalid points, using default start/end');
    points = [[startX, startY], [endX, endY]];
  }

  const arrowShape = points.length > 2 ? ArrowLineShape.curve : ArrowLineShape.straight;

  const texts: ArrowLineText[] = [];
  if (arrow.label) {
    const textValue = buildText(arrow.label.text, undefined);
    texts.push({
      position: 0.5,
      text: textValue,
    });
  }

  const element = createArrowLineElement(
    arrowShape,
    [...points] as [Point, Point],
    { marker: mapArrowhead(arrow.startArrowhead) },
    { marker: mapArrowhead(arrow.endArrowhead) },
    texts,
    {
      strokeWidth: arrow.strokeWidth || 1,
      strokeColor: (arrow.strokeColor && arrow.strokeColor !== 'none' && arrow.strokeColor !== '') ? arrow.strokeColor : '#000',
      ...(arrow.strokeStyle === 'dotted' ? { strokeStyle: StrokeStyle.dotted } : {}),
    } satisfies ArrowLineStyle
  );

  if ('groupId' in arrow && arrow.groupId) {
    let groupElement = groupMap[arrow.groupId as string];
    if (!groupElement) {
      groupElement = createGroup();
      groupMap[arrow.groupId as string] = groupElement;
    }
    element.groupId = groupElement.id;
  }

  return element;
}

function transformArrow(
  arrow: ClassArrow,
  _elementMap: Record<string, PlaitElement>,
  groupMap: Record<string, PlaitGroup>,
  warnings: string[] = []
): PlaitElement | null {
  // TODO: elementMap is reserved for future element binding functionality
  // Currently, arrows are created without binding to their source/target elements
  const element = transformArrowWithoutBinding(arrow, groupMap, warnings);
  if (!element) return null;

  return element;
}
  
function transformNamespace(
  childrenElements: PlaitCommonGeometry[],
  name: string
): PlaitElement[] {
  const childrenRectangles = childrenElements.map((ele) =>
    RectangleClient.getRectangleByPoints(ele.points!)
  );

  if (childrenRectangles.length === 0) return [];

  const boundingRectangle = RectangleClient.getBoundingRectangle(childrenRectangles);
  const PADDING = 60;
  const namespaceRectangle = RectangleClient.inflate(boundingRectangle, PADDING);

  const containerElement = createGeometryElement(
    BasicShapes.rectangle,
    RectangleClient.getPoints(namespaceRectangle),
    '',
    { strokeWidth: 1 }
  );

  const slateTextElement = buildText(name, undefined);
  const textSize = measureElement(null, slateTextElement, {
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: PLAIT_DEFAULT_FONT_SIZE,
  });

  const textPoints = RectangleClient.getPoints(
    RectangleClient.getRectangleByCenterPoint(
      [namespaceRectangle.x + namespaceRectangle.width / 2, namespaceRectangle.y + 4 + textSize.height / 2],
      textSize.width,
      textSize.height
    )
  );

  const textElement = createGeometryElement(BasicShapes.text, textPoints, slateTextElement);

  return [textElement, containerElement];
}
