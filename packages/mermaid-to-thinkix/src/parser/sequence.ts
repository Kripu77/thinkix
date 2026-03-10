import type {
  MermaidSequenceData,
  SequenceNode,
  SequenceContainer,
  SequenceLine,
  SequenceText,
} from '../types';
import type {
  MermaidDiagram,
  MermaidSequenceParser,
  MermaidActor,
  MermaidBox,
} from '../mermaid-types';
import { StrokeStyle } from '@plait/common';
import {
  createSequenceArrowFromSVG,
  createContainerFromSVG,
  createLineFromSVG,
  createTextFromSVG,
} from '../element-skeleton';
import { generateId } from '../utils';

const MESSAGE_TYPE = {
  SOLID: 0,
  DOTTED: 1,
  NOTE: 2,
  SOLID_CROSS: 3,
  DOTTED_CROSS: 4,
  SOLID_OPEN: 5,
  DOTTED_OPEN: 6,
  LOOP_START: 10,
  LOOP_END: 11,
  ALT_START: 12,
  ALT_ELSE: 13,
  ALT_END: 14,
  OPT_START: 15,
  OPT_END: 16,
  ACTIVE_START: 17,
  ACTIVE_END: 18,
  PAR_START: 19,
  PAR_AND: 20,
  PAR_END: 21,
  RECT_START: 22,
  RECT_END: 23,
  SOLID_POINT: 24,
  DOTTED_POINT: 25,
  AUTONUMBER: 26,
  CRITICAL_START: 27,
  CRITICAL_OPTION: 28,
  CRITICAL_END: 29,
  BREAK_START: 30,
  BREAK_END: 31,
  PAR_OVER_START: 32,
} as const;

const SEQUENCE_ARROW_TYPES: Record<number, string> = {
  0: 'SOLID',
  1: 'DOTTED',
  3: 'SOLID_CROSS',
  4: 'DOTTED_CROSS',
  5: 'SOLID_OPEN',
  6: 'DOTTED_OPEN',
  24: 'SOLID_POINT',
  25: 'DOTTED_POINT',
};

function attachSequenceNumber(
  node: SVGLineElement | SVGPathElement,
  arrow: MermaidSequenceData['arrows'][number]
): void {
  const showSequenceNumber = !!node.nextElementSibling?.classList.contains('sequenceNumber');

  if (showSequenceNumber) {
    const text = node.nextElementSibling?.textContent;
    if (!text) return;

    const height = 30;
    const yOffset = height / 2;
    const xOffset = 10;

    arrow.sequenceNumber = {
      type: 'rectangle',
      x: arrow.startX - xOffset,
      y: arrow.startY - yOffset,
      label: { text, fontSize: 14 },
      height,
      subtype: 'sequence',
    };
  }
}

function createActorSymbol(
  rootNode: SVGRectElement,
  text: string,
  opts?: { id?: string }
): SequenceNode[] {
  if (!rootNode) {
    throw new Error('Root node not found');
  }

  const groupId = generateId('actor-group');
  const children = Array.from(rootNode.children);
  const nodeElements: SequenceNode[] = [];

  children.forEach((child, index) => {
    const id = `${opts?.id}-${index}`;
    let element: SequenceContainer | SequenceLine | SequenceText | undefined;

    switch (child.tagName) {
      case 'line': {
        const startX = Number(child.getAttribute('x1'));
        const startY = Number(child.getAttribute('y1'));
        const endX = Number(child.getAttribute('x2'));
        const endY = Number(child.getAttribute('y2'));

        element = createLineFromSVG(child as SVGLineElement, startX, startY, endX, endY, {
          groupId,
          id,
        });
        break;
      }
      case 'text':
        element = createTextFromSVG(child as SVGTextElement, text, { groupId, id });
        break;
      case 'circle':
        element = createContainerFromSVG(child as SVGSVGElement, 'ellipse', {
          label: child.textContent ? { text: child.textContent } : undefined,
          groupId,
          id,
        });
        break;
      default:
        element = createContainerFromSVG(child as SVGSVGElement, 'rectangle', {
          label: child.textContent ? { text: child.textContent } : undefined,
          groupId,
          id,
        });
    }
    if (element) {
      nodeElements.push(element);
    }
  });

  return nodeElements;
}

