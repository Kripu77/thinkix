import type {
  MermaidClassData,
  ClassNode,
  ClassContainer,
  ClassLine,
  ClassText,
  ClassArrow,
  ClassNamespace,
} from '../types';
import type { MermaidDiagram } from '../mermaid-types';
import { generateId } from '../utils';

interface MermaidClassParser {
  getClasses(): Record<string, MermaidClassNode>;
  getRelations(): MermaidRelationNode[];
  getNotes(): MermaidNoteNode[];
  getDirection(): 'LR' | 'RL' | 'TB' | 'BT';
  getNamespaces(): ClassNamespace[];
}

interface MermaidRelationNode {
  id1: string;
  id2: string;
  relation: {
    lineType: number;
    type1: number;
    type2: number;
  };
  title?: string;
  relationTitle1?: string;
  relationTitle2?: string;
}

interface MermaidClassNode {
  domId: string;
  id: string;
}

interface MermaidNoteNode {
  id: string;
  text: string;
  class: string;
}
import {
  createClassContainerFromSVG,
  createClassArrow,
  createClassLineFromSVG,
  createClassText,
} from '../element-skeleton';
import { getTransformAttr } from '../utils';
import { computeEdgePositions } from '../edge-parser/path';

const RELATION_TYPE = {
  AGGREGATION: 0,
  EXTENSION: 1,
  COMPOSITION: 2,
  DEPENDENCY: 3,
  LOLLIPOP: 4,
} as const;

const LINE_TYPE = {
  LINE: 0,
  DOTTED_LINE: 1,
} as const;

const MERMAID_ARROW_HEAD_OFFSET = 16;

function getStrokeStyle(type: number): 'solid' | 'dotted' {
  switch (type) {
    case LINE_TYPE.LINE:
      return 'solid';
    case LINE_TYPE.DOTTED_LINE:
      return 'dotted';
    default:
      return 'solid';
  }
}

function getArrowhead(type: number | 'none'): 'arrow' | 'triangle' | 'diamond' | 'triangle_outline' | 'diamond_outline' | null {
  if (type === 'none') {
    return null;
  }

  switch (type) {
    case RELATION_TYPE.AGGREGATION:
      return 'diamond_outline';
    case RELATION_TYPE.COMPOSITION:
      return 'diamond';
    case RELATION_TYPE.EXTENSION:
      return 'triangle_outline';
    case RELATION_TYPE.DEPENDENCY:
    default:
      return 'arrow';
  }
}

function parseClasses(
  classes: { [key: string]: MermaidClassNode },
  containerEl: Element
): { nodes: ClassContainer[]; lines: ClassLine[]; text: ClassText[] } {
  const nodes: ClassContainer[] = [];
  const lines: ClassLine[] = [];
  const text: ClassText[] = [];

  Object.values(classes).forEach((classNode) => {
    const { domId, id: classId } = classNode;
    const groupId = generateId('class-group');
    const domNode = containerEl.querySelector(`[data-id=${classId}]`);

    if (!domNode) {
      throw new Error(`DOM Node with id ${domId} not found`);
    }

    const { transformX, transformY } = getTransformAttr(domNode as unknown as SVGElement);

    const container = createClassContainerFromSVG(
      domNode.firstChild as SVGRectElement,
      'rectangle',
      { id: classId, groupId, subtype: 'class' }
    );

    container.x! += transformX;
    container.y! += transformY;
    container.metadata = { classId };
    nodes.push(container);

    const lineNodes = Array.from(domNode.querySelectorAll('.divider')) as SVGLineElement[];

    lineNodes.forEach((lineNode) => {
      const startX = Number(lineNode.getAttribute('x1'));
      const startY = Number(lineNode.getAttribute('y1'));
      const endX = Number(lineNode.getAttribute('x2'));
      const endY = Number(lineNode.getAttribute('y2'));

      const line = createClassLineFromSVG(lineNode, startX, startY, endX, endY, {
        groupId,
        id: generateId('class-line'),
      });

      line.startX += transformX;
      line.startY += transformY;
      line.endX += transformX;
      line.endY += transformY;
      line.metadata = { classId };
      lines.push(line);
    });

    const labelNodes = domNode.querySelector('.label')?.children;
    if (!labelNodes) {
      return;
    }

    Array.from(labelNodes).forEach((node) => {
      const label = node.textContent;
      if (!label) return;

      const id = generateId('class-text');
      const { transformX: textTransformX, transformY: textTransformY } = getTransformAttr(node as unknown as SVGElement);
      const boundingBox = (node as SVGForeignObjectElement).getBBox();

      const offsetY = 10;

      const textElement = createClassText(
        transformX + textTransformX,
        transformY + textTransformY + offsetY,
        label,
        {
          width: boundingBox.width,
          height: boundingBox.height,
          id,
          groupId,
        }
      );

      textElement.metadata = { classId };
      text.push(textElement);
    });
  });

  return { nodes, lines, text };
}

