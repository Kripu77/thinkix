'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { db, type BoardDto } from './db';
import type { PlaitElement } from '@plait/core';

export interface BoardMetadata {
  id: string;
  name: string;
  elementCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Board {
  id: string;
  name: string;
  elements: PlaitElement[];
  viewport: { x: number; y: number; zoom: number };
  createdAt: number;
  updatedAt: number;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface BoardState {
  boards: BoardMetadata[];
  currentBoard: Board | null;
  isLoading: boolean;
  saveStatus: SaveStatus;
}

interface BoardActions {
  initialize: () => Promise<void>;
  createBoard: (name: string) => Promise<Board>;
  switchBoard: (id: string) => Promise<Board | null>;
  deleteBoard: (id: string) => Promise<Board | null>;
  renameBoard: (id: string, name: string) => Promise<void>;
  saveBoard: (board: Board) => Promise<void>;
  setSaveStatus: (status: SaveStatus) => void;
}

type BoardStore = BoardState & BoardActions;

function mapBoardDtoToBoard(boardDto: BoardDto): Board {
  return {
    id: boardDto.id,
    name: boardDto.name,
    elements: boardDto.elements as PlaitElement[],
    viewport: boardDto.viewport,
    createdAt: boardDto.createdAt,
    updatedAt: boardDto.updatedAt,
  };
}

function toBoardMetadata(board: Board): BoardMetadata {
  return {
    id: board.id,
    name: board.name,
    elementCount: board.elements.length,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };
}

function upsertBoardMetadata(
  boards: BoardMetadata[],
  nextBoard: BoardMetadata,
): BoardMetadata[] {
  const existingIndex = boards.findIndex((board) => board.id === nextBoard.id);
  if (existingIndex === -1) {
    return [...boards, nextBoard];
  }

  return boards.map((board, index) =>
    index === existingIndex ? nextBoard : board,
  );
}

export const useBoardStore = create<BoardStore>()(
  subscribeWithSelector((set, get) => ({
    boards: [],
    currentBoard: null,
    isLoading: true,
    saveStatus: 'idle',

    initialize: async () => {
      try {
        await db.open();

        const allBoards = await db.boards.toArray();
        const boardMetadata: BoardMetadata[] = allBoards.map((b) =>
          toBoardMetadata(mapBoardDtoToBoard(b)),
        );

        const activeIdMeta = await db.metadata.get('activeBoardId');
        const activeId = activeIdMeta?.value;

        let activeBoard: Board | null = null;
        if (activeId) {
          const boardDto = await db.boards.get(activeId);
          if (boardDto) {
            activeBoard = mapBoardDtoToBoard(boardDto);
          }
        }

        if (!activeBoard && boardMetadata.length > 0) {
          const firstBoardDto = await db.boards.get(boardMetadata[0].id);
          if (firstBoardDto) {
            activeBoard = mapBoardDtoToBoard(firstBoardDto);
            await db.metadata.put({ key: 'activeBoardId', value: firstBoardDto.id });
          }
        }

        if (!activeBoard && boardMetadata.length === 0) {
          const now = Date.now();
          const newBoard: Board = {
            id: crypto.randomUUID(),
            name: 'My Board',
            elements: [],
            viewport: { x: 0, y: 0, zoom: 1 },
            createdAt: now,
            updatedAt: now,
          };
          await db.boards.add(newBoard as BoardDto);
          await db.metadata.put({ key: 'activeBoardId', value: newBoard.id });
          boardMetadata.push(toBoardMetadata(newBoard));
          activeBoard = newBoard;
        }

        set({ boards: boardMetadata, currentBoard: activeBoard, isLoading: false });
      } catch (error) {
        console.error('Failed to initialize board store:', error);
        set({ isLoading: false });
      }
    },

    createBoard: async (name: string) => {
      const now = Date.now();
      const newBoard: Board = {
        id: crypto.randomUUID(),
        name,
        elements: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        createdAt: now,
        updatedAt: now,
      };

      await db.boards.add(newBoard as BoardDto);
      await db.metadata.put({ key: 'activeBoardId', value: newBoard.id });

      set((state) => ({
        boards: upsertBoardMetadata(state.boards, toBoardMetadata(newBoard)),
        currentBoard: newBoard,
      }));

      return newBoard;
    },

    switchBoard: async (id: string) => {
      const boardDto = await db.boards.get(id);
      if (!boardDto) return null;

      const board = mapBoardDtoToBoard(boardDto);

      await db.metadata.put({ key: 'activeBoardId', value: id });
      set({ currentBoard: board });

      return board;
    },

    deleteBoard: async (id: string) => {
      const state = get();
      const boardToDelete = state.boards.find((board) => board.id === id);
      if (!boardToDelete) {
        return state.currentBoard;
      }

      if (state.boards.length <= 1) {
        throw new Error('Cannot delete the last board');
      }

      const newBoards = state.boards.filter((board) => board.id !== id);
      const deletingActiveBoard = state.currentBoard?.id === id;

      let nextBoard: Board | null = deletingActiveBoard ? null : state.currentBoard;
      const nextBoardMetadata = deletingActiveBoard ? newBoards[0] : null;

      if (nextBoardMetadata) {
        const nextBoardDto = await db.boards.get(nextBoardMetadata.id);
        nextBoard = nextBoardDto ? mapBoardDtoToBoard(nextBoardDto) : null;
      }

      if (deletingActiveBoard && !nextBoard) {
        throw new Error(`Failed to resolve fallback board after deleting ${boardToDelete.name}`);
      }

      await db.boards.delete(id);

      if (deletingActiveBoard) {
        await db.metadata.put({ key: 'activeBoardId', value: nextBoard!.id });
      }

      set({
        boards: newBoards,
        currentBoard: deletingActiveBoard ? nextBoard : state.currentBoard,
      });

      return deletingActiveBoard ? nextBoard : state.currentBoard;
    },

    renameBoard: async (id: string, name: string) => {
      const updatedAt = Date.now();
      await db.boards.update(id, { name, updatedAt });

      set((state) => ({
        boards: state.boards.map((b) =>
          b.id === id ? { ...b, name, updatedAt } : b,
        ),
        currentBoard:
          state.currentBoard?.id === id
            ? { ...state.currentBoard, name, updatedAt }
            : state.currentBoard,
      }));
    },

    saveBoard: async (board: Board) => {
      set({ saveStatus: 'saving' });
      try {
        await db.boards.put(board as BoardDto);
        set((state) => ({
          saveStatus: 'saved',
          boards: upsertBoardMetadata(state.boards, toBoardMetadata(board)),
          currentBoard:
            state.currentBoard?.id === board.id
              ? board
              : state.currentBoard,
        }));
        setTimeout(() => set({ saveStatus: 'idle' }), 2000);
      } catch (error) {
        console.error('Failed to save board:', error);
        set({ saveStatus: 'error' });
        setTimeout(() => set({ saveStatus: 'idle' }), 3000);
      }
    },

    setSaveStatus: (status: SaveStatus) => set({ saveStatus: status }),
  }))
);
