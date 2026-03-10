
export const DEFAULT_FONT_SIZE = 16;

export const THINKIX_FONT_SCALING_FACTOR = 1.25;

export const MERMAID_CONFIG = {
  startOnLoad: false,
  flowchart: { curve: 'linear' },
  themeVariables: {
    fontSize: `${DEFAULT_FONT_SIZE}px`,
  },
  maxEdges: 500,
  maxTextSize: 50000,
} as const;

export const MERMAID_DOM_PREFIX = 'mermaid-to-thinkix';

export const DEFAULT_VERTEX_STYLE = {
  fill: '#ECECFF',
  strokeColor: '#9370DB',
  strokeWidth: 2,
} as const;

export const DEFAULT_SUBGRAPH_STYLE = {
  fill: '#ffffde',
  strokeColor: '#aaaa33',
  strokeWidth: 1,
} as const;

export const DEFAULT_ARROW_STYLE = {
  strokeColor: '#000000',
  strokeWidth: 2,
} as const;

export const VERTEX_SHAPE_MAP: Record<string, string> = {
  rect: 'rectangle',
  round: 'roundRectangle',
  stadium: 'stadium',
  circle: 'ellipse',
  doublecircle: 'ellipse',
  diamond: 'diamond',
  hexagon: 'hexagon',
  parallelogram: 'parallelogram',
  trapezoid: 'trapezoid',
  cylinder: 'cylinder',
  subroutine: 'subroutine',
} as const;

export const EDGE_MARKER_MAP: Record<string, { source: string; target: string }> = {
  arrow_point: { source: 'none', target: 'arrow' },
  arrow_circle: { source: 'none', target: 'arrow' },
  arrow_cross: { source: 'none', target: 'arrow' },
  arrow_open: { source: 'none', target: 'none' },
  double_arrow_point: { source: 'arrow', target: 'arrow' },
  double_arrow_circle: { source: 'arrow', target: 'arrow' },
  double_arrow_cross: { source: 'arrow', target: 'arrow' },
  double_arrow_open: { source: 'none', target: 'none' },
  dotted: { source: 'none', target: 'arrow' },
} as const;
  
export const MIN_POINT_DISTANCE = 20;

export const SUBGRAPH_PADDING = 60;
