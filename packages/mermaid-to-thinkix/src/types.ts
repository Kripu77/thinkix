import type { PlaitElement, Point } from '@plait/core';

export type MermaidDiagramType =
  | 'flowchart-v2'
  | 'flowchart'
  | 'sequence'
  | 'classDiagram'
  | 'stateDiagram'
  | 'erDiagram'
  | 'gitGraph'
  | 'pie';


export type MermaidVertexType =
  | 'round'
  | 'stadium'
  | 'subroutine'
  | 'cylinder'
  | 'circle'
  | 'doublecircle'
  | 'diamond'
  | 'hexagon'
  | 'parallelogram'
  | 'trapezoid'
  | 'rect';

export type MermaidEdgeType =
  | 'arrow_point'
  | 'arrow_circle'
  | 'arrow_cross'
  | 'arrow_open'
  | 'double_arrow_point'
  | 'double_arrow_circle'
  | 'double_arrow_cross'
  | 'double_arrow_open'
  | 'dotted';


export interface MermaidContainerStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: string;
  strokeDasharray?: string;
  fontSize?: string;
  strokeColor?: string;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface MermaidLabelStyle {
  color?: string;
}


export interface MermaidVertex {
  id: string;
  text: string;
  type: MermaidVertexType;
  labelType?: 'markdown' | 'text';
  classes?: string;
  link?: string;
}

export interface MermaidEdge {
  start: string;
  end: string;
  text?: string;
  type: MermaidEdgeType;
  stroke?: 'dotted' | 'normal';
  labelType?: 'markdown' | 'text';
}

export interface MermaidSubgraph {
  id: string;
  title: string;
  nodeIds: string[];
  classes?: string;
  dir?: 'TB' | 'TD' | 'BT' | 'RL' | 'LR';
}

export interface MermaidGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MermaidVertexWithGeometry extends MermaidVertex, MermaidGeometry {
  containerStyle?: MermaidContainerStyle;
  labelStyle?: MermaidLabelStyle;
}

export interface MermaidEdgeWithPath extends MermaidEdge {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  reflectionPoints: Array<{ x: number; y: number }>;
}

export interface MermaidSubgraphWithGeometry extends MermaidSubgraph, MermaidGeometry {}

export interface MermaidFlowchartData {
  type: 'flowchart';
  vertices: Record<string, MermaidVertexWithGeometry | undefined>;
  edges: MermaidEdgeWithPath[];
  subgraphs: MermaidSubgraphWithGeometry[];
  warnings?: string[];
}

export interface MermaidSequenceData {
  type: 'sequence';
  nodes: Array<SequenceNode[]>;
  lines: SequenceLine[];
  arrows: SequenceArrow[];
  loops?: SequenceLoop;
  groups: SequenceGroup[];
  warnings?: string[];
}

export type SequenceNode =
  | SequenceContainer
  | SequenceLine
  | SequenceText
  | SequenceArrow;

export interface SequenceContainer {
  type: 'rectangle' | 'ellipse';
  x: number;
  y: number;
  width?: number;
  height?: number;
  id?: string;
  label?: {
    text: string;
    fontSize: number;
  };
  subtype?: 'actor' | 'activation' | 'highlight' | 'note' | 'sequence';
  strokeStyle?: 'solid' | 'dashed';
  strokeWidth?: number;
  strokeColor?: string;
  bgColor?: string;
  groupId?: string;
}

export interface SequenceLine {
  type: 'line';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  id?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dotted' | 'dashed';
  groupId?: string;
}

export interface SequenceText {
  type: 'text';
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  id?: string;
  groupId?: string;
}

export interface SequenceArrow {
  type: 'arrow';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  label?: {
    text: string;
    fontSize?: number;
  };
  strokeStyle?: 'solid' | 'dotted' | 'dashed';
  strokeWidth?: number;
  strokeColor?: string;
  startArrowhead?: 'arrow' | 'diamond' | 'circle' | null;
  endArrowhead?: 'arrow' | 'diamond' | 'circle' | null;
  sequenceNumber?: SequenceContainer;
  /** Absolute coordinates of path points including start, reflection points, and end */
  points?: number[][];
}

