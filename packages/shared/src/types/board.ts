import type { DrawingTool } from './tools';
import type { SaveStatus } from '@thinkix/storage';

export interface BoardState {
  activeTool: DrawingTool;
  zoom: number;
  currentBoardId: string | null;
  saveStatus: SaveStatus;
  handdrawn: boolean;
  isMobile: boolean;
  isPencilMode: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface BoardContextValue<T = any> {
  board: T | null;
  setBoard: React.Dispatch<React.SetStateAction<T | null>>;
  state: BoardState;
  setState: React.Dispatch<React.SetStateAction<BoardState>>;
  setActiveTool: (tool: DrawingTool) => void;
  setCurrentBoardId: (id: string | null) => void;
  setSaveStatus: (status: SaveStatus) => void;
  toggleHanddrawn: () => void;
  setPencilMode: (enabled: boolean) => void;
}
