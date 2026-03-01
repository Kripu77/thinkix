import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const mockUpdateMyPresence = vi.fn();
const mockOthers = vi.fn(() => []);
const mockStatus = vi.fn(() => 'connected');
const mockRoom = { id: 'test-room' };

const mockYjsContext = {
  user: { id: 'user-1', name: 'Test User', color: '#FF0000' },
  elements: [],
  setElements: vi.fn(),
  isLocalChange: false,
  syncState: { isConnected: true, isSyncing: false, lastSyncedAt: Date.now() },
};

vi.mock('@liveblocks/react/suspense', () => ({
  useMyPresence: () => [{}, mockUpdateMyPresence],
  useOthers: () => mockOthers(),
  useStatus: () => mockStatus(),
  useRoom: () => mockRoom,
}));

vi.mock('@thinkix/collaboration/adapter/yjs-provider', () => ({
  useYjsCollaboration: () => mockYjsContext,
}));

describe('useCollaborationRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOthers.mockReturnValue([]);
    mockStatus.mockReturnValue('connected');
  });

  describe('user presence', () => {
    it('updates presence with user info on mount', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      renderHook(() => useCollaborationRoom());
      
      expect(mockUpdateMyPresence).toHaveBeenCalledWith({
        user: {
          id: 'user-1',
          name: 'Test User',
          color: '#FF0000',
          avatar: undefined,
        },
      });
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
      
      expect(mockUpdateMyPresence).toHaveBeenCalledWith({
        user: {
          id: 'user-1',
          name: 'Test User',
          color: '#FF0000',
          avatar: 'data:image/svg+xml,test',
        },
      });
      
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
      
      expect(mockUpdateMyPresence).toHaveBeenCalledWith({
        cursor: { x: 100, y: 200 },
      });
    });

    it('clears cursor when set to null', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.updatePresence({ cursor: null });
      });
      
      expect(mockUpdateMyPresence).toHaveBeenCalledWith({
        cursor: undefined,
      });
    });

    it('updates selection', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.updatePresence({ selection: ['el-1', 'el-2'] });
      });
      
      expect(mockUpdateMyPresence).toHaveBeenCalledWith({
        selection: ['el-1', 'el-2'],
      });
    });

    it('updates viewport', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.updatePresence({ viewport: { x: 0, y: 0, zoom: 2 } });
      });
      
      expect(mockUpdateMyPresence).toHaveBeenCalledWith({
        viewport: { x: 0, y: 0, zoom: 2 },
      });
    });

    it('updates user info', async () => {
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      act(() => {
        result.current.updatePresence({ user: { name: 'New Name' } });
      });
      
      expect(mockUpdateMyPresence).toHaveBeenCalledWith({
        user: {
          id: 'user-1',
          name: 'New Name',
          color: '#FF0000',
          avatar: undefined,
        },
      });
    });
  });

  describe('others presence', () => {
    it('filters others with user presence', async () => {
      mockOthers.mockReturnValue([
        {
          connectionId: 1,
          presence: {
            user: { id: 'user-2', name: 'Alice', color: '#00FF00' },
            cursor: { x: 100, y: 200 },
          },
        },
        {
          connectionId: 2,
          presence: {},
        },
      ]);
      
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      await waitFor(() => {
        expect(result.current.others.length).toBe(1);
        expect(result.current.others[0].user.name).toBe('Alice');
      });
    });

    it('calculates correct user count', async () => {
      mockOthers.mockReturnValue([
        { connectionId: 1, presence: { user: {} } },
        { connectionId: 2, presence: { user: {} } },
      ]);
      
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      await waitFor(() => {
        expect(result.current.userCount).toBe(3);
      });
    });
  });

  describe('connection status', () => {
    it('returns connected status', async () => {
      mockStatus.mockReturnValue('connected');
      
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.connectionStatus).toBe('connected');
    });

    it('returns connecting status', async () => {
      mockStatus.mockReturnValue('connecting');
      
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.connectionStatus).toBe('connecting');
    });

    it('returns reconnecting status', async () => {
      mockStatus.mockReturnValue('reconnecting');
      
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.connectionStatus).toBe('reconnecting');
    });

    it('returns disconnected status', async () => {
      mockStatus.mockReturnValue('disconnected');
      
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.connectionStatus).toBe('disconnected');
    });

    it('returns initial status for unknown', async () => {
      mockStatus.mockReturnValue('unknown');
      
      const { useCollaborationRoom } = await import('@thinkix/collaboration/adapter');
      const { result } = renderHook(() => useCollaborationRoom());
      
      expect(result.current.connectionStatus).toBe('initial');
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
