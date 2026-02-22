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
  deleteBoard: (id: string) => Promise<void>;
  renameBoard: (id: string, name: string) => Promise<void>;
  saveBoard: (board: Board) => Promise<void>;
  setSaveStatus: (status: SaveStatus) => void;
}

type BoardStore = BoardState & BoardActions;

export const useBoardStore = create<BoardStore>()(
  subscribeWithSelector((set) => ({
    boards: [],
    currentBoard: null,
    isLoading: true,
    saveStatus: 'idle',

    initialize: async () => {
      try {
        await db.open();

        const allBoards = await db.boards.toArray();
        const boardMetadata: BoardMetadata[] = allBoards.map((b) => ({
          id: b.id,
          name: b.name,
          elementCount: b.elements.length,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        }));

        const activeIdMeta = await db.metadata.get('activeBoardId');
        const activeId = activeIdMeta?.value;

        let activeBoard: Board | null = null;
        if (activeId) {
          const boardDto = await db.boards.get(activeId);
          if (boardDto) {
            activeBoard = {
              id: boardDto.id,
              name: boardDto.name,
              elements: boardDto.elements as PlaitElement[],
              viewport: boardDto.viewport,
              createdAt: boardDto.createdAt,
              updatedAt: boardDto.updatedAt,
            };
          }
        }

        if (!activeBoard && boardMetadata.length > 0) {
          const firstBoardDto = await db.boards.get(boardMetadata[0].id);
          if (firstBoardDto) {
            activeBoard = {
              id: firstBoardDto.id,
              name: firstBoardDto.name,
              elements: firstBoardDto.elements as PlaitElement[],
              viewport: firstBoardDto.viewport,
              createdAt: firstBoardDto.createdAt,
              updatedAt: firstBoardDto.updatedAt,
            };
            await db.metadata.put({ key: 'activeBoardId', value: firstBoardDto.id });
          }
        }

        // If no boards at all, create a default one
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
          boardMetadata.push({
            id: newBoard.id,
            name: newBoard.name,
            elementCount: 0,
            createdAt: now,
            updatedAt: now,
          });
          activeBoard = newBoard;
        }

        set({ boards: boardMetadata, currentBoard: activeBoard, isLoading: false });
      } catch (error) {
        console.error('Failed to initialize board store:', error);
        set({ isLoading: false });
      }
    },

    // Create a new board
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
        boards: [
          ...state.boards,
          {
            id: newBoard.id,
            name: newBoard.name,
            elementCount: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
        currentBoard: newBoard,
      }));

      return newBoard;
    },

    // Switch to a different board
    switchBoard: async (id: string) => {
      const boardDto = await db.boards.get(id);
      if (!boardDto) return null;

      const board: Board = {
        id: boardDto.id,
        name: boardDto.name,
        elements: boardDto.elements as PlaitElement[],
        viewport: boardDto.viewport,
        createdAt: boardDto.createdAt,
        updatedAt: boardDto.updatedAt,
      };

      await db.metadata.put({ key: 'activeBoardId', value: id });
      set({ currentBoard: board });

      return board;
    },

    // Delete a board
    deleteBoard: async (id: string) => {
      await db.boards.delete(id);

      set((state) => {
        const newBoards = state.boards.filter((b) => b.id !== id);

        // If we deleted the active board, switch to another
        if (state.currentBoard?.id === id && newBoards.length > 0) {
          db.metadata.put({ key: 'activeBoardId', value: newBoards[0].id });
          // Note: the actual board switch will happen on next render
          // or the caller can call switchBoard
        } else if (newBoards.length === 0) {
          db.metadata.delete('activeBoardId');
        }

        return { boards: newBoards };
      });
    },

    // Rename a board
    renameBoard: async (id: string, name: string) => {
      await db.boards.update(id, { name, updatedAt: Date.now() });

      set((state) => ({
        boards: state.boards.map((b) => (b.id === id ? { ...b, name } : b)),
        currentBoard:
          state.currentBoard?.id === id
            ? { ...state.currentBoard, name }
            : state.currentBoard,
      }));
    },

    // Save board (auto-save)
    saveBoard: async (board: Board) => {
      set({ saveStatus: 'saving' });
      try {
        await db.boards.put(board as BoardDto);
        set({ saveStatus: 'saved' });
        setTimeout(() => set({ saveStatus: 'idle' }), 2000);
      } catch (error) {
        console.error('Failed to save board:', error);
        set({ saveStatus: 'error' });
        setTimeout(() => set({ saveStatus: 'idle' }), 3000);
      }
    },

    // Set save status directly
    setSaveStatus: (status: SaveStatus) => set({ saveStatus: status }),
  }))
);
