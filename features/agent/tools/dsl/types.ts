export type ShapeType = 'rect' | 'ellipse' | 'diamond' | 'roundRect' | 'cloud' | 'star' | 'triangle' | 'parallelogram' | 'hexagon';

export type StickyColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';

export type ArrowStyle = 'straight' | 'curve' | 'elbow';

export interface ShapeNode {
  type: 'shape';
  shape: ShapeType;
  text: string;
  id?: string;
}

export interface StickyNode {
  type: 'sticky';
  text: string;
  color?: StickyColor;
  id?: string;
}

export interface TextNode {
  type: 'text';
  text: string;
  id?: string;
}

export interface ConnectNode {
  type: 'connect';
  sourceId: string;
  targetId: string;
  label?: string;
  style?: ArrowStyle;
}

export interface MindmapNode {
  type: 'mindmap';
  root: MindmapChild;
}

export interface MindmapChild {
  text: string;
  children?: MindmapChild[];
}

export interface MermaidNode {
  type: 'mermaid';
  code: string;
}

export interface PatchNode {
  type: 'patch';
  id: string;
  props: Record<string, string>;
}

export interface LayoutNode {
  type: 'layout';
  mode: 'grid' | 'row' | 'near';
  nearId?: string;
}

export type DslNode = ShapeNode | StickyNode | TextNode | ConnectNode | MindmapNode | MermaidNode | PatchNode | LayoutNode;

export interface ParseResult {
  statements: DslNode[];
  errors: Array<{ message: string; line: number; column: number }>;
}

export interface CompileResult {
  elements: unknown[];
  layout?: 'grid' | 'row' | { near: string };
  connects: ConnectNode[];
  mindmaps: MindmapNode[];
  mermaids: MermaidNode[];
  patches: Array<{ id: string; props: Record<string, string> }>;
}
