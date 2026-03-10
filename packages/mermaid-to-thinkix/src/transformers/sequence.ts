import type {
  MermaidSequenceData,
  MermaidToBoardResult,
  SequenceNode,
  SequenceContainer,
  SequenceLine,
  SequenceText,
  SequenceArrow,
} from '../types';
import type { PlaitElement, PlaitGroup, Point } from '@plait/core';
import type { PlaitShapeElement } from '@plait/draw';
import {
  createArrowLineElement,
  createGeometryElement,
  ArrowLineShape,
  ArrowLineMarkerType,
  BasicShapes,
  ArrowLineText,
} from '@plait/draw';
import { createGroup, RectangleClient } from '@plait/core';
import { buildText, StrokeStyle, measureElement, DEFAULT_FONT_FAMILY } from '@plait/common';

const PLAIT_DEFAULT_FONT_SIZE = 16;

type ArrowLineStyle = {
  strokeWidth: number;
  strokeColor: string;
  strokeStyle?: StrokeStyle;
};

export async function transformSequenceToBoard(
  data: MermaidSequenceData
): Promise<MermaidToBoardResult> {
  const elements: PlaitElement[] = [];
  const warnings: string[] = [...(data.warnings || [])];
  const mermaidGroupIdToElementMap: Record<string, PlaitGroup> = {};

  for (const nodeArray of data.nodes) {
    for (const node of nodeArray) {
      const element = transformNode(node, mermaidGroupIdToElementMap);
      if (element) {
        elements.push(element);
      }
    }
  }

  for (const line of data.lines) {
    const element = transformLine(line, mermaidGroupIdToElementMap);
    if (element) {
      elements.push(element);
    }
  }

  const activations: PlaitElement[] = [];
  for (const arrow of data.arrows) {
    const result = transformArrow(arrow, mermaidGroupIdToElementMap, warnings);
    if (result) {
      if (arrow.sequenceNumber) {
        const seqNum = transformNode(arrow.sequenceNumber, mermaidGroupIdToElementMap);
        if (seqNum) {
          activations.push(seqNum);
        }
      }
      elements.push(result);
    }
  }

  if (data.loops) {
    const { lines, texts, nodes } = data.loops;

    for (const line of lines) {
      const element = transformLine(line, mermaidGroupIdToElementMap);
      if (element) {
        elements.push(element);
      }
    }

    for (const text of texts) {
      const element = transformText(text, mermaidGroupIdToElementMap);
      if (element) {
        elements.push(element);
      }
    }

    for (const node of nodes) {
      const element = transformNode(node, mermaidGroupIdToElementMap);
      if (element) {
        elements.push(element);
      }
    }
  }

  elements.push(...activations);

  if (data.groups) {
    const actorToElementsMap = new Map<string, PlaitElement[]>();

    for (const ele of elements) {
      const element = ele as PlaitShapeElement & { origin?: SequenceNode };
      if (element.origin && 'id' in element.origin && element.origin.id) {
        const hyphenIndex = element.origin.id.indexOf('-');
        const id = element.origin.id.substring(0, hyphenIndex > 0 ? hyphenIndex : element.origin.id.length);

        if (!actorToElementsMap.has(id)) {
          actorToElementsMap.set(id, []);
        }
        actorToElementsMap.get(id)!.push(ele);
      }
    }

    const actorKeysSets = new Map<string, Set<string>>();
    for (const group of data.groups) {
      actorKeysSets.set(group.name, new Set(group.actorKeys));
    }

    for (const group of data.groups) {
      const { name } = group;
      const actorKeysSet = actorKeysSets.get(name);
      if (!actorKeysSet || actorKeysSet.size === 0) continue;

      const actors: PlaitElement[] = [];
      for (const [actorId, actorElements] of actorToElementsMap) {
        if (actorKeysSet.has(actorId)) {
          actors.push(...actorElements);
        }
      }

      if (actors.length === 0) continue;

      const groupElements = transformGroup(actors as PlaitShapeElement[], name, {
        fill: group.fill,
      });

      elements.unshift(...groupElements);
    }
  }

  Object.values(mermaidGroupIdToElementMap).forEach((groupElement) => {
    elements.push(groupElement);
  });

  return { elements, warnings };
}

function transformNode(
  node: SequenceNode,
  groupMap: Record<string, PlaitGroup>
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
      return transformArrow(node, groupMap);
    default:
      return null;
  }
}

function transformContainer(
  container: SequenceContainer,
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
  const textElement = createGeometryElement(
    container.type === 'ellipse' ? BasicShapes.ellipse : BasicShapes.rectangle,
    RectangleClient.getPoints({
      x: container.x,
      y: container.y,
      width: container.width || 100,
      height: container.height || 50,
    }),
    textStyle,
    styleOptions
  );

  if (container.groupId) {
    let groupElement = groupMap[container.groupId];
    if (!groupElement) {
      groupElement = createGroup();
      groupMap[container.groupId] = groupElement;
    }
    textElement.groupId = groupElement.id;
  }

  return textElement;
}