function adjustArrowPosition(
  direction: 'LR' | 'RL' | 'TB' | 'BT',
  arrow: ClassArrow
): ClassArrow {
  const arrowHeadShapes = ['triangle_outline', 'diamond', 'diamond_outline'];

  const shouldUpdateStartArrowhead =
    arrow.startArrowhead && arrowHeadShapes.includes(arrow.startArrowhead);
  const shouldUpdateEndArrowhead =
    arrow.endArrowhead && arrowHeadShapes.includes(arrow.endArrowhead);

  if (!shouldUpdateEndArrowhead && !shouldUpdateStartArrowhead) {
    return arrow;
  }

  const offset = MERMAID_ARROW_HEAD_OFFSET;

  if (shouldUpdateStartArrowhead) {
    if (direction === 'LR') {
      arrow.startX! -= offset;
    } else if (direction === 'RL') {
      arrow.startX! += offset;
    } else if (direction === 'TB') {
      arrow.startY! -= offset;
    } else if (direction === 'BT') {
      arrow.startY! += offset;
    }
  }

  if (shouldUpdateEndArrowhead) {
    if (direction === 'LR') {
      arrow.endX! += offset;
    } else if (direction === 'RL') {
      arrow.endX! -= offset;
    } else if (direction === 'TB') {
      arrow.endY! += offset;
    } else if (direction === 'BT') {
      arrow.endY! -= offset;
    }
  }

  return arrow;
}

function parseRelations(
  relations: MermaidRelationNode[],
  classNodes: ClassContainer[],
  containerEl: Element,
  direction: 'LR' | 'RL' | 'TB' | 'BT'
): { arrows: ClassArrow[]; text: ClassText[] } {
  const edges = containerEl.querySelector('.edgePaths')?.children;

  if (!edges) {
    return { arrows: [], text: [] };
  }

  const arrows: ClassArrow[] = [];
  const text: ClassText[] = [];

  relations.forEach((relationNode, index) => {
    const { id1, id2, relation } = relationNode;
    const node1 = classNodes.find((node) => node.id === id1);
    const node2 = classNodes.find((node) => node.id === id2);

    if (!node1 || !node2) return;

    const strokeStyle = getStrokeStyle(relation.lineType);
    const startArrowhead = getArrowhead(relation.type1);
    const endArrowhead = getArrowhead(relation.type2);

    const edgePositionData = computeEdgePositions(edges[index] as SVGPathElement);

    const points = edgePositionData.reflectionPoints.length > 2
      ? edgePositionData.reflectionPoints.map(p => [p.x, p.y])
      : undefined;

    const arrowSkeleton = createClassArrow(
      edgePositionData.startX,
      edgePositionData.startY,
      edgePositionData.endX,
      edgePositionData.endY,
      {
        strokeStyle,
        startArrowhead,
        endArrowhead,
        label: relationNode.title ? { text: relationNode.title } : undefined,
        start: { type: 'rectangle', id: node1.id },
        end: { type: 'rectangle', id: node2.id },
        points,
      }
    );

    const arrow = adjustArrowPosition(direction, arrowSkeleton);
    arrows.push(arrow);

    const { relationTitle1, relationTitle2 } = relationNode;
    const offsetX = 20;
    const offsetY = 15;
    const directionOffset = 15;
    let x: number;
    let y: number;

    if (relationTitle1 && relationTitle1 !== 'none') {
      switch (direction) {
        case 'TB':
          x = arrow.startX! - offsetX;
          if (arrow.endX! < arrow.startX!) {
            x -= directionOffset;
          }
          y = arrow.startY! + offsetY;
          break;
        case 'BT':
          x = arrow.startX! + offsetX;
          if (arrow.endX! > arrow.startX!) {
            x += directionOffset;
          }
          y = arrow.startY! - offsetY;
          break;
        case 'LR':
          x = arrow.startX! + offsetX;
          y = arrow.startY! + offsetY;
          if (arrow.endY! > arrow.startY!) {
            y += directionOffset;
          }
          break;
        case 'RL':
          x = arrow.startX! - offsetX;
          y = arrow.startY! - offsetY;
          if (arrow.startY! > arrow.endY!) {
            y -= directionOffset;
          }
          break;
        default:
          x = arrow.startX! - offsetX;
          y = arrow.startY! + offsetY;
      }

      const relationTitleElement = createClassText(x, y, relationTitle1, { fontSize: 16 });
      text.push(relationTitleElement);
    }

    if (relationTitle2 && relationTitle2 !== 'none') {
      switch (direction) {
        case 'TB':
          x = arrow.endX! + offsetX;
          if (arrow.endX! < arrow.startX!) {
            x += directionOffset;
          }
          y = arrow.endY! - offsetY;
          break;
        case 'BT':
          x = arrow.endX! - offsetX;
          if (arrow.endX! > arrow.startX!) {
            x -= directionOffset;
          }
          y = arrow.endY! + offsetY;
          break;
        case 'LR':
          x = arrow.endX! - offsetX;
          y = arrow.endY! - offsetY;
          if (arrow.endY! > arrow.startY!) {
            y -= directionOffset;
          }
          break;
        case 'RL':
          x = arrow.endX! + offsetX;
          y = arrow.endY! + offsetY;
          if (arrow.startY! > arrow.endY!) {
            y += directionOffset;
          }
          break;
        default:
          x = arrow.endX! + offsetX;
          y = arrow.endY! - offsetY;
      }

      const relationTitleElement = createClassText(x, y, relationTitle2, { fontSize: 16 });
      text.push(relationTitleElement);
    }
  });

  return { arrows, text };
}

