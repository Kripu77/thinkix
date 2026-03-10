import type {
  MermaidFlowchartData,
  MermaidVertexWithGeometry,
  MermaidEdgeWithPath,
  MermaidSubgraphWithGeometry,
  MermaidVertex,
  MermaidContainerStyle,
  MermaidLabelStyle,
  MermaidEdgeType,
} from '../types';
import type {
  MermaidLibrary,
  MermaidDiagram,
  MermaidParser,
  MermaidSubgraph,
} from '../mermaid-types';
import { computeEdgePositions } from '../edge-parser/path';
import { getTransformAttr, entityCodesToText } from '../utils';
import { MERMAID_DOM_PREFIX } from '../constants';
import { createLogger } from '@thinkix/shared';

const logger = createLogger('mermaid-to-thinkix:parser');

function injectSvg(svg: string): { container: HTMLDivElement; cleanup: () => void } {
  const container = document.createElement('div');
  container.id = `${MERMAID_DOM_PREFIX}-${Date.now()}`;
  container.setAttribute(
    'style',
    'position: absolute; visibility: hidden; pointer-events: none; z-index: -1;'
  );
  container.innerHTML = svg;
  document.body.appendChild(container);

  const cleanup = () => {
    container.remove();
  };

  return { container, cleanup };
}

function computeElementPosition(
  element: Element,
  container: Element
): { x: number; y: number } {
  let root = element.parentElement?.parentElement;

  const childElement = element.childNodes[0] as SVGElement | null;
  let childPosition = { x: 0, y: 0 };

  if (childElement) {
    const { transformX, transformY } = getTransformAttr(childElement);
    const boundingBox = (childElement as SVGGraphicsElement).getBBox();

    childPosition = {
      x: Number(childElement.getAttribute('x')) || transformX + boundingBox.x || 0,
      y: Number(childElement.getAttribute('y')) || transformY + boundingBox.y || 0,
    };
  }

  const { transformX, transformY } = getTransformAttr(element as SVGElement);
  const position = {
    x: transformX + childPosition.x,
    y: transformY + childPosition.y,
  };

  while (root && root.id !== container.id) {
    if (root.classList.value === 'root' && root.hasAttribute('transform')) {
      const { transformX: rootX, transformY: rootY } = getTransformAttr(root as unknown as SVGElement);
      position.x += rootX;
      position.y += rootY;
    }
    root = root.parentElement;
  }

  return { x: position.x, y: position.y };
}

function parseVertex(
  data: MermaidVertex,
  container: Element,
  classes: Record<string, { styles?: string[]; textStyles?: string[] }>
): MermaidVertexWithGeometry | undefined {
  const el = container.querySelector(`[id*="flowchart-${data.id}-"]`);
  if (!el) {
    return undefined;
  }

  let link: string | undefined;
  if (el.parentElement?.tagName.toLowerCase() === 'a') {
    link = el.parentElement.getAttribute('xlink:href') || undefined;
  }

  const position = computeElementPosition(link ? el.parentElement! : el, container);

  const boundingBox = (el as SVGGraphicsElement).getBBox();
  const dimension = {
    width: boundingBox.width,
    height: boundingBox.height,
  };

  const labelContainerStyleText = el
    .querySelector('.label-container')
    ?.getAttribute('style');
  const labelStyleText = el.querySelector('.label')?.getAttribute('style');

  const containerStyle: Record<string, string> = {};
  labelContainerStyleText?.split(';').forEach((property) => {
    if (!property) return;
    const key = property.split(':')[0]?.trim();
    const value = property.split(':')[1]?.trim();
    if (key && value) {
      containerStyle[key] = value;
    }
  });

  const labelStyle: Record<string, string> = {};
  labelStyleText?.split(';').forEach((property) => {
    if (!property) return;
    const key = property.split(':')[0]?.trim();
    const value = property.split(':')[1]?.trim();
    if (key && value) {
      labelStyle[key] = value;
    }
  });

  if (data.classes && classes[data.classes]) {
    const classDef = classes[data.classes];
    if (classDef.styles) {
      classDef.styles.forEach((style) => {
        const [key, value] = style.split(':');
        if (key && value) {
          containerStyle[key.trim()] = value.trim();
        }
      });
    }
    if (classDef.textStyles) {
      classDef.textStyles.forEach((style) => {
        const [key, value] = style.split(':');
        if (key && value) {
          labelStyle[key.trim()] = value.trim();
        }
      });
    }
  }

  return {
    id: data.id,
    labelType: data.labelType,
    text: entityCodesToText(data.text),
    type: data.type,
    link,
    ...position,
    ...dimension,
    containerStyle: containerStyle as MermaidContainerStyle,
    labelStyle: labelStyle as MermaidLabelStyle,
  };
}

