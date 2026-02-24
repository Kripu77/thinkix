import { isPencilEvent, PlaitBoard } from '@plait/core';

const PEN_MODE_BOARDS = new WeakMap<PlaitBoard, boolean>();

export function isPenModeActive(board: PlaitBoard): boolean {
  return PEN_MODE_BOARDS.get(board) === true;
}

export function setIsPenMode(board: PlaitBoard, enabled: boolean): void {
  PEN_MODE_BOARDS.set(board, enabled);
}

type PenModeChangeCallback = (isPencilMode: boolean) => void;

function isTouchEvent(event: PointerEvent): boolean {
  return event.pointerType === 'touch';
}

export function addPenMode(board: PlaitBoard, onPencilModeChange?: PenModeChangeCallback): PlaitBoard {
  const { pointerDown } = board;

  board.pointerDown = (event: PointerEvent) => {
    const isPenInput = isPencilEvent(event);
    const currentlyInPenMode = isPenModeActive(board);

    if (isPenInput && !currentlyInPenMode) {
      setIsPenMode(board, true);
      onPencilModeChange?.(true);
    }

    if (currentlyInPenMode && !isPenInput && isTouchEvent(event)) {
      return;
    }

    pointerDown(event);
  };

  return board;
}
