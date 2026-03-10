import type {
  MermaidFlowchartData,
  MermaidVertexWithGeometry,
  MermaidEdgeWithPath,
  MermaidToBoardResult,
  MermaidPlaitShapeElement,
} from '../types';
import {
  DEFAULT_VERTEX_STYLE,
  DEFAULT_SUBGRAPH_STYLE,
  DEFAULT_ARROW_STYLE,
} from '../constants';
import { cleanText, removeMarkdown, removeFontAwesomeIcons } from '../utils';
import {
  createGeometryElement,
  BasicShapes,
  createArrowLineElement,
  ArrowLineShape,
  ArrowLineMarkerType,
  ArrowLineHandle,
  ArrowLineText,
  PlaitShapeElement,
} from '@plait/draw';
import { createGroup, type PlaitElement, type Point, RectangleClient } from '@plait/core';
import { buildText, StrokeStyle, CustomText, measureElement, DEFAULT_FONT_FAMILY } from '@plait/common';

type ExtendedPlaitShapeElement = PlaitShapeElement & MermaidPlaitShapeElement;

export interface ThinkixConfig {
  fontSize: number;
}

const PLAIT_DEFAULT_FONT_SIZE = 16;
const DEFAULT_LINE_WIDTH = 2;


const VERTEX_TYPE = {
  ROUND: 'round',
  STADIUM: 'stadium',
  SUBROUTINE: 'subroutine',
  CYLINDER: 'cylinder',
  CIRCLE: 'circle',
  DOUBLECIRCLE: 'doublecircle',
  DIAMOND: 'diamond',
  HEXAGON: 'hexagon',
  PARALLELOGRAM: 'parallelogram',
  TRAPEZOID: 'trapezoid',
  RECT: 'rect',
} as const;

function getText(element: MermaidVertexWithGeometry | MermaidEdgeWithPath): string {
  let text = element.text || '';
  if (element.labelType === 'markdown') {
    text = removeMarkdown(text);
  }

  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/\\n/g, '\n');
  text = text.replace(/<\/?(sub|small|i)>/gi, '');

  return removeFontAwesomeIcons(text);
}

function computeVertexStyle(
  containerStyle: MermaidVertexWithGeometry['containerStyle']
): Partial<ExtendedPlaitShapeElement> {
  const style: Partial<ExtendedPlaitShapeElement> = {};

  if (containerStyle?.fill) {
    style.fill = containerStyle.fill;
  }

  if (containerStyle?.stroke) {
    style.strokeColor = containerStyle.stroke;
  }

  if (containerStyle?.strokeWidth) {
    style.strokeWidth = Number(containerStyle.strokeWidth);
  }

  if (containerStyle?.strokeDasharray) {
    style.strokeStyle = StrokeStyle.dashed;
  }

  return style;
}

function computeTextStyle(
  labelStyle: MermaidVertexWithGeometry['labelStyle']
): Partial<CustomText> {
  const textStyle: Partial<CustomText> = {};

  if (labelStyle?.color) {
    textStyle.color = labelStyle.color;
  }

  return textStyle;
}

function getArrowMarkerType(
  edgeType: string
): { source: ArrowLineHandle; target: ArrowLineHandle } {
  const markerMap: Record<string, { source: ArrowLineHandle; target: ArrowLineHandle }> = {
    arrow_point: {
      source: { marker: ArrowLineMarkerType.none },
      target: { marker: ArrowLineMarkerType.arrow },
    },
    arrow_circle: {
      source: { marker: ArrowLineMarkerType.none },
      target: { marker: ArrowLineMarkerType.arrow },
    },
    arrow_cross: {
      source: { marker: ArrowLineMarkerType.none },
      target: { marker: ArrowLineMarkerType.arrow },
    },
    arrow_open: {
      source: { marker: ArrowLineMarkerType.none },
      target: { marker: ArrowLineMarkerType.none },
    },
    double_arrow_point: {
      source: { marker: ArrowLineMarkerType.arrow },
      target: { marker: ArrowLineMarkerType.arrow },
    },
    double_arrow_circle: {
      source: { marker: ArrowLineMarkerType.arrow },
      target: { marker: ArrowLineMarkerType.arrow },
    },
    double_arrow_cross: {
      source: { marker: ArrowLineMarkerType.arrow },
      target: { marker: ArrowLineMarkerType.arrow },
    },
  };

  return markerMap[edgeType] || markerMap.arrow_point;
}

function getRectangleByMermaidElement(
  element: MermaidVertexWithGeometry | { x: number; y: number; width: number; height: number }
): { x: number; y: number; width: number; height: number } {
  return element;
}

interface GroupMapping {
  getGroupIds: (elementId: string) => string[];
  getParentId: (elementId: string) => string | null;
}

