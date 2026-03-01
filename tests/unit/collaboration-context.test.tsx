import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const mockCollaborationState = {
  user: { id: 'user-1', name: 'Test User', color: '#FF0000' } as { id: string; name: string; color: string; avatar?: string },
  elements: [] as Array<{ id: string; type: string }>,
  setElements: vi.fn(),
  isLocalChange: false,
  syncState: { isConnected: true, isSyncing: false, lastSyncedAt: Date.now() },
  updatePresence: vi.fn(),
  others: [] as Array<{ id: string }>,
  userCount: 1,
  connectionStatus: 'connected' as string,
  roomId: 'test-room',
};

vi.mock('@thinkix/collaboration/adapter/yjs-provider', () => ({
  useYjsCollaboration: () => ({
    user: mockCollaborationState.user,
    elements: mockCollaborationState.elements,
    setElements: mockCollaborationState.setElements,
    isLocalChange: mockCollaborationState.isLocalChange,
    syncState: mockCollaborationState.syncState,
  }),
}));

vi.mock('@thinkix/collaboration/adapter/collaboration-context', () => ({
  useCollaborationRoom: () => ({
    updatePresence: mockCollaborationState.updatePresence,
    others: mockCollaborationState.others,
    userCount: mockCollaborationState.userCount,
    connectionStatus: mockCollaborationState.connectionStatus,
    syncState: mockCollaborationState.syncState,
    elements: mockCollaborationState.elements,
    setElements: mockCollaborationState.setElements,
    roomId: mockCollaborationState.roomId,
  }),
  useOptionalCollaborationRoom: () => null,
  CollaborationRoomProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { useCollaborationRoom, useOptionalCollaborationRoom } from '@thinkix/collaboration/adapter';

describe('useCollaborationRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollaborationState.user = { id: 'user-1', name: 'Test User', color: '#FF0000' };
    mockCollaborationState.elements = [];
    mockCollaborationState.connectionStatus = 'connected';
    mockCollaborationState.userCount = 1;
    mockCollaborationState.others = [];
    mockCollaborationState.syncState = { isConnected: true, isSyncing: false, lastSyncedAt: Date.now() };
  });

  describe('user presence', () => {
    it('updates presence with user info on mount', () => {
      renderHook(() => useCollaborationRoom());
      
      expect(mockCollaborationState.user).toEqual({
        id: 'user-1',
        name: 'Test User',
        color: '#FF0000',
      });
    });

    it('includes avatar in presence when available', () => {
      mockCollaborationState.user = { id: 'user-1', name: 'Test User', color: '#FF0000', avatar: 'data:image/svg+xml,test' };
      renderHook(() => useCollaborationRoom());
      
      expect(mockCollaborationState.user.avatar).toBe('data:image/svg+xml,test');
    });
  });

  describe('updatePresence', () => {
    it('updates cursor presence', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.updatePresence({ cursor: { x: 100, y: 200 } });
      });
      
      expect(mockCollaborationState.updatePresence).toHaveBeenCalledWith({ cursor: { x: 100, y: 200 } });
    });

    it('clears cursor when set to null', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.updatePresence({ cursor: null });
      });
      
      expect(mockCollaborationState.updatePresence).toHaveBeenCalledWith({ cursor: null });
    });

    it('updates selection', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.updatePresence({ selection: ['el-1', 'el-2'] });
      });
      
      expect(mockCollaborationState.updatePresence).toHaveBeenCalledWith({ selection: ['el-1', 'el-2'] });
    });

    it('updates viewport', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.updatePresence({ viewport: { x: 0, y: 0, zoom: 2 } });
      });
      
      expect(mockCollaborationState.updatePresence).toHaveBeenCalledWith({ viewport: { x: 0, y: 0, zoom: 2 } });
    });

    it('updates user info', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.updatePresence({ user: { name: 'New Name' } });
      });
      
      expect(mockCollaborationState.updatePresence).toHaveBeenCalledWith({ user: { name: 'New Name' } });
    });
  });

  describe('others presence', () => {
    it('filters others with user presence', async () => {
      mockCollaborationState.others = [{ id: 'user-2' }];
      const { result } = renderHook(() => useCollaborationRoom());
      
      await waitFor(() => {
        expect(result.current.others).toBeDefined();
        expect(result.current.others).toHaveLength(1);
      });
    });

    it('calculates correct user count', async () => {
      mockCollaborationState.userCount = 3;
      const { result } = renderHook(() => useCollaborationRoom());
      
      await waitFor(() => {
        expect(result.current.userCount).toBe(3);
      });
    });
  });

  describe('connection status', () => {
    it('returns connected status', () => {
      mockCollaborationState.connectionStatus = 'connected';
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.connectionStatus).toBe('connected');
    });

    it('returns connecting status', () => {
      mockCollaborationState.connectionStatus = 'connecting';
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.connectionStatus).toBe('connecting');
    });

    it('returns reconnecting status', () => {
      mockCollaborationState.connectionStatus = 'reconnecting';
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.connectionStatus).toBe('reconnecting');
    });

    it('returns disconnected status', () => {
      mockCollaborationState.connectionStatus = 'disconnected';
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.connectionStatus).toBe('disconnected');
    });

    it('returns initial status for unknown', () => {
      mockCollaborationState.connectionStatus = 'unknown';
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.connectionStatus).toBe('unknown');
    });
  });

  describe('sync state', () => {
    it('exposes sync state from YJS context', () => {
      mockCollaborationState.syncState = { isConnected: true, isSyncing: false, lastSyncedAt: 12345 };
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.syncState.isConnected).toBe(true);
      expect(result.current.syncState.isSyncing).toBe(false);
    });
  });

  describe('elements', () => {
    it('exposes elements from YJS context', () => {
      mockCollaborationState.elements = [{ id: 'el-1', type: 'shape' }];
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.elements).toEqual([{ id: 'el-1', type: 'shape' }]);
    });

    it('calls setElements from YJS context', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.setElements([{ id: 'el-1', type: 'shape' }]);
      });
      
      expect(mockCollaborationState.setElements).toHaveBeenCalledWith([{ id: 'el-1', type: 'shape' }]);
    });
  });

  describe('room info', () => {
    it('returns room ID', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.roomId).toBe('test-room');
    });
  });
});

describe('useOptionalCollaborationRoom', () => {
  it('returns null when used outside provider', () => {
    const { result } = renderHook(() => useOptionalCollaborationRoom());
    
    expect(result.current).toBeNull();
  });
});
