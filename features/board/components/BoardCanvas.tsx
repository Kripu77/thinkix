'use client';

import { useState, useEffect, type ReactNode, useMemo, useCallback } from 'react';
import { Board, Wrapper, type BoardChangeData, withPinchZoom, useListRender, useBoard } from '@plait-board/react-board';
import {
  type PlaitElement,
  type PlaitBoardOptions,
  type PlaitPlugin,
  PlaitBoard,
  type PlaitTheme,
  ThemeColorMode,
} from '@plait/core';
import { withGroup, withText } from '@plait/common';
import { withDraw } from '@plait/draw';
import { withMind, MindThemeColors } from '@plait/mind';
import { addPenMode } from '../plugins/add-pen-mode';
import { addImageRenderer } from '../plugins/add-image-renderer';
import { addEmojiRenderer } from '../plugins/add-emoji-renderer';
import { addMindNodeResize } from '../plugins/add-mind-node-resize';
import { addImageInteractions } from '../plugins/add-image-interactions';
import { addTextRenderer } from '../plugins/add-text-renderer';
import { withTextNormalization } from '../plugins/with-text-normalization';
import { withScribble } from '../plugins/scribble';
import { withEraser } from '../plugins/with-eraser';
import { withStickyNote } from '../plugins/with-sticky-note';
import { withHanddrawn } from '../plugins/handdrawn-mode';
import { withToolSync } from '../plugins/with-tool-sync';
import { withGrid } from '../grid';
import { useBoardState } from '../hooks/use-board-state';
import { DRAWING_TOOLS } from '@/shared/constants';
import { SelectionToolbar, ZoomToolbar } from '@/features/toolbar';
import { GridToolbar } from '../grid/components';
import { useAutoSave } from '@/features/storage';
import { PencilModeIndicator } from './PencilModeIndicator';
import type { Board as StorageBoard } from '@thinkix/storage';
import { useOptionalSyncBus, type BoardElement, validateBoardElements, logger } from '@thinkix/collaboration';

import '@/app/styles/plait-react-board.css';

export interface BoardCanvasProps {
  initialValue?: PlaitElement[];
  className?: string;
  children?: ReactNode;
  boardData?: StorageBoard | null;
}

const DEFAULT_BOARD_OPTIONS: PlaitBoardOptions = {
  readonly: false,
  hideScrollbar: false,
  disabledScrollOnNonFocus: false,
  themeColors: MindThemeColors,
};

const DEFAULT_THEME: PlaitTheme = {
  themeColorMode: ThemeColorMode.default,
};

const createPlugins = (onPencilModeChange?: (isPencilMode: boolean) => void): PlaitPlugin[] => [
  withGrid,
  withDraw,
  withTextNormalization(),
  withText,
  addTextRenderer,
  addImageRenderer,
  withGroup,
  withMind,
  addEmojiRenderer,
  addMindNodeResize,
  (board: PlaitBoard) => addPenMode(board, onPencilModeChange),
  addImageInteractions,
  withScribble,
  withEraser,
  withStickyNote,
  withHanddrawn,
  withToolSync,
  withPinchZoom,
];

function RemoteSyncHandler({ onElementsChange }: { onElementsChange: (elements: PlaitElement[]) => void }) {
  const board = useBoard();
  const listRender = useListRender();
  const syncBusContext = useOptionalSyncBus();

  useEffect(() => {
    if (!syncBusContext) return;
    
    const unsubscribe = syncBusContext.syncBus.subscribeToRemoteChanges((elements: BoardElement[]) => {
      onElementsChange(elements);
      listRender.update(elements, {
        board: board,
        parent: board,
        parentG: PlaitBoard.getElementHost(board),
      });
    });

    return unsubscribe;
  }, [board, listRender, onElementsChange, syncBusContext]);

  return null;
}

export function BoardCanvas({
  initialValue = [],
  className,
  children,
  boardData,
}: BoardCanvasProps) {
  const { board, setBoard, state, setCurrentBoardId, setPencilMode } = useBoardState();
  const syncBusContext = useOptionalSyncBus();
  
  const initialElements = useMemo(() => {
    return boardData?.elements ?? initialValue;
  }, [boardData?.elements, initialValue]);

  const [value, setValue] = useState<PlaitElement[]>(initialElements);

  useEffect(() => {
    if (boardData) {
      setCurrentBoardId(boardData.id);
    }
  }, [boardData, setCurrentBoardId]);

  useEffect(() => {
    setValue(initialElements);
  }, [initialElements]);

  useAutoSave({
    board: board,
    enabled: !!boardData,
  });

  const handleChange = (data: BoardChangeData) => {
    setValue(data.children);
    
    if (!syncBusContext) {
      logger.debug('SyncBus not available, skipping sync');
      return;
    }
    
    const { valid, invalid } = validateBoardElements(data.children);
    if (invalid.length > 0) {
      logger.warn(`Skipped ${invalid.length} invalid board elements`, { invalidCount: invalid.length });
    }
    syncBusContext.emitLocalChange(valid);
  };

  const handleBoardInit = (board: PlaitBoard) => {
    setBoard(board);
  };

  const handlePencilModeChange = useCallback((isPencilMode: boolean) => {
    setPencilMode(isPencilMode);
  }, [setPencilMode]);

  const plugins = useMemo(() => createPlugins(handlePencilModeChange), [handlePencilModeChange]);

  const getCursorClass = () => {
    const tool = state.activeTool;
    if (tool === 'eraser') return 'eraser-cursor';
    if (tool === 'hand') return 'pan-cursor';
    if (DRAWING_TOOLS.has(tool) || tool === 'text' || tool === 'stickyNote') {
      return 'crosshair-cursor';
    }
    return '';
  };

  const boardCursorClass = getCursorClass();

  return (
    <div className={`relative w-full h-full board-wrapper ${className || ''} ${boardCursorClass}`}>
      <Wrapper
        key={boardData?.id ?? 'default'}
        value={value}
        options={DEFAULT_BOARD_OPTIONS}
        plugins={plugins}
        theme={DEFAULT_THEME}
        onChange={handleChange}
      >
        <div data-board="true" className="w-full h-full">
          <Board
            className="w-full h-full bg-background"
            afterInit={handleBoardInit}
          />
        </div>
        <RemoteSyncHandler onElementsChange={setValue} />
        <PencilModeIndicator />
        <SelectionToolbar />
        <ZoomToolbar />
        <GridToolbar />
        {children}
      </Wrapper>
    </div>
  );
}
