'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { Board, Wrapper, type BoardChangeData } from '@plait-board/react-board';
import {
  type PlaitElement,
  type PlaitBoardOptions,
  type PlaitPlugin,
  type PlaitBoard,
  type PlaitTheme,
  ThemeColorMode,
  withSelection,
  withHistory,
  withHotkey,
} from '@plait/core';
import { withGroup, withText } from '@plait/common';
import { withDraw } from '@plait/draw';
import { withMind, MindThemeColors } from '@plait/mind';
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
import { asPlaitPlugin } from '@thinkix/plait-utils/plugin-utils';
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


export function BoardCanvas({
  initialValue = [],
  className,
  children,
  boardData,
}: BoardCanvasProps) {
  const { board, setBoard, setCurrentBoardId } = useBoardState();
  const [value, setValue] = useState<PlaitElement[]>(initialValue);

  const plugins: PlaitPlugin[] = [
    asPlaitPlugin(withTextNormalization()),
    withText,
    asPlaitPlugin(addTextRenderer),
    withSelection,
    withDraw,
    withGroup,
    withMind,
    addEmojiRenderer,
    asPlaitPlugin(addMindNodeResize),
    withHistory,
    withHotkey,
    addPenMode,
    addImageInteractions,
    withScribble,
    withEraser,
    withStickyNote,
    withHanddrawn,
  ];

  const handleChange = (data: BoardChangeData) => {
    setValue(data.children);
  };

  const handleBoardInit = (board: PlaitBoard) => {
    setBoard(board);
  };

  useEffect(() => {
    if (boardData) {
      setValue(boardData.elements);
      setCurrentBoardId(boardData.id);
    }
  }, [boardData, setCurrentBoardId]);

  useAutoSave({
    board: board,
    enabled: !!boardData,
  });

  return (
    <div className={`relative w-full h-full board-wrapper ${className || ''}`}>
      <Wrapper
        key={boardData?.id ?? 'default'}
        value={value}
        options={DEFAULT_BOARD_OPTIONS}
        plugins={plugins}
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
