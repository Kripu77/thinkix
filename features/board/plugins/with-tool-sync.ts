import {
  PlaitBoard,
  PlaitPlugin,
  PlaitPointerType,
  BoardTransforms,
} from '@plait/core';
import { CUSTOM_EVENTS } from '@/shared/constants';

const boardPointerStates = new WeakMap<PlaitBoard, string | undefined>();
let isPatched = false;
const originalUpdatePointerType = BoardTransforms.updatePointerType;


function patchUpdatePointerType() {
  if (isPatched) return;
  
  try {
    isPatched = true;

    BoardTransforms.updatePointerType = <T extends string>(board: PlaitBoard, pointer: T) => {
      const previousPointer = boardPointerStates.get(board);
      originalUpdatePointerType(board, pointer);
      boardPointerStates.set(board, pointer);

      if (
        previousPointer &&
        previousPointer !== PlaitPointerType.selection &&
        pointer === PlaitPointerType.selection
      ) {
        window.dispatchEvent(
          new CustomEvent(CUSTOM_EVENTS.TOOL_CHANGE, {
            detail: { tool: 'select' },
          })
        );
      }
    };
  } catch (error) {
    console.error('Failed to patch updatePointerType:', error);
    isPatched = false;
  }
}

export const withToolSync: PlaitPlugin = (board: PlaitBoard) => {
  patchUpdatePointerType();
  boardPointerStates.set(board, board.pointer);
  return board;
};
