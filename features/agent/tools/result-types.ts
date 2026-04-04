export type CommandResultKind =
  | 'board-list'
  | 'board-location'
  | 'board-switch'
  | 'board-create'
  | 'board-delete'
  | 'element-list'
  | 'element-read'
  | 'element-mutate'
  | 'selection'
  | 'search'
  | 'info'
  | 'error';

export interface BoardReferenceData {
  id: string;
  name: string;
  path: string;
}

export interface BoardListEntryData extends BoardReferenceData {
  elementCount: number;
  isCurrent: boolean;
}

export interface BoardListData {
  boards: BoardListEntryData[];
  currentBoardId: string | null;
}

export interface BoardLocationData {
  path: string;
  board: BoardReferenceData | null;
}

export interface BoardSwitchData {
  board: BoardReferenceData;
}

export interface BoardCreateData {
  board: BoardReferenceData;
}

export interface BoardDeleteData {
  deletedBoard: BoardReferenceData;
  activeBoard: BoardReferenceData | null;
}

export interface ElementEntryData {
  id: string;
  type: string;
  category: string;
  label: string;
  raw: string;
}

export interface DiagramEntryData {
  id: string;
  label: string;
  shapeCount: number;
  lineCount: number;
  shapes: ElementEntryData[];
  lines: ElementEntryData[];
  other: ElementEntryData[];
}

export interface ElementListData {
  diagrams: DiagramEntryData[];
  standalone: ElementEntryData[];
}

export type CommandResultData =
  | BoardListData
  | BoardLocationData
  | BoardSwitchData
  | BoardCreateData
  | BoardDeleteData
  | ElementListData;

export interface RunToolOutput {
  type: 'run-result';
  text: string;
  exitCode: number;
  durationMs: number;
  kind: CommandResultKind;
  summary: string;
  data?: CommandResultData;
}