function parseActors(
  actors: Record<string, MermaidActor>,
  containerEl: Element,
  warnings: string[] = []
): { nodes: MermaidSequenceData['nodes']; lines: MermaidSequenceData['lines'] } {
  const actorTopNodes = Array.from(containerEl.querySelectorAll<SVGElement>('.actor-top'));
  const actorBottomNodes = Array.from(containerEl.querySelectorAll<SVGElement>('.actor-bottom'));

  const nodes: MermaidSequenceData['nodes'] = [];
  const lines: MermaidSequenceData['lines'] = [];

  Object.values(actors).forEach((actor) => {
    const topRootNode = actorTopNodes.find(
      (actorNode) => actorNode.getAttribute('name') === actor.name
    ) as SVGRectElement;
    const bottomRootNode = actorBottomNodes.find(
      (actorNode) => actorNode.getAttribute('name') === actor.name
    ) as SVGRectElement;

    if (!topRootNode || !bottomRootNode) {
      warnings.push(`Actor "${actor.name}" could not be parsed - DOM nodes not found`);
      return;
    }

    const text = actor.description ?? actor.name;

    if (actor.type === 'participant') {
      const topNodeElement = createContainerFromSVG(topRootNode, 'rectangle', {
        id: `${actor.name}-top`,
        label: { text },
        subtype: 'actor',
      });
      nodes.push([topNodeElement]);

      const bottomNodeElement = createContainerFromSVG(bottomRootNode, 'rectangle', {
        id: `${actor.name}-bottom`,
        label: { text },
        subtype: 'actor',
      });
      nodes.push([bottomNodeElement]);

      const lineNode = topRootNode?.parentElement?.previousElementSibling as SVGLineElement;
      if (lineNode?.tagName !== 'line') {
        warnings.push(`Lifeline for participant "${actor.name}" could not be found - expected line element`);
        return;
      }

      const startX = Number(lineNode.getAttribute('x1'));
      const startY = topNodeElement.y! + (topNodeElement.height || 0);
      const endY = bottomNodeElement.y!;
      const endX = Number(lineNode.getAttribute('x2'));

      const line = createLineFromSVG(lineNode, startX, startY, endX, endY);
      lines.push(line);
    } else if (actor.type === 'actor') {
      const topNodeElement = createActorSymbol(topRootNode, text, {
        id: `${actor.name}-top`,
      });
      nodes.push(topNodeElement);

      const bottomNodeElement = createActorSymbol(bottomRootNode, text, {
        id: `${actor.name}-bottom`,
      });
      nodes.push(bottomNodeElement);

      const lineNode = topRootNode.previousElementSibling as SVGLineElement;
      if (lineNode?.tagName !== 'line') {
        warnings.push(`Lifeline for actor "${actor.name}" could not be found - expected line element`);
        return;
      }

      const startX = Number(lineNode.getAttribute('x1'));
      const startY = Number(lineNode.getAttribute('y1'));
      const endX = Number(lineNode.getAttribute('x2'));

      const bottomEllipseNode = bottomNodeElement.find(
        (node) => node?.type === 'ellipse' || node?.type === 'rectangle'
      ) as SequenceContainer | undefined;

      if (bottomEllipseNode && bottomEllipseNode.y !== undefined) {
        const endY = bottomEllipseNode.y;
        const line = createLineFromSVG(lineNode, startX, startY, endX, endY);
        lines.push(line);
      }
    }
  });

  return { nodes, lines };
}

function computeArrows(
  messages: Array<{
    type: number;
    to: string;
    from: string;
    message: string;
  }>,
  containerEl: Element
): MermaidSequenceData['arrows'] {
  const arrows: MermaidSequenceData['arrows'] = [];

  const arrowNodes = Array.from<SVGLineElement>(
    containerEl.querySelectorAll('[class*="messageLine"]')
  );

  const supportedMessageTypes = Object.keys(SEQUENCE_ARROW_TYPES);
  const arrowMessages = messages.filter((message) =>
    supportedMessageTypes.includes(message.type.toString())
  );

  arrowNodes.forEach((arrowNode, index) => {
    const message = arrowMessages[index];
    if (!message) return;

    const messageType = SEQUENCE_ARROW_TYPES[message.type];
    const isDotted = messageType.startsWith('DOTTED');
    const isOpen = messageType.endsWith('OPEN');

    const arrow = createSequenceArrowFromSVG(arrowNode, {
      label: message?.message,
      strokeStyle: isDotted ? StrokeStyle.dotted : StrokeStyle.solid,
      endArrowhead: isOpen ? null : 'arrow',
    });

    attachSequenceNumber(arrowNode, arrow);
    arrows.push(arrow);
  });

  return arrows;
}

function computeNotes(
  messages: Array<{ type: number; message: string }>,
  containerEl: Element
): MermaidSequenceData['nodes'][number][] {
  const noteNodes = Array.from(containerEl.querySelectorAll('.note')).map(
    (node) => node.parentElement
  );

  const noteMessages = messages.filter((message) => message.type === MESSAGE_TYPE.NOTE);
  const notes: MermaidSequenceData['nodes'][number][] = [];

  noteNodes.forEach((node, index) => {
    if (!node) return;
    const rect = node.firstChild as SVGSVGElement;
    const text = noteMessages[index]?.message;
    if (!text) return;

    const note = createContainerFromSVG(rect, 'rectangle', {
      label: { text },
      subtype: 'note',
    });
    notes.push([note]);
  });

  return notes;
}

