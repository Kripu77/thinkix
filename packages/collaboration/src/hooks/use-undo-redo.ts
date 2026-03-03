'use client';

import { useCallback, useMemo } from 'react';
import type { PlaitBoard } from '@plait/core';
import { useOptionalCollaborationRoom } from '../adapter/collaboration-context';
import { logger } from '../logger';
import type { UndoState } from '../types';

interface UndoRedoState extends UndoState {
  isCollaborationMode: boolean;
}

interface UndoRedoActions {
  undo: () => void;
  redo: () => void;
}

interface UseUndoRedoReturn extends UndoRedoState, UndoRedoActions {}

export function useUndoRedo(board: PlaitBoard | null): UseUndoRedoReturn {
  const collabRoom = useOptionalCollaborationRoom();
  const isCollaborationMode = !!collabRoom;

  const state = useMemo<UndoRedoState>(() => {
    if (isCollaborationMode) {
      return {
        canUndo: collabRoom.undoState.canUndo,
        canRedo: collabRoom.undoState.canRedo,
        undoStackSize: collabRoom.undoState.undoStackSize,
        redoStackSize: collabRoom.undoState.redoStackSize,
        isCollaborationMode,
      };
    }

    const undoStackSize = board?.history?.undos.length ?? 0;
    const redoStackSize = board?.history?.redos.length ?? 0;

    return {
      canUndo: undoStackSize > 0,
      canRedo: redoStackSize > 0,
      undoStackSize,
      redoStackSize,
      isCollaborationMode,
    };
  }, [board?.history?.undos.length, board?.history?.redos.length, collabRoom, isCollaborationMode]);

  const undo = useCallback(() => {
    if (isCollaborationMode) {
      try {
        collabRoom.undo();
      } catch (error) {
        logger.error('Undo failed in collaboration mode', error instanceof Error ? error : undefined);
      }
    } else if (board) {
      try {
        board.undo();
      } catch (error) {
        logger.error('Undo failed', error instanceof Error ? error : undefined);
      }
    }
  }, [board, collabRoom, isCollaborationMode]);

  const redo = useCallback(() => {
    if (isCollaborationMode) {
      try {
        collabRoom.redo();
      } catch (error) {
        logger.error('Redo failed in collaboration mode', error instanceof Error ? error : undefined);
      }
    } else if (board) {
      try {
        board.redo();
      } catch (error) {
        logger.error('Redo failed', error instanceof Error ? error : undefined);
      }
    }
  }, [board, collabRoom, isCollaborationMode]);

  return {
    ...state,
    undo,
    redo,
  };
}