function transformLine(
  line: SequenceLine,
  groupMap: Record<string, PlaitGroup>
): PlaitElement | null {
  const points: [Point, Point] = [
    [line.startX, line.startY],
    [line.endX, line.endY],
  ];

  const arrowElement = createArrowLineElement(
    ArrowLineShape.straight,
    points,
    { marker: ArrowLineMarkerType.none },
    { marker: ArrowLineMarkerType.none },
    [],
    {
      strokeWidth: line.strokeWidth || 2,
      strokeColor: line.strokeColor || '#000',
      ...(line.strokeStyle ? { strokeStyle: line.strokeStyle as StrokeStyle } : {}),
    } satisfies ArrowLineStyle
  );

  if (line.groupId) {
    let groupElement = groupMap[line.groupId];
    if (!groupElement) {
      groupElement = createGroup();
      groupMap[line.groupId] = groupElement;
    }
    arrowElement.groupId = groupElement.id;
  }

  return arrowElement;
}

function transformText(
  text: SequenceText,
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

  const textElement = createGeometryElement(
    BasicShapes.text,
    RectangleClient.getPoints(textRectangle),
    textContent
  );

  if (text.groupId) {
    let groupElement = groupMap[text.groupId];
    if (!groupElement) {
      groupElement = createGroup();
      groupMap[text.groupId] = groupElement;
    }
    textElement.groupId = groupElement.id;
  }

  return textElement;
}

function transformArrow(
  arrow: SequenceArrow,
  groupMap: Record<string, PlaitGroup>,
  warnings: string[] = []
): PlaitElement | null {
  const isValidCoordinate = (value: number) => typeof value === 'number' && !isNaN(value) && isFinite(value);
  if (!isValidCoordinate(arrow.startX) || !isValidCoordinate(arrow.startY) ||
      !isValidCoordinate(arrow.endX) || !isValidCoordinate(arrow.endY)) {
    warnings.push(`Arrow with invalid coordinates was skipped: ${JSON.stringify(arrow)}`);
    return null;
  }

  let points: Point[];
  if (arrow.points && arrow.points.length > 0) {
    points = arrow.points as Point[];
  } else {
    points = [[arrow.startX, arrow.startY], [arrow.endX, arrow.endY]];
  }

  const allPointsValid = points.every(p => isValidCoordinate(p[0]) && isValidCoordinate(p[1]));
  if (!allPointsValid) {
    warnings.push('Arrow had invalid points, using default start/end');
    points = [[arrow.startX, arrow.startY], [arrow.endX, arrow.endY]];
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

  const arrowElement = createArrowLineElement(
    arrowShape,
    [...points] as [Point, Point],
    {
      marker:
        arrow.endArrowhead === 'arrow'
          ? ArrowLineMarkerType.arrow
          : ArrowLineMarkerType.none,
    },
    {
      marker:
        arrow.startArrowhead === 'arrow'
          ? ArrowLineMarkerType.arrow
          : ArrowLineMarkerType.none,
    },
    texts,
    {
      strokeWidth: arrow.strokeWidth || 1,
      strokeColor: (arrow.strokeColor && arrow.strokeColor !== 'none' && arrow.strokeColor !== '') ? arrow.strokeColor : '#000',
      ...(arrow.strokeStyle ? { strokeStyle: arrow.strokeStyle as StrokeStyle } : {}),
    } satisfies ArrowLineStyle
  );

  if ('groupId' in arrow && arrow.groupId) {
    let groupElement = groupMap[arrow.groupId as string];
    if (!groupElement) {
      groupElement = createGroup();
      groupMap[arrow.groupId as string] = groupElement;
    }
    arrowElement.groupId = groupElement.id;
  }

  return arrowElement;
}
  
function transformGroup(
  children: PlaitShapeElement[],
  name: string,
  options: { fill?: string }
): PlaitElement[] {
  const childrenRectangles = children.map((ele) =>
    RectangleClient.getRectangleByPoints(ele.points!)
  );

  if (childrenRectangles.length === 0) return [];

  const boundingRectangle = RectangleClient.getBoundingRectangle(childrenRectangles);
  const PADDING = 60;
  const groupRectangle = RectangleClient.inflate(boundingRectangle, PADDING);

  const containerElement = createGeometryElement(
    BasicShapes.rectangle,
    RectangleClient.getPoints(groupRectangle),
    '',
    { strokeWidth: 1, fill: options.fill || '#f0f0f0' }
  );

  const slateTextElement = buildText(name, undefined);
  const textSize = measureElement(null, slateTextElement, {
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: PLAIT_DEFAULT_FONT_SIZE,
  });

  const textPoints = RectangleClient.getPoints(
    RectangleClient.getRectangleByCenterPoint(
      [groupRectangle.x + groupRectangle.width / 2, groupRectangle.y + 4 + textSize.height / 2],
      textSize.width,
      textSize.height
    )
  );

  const textElement = createGeometryElement(BasicShapes.text, textPoints, slateTextElement);

  const groupElement = createGroup();
  containerElement.groupId = groupElement.id;
  textElement.groupId = groupElement.id;

  children.forEach((child) => {
    const isInContainer = RectangleClient.isPointInRectangle(
      groupRectangle,
      child.points![0] as [number, number]
    ) && RectangleClient.isPointInRectangle(groupRectangle, child.points![2] as [number, number]);

    if (isInContainer) {
      child.groupId = groupElement.id;
    }
  });

  return [textElement, containerElement, groupElement];
}