function parseEdge(
  data: {
    start: string;
    end: string;
    text?: string;
    type?: string;
    stroke?: string;
    labelType?: 'markdown' | 'text';
  },
  edgeIndex: number,
  container: Element
): MermaidEdgeWithPath {
  const edge = container.querySelector<SVGPathElement>(
    `[id*="L-${data.start}-${data.end}-${edgeIndex}"]`
  );

  if (!edge) {
    throw new Error(`Edge element not found for selector [id*="L-${data.start}-${data.end}-${edgeIndex}"]`);
  }

  const position = computeElementPosition(edge, container);
  const edgePositionData = computeEdgePositions(edge, position);

  return {
    start: data.start,
    end: data.end,
    type: (data.type || 'arrow_point') as MermaidEdgeType,
    stroke: (data.stroke || 'normal') as 'dotted' | 'normal',
    text: data.text ? entityCodesToText(data.text) : '',
    labelType: data.labelType,
    ...edgePositionData,
  };
}

function parseSubgraph(
  data: { id: string; title: string; nodes: string[]; classes?: string; dir?: string },
  container: Element
): MermaidSubgraphWithGeometry {
  const nodeIds = data.nodes.map((n: string) => {
    if (n.startsWith('flowchart-')) {
      return n.split('-')[1];
    }
    return n;
  });

  const el: SVGSVGElement | null = container.querySelector(`[id='${data.id}']`);
  if (!el) {
    return {
      id: data.id,
      title: entityCodesToText(data.title),
      nodeIds,
      x: 0,
      y: 0,
      width: 200,
      height: 100,
    };
  }

  const position = computeElementPosition(el, container);

  const boundingBox = el.getBBox();
  const dimension = {
    width: boundingBox.width,
    height: boundingBox.height,
  };

  return {
    id: data.id,
    title: entityCodesToText(data.title),
    nodeIds,
    ...position,
    ...dimension,
  };
}

/**
 * Parses a Mermaid flowchart diagram into structured data
 */
export async function parseFlowchartDiagram(
  definition: string,
  mermaidApi: MermaidLibrary
): Promise<MermaidFlowchartData> {
  const diagram = await mermaidApi.mermaidAPI.getDiagramFromText(definition) as MermaidDiagram;

  diagram.parse?.();

  const parser = diagram.parser?.yy as MermaidParser;
  if (!parser) {
    throw new Error('Mermaid parser not available');
  }

  const classes = parser.getClasses?.() ?? {};
  const warnings: string[] = [];

  const rawSubgraphs = parser.getSubGraphs?.() ?? [];
  const subgraphIds = new Set(rawSubgraphs.map((sg: MermaidSubgraph) => sg.id));

  const { svg } = await mermaidApi.render(`${MERMAID_DOM_PREFIX}-${Date.now()}`, definition);

  const { container, cleanup } = injectSvg(svg);

  try {
    const rawVertices = parser.getVertices();
    const vertices: Record<string, MermaidVertexWithGeometry | undefined> = {};

    for (const [id, vertex] of Object.entries(rawVertices)) {
      if (subgraphIds.has(id)) {
        continue;
      }
      const parsed = parseVertex(vertex as MermaidVertex, container, classes);
      if (parsed) {
        vertices[id] = parsed;
      } else {
        warnings.push(`Vertex "${id}" could not be parsed - DOM element not found`);
      }
    }

    const edgeCountMap = new Map<string, number>();

    const rawEdges = parser.getEdges();
    const edges: MermaidEdgeWithPath[] = [];

    const validEdges = rawEdges.filter((edge: { start: string; end: string }) => {
      return container.querySelector(`[id*="L-${edge.start}-${edge.end}"]`);
    });

    for (const edgeData of validEdges) {
      const edgeId = `${edgeData.start}-${edgeData.end}`;
      const count = edgeCountMap.get(edgeId) || 0;
      edgeCountMap.set(edgeId, count + 1);

      try {
        const parsed = parseEdge(edgeData, count, container);
        edges.push(parsed);
      } catch (err) {
        const edgeInfo = edgeData ? `from "${edgeData.start}" to "${edgeData.end}"` : 'unknown edge';
        const errorMsg = `Edge parsing failed for ${edgeInfo}: ${err instanceof Error ? err.message : 'Unknown error'}`;
        logger.error(errorMsg, err instanceof Error ? err : undefined, { edge: edgeData });
        warnings.push(errorMsg);
      }
    }

    const subgraphs = rawSubgraphs.map((sg: MermaidSubgraph) => parseSubgraph(sg, container));

    return {
      type: 'flowchart',
      vertices,
      edges,
      subgraphs,
      warnings,
    };
  } finally {
    cleanup();
  }
}