export interface SequenceLoop {
  lines: SequenceLine[];
  texts: SequenceText[];
  nodes: SequenceContainer[];
}

export interface SequenceGroup {
  name: string;
  actorKeys: string[];
  fill: string;
}

export interface MermaidClassData {
  type: 'class';
  nodes: Array<ClassNode[]>;
  lines: ClassLine[];
  arrows: ClassArrow[];
  text: ClassText[];
  namespaces: ClassNamespace[];
  warnings?: string[];
}

export type ClassNode = ClassContainer | ClassLine | ClassArrow | ClassText;

export interface ClassContainer {
  type: 'rectangle' | 'ellipse';
  x: number;
  y: number;
  width?: number;
  height?: number;
  id?: string;
  label?: {
    text: string;
    fontSize: number;
  };
  subtype?: 'note' | 'class';
  strokeStyle?: 'solid' | 'dashed';
  strokeWidth?: number;
  strokeColor?: string;
  bgColor?: string;
  groupId?: string;
  metadata?: { classId?: string };
}

export interface ClassLine {
  type: 'line';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  id?: string;
  strokeColor?: string;
  strokeWidth?: number;
  groupId?: string;
  metadata?: { classId?: string };
}

export interface ClassArrow {
  type: 'arrow';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  label?: {
    text: string;
  };
  strokeStyle?: 'solid' | 'dotted';
  strokeWidth?: number;
  strokeColor?: string;
  startArrowhead?: 'arrow' | 'triangle' | 'diamond' | 'triangle_outline' | 'diamond_outline' | null;
  endArrowhead?: 'arrow' | 'triangle' | 'diamond' | 'triangle_outline' | 'diamond_outline' | null;
  /** Absolute coordinates of path points including start, reflection points, and end */
  points?: number[][];
  start?: { id?: string; type: string };
  end?: { id?: string; type: string };
}

export interface ClassText {
  type: 'text';
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize: number;
  id?: string;
  groupId?: string;
  metadata?: { classId?: string };
}

export interface ClassNamespace {
  id: string;
  classes: { [key: string]: boolean };
}

export interface MermaidGraphImage {
  type: 'graphImage';
  mimeType: string;
  dataURL: string;
  width: number;
  height: number;
}

export type MermaidDiagramData =
  | MermaidFlowchartData
  | MermaidSequenceData
  | MermaidClassData
  | MermaidGraphImage;

export interface MermaidConfig {
  startOnLoad?: boolean;
  flowchart?: {
    curve?: 'linear' | 'basis';
  };
  themeVariables?: {
    fontSize?: string;
    fontFamily?: string;
  };
  maxEdges?: number;
  maxTextSize?: number;
}

export interface MermaidToBoardResult {
  elements: Array<PlaitElement | MermaidGraphImage>;
  warnings: string[];
}

export interface MermaidPlaitShapeElement {
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface MermaidPlaitElement {
  metadata?: MermaidElementMetadata;
  origin?: { metadata?: MermaidElementMetadata };
}

export interface MermaidElementMetadata {
  classId?: string;
  sourceType?: 'mermaid-flowchart' | 'mermaid-sequence' | 'mermaid-class';
  originalId?: string;
}

export interface MermaidArrowElement {
  source?: {
    id?: string;
    type?: string;
    boundId?: string;
    connection?: [number, number];
  };
  target?: {
    id?: string;
    type?: string;
    boundId?: string;
    connection?: [number, number];
  };
}

export interface ExtendedTextProperties {
  textHeight?: number;
}

export interface ExtendedPlaitElement extends PlaitElement {
  metadata?: MermaidElementMetadata;
  origin?: { metadata?: MermaidElementMetadata };
  points?: Point[];
  groupId?: string;
}
  
export interface ExtendedArrowElement extends PlaitElement, MermaidArrowElement {
  points?: Point[];
}
