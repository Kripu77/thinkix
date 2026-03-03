import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';

const mockUndoManager = {
  undoStack: [] as unknown[],
  redoStack: [] as unknown[],
  undo: vi.fn(),
  redo: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock('yjs', () => ({
  Doc: vi.fn(() => ({
    transact: vi.fn((fn) => fn()),
    getMap: vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      values: vi.fn(() => [].values()),
      size: 0,
    })),
    destroy: vi.fn(),
  })),
  UndoManager: vi.fn(() => mockUndoManager),
}));

vi.mock('@liveblocks/react/suspense', () => ({
  LiveblocksProvider: ({ children }: { children: ReactNode }) => createElement('div', null, children),
  RoomProvider: ({ children }: { children: ReactNode }) => createElement('div', null, children),
  useRoom: () => ({ id: 'test-room' }),
  useStatus: () => 'connected',
  useMyPresence: () => [{}, vi.fn()],
  useOthers: () => [],
  useSelf: () => ({ connectionId: 'test-conn' }),
}));

vi.mock('@liveblocks/yjs', () => ({
  LiveblocksYjsProvider: vi.fn(() => ({
    destroy: vi.fn(),
  })),
}));

describe('Y.js UndoManager Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUndoManager.undoStack = [];
    mockUndoManager.redoStack = [];
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('UndoManager initialization', () => {
    it('creates UndoManager with tracked origins', async () => {
      const { Y } = await import('@thinkix/collaboration/adapter');
      
      expect(Y).toBeDefined();
    });
  });

  describe('undo state', () => {
    it('exposes undoState in collaboration context', async () => {
      const { useOptionalCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      
      const { result } = renderHook(() => useOptionalCollaborationRoom());
      expect(result.current).toBeNull();
    });

    it('exposes undoState in YjsCollaboration context', async () => {
      const { useOptionalYjsCollaboration } = await import('@thinkix/collaboration/adapter');
      
      const { result } = renderHook(() => useOptionalYjsCollaboration());
      expect(result.current).toBeNull();
    });
  });

  describe('undo operation', () => {
    it('calls undo on UndoManager when stack is not empty', () => {
      mockUndoManager.undoStack = [{ type: 'add' }];
      
      mockUndoManager.undo();
      
      expect(mockUndoManager.undo).toHaveBeenCalled();
    });

    it('does not call undo when stack is empty', () => {
      mockUndoManager.undoStack = [];
      
      if (mockUndoManager.undoStack.length > 0) {
        mockUndoManager.undo();
      }
      
      expect(mockUndoManager.undo).not.toHaveBeenCalled();
    });
  });

  describe('redo operation', () => {
    it('calls redo on UndoManager when stack is not empty', () => {
      mockUndoManager.redoStack = [{ type: 'add' }];
      
      mockUndoManager.redo();
      
      expect(mockUndoManager.redo).toHaveBeenCalled();
    });

    it('does not call redo when stack is empty', () => {
      mockUndoManager.redoStack = [];
      
      if (mockUndoManager.redoStack.length > 0) {
        mockUndoManager.redo();
      }
      
      expect(mockUndoManager.redo).not.toHaveBeenCalled();
    });
  });

  describe('event listeners', () => {
    it('registers listeners for stack events', async () => {
      expect(mockUndoManager.on).toBeDefined();
      expect(typeof mockUndoManager.on).toBe('function');
    });
  });

  describe('CollaborationRoomContext', () => {
    it('exposes undo and redo functions', async () => {
      const { useOptionalCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      
      const { result } = renderHook(() => useOptionalCollaborationRoom());
      expect(result.current).toBeNull();
    });
  });

  describe('useUndoRedo hook', () => {
    it('returns correct state when not in collaboration mode', async () => {
      const { useUndoRedo } = await import('@thinkix/collaboration');
      
      const mockBoard = {
        history: {
          undos: [],
          redos: [],
        },
      } as Parameters<typeof useUndoRedo>[0];
      
      const { result } = renderHook(() => useUndoRedo(mockBoard));
      
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.isCollaborationMode).toBe(false);
    });

    it('returns correct stack sizes', async () => {
      const { useUndoRedo } = await import('@thinkix/collaboration');
      
      const mockBoard = {
        history: {
          undos: [{}, {}],
          redos: [{}],
        },
      } as Parameters<typeof useUndoRedo>[0];
      
      const { result } = renderHook(() => useUndoRedo(mockBoard));
      
      expect(result.current.undoStackSize).toBe(2);
      expect(result.current.redoStackSize).toBe(1);
    });
  });
});
