import type { MermaidVertex, MermaidEdge } from './types';

export interface MermaidLibrary {
  initialize(config: MermaidConfig): void;
  mermaidAPI: {
    getDiagramFromText(text: string): Promise<MermaidDiagram>;
  };
  render(id: string, text: string): Promise<{ svg: string }>;
}

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

export type MermaidDiagramType = 'flowchart-v2' | 'flowchart' | 'sequence' | 'classDiagram' | 'classDiagram-V2' | 'stateDiagram' | 'erDiagram' | 'gitGraph' | 'pie' | 'graphImage';

export interface MermaidDiagram {
  type: MermaidDiagramType;
  parser?: { yy: MermaidParser };
  parse?(): void;
}

export interface MermaidParser {
  getVertices(): Record<string, MermaidVertex>;
  getEdges(): MermaidEdge[];
  getClasses?: () => Record<string, { styles?: string[]; textStyles?: string[] }>;
  getSubGraphs?: () => MermaidSubgraph[];
  getDirection?: () => 'LR' | 'RL' | 'TB' | 'BT';
}

export interface MermaidSubgraph {
  id: string;
  title: string;
  nodes: string[];
  classes?: string;
  dir?: 'TB' | 'TD' | 'BT' | 'RL' | 'LR';
}

export interface MermaidSequenceParser extends MermaidParser {
  getParticipants(): MermaidParticipant[];
  getBoxes(): MermaidBox[];
  getSignals(): MermaidSignal[];
  getActors(): MermaidActor[];
  getMessages(): MermaidMessage[];
}

export interface MermaidParticipant {
  name: string;
  description?: string;
  type?: 'actor' | 'participant';
}

export interface MermaidBox {
  name: string;
  classes?: string[];
}

export interface MermaidSignal {
  type?: number;
  from?: string;
  to?: string;
  message?: string;
}

export interface MermaidActor {
  name: string;
  description?: string;
  type: 'actor' | 'participant';
}

export interface MermaidMessage {
  type: number;
  from: string;
  to: string;
  message: string;
}

export interface MermaidNote {
  type: number;
  message: string;
}

export interface MermaidClassNamespace {
  id: string;
  classes: Record<string, boolean>;
}

export interface MermaidClassDefinition {
  id: string;
  name: string;
  methods?: string[];
  members?: string[];
  annotations?: string[];
}

export interface MermaidClassRelation {
  id: string;
  from: string;
  to: string;
  type: string;
  title?: string;
  relation?: {
    type1: string;
    type2?: string;
    lineCount: number;
  };
}

export interface MermaidClassNote {
  id: string;
  text: string;
  classId?: string;
}