function parseNotes(
  notes: MermaidNoteNode[],
  containerEl: Element,
  classNodes: ClassContainer[]
): { notes: ClassContainer[]; connectors: ClassArrow[] } {
  const noteContainers: ClassContainer[] = [];
  const connectors: ClassArrow[] = [];

  notes.forEach((note) => {
    const { id, text, class: classId } = note;
    const node = containerEl.querySelector<SVGSVGElement>(`#${id}`);

    if (!node) {
      return;
    }

    const { transformX, transformY } = getTransformAttr(node as unknown as SVGElement);
    const rect = node.firstChild as SVGRectElement;

    const container = createClassContainerFromSVG(rect, 'rectangle', {
      id,
      subtype: 'note',
      label: { text },
    });

    container.x! += transformX;
    container.y! += transformY;
    noteContainers.push(container);

    if (classId) {
      const classNode = classNodes.find((node) => node.id === classId);
      if (!classNode) {
        return;
      }

      const startX = container.x! + (container.width || 0) / 2;
      const startY = container.y! + (container.height || 0);
      const endX = startX;
      const endY = classNode.y;

      const connector = createClassArrow(startX, startY, endX, endY, {
        strokeStyle: 'dotted',
        startArrowhead: null,
        endArrowhead: null,
        start: { id: container.id, type: 'rectangle' },
        end: { id: classNode.id, type: 'rectangle' },
      });
      connectors.push(connector);
    }
  });

  return { notes: noteContainers, connectors };
}
      
export async function parseClassDiagram(
  diagram: MermaidDiagram,
  containerEl: Element
): Promise<MermaidClassData> {
  diagram.parse?.();

  const mermaidParser = diagram.parser?.yy as unknown as MermaidClassParser;

  if (!mermaidParser) {
    throw new Error('Mermaid parser not available');
  }

  const direction = mermaidParser.getDirection?.() ?? 'TB';

  const nodes: ClassNode[][] = [];
  const lines: ClassLine[] = [];
  const text: ClassText[] = [];
  const arrows: ClassArrow[] = [];
  const classNodes: ClassContainer[] = [];

  const namespaces: ClassNamespace[] = mermaidParser.getNamespaces?.() ?? [];

  const classes = mermaidParser.getClasses?.();
  if (classes && Object.keys(classes).length) {
    const classData = parseClasses(classes, containerEl);
    nodes.push(classData.nodes);
    lines.push(...classData.lines);
    text.push(...classData.text);
    classNodes.push(...classData.nodes);
  }

  const relations = mermaidParser.getRelations?.() ?? [];
  const { arrows: relationArrows, text: relationTitles } = parseRelations(relations, classNodes, containerEl, direction);

  const notes = mermaidParser.getNotes?.() ?? [];
  const { notes: noteContainers, connectors } = parseNotes(notes, containerEl, classNodes);

  nodes.push(noteContainers);
  arrows.push(...relationArrows);
  arrows.push(...connectors);
  text.push(...relationTitles);

  return {
    type: 'class',
    nodes,
    lines,
    arrows,
    text,
    namespaces,
    warnings: undefined,
  };
}