function buildGroupHierarchy(
  data: MermaidFlowchartData
): GroupMapping {
  const tree: {
    [key: string]: {
      id: string;
      parent: string | null;
      isLeaf: boolean;
    };
  } = {};

  for (const subGraph of data.subgraphs) {
    for (const nodeId of subGraph.nodeIds) {
      tree[subGraph.id] = {
        id: subGraph.id,
        parent: null,
        isLeaf: false,
      };
      tree[nodeId] = {
        id: nodeId,
        parent: subGraph.id,
        isLeaf: data.vertices[nodeId] !== undefined,
      };
    }
  }

  const mapper: { [key: string]: string[] } = {};

  for (const id of [
    ...Object.keys(data.vertices),
    ...data.subgraphs.map((c) => c.id),
  ]) {
    if (!tree[id]) {
      continue;
    }

    let curr = tree[id];
    const groupIds: string[] = [];

    if (!curr.isLeaf) {
      groupIds.push(`subgraph_group_${curr.id}`);
    }

    while (true) {
      if (curr.parent) {
        groupIds.push(`subgraph_group_${curr.parent}`);
        curr = tree[curr.parent];
      } else {
        break;
      }
    }

    mapper[id] = groupIds;
  }

  return {
    getGroupIds: (elementId) => mapper[elementId] || [],
    getParentId: (elementId) => tree[elementId]?.parent || null,
  };
}

