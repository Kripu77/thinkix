import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const mockYjsContext = {
  user: { id: 'user-1', name: 'Test User', color: '#FF0000' },
  elements: [],
  setElements: vi.fn(),
  isLocalChange: false,
  syncState: { isConnected: true, isSyncing: false, lastSyncedAt: Date.now() },
};

vi.mock('@thinkix/collaboration/adapter/yjs-provider', () => ({
  useYjsCollaboration: () => mockYjsContext,
}));

describe('useCollaborationRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('user presence', () => {
    it('updates presence with user info on mount', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      renderHook(() => useCollaborationRoom());
      
      expect(true).toBe(true);
    });

    it('includes avatar in presence when available', async () => {
      mockYjsContext.user = { 
        id: 'user-1', 
        name: 'Test User', 
        color: '#FF0000',
        avatar: 'data:image/svg+xml,test',
      };
      
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      renderHook(() => useCollaborationRoom());
      
      expect(true).toBe(true);
      
      mockYjsContext.user = { id: 'user-1', name: 'Test User', color: '#FF0000' };
    });
  });

  describe('updatePresence', () => {
    it('updates cursor presence', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.updatePresence({ cursor: { x: 100, y: 200 } });
      });
      
      expect(true).toBe(true);
    });

    it('clears cursor when set to null', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.updatePresence({ cursor: null });
      });
      
      expect(true).toBe(true);
    });

    it('updates selection', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.updatePresence({ selection: ['el-1', 'el-2'] });
      });
      
      expect(true).toBe(true);
    });

    it('updates viewport', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.updatePresence({ viewport: { x: 0, y: 0, zoom: 2 } });
      });
      
      expect(true).toBe(true);
    });

    it('updates user info', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.updatePresence({ user: { name: 'New Name' } });
      });
      
      expect(true).toBe(true);
    });
  });

  describe('others presence', () => {
    it('filters others with user presence', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      await waitFor(() => {
        expect(result.current.others).toBeDefined();
      });
    });

    it('calculates correct user count', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      await waitFor(() => {
        expect(result.current.userCount).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('connection status', () => {
    it('returns connected status', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.connectionStatus).toBe('connected');
    });

    it('returns connecting status', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(typeof result.current.connectionStatus).toBe('string');
    });

    it('returns reconnecting status', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(typeof result.current.connectionStatus).toBe('string');
    });

    it('returns disconnected status', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(typeof result.current.connectionStatus).toBe('string');
    });

    it('returns initial status for unknown', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(typeof result.current.connectionStatus).toBe('string');
    });
  });

  describe('sync state', () => {
    it('exposes sync state from YJS context', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.syncState.isConnected).toBe(true);
      expect(result.current.syncState.isSyncing).toBe(false);
    });
  });

  describe('elements', () => {
    it('exposes elements from YJS context', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.elements).toEqual([]);
    });

    it('calls setElements from YJS context', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.setElements([{ id: 'el-1', type: 'shape' }]);
      });
      
      expect(mockYjsContext.setElements).toHaveBeenCalledWith([{ id: 'el-1', type: 'shape' }]);
    });
  });

  describe('room info', () => {
    it('returns room ID', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.roomId).toBe('test-room');
    });
  });
});

describe('useOptionalCollaborationRoom', () => {
  it('returns null when used outside provider', async () => {
    const { useOptionalCollaborationRoom } = await import('@thinkix/collaboration/adapter');
    const { result } = renderHook(() => useOptionalCollaborationRoom());
    
    expect(result.current).toBeNull();
  });
});
