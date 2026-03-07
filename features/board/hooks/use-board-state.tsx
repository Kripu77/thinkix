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
  MOBILE_BREAKPOINT,
  CUSTOM_EVENTS,
  STORAGE_KEYS,
} from '@/shared/constants';
import type { BoardState, BoardContextValue, DrawingTool } from '@thinkix/shared';
import type { SaveStatus } from '@thinkix/storage';
import { LaserPointer } from '../utils';
import { setHanddrawn, isHanddrawn } from '../plugins/handdrawn-mode';
import { setIsPenMode } from '../plugins/add-pen-mode';
import posthog from 'posthog-js';

type BoardContextValueTyped = BoardContextValue<PlaitBoard>;

const BoardContext = createContext<BoardContextValueTyped | null>(null);

interface BoardProviderProps {
  children: ReactNode;
}

function getStoredHanddrawn(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEYS.HANDDRAWN) === 'true';
  } catch {
    return false;
  }
}

function setStoredHanddrawn(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HANDDRAWN, String(enabled));
  } catch {
    // Ignore storage errors
  }
}


function detectMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return isMobileUA || (isTouchDevice && isSmallScreen);
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

export function BoardProvider({ children }: BoardProviderProps) {
  const [board, setBoard] = useState<PlaitBoard | null>(null);
  const [state, setState] = useState<BoardState>(() => ({
    activeTool: DEFAULT_TOOL,
    zoom: 100,
    currentBoardId: null,
    saveStatus: 'idle',
    handdrawn: getStoredHanddrawn(),
    isMobile: detectMobile(),
    isPencilMode: false,
  }));

  const boardRef = useRef<PlaitBoard | null>(null);
  const laserPointerRef = useRef<LaserPointer | null>(null);
  const handdrawnAppliedRef = useRef(false);

  useEffect(() => {
    const handleResize = debounce(() => {
      const isMobile = detectMobile();
      setState((prev) => {
        if (prev.isMobile !== isMobile) {
          return { ...prev, isMobile };
        }
        return prev;
      });
    }, 150);

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

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
      const currentBoard = boardRef.current;
      
      setState((prev) => ({ ...prev, activeTool: tool }));

      if (!currentBoard) return;

      posthog.capture('tool_selected', { tool });

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
    const newMode = currentBoard ? !isHanddrawn(currentBoard) : true;
    if (currentBoard) {
      setHanddrawn(currentBoard, newMode);
      setStoredHanddrawn(newMode);
    }
    posthog.capture('handdrawn_mode_toggled', { enabled: newMode });
    setState((prev) => ({ ...prev, handdrawn: newMode }));
  }, []);

  const setPencilMode = useCallback((enabled: boolean) => {
    const currentBoard = boardRef.current;
    if (currentBoard) {
      setIsPenMode(currentBoard, enabled);
    }
    posthog.capture('pencil_mode_toggled', { enabled });
    setState((prev) => ({ ...prev, isPencilMode: enabled }));
  }, []);

  useEffect(() => {
    const handleToolChange = (e: CustomEvent<{ tool: DrawingTool }>) => {
      if (e.detail?.tool) {
        setState((prev) => ({ ...prev, activeTool: e.detail.tool }));
      }
    };

    window.addEventListener(CUSTOM_EVENTS.TOOL_CHANGE, handleToolChange as EventListener);
    return () => {
      window.removeEventListener(CUSTOM_EVENTS.TOOL_CHANGE, handleToolChange as EventListener);
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
      setPencilMode,
    }),
    [board, state, setActiveTool, setCurrentBoardId, setSaveStatus, toggleHanddrawn, setPencilMode]
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
