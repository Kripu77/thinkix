'use client';

import { useState, useEffect, type ReactNode, useMemo } from 'react';
import { Board, Wrapper, type BoardChangeData } from '@plait-board/react-board';
import {
  type PlaitElement,
  type PlaitBoardOptions,
  type PlaitPlugin,
  type PlaitBoard,
  type PlaitTheme,
  ThemeColorMode,
} from '@plait/core';
import { withGroup, withText } from '@plait/common';
import { withDraw } from '@plait/draw';
import { withMind, MindThemeColors } from '@plait/mind';
import { addImageRenderer } from '../plugins/add-image-renderer';
import { addEmojiRenderer } from '../plugins/add-emoji-renderer';
import { addMindNodeResize } from '../plugins/add-mind-node-resize';
import { addPenMode } from '../plugins/add-pen-mode';
import { addImageInteractions } from '../plugins/add-image-interactions';
import { addTextRenderer } from '../plugins/add-text-renderer';
import { withTextNormalization } from '../plugins/with-text-normalization';
import { withScribble } from '../plugins/scribble';
import { withEraser } from '../plugins/with-eraser';
import { withStickyNote } from '../plugins/with-sticky-note';
import { withHanddrawn } from '../plugins/handdrawn-mode';
import { useBoardState } from '../hooks/use-board-state';
import { SelectionToolbar, ZoomToolbar } from '@/features/toolbar';
import { useAutoSave } from '@/features/storage';
import type { Board as StorageBoard } from '@thinkix/storage';

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

const createPlugins = (): PlaitPlugin[] => [
  withDraw,
  withTextNormalization(),
  withText,
  addTextRenderer,
  addImageRenderer,
  withGroup,
  withMind,
  addEmojiRenderer,
  addMindNodeResize,
  addPenMode,
  addImageInteractions,
  withScribble,
  withEraser,
  withStickyNote,
  withHanddrawn,
];

export function BoardCanvas({
  initialValue = [],
  className,
  children,
  boardData,
}: BoardCanvasProps) {
  const { board, setBoard, setCurrentBoardId } = useBoardState();
  
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
  };

  const handleBoardInit = (board: PlaitBoard) => {
    setBoard(board);
  };

  return (
    <div className={`relative w-full h-full board-wrapper ${className || ''}`}>
      <Wrapper
        key={boardData?.id ?? 'default'}
        value={value}
        options={DEFAULT_BOARD_OPTIONS}
        plugins={createPlugins()}
        theme={DEFAULT_THEME}
        onChange={handleChange}
      >
        <Board
          className="w-full h-full bg-background"
          afterInit={handleBoardInit}
        />
        <SelectionToolbar />
        <ZoomToolbar />
        {children}
      </Wrapper>
    </div>
  );
}
