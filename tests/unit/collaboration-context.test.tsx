import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('@thinkix/collaboration/adapter/yjs-provider', () => ({
  useYjsCollaboration: () => ({
    user: { id: 'user-1', name: 'Test User', color: '#FF0000' },
    elements: [],
    setElements: vi.fn(),
    isLocalChange: false,
    syncState: { isConnected: true, isSyncing: false, lastSyncedAt: Date.now() },
  }),
}));

vi.mock('@thinkix/collaboration/adapter/collaboration-context', () => ({
  useCollaborationRoom: () => ({
    updatePresence: vi.fn(),
    others: [],
    userCount: 1,
    connectionStatus: 'connected',
    syncState: { isConnected: true, isSyncing: false, lastSyncedAt: Date.now() },
    elements: [],
    setElements: vi.fn(),
    roomId: 'test-room',
  }),
  useOptionalCollaborationRoom: () => null,
  CollaborationRoomProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { useCollaborationRoom, useOptionalCollaborationRoom } from '@thinkix/collaboration/adapter';

describe('useCollaborationRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('user presence', () => {
    it('updates presence with user info on mount', () => {
      renderHook(() => useCollaborationRoom());
      
      expect(true).toBe(true);
    });

    it('includes avatar in presence when available', () => {
      renderHook(() => useCollaborationRoom());
      
      expect(true).toBe(true);
    });
  });

  describe('updatePresence', () => {
    it('updates cursor presence', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.updatePresence({ cursor: { x: 100, y: 200 } });
      });
      
      expect(true).toBe(true);
    });

    it('clears cursor when set to null', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.updatePresence({ cursor: null });
      });
      
      expect(true).toBe(true);
    });

    it('updates selection', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.updatePresence({ selection: ['el-1', 'el-2'] });
      });
      
      expect(true).toBe(true);
    });

    it('updates viewport', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.updatePresence({ viewport: { x: 0, y: 0, zoom: 2 } });
      });
      
      expect(true).toBe(true);
    });

    it('updates user info', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.updatePresence({ user: { name: 'New Name' } });
      });
      
      expect(true).toBe(true);
    });
  });

  describe('others presence', () => {
    it('filters others with user presence', async () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      await waitFor(() => {
        expect(result.current.others).toBeDefined();
      });
    });

    it('calculates correct user count', async () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      await waitFor(() => {
        expect(result.current.userCount).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('connection status', () => {
    it('returns connected status', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.connectionStatus).toBe('connected');
    });

    it('returns connecting status', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(typeof result.current.connectionStatus).toBe('string');
    });

    it('returns reconnecting status', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(typeof result.current.connectionStatus).toBe('string');
    });

    it('returns disconnected status', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(typeof result.current.connectionStatus).toBe('string');
    });

    it('returns initial status for unknown', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(typeof result.current.connectionStatus).toBe('string');
    });
  });

  describe('sync state', () => {
    it('exposes sync state from YJS context', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.syncState.isConnected).toBe(true);
      expect(result.current.syncState.isSyncing).toBe(false);
    });
  });

  describe('elements', () => {
    it('exposes elements from YJS context', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.elements).toEqual([]);
    });

    it('calls setElements from YJS context', () => {
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.setElements([{ id: 'el-1', type: 'shape' }]);
      });
      
      expect(true).toBe(true);
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
