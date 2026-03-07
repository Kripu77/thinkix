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

/**
 * HACK: Monkey-patch BoardTransforms.updatePointerType to emit custom events
 *
 * This is necessary because Plait doesn't provide tool change hooks.
 * We wrap the original function to dispatch 'thinkix:toolchange' events
 * when the pointer type transitions to selection mode.
 *
 * This enables UI components (like BoardToolbar) to react to tool changes
 * triggered by Plait's internal logic (e.g., after creating a sticky note).
 *
 * TODO: Monitor Plait library updates for native event support
 */
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
