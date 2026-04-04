import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BoardDto } from './db';

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    open: vi.fn(),
    boards: {
      toArray: vi.fn(),
      get: vi.fn(),
      add: vi.fn(),
      put: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    metadata: {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('./db', () => ({
  db: mockDb,
}));

import {
  useBoardStore,
  type Board,
  type BoardMetadata,
} from './use-board-store';

function createBoardDto(id: string, name: string): BoardDto {
  return {
    id,
    name,
    elements: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    createdAt: 1,
    updatedAt: 1,
  };
}

function createBoard(board: BoardDto): Board {
  return {
    id: board.id,
    name: board.name,
    elements: [],
    viewport: board.viewport,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };
}

function createBoardMetadata(board: BoardDto): BoardMetadata {
  return {
    id: board.id,
    name: board.name,
    elementCount: board.elements.length,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };
}

describe('use-board-store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBoardStore.setState({
      boards: [],
      currentBoard: null,
      isLoading: false,
      saveStatus: 'idle',
    });
  });

  describe('deleteBoard', () => {
    it('switches currentBoard to the next board when deleting the active board', async () => {
      const boardA = createBoardDto('board-a', 'Board A');
      const boardB = createBoardDto('board-b', 'Board B');

      mockDb.boards.get.mockResolvedValue(boardB);
      mockDb.boards.delete.mockResolvedValue(undefined);
      mockDb.metadata.put.mockResolvedValue(undefined);

      useBoardStore.setState({
        boards: [createBoardMetadata(boardA), createBoardMetadata(boardB)],
        currentBoard: createBoard(boardA),
      });

      const nextBoard = await useBoardStore.getState().deleteBoard(boardA.id);

      expect(useBoardStore.getState().boards).toEqual([
        createBoardMetadata(boardB),
      ]);
      expect(useBoardStore.getState().currentBoard).toMatchObject({
        id: boardB.id,
        name: boardB.name,
      });
      expect(nextBoard).toMatchObject({
        id: boardB.id,
        name: boardB.name,
      });
      expect(mockDb.boards.delete).toHaveBeenCalledWith(boardA.id);
      expect(mockDb.metadata.put).toHaveBeenCalledWith({
        key: 'activeBoardId',
        value: boardB.id,
      });
    });

    it('rejects deleting the last remaining board', async () => {
      const board = createBoardDto('board-a', 'Board A');

      useBoardStore.setState({
        boards: [createBoardMetadata(board)],
        currentBoard: createBoard(board),
      });

      await expect(
        useBoardStore.getState().deleteBoard(board.id),
      ).rejects.toThrow('Cannot delete the last board');

      expect(useBoardStore.getState().boards).toEqual([
        createBoardMetadata(board),
      ]);
      expect(useBoardStore.getState().currentBoard).toMatchObject({
        id: board.id,
      });
      expect(mockDb.boards.delete).not.toHaveBeenCalled();
      expect(mockDb.metadata.delete).not.toHaveBeenCalled();
    });

    it('preserves currentBoard when deleting a different board', async () => {
      const boardA = createBoardDto('board-a', 'Board A');
      const boardB = createBoardDto('board-b', 'Board B');

      mockDb.boards.delete.mockResolvedValue(undefined);

      useBoardStore.setState({
        boards: [createBoardMetadata(boardA), createBoardMetadata(boardB)],
        currentBoard: createBoard(boardA),
      });

      const nextBoard = await useBoardStore.getState().deleteBoard(boardB.id);

      expect(useBoardStore.getState().boards).toEqual([
        createBoardMetadata(boardA),
      ]);
      expect(useBoardStore.getState().currentBoard).toMatchObject({
        id: boardA.id,
      });
      expect(nextBoard).toMatchObject({
        id: boardA.id,
        name: boardA.name,
      });
      expect(mockDb.metadata.put).not.toHaveBeenCalled();
      expect(mockDb.metadata.delete).not.toHaveBeenCalled();
    });
  });
});