export async function transformFlowchartToBoard(
  data: MermaidFlowchartData,
  _config: ThinkixConfig = { fontSize: 16 }
): Promise<MermaidToBoardResult> {
  const elements: PlaitElement[] = [];
  const warnings: string[] = [...(data.warnings || [])];

  const validVertices: Record<string, MermaidVertexWithGeometry> = {};
  for (const [id, vertex] of Object.entries(data.vertices)) {
    if (!vertex) continue;
    if (!isFinite(vertex.x) || !isFinite(vertex.y) ||
        !isFinite(vertex.width) || !isFinite(vertex.height) ||
        vertex.width <= 0 || vertex.height <= 0) {
      warnings.push(`Vertex ${id} has invalid geometry`);
      continue;
    }
    validVertices[id] = vertex;
  }

  const filteredData = { ...data, vertices: validVertices };

  const mermaidIdToElementMap: Record<string, PlaitElement> = {};
  const mermaidGroupIdToElementMap: Record<string, PlaitElement> = {};

  const { getGroupIds, getParentId } = buildGroupHierarchy(filteredData);

  for (const subGraph of data.subgraphs.reverse()) {
    const groupIds = getGroupIds(subGraph.id);

    groupIds.forEach((groupId, index) => {
      if (!mermaidGroupIdToElementMap[groupId]) {
        const groupElement = createGroup();
        mermaidGroupIdToElementMap[groupId] = groupElement;
      }
      if (index > 0 && mermaidGroupIdToElementMap[groupId]) {
        const childGroup = mermaidGroupIdToElementMap[groupIds[index - 1]];
        childGroup.groupId = mermaidGroupIdToElementMap[groupId].id;
      }
    });

    const text = buildText(cleanText(subGraph.title), undefined);
    const textSize = measureElement(null, text, {
      fontSize: PLAIT_DEFAULT_FONT_SIZE,
      fontFamily: DEFAULT_FONT_FAMILY,
    });
    const textHeight = textSize.height || 20;
    const textWidth = textSize.width || 100;

    const titlePoints = RectangleClient.getPoints(
      RectangleClient.getRectangleByCenterPoint(
        [
          subGraph.x + subGraph.width / 2,
          subGraph.y + 4 + textHeight / 2,
        ],
        textWidth,
        textHeight
      )
    );

    const textElement = createGeometryElement(
      BasicShapes.text,
      titlePoints,
      text
    );

    const containerElement = createGeometryElement(
      BasicShapes.rectangle,
      RectangleClient.getPoints(getRectangleByMermaidElement(subGraph)),
      '',
      {
        fill: DEFAULT_SUBGRAPH_STYLE.fill,
        strokeColor: DEFAULT_SUBGRAPH_STYLE.strokeColor,
        strokeWidth: DEFAULT_SUBGRAPH_STYLE.strokeWidth,
      }
    );

    if (groupIds[0] && mermaidGroupIdToElementMap[groupIds[0]]) {
      containerElement.groupId = mermaidGroupIdToElementMap[groupIds[0]].id;
      textElement.groupId = mermaidGroupIdToElementMap[groupIds[0]].id;
    }

    elements.push(containerElement);
    mermaidIdToElementMap[subGraph.id] = containerElement;
    elements.push(textElement);

    groupIds.forEach((groupId) => {
      const existing = elements.findIndex(
        (searchElement) => searchElement.id === mermaidGroupIdToElementMap[groupId]?.id
      ) >= 0;
      if (!existing) {
        elements.push(mermaidGroupIdToElementMap[groupId]);
      }
    });
  }

  for (const vertex of Object.values(filteredData.vertices)) {
    if (!vertex) continue;

    const groupIds = getGroupIds(vertex.id);

    const elementStyle = computeVertexStyle(vertex.containerStyle);
    const textStyle = computeTextStyle(vertex.labelStyle);

    const verticesText = buildText(getText(vertex), undefined, textStyle);

    const styleOptions = {
      fill: DEFAULT_VERTEX_STYLE.fill,
      strokeColor: DEFAULT_VERTEX_STYLE.strokeColor,
      strokeWidth: DEFAULT_VERTEX_STYLE.strokeWidth,
      ...elementStyle,
    };

    let geometryElement = createGeometryElement(
      BasicShapes.rectangle,
      RectangleClient.getPoints(getRectangleByMermaidElement(vertex)),
      verticesText,
      styleOptions
    );

    switch (vertex.type) {
      case VERTEX_TYPE.ROUND: {
        geometryElement.shape = BasicShapes.roundRectangle;
        break;
      }
      case VERTEX_TYPE.STADIUM: {
        geometryElement.shape = BasicShapes.roundRectangle;
        break;
      }
      case VERTEX_TYPE.DOUBLECIRCLE: {
        const CIRCLE_MARGIN = 5;
        const innerRectangle = RectangleClient.inflate(
          getRectangleByMermaidElement(vertex),
          -CIRCLE_MARGIN * 2
        );
        const innerCircle = createGeometryElement(
          BasicShapes.ellipse,
          RectangleClient.getPoints(innerRectangle),
          buildText(getText(vertex)),
          styleOptions
        );
        geometryElement = { ...geometryElement, shape: BasicShapes.ellipse };
        geometryElement.text = buildText('');
        elements.push(geometryElement);
        elements.push(innerCircle);
        mermaidIdToElementMap[vertex.id] = geometryElement;

        const groupElement = groupIds[0] && mermaidGroupIdToElementMap[groupIds[0]];
        if (groupElement) {
          geometryElement.groupId = groupElement.id;
          innerCircle.groupId = groupElement.id;
        }
        continue;
      }
      case VERTEX_TYPE.CIRCLE: {
        geometryElement.shape = BasicShapes.ellipse;
        break;
      }
      case VERTEX_TYPE.DIAMOND: {
        geometryElement.shape = BasicShapes.diamond;
        break;
      }
      case VERTEX_TYPE.HEXAGON: {
        geometryElement.shape = BasicShapes.hexagon;
        break;
      }
      case VERTEX_TYPE.PARALLELOGRAM: {
        geometryElement.shape = BasicShapes.parallelogram;
        break;
      }
      case VERTEX_TYPE.TRAPEZOID: {
        geometryElement.shape = BasicShapes.trapezoid;
        break;
      }
    }

    elements.push(geometryElement);
    mermaidIdToElementMap[vertex.id] = geometryElement;

    const groupElement = groupIds[0] && mermaidGroupIdToElementMap[groupIds[0]];
    if (groupElement) {
      geometryElement.groupId = groupElement.id;
    }
  }

  for (const edge of filteredData.edges) {
    let groupIds: string[] = [];
    const startParentId = getParentId(edge.start);
    const endParentId = getParentId(edge.end);

    if (startParentId && startParentId === endParentId) {
      groupIds = getGroupIds(startParentId);
    }

    const { reflectionPoints } = edge;
    if (reflectionPoints.length < 2) {
      warnings.push(`Edge ${edge.start} -> ${edge.end} has insufficient points`);
      continue;
    }
    const points: Point[] = reflectionPoints.map(
      (point) => [point.x, point.y] as Point
    );

    const arrowType = getArrowMarkerType(edge.type);

    const sourceHandle: ArrowLineHandle = {
      marker: arrowType.source.marker,
    };
    const targetHandle: ArrowLineHandle = {
      marker: arrowType.target.marker,
    };

    const texts: ArrowLineText[] = [];
    if (edge.text) {
      const textValue = buildText(getText(edge));
      texts.push({
        position: 0.5,
        text: textValue,
      });
    }

    const arrowStyle: {
      strokeWidth: number;
      strokeColor: string;
      strokeStyle?: 'solid' | 'dashed' | 'dotted';
    } = {
      strokeWidth: DEFAULT_LINE_WIDTH,
      strokeColor: DEFAULT_ARROW_STYLE.strokeColor,
    };

    if (edge.stroke === 'dotted') {
      arrowStyle.strokeStyle = StrokeStyle.dotted;
    }

    const arrowLineElement = createArrowLineElement(
      ArrowLineShape.straight,
      [points[0], points[points.length - 1]] as [Point, Point],
      {
        ...sourceHandle,
      },
      {
        ...targetHandle,
      },
      texts,
      { ...arrowStyle }
    );

    const groupElement =
      groupIds[0] && mermaidGroupIdToElementMap[groupIds[0]];
    if (groupElement) {
      arrowLineElement.groupId = groupElement.id;
    }

    elements.push(arrowLineElement);
  }

  return { elements, warnings };
}
