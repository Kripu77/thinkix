import type { PlaitBoard } from '@plait/core';
import type { PlaitMindBoard, MindElement } from '@plait/mind';
import { MindTransforms } from '@plait/mind';

export interface CreateMindmapData {
  mindMapData: MindElement;
}

export interface AddNodeData {
  text: string;
  position: [number, number];
  parentId?: string;
}

export interface UpdateNodeData {
  nodeId: string;
  width?: number;
  height?: number;
  text?: string;
}

export interface DeleteSelectionData {
  nodeIds: string[];
}

export type CanvasCommandData = CreateMindmapData | AddNodeData | UpdateNodeData | DeleteSelectionData;

export interface CanvasCommand {
  type: 'createMindmap' | 'addNode' | 'addEdge' | 'updateNode' | 'deleteSelection';
  data: CanvasCommandData;
}

export interface MindmapNodeData {
  text: string;
  position: [number, number];
  parentId?: string;
}

export function executeCommand(board: PlaitBoard, command: CanvasCommand): void {
  switch (command.type) {
    case 'createMindmap':
      MindTransforms.insertMind(board as PlaitMindBoard, (command.data as CreateMindmapData).mindMapData);
      break;
    case 'addNode':
      break;
    case 'updateNode':
      break;
    case 'deleteSelection':
      break;
  }
}