function parseActivations(containerEl: Element): MermaidSequenceData['nodes'][number][] {
  const activationNodes = Array.from(
    containerEl.querySelectorAll(`[class*="activation"]`)
  ) as SVGSVGElement[];

  const activations: MermaidSequenceData['nodes'][number][] = [];

  activationNodes.forEach((node) => {
    const rect = createContainerFromSVG(node, 'rectangle', {
      label: { text: '' },
      subtype: 'activation',
    });
    activations.push([rect]);
  });

  return activations;
}

function parseLoops(
  messages: Array<{ type: number; message: string }>,
  containerEl: Element
): MermaidSequenceData['loops'] {
  const lineNodes = Array.from(containerEl.querySelectorAll('.loopLine')) as SVGLineElement[];

  const lines = lineNodes.map((node) => {
    const startX = Number(node.getAttribute('x1'));
    const startY = Number(node.getAttribute('y1'));
    const endX = Number(node.getAttribute('x2'));
    const endY = Number(node.getAttribute('y2'));

    return createLineFromSVG(node, startX, startY, endX, endY);
  });

  lines.forEach((line) => {
    line.strokeStyle = 'dotted';
    line.strokeColor = '#adb5bd';
    line.strokeWidth = 2;
  });

  const loopTextNodes = Array.from(containerEl.querySelectorAll('.loopText')) as SVGTextElement[];

  const criticalMessages = messages
    .filter((message) => message.type === MESSAGE_TYPE.CRITICAL_START)
    .map((message) => message.message);

  const texts = loopTextNodes.map((node) => {
    const text = node.textContent || '';
    const textElement = createTextFromSVG(node, text);

    const rawText = text.match(/\[(.*?)\]/)?.[1] || '';
    const isCritical = criticalMessages.includes(rawText);

    if (isCritical) {
      textElement.x += 16;
    }

    return textElement;
  });

  const labelBoxes = Array.from(containerEl?.querySelectorAll('.labelBox')) as SVGSVGElement[];
  const labelTextNode = Array.from(containerEl?.querySelectorAll('.labelText'));

  const nodes = labelBoxes.map((labelBox, index) => {
    const text = labelTextNode[index]?.textContent || '';

    return createContainerFromSVG(labelBox, 'rectangle', {
      label: { text },
    });
  });

  nodes.forEach((node) => {
    node.strokeColor = '#adb5bd';
    node.bgColor = '#e9ecef';
    node.width = undefined;
  });

  return { lines, texts, nodes };
}

function computeHighlights(containerEl: Element): SequenceContainer[][] {
  const rects = (Array.from(containerEl.querySelectorAll('.rect')) as SVGRectElement[]).filter(
    (node) => node.parentElement?.tagName !== 'g'
  );

  const nodes: SequenceContainer[][] = [];

  rects.forEach((rect) => {
    const node = createContainerFromSVG(rect, 'rectangle', {
      label: { text: '' },
      subtype: 'highlight',
    });
    nodes.push([node as SequenceContainer]);
  });

  return nodes;
}

export async function parseSequenceDiagram(
  diagram: MermaidDiagram,
  containerEl: Element
): Promise<MermaidSequenceData> {
  diagram.parse?.();

  const mermaidParser = diagram.parser?.yy as MermaidSequenceParser;

  if (!mermaidParser) {
    throw new Error('Mermaid parser not available');
  }

  const nodes: SequenceNode[][] = [];
  const rawBoxes = mermaidParser.getBoxes?.() ?? [];
  const groups = rawBoxes.map((box: MermaidBox) => ({
    name: box.name,
    actorKeys: box.classes ?? [],
    fill: '',
  }));
  const bgHighlights = computeHighlights(containerEl);

  const rawActors = mermaidParser.getActors?.() ?? [];
  const actorData: Record<string, MermaidActor> = {};
  for (const actor of rawActors) {
    actorData[actor.name] = actor;
  }

  const parseWarnings: string[] = [];
  const { nodes: actors, lines } = parseActors(actorData, containerEl, parseWarnings);

  parseWarnings.forEach(warning => console.warn(`[parseSequenceDiagram] ${warning}`));

  const messages = mermaidParser.getMessages?.() ?? [];

  const arrows = computeArrows(messages, containerEl);
  const notes = computeNotes(messages, containerEl);
  const activations = parseActivations(containerEl);
  const loops = parseLoops(messages, containerEl);

  nodes.push(...bgHighlights);
  nodes.push(...actors);
  nodes.push(...notes);
  nodes.push(...activations);

  return {
    type: 'sequence',
    lines,
    arrows,
    nodes,
    loops,
    groups,
    warnings: parseWarnings.length > 0 ? parseWarnings : undefined,
  };
}
