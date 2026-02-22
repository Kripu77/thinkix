import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface BoardMetadata {
  id: string;
  name: string;
  elementCount: number;
  createdAt: number;
  updatedAt: number;
}

interface Board {
  id: string;
  name: string;
  elements: unknown[];
  viewport: { x: number; y: number; zoom: number };
  createdAt: number;
  updatedAt: number;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface BoardStore {
  boards: BoardMetadata[];
  currentBoard: Board | null;
  isLoading: boolean;
  saveStatus: SaveStatus;
  createBoard: (name: string) => Promise<Board>;
  deleteBoard: (id: string) => void;
  renameBoard: (id: string, name: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setCurrentBoard: (board: Board | null) => void;
}

const createTestStore = () => {
  return create<BoardStore>()(
    subscribeWithSelector((set) => ({
      boards: [],
      currentBoard: null,
      isLoading: false,
      saveStatus: 'idle',

      createBoard: async (name: string) => {
        const board: Board = {
          id: `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          elements: [],
          viewport: { x: 0, y: 0, zoom: 1 },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const metadata: BoardMetadata = {
          id: board.id,
          name: board.name,
          elementCount: 0,
          createdAt: board.createdAt,
          updatedAt: board.updatedAt,
        };
        set((state) => ({ boards: [...state.boards, metadata] }));
        return board;
      },

      deleteBoard: (id: string) => {
        set((state) => ({
          boards: state.boards.filter((b) => b.id !== id),
          currentBoard: state.currentBoard?.id === id ? null : state.currentBoard,
        }));
      },

      renameBoard: (id: string, name: string) => {
        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === id ? { ...b, name, updatedAt: Date.now() } : b
          ),
        }));
      },

      setSaveStatus: (status) => set({ saveStatus: status }),

      setCurrentBoard: (board) => set({ currentBoard: board }),
    }))
  );
};

describe('storage/use-board-store', () => {
  let useStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    useStore = createTestStore();
  });

  describe('initial state', () => {
    it('should have empty boards array initially', () => {
      expect(useStore.getState().boards).toEqual([]);
    });

    it('should have null currentBoard initially', () => {
      expect(useStore.getState().currentBoard).toBeNull();
    });

    it('should have idle saveStatus initially', () => {
      expect(useStore.getState().saveStatus).toBe('idle');
    });
  });

  describe('setSaveStatus', () => {
    it('should update saveStatus to saving', () => {
      useStore.getState().setSaveStatus('saving');
      expect(useStore.getState().saveStatus).toBe('saving');
    });

    it('should update saveStatus to saved', () => {
      useStore.getState().setSaveStatus('saved');
      expect(useStore.getState().saveStatus).toBe('saved');
    });

    it('should update saveStatus to error', () => {
      useStore.getState().setSaveStatus('error');
      expect(useStore.getState().saveStatus).toBe('error');
    });

    it('should transition through all save states', () => {
      const { setSaveStatus } = useStore.getState();

      setSaveStatus('saving');
      expect(useStore.getState().saveStatus).toBe('saving');

      setSaveStatus('saved');
      expect(useStore.getState().saveStatus).toBe('saved');

      setSaveStatus('idle');
      expect(useStore.getState().saveStatus).toBe('idle');
    });
  });

  describe('createBoard', () => {
    it('should create a board with the given name', async () => {
      const board = await useStore.getState().createBoard('Test Board');

      expect(board.name).toBe('Test Board');
      expect(board.id).toBeDefined();
      expect(board.id).toMatch(/^board-/);
      expect(board.elements).toEqual([]);
      expect(board.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    });

    it('should add created board to boards list', async () => {
      await useStore.getState().createBoard('Test Board');

      const { boards } = useStore.getState();
      expect(boards).toHaveLength(1);
      expect(boards[0].name).toBe('Test Board');
    });

    it('should create boards with unique IDs', async () => {
      const board1 = await useStore.getState().createBoard('Board 1');
      await new Promise((r) => setTimeout(r, 5));
      const board2 = await useStore.getState().createBoard('Board 2');

      expect(board1.id).not.toBe(board2.id);
    });

    it('should track element count as 0 for new board', async () => {
      await useStore.getState().createBoard('Test Board');

      const { boards } = useStore.getState();
      expect(boards[0].elementCount).toBe(0);
    });
  });

  describe('deleteBoard', () => {
    it('should remove board from list', async () => {
      const board = await useStore.getState().createBoard('Test Board');
      expect(useStore.getState().boards).toHaveLength(1);

      useStore.getState().deleteBoard(board.id);

      expect(useStore.getState().boards).toHaveLength(0);
    });

    it('should clear currentBoard if deleted', async () => {
      const board = await useStore.getState().createBoard('Test Board');
      useStore.getState().setCurrentBoard(board);

      expect(useStore.getState().currentBoard).not.toBeNull();

      useStore.getState().deleteBoard(board.id);

      expect(useStore.getState().currentBoard).toBeNull();
    });

    it('should not clear currentBoard if different board deleted', async () => {
      const board1 = await useStore.getState().createBoard('Board 1');
      await new Promise((r) => setTimeout(r, 5));
      const board2 = await useStore.getState().createBoard('Board 2');

      useStore.getState().setCurrentBoard(board1);

      useStore.getState().deleteBoard(board2.id);

      expect(useStore.getState().currentBoard?.id).toBe(board1.id);
    });
  });

  describe('renameBoard', () => {
    it('should update board name', async () => {
      const board = await useStore.getState().createBoard('Original Name');
      useStore.getState().renameBoard(board.id, 'New Name');

      const { boards } = useStore.getState();
      expect(boards[0].name).toBe('New Name');
    });

    it('should update updatedAt timestamp', async () => {
      const board = await useStore.getState().createBoard('Test Board');
      const originalUpdatedAt = board.updatedAt;

      await new Promise((r) => setTimeout(r, 10));
      useStore.getState().renameBoard(board.id, 'New Name');

      const { boards } = useStore.getState();
      expect(boards[0].updatedAt).toBeGreaterThan(originalUpdatedAt);
    });

    it('should not affect other boards', async () => {
      const board1 = await useStore.getState().createBoard('Board 1');
      await new Promise((r) => setTimeout(r, 5));
      await useStore.getState().createBoard('Board 2');

      useStore.getState().renameBoard(board1.id, 'Renamed');

      const { boards } = useStore.getState();
      expect(boards[0].name).toBe('Renamed');
      expect(boards[1].name).toBe('Board 2');
    });
  });
});
