import type { MermaidDiagramData, MermaidToBoardResult } from '../types';
import { transformFlowchartToBoard, type ThinkixConfig } from './flowchart';
import { transformSequenceToBoard } from './sequence';
import { transformClassToBoard } from './class';

export { transformFlowchartToBoard } from './flowchart';
export { transformSequenceToBoard } from './sequence';
export { transformClassToBoard } from './class';

export async function transformToBoard(
  data: MermaidDiagramData,
  config?: ThinkixConfig
): Promise<MermaidToBoardResult> {
  switch (data.type) {
    case 'flowchart':
      return await transformFlowchartToBoard(data, config);
    case 'sequence':
      return await transformSequenceToBoard(data);
    case 'class':
      return await transformClassToBoard(data);
    case 'graphImage':
      return { elements: [data], warnings: [] };
    default: {
      const exhaustiveCheck: never = data;
      void exhaustiveCheck;
      return {
        elements: [],
        warnings: [`Unsupported diagram type`],
      };
    }
  }
}

export type { ThinkixConfig } from './flowchart';
