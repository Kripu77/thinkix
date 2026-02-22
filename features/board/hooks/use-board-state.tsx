'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { PlaitPointerType, BoardTransforms, type PlaitBoard } from '@plait/core';
import { BoardCreationMode, setCreationMode, selectImage } from '@plait/common';
import { DrawTransforms } from '@plait/draw';
import {
  TOOL_TO_POINTER,
  DRAWING_TOOLS,
  DEFAULT_TOOL,
  STICKY_NOTE_POINTER,
} from '@/shared/constants';
import type { BoardState, BoardContextValue, DrawingTool } from '@thinkix/shared';
import type { SaveStatus } from '@thinkix/storage';
import { LaserPointer } from '../utils';
import { setHanddrawn, isHanddrawn } from '../plugins/handdrawn-mode';

type BoardContextValueTyped = BoardContextValue<PlaitBoard>;

const BoardContext = createContext<BoardContextValueTyped | null>(null);

interface BoardProviderProps {
  children: ReactNode;
}

const HANDDRAWN_STORAGE_KEY = 'thinkix:handdrawn';

function getStoredHanddrawn(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(HANDDRAWN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function setStoredHanddrawn(enabled: boolean): void {
  try {
    localStorage.setItem(HANDDRAWN_STORAGE_KEY, String(enabled));
  } catch {
    // Ignore storage errors
  }
}


export function BoardProvider({ children }: BoardProviderProps) {
  const [board, setBoard] = useState<PlaitBoard | null>(null);
  const [state, setState] = useState<BoardState>({
    activeTool: DEFAULT_TOOL,
    zoom: 100,
    currentBoardId: null,
    saveStatus: 'idle',
    handdrawn: getStoredHanddrawn(),
  });

  const boardRef = useRef<PlaitBoard | null>(null);
  const laserPointerRef = useRef<LaserPointer | null>(null);
  const handdrawnAppliedRef = useRef(false);

  useEffect(() => {
    boardRef.current = board;
    
    if (board && state.handdrawn && !handdrawnAppliedRef.current) {
      setHanddrawn(board, true, 'excalidraw');
      handdrawnAppliedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  const setActiveTool = useCallback(
    (tool: DrawingTool) => {
      setState((prev) => ({ ...prev, activeTool: tool }));

      const currentBoard = boardRef.current;
      if (!currentBoard) return;

      if (laserPointerRef.current) {
        laserPointerRef.current.destroy();
        laserPointerRef.current = null;
      }

      if (tool === 'image') {
        selectImage(currentBoard, 400, (imageItem) => {
          DrawTransforms.insertImage(currentBoard, imageItem);
          setState((prev) => ({ ...prev, activeTool: DEFAULT_TOOL }));
          BoardTransforms.updatePointerType(currentBoard, PlaitPointerType.selection);
        });
        return;
      }

      if (tool === 'laser') {
        BoardTransforms.updatePointerType(currentBoard, PlaitPointerType.hand);
        setCreationMode(currentBoard, BoardCreationMode.dnd);
        laserPointerRef.current = new LaserPointer();
        laserPointerRef.current.init(currentBoard);
        return;
      }

      if (tool === 'eraser') {
        BoardTransforms.updatePointerType(currentBoard, 'eraser');
        setCreationMode(currentBoard, BoardCreationMode.drawing);
        return;
      }

      if (tool === 'stickyNote') {
        BoardTransforms.updatePointerType(currentBoard, STICKY_NOTE_POINTER);
        setCreationMode(currentBoard, BoardCreationMode.drawing);
        return;
      }

      const pointerType = TOOL_TO_POINTER[tool];
      BoardTransforms.updatePointerType(currentBoard, pointerType);

      if (DRAWING_TOOLS.has(tool)) {
        setCreationMode(currentBoard, BoardCreationMode.drawing);
      } else {
        setCreationMode(currentBoard, BoardCreationMode.dnd);
      }
    },
    []
  );

  const setCurrentBoardId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, currentBoardId: id }));
  }, []);

  const setSaveStatus = useCallback((status: SaveStatus) => {
    setState((prev) => ({ ...prev, saveStatus: status }));
  }, []);

  const toggleHanddrawn = useCallback(() => {
    const currentBoard = boardRef.current;
    if (currentBoard) {
      const newMode = !isHanddrawn(currentBoard);
      setHanddrawn(currentBoard, newMode);
      setStoredHanddrawn(newMode);
    }
    setState((prev) => ({ ...prev, handdrawn: !prev.handdrawn }));
  }, []);

  useEffect(() => {
    const handleToolChange = (e: CustomEvent<{ tool: DrawingTool }>) => {
      if (e.detail?.tool) {
        setState((prev) => ({ ...prev, activeTool: e.detail.tool }));
      }
    };

    window.addEventListener('thinkix:toolchange', handleToolChange as EventListener);
    return () => {
      window.removeEventListener('thinkix:toolchange', handleToolChange as EventListener);
    };
  }, []);

  const value = useMemo<BoardContextValue>(
    () => ({
      board,
      setBoard,
      state,
      setState,
      setActiveTool,
      setCurrentBoardId,
      setSaveStatus,
      toggleHanddrawn,
    }),
    [board, state, setActiveTool, setCurrentBoardId, setSaveStatus, toggleHanddrawn]
  );

  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
}


export function useBoardState(): BoardContextValueTyped {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardState must be used within BoardProvider');
  }
  return context;
}
