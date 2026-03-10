import { DEFAULT_FONT_SIZE, THINKIX_FONT_SCALING_FACTOR } from './constants';
import { parseMermaidDiagram } from './parser';
import { transformFlowchartToBoard } from './transformers/flowchart';
import { transformSequenceToBoard } from './transformers/sequence';
import { transformClassToBoard } from './transformers/class';
import type { MermaidConfig, MermaidToBoardResult } from './types';

export type {
  MermaidDiagramType,
  MermaidVertexType,
  MermaidEdgeType,
  MermaidContainerStyle,
  MermaidLabelStyle,
  MermaidVertex,
  MermaidEdge,
  MermaidSubgraph,
  MermaidGeometry,
  MermaidVertexWithGeometry,
  MermaidEdgeWithPath,
  MermaidSubgraphWithGeometry,
  MermaidFlowchartData,
  MermaidSequenceData,
  MermaidClassData,
  MermaidGraphImage,
  MermaidDiagramData,
  MermaidConfig,
  MermaidToBoardResult,
} from './types.js';

export {
  DEFAULT_FONT_SIZE,
  MERMAID_CONFIG,
  MERMAID_DOM_PREFIX,
  DEFAULT_VERTEX_STYLE,
  DEFAULT_SUBGRAPH_STYLE,
  DEFAULT_ARROW_STYLE,
  VERTEX_SHAPE_MAP,
  EDGE_MARKER_MAP,
  MIN_POINT_DISTANCE,
  SUBGRAPH_PADDING,
  THINKIX_FONT_SCALING_FACTOR,
} from './constants';

export {
  encodeEntities,
  decodeEntities,
  entityCodesToText,
  removeMarkdown,
  removeFontAwesomeIcons,
  normalizeText,
  cleanText,
  parseStyleString,
  convertContainerStyle,
  convertLabelStyle,
  isValidMermaidDefinition,
  generateId,
  safeNumber,
  isDefined,
  getTransformAttr,
  type TransformResult,
} from './utils';

export {
  pointDistance,
  areCollinear,
  filterRedundantPoints,
  simplifyCollinearPoints,
  extractPathPoints,
  computeEdgePositions,
} from './edge-parser/path';

export {
  isSVGElement,
  isSVGRectElement,
  isSVGPathElement,
  isSVGLineElement,
  isSVGTextElement,
  isSVGSVGElement,
  isSVGGraphicsElement,
  isSVGForeignObjectElement,
  isSVGGroupElement,
  assertSVGElement,
  assertSVGRectElement,
  assertSVGPathElement,
  assertSVGLineElement,
  assertSVGTextElement,
  assertSVGSVGElement,
  assertSVGGraphicsElement,
  assertSVGForeignObjectElement,
  assertNode,
  assertElement,
} from './dom-guards';

export {
  parseMermaidDiagram,
} from './parser';

export { isValidMermaidDefinition as validateMermaidDefinition } from './utils';

export {
  transformToBoard,
  transformFlowchartToBoard,
  transformSequenceToBoard,
  transformClassToBoard,
} from './transformers';


export interface ThinkixConfig {
  fontSize: number;
}


export async function parseMermaidToBoard(
  definition: string,
  config?: MermaidConfig
): Promise<MermaidToBoardResult> {
  const mermaidConfig = config || {};
  const fontSize =
    parseInt(mermaidConfig.themeVariables?.fontSize ?? '') || DEFAULT_FONT_SIZE;

  const parsedData = await parseMermaidDiagram(definition, {
    ...mermaidConfig,
    themeVariables: {
      ...mermaidConfig.themeVariables,
      fontSize: `${fontSize * THINKIX_FONT_SCALING_FACTOR}px`,
    },
  });

  const thinkixConfig: ThinkixConfig = { fontSize };

  switch (parsedData.type) {
    case 'flowchart':
      return await transformFlowchartToBoard(parsedData, thinkixConfig);

    case 'sequence':
      return await transformSequenceToBoard(parsedData);

    case 'class':
      return await transformClassToBoard(parsedData);

    case 'graphImage':
      return { elements: [parsedData], warnings: [] };

    default: {
      const unsupportedType: never = parsedData;
      void unsupportedType;
      return {
        elements: [],
        warnings: [`Unsupported diagram type`],
      };
    }
  }
}

const mermaidToThinkix = {
  parseMermaidToBoard,
  parseMermaidDiagram,
};

export default mermaidToThinkix;
