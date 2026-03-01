import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockUpdateMyPresence = vi.fn();
const mockMyPresence = vi.fn(() => ({}));
const mockOthers = vi.fn(() => []);
const mockStatus = vi.fn(() => 'connected');
const mockRoom = { id: 'test-room' };

vi.mock('@liveblocks/react/suspense', () => ({
  useMyPresence: () => [mockMyPresence(), mockUpdateMyPresence],
  useOthers: () => mockOthers(),
  useStatus: () => mockStatus(),
  useRoom: () => mockRoom,
}));

describe('usePresence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMyPresence.mockReturnValue({});
  });

  describe('updateCursor', () => {
    it('updates cursor presence', async () => {
      const { usePresence } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateCursor({ x: 100, y: 200, pointer: 'mouse' });
      });
      
      expect(mockUpdateMyPresence).toHaveBeenCalledWith({ 
        cursor: { x: 100, y: 200, pointer: 'mouse' } 
      });
    });

    it('clears cursor when set to null', async () => {
      const { usePresence } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateCursor(null);
      });
      
      expect(mockUpdateMyPresence).toHaveBeenCalledWith({ cursor: null });
    });
  });

  describe('updateSelection', () => {
    it('updates selection presence', async () => {
      const { usePresence } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateSelection(['el-1', 'el-2']);
      });
      
      expect(mockUpdateMyPresence).toHaveBeenCalledWith({ selection: ['el-1', 'el-2'] });
    });

    it('clears selection when set to null', async () => {
      const { usePresence } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateSelection(null);
      });
      
      expect(mockUpdateMyPresence).toHaveBeenCalledWith({ selection: null });
    });
  });

  describe('updateViewport', () => {
    it('updates viewport presence', async () => {
      const { usePresence } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateViewport({ x: 0, y: 0, zoom: 2 });
      });
      
      expect(mockUpdateMyPresence).toHaveBeenCalledWith({ 
        viewport: { x: 0, y: 0, zoom: 2 } 
      });
    });

    it('clears viewport when set to null', async () => {
      const { usePresence } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateViewport(null);
      });
      
      expect(mockUpdateMyPresence).toHaveBeenCalledWith({ viewport: null });
    });
  });

  describe('updateUserInfo', () => {
    it('updates user info with merge', async () => {
      mockMyPresence.mockReturnValue({
        user: { id: 'user-1', name: 'Old Name', color: '#FF0000' },
      });
      
      const { usePresence } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateUserInfo({ name: 'New Name' });
      });
      
      expect(mockUpdateMyPresence).toHaveBeenCalledWith({
        user: { id: 'user-1', name: 'New Name', color: '#FF0000' },
      });
    });

    it('creates user object when none exists', async () => {
      mockMyPresence.mockReturnValue({});
      
      const { usePresence } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateUserInfo({ name: 'Test User' });
      });
      
      expect(mockUpdateMyPresence).toHaveBeenCalledWith({
        user: expect.objectContaining({ name: 'Test User' }),
      });
    });

    it('updates avatar', async () => {
      mockMyPresence.mockReturnValue({
        user: { id: 'user-1', name: 'Test', color: '#FF0000' },
      });
      
      const { usePresence } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateUserInfo({ avatar: 'data:image/svg+xml,test' });
      });
      
      expect(mockUpdateMyPresence).toHaveBeenCalledWith({
        user: { id: 'user-1', name: 'Test', color: '#FF0000', avatar: 'data:image/svg+xml,test' },
      });
    });
  });

  describe('myPresence', () => {
    it('returns current presence', async () => {
      mockMyPresence.mockReturnValue({ cursor: { x: 100, y: 200 } });
      
      const { usePresence } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
      const { result } = renderHook(() => usePresence());
      
      expect(result.current.myPresence).toEqual({ cursor: { x: 100, y: 200 } });
    });
  });
});

describe('useRoomPresence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOthers.mockReturnValue([]);
    mockStatus.mockReturnValue('connected');
  });

  describe('users', () => {
    it('returns empty array when no others', async () => {
      const { useRoomPresence } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.users).toEqual([]);
    });

    it('filters and maps users with presence', async () => {
      mockOthers.mockReturnValue([
        {
          connectionId: 1,
          presence: {
            user: { id: 'user-1', name: 'Alice', color: '#FF0000' },
            cursor: { x: 100, y: 200 },
            selection: ['el-1'],
          },
        },
        {
          connectionId: 2,
          presence: {
            user: undefined,
          },
        },
      ]);
      
      const { useRoomPresence } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.users.length).toBe(1);
      expect(result.current.users[0].user.name).toBe('Alice');
      expect(result.current.users[0].cursor).toEqual({ x: 100, y: 200 });
      expect(result.current.users[0].selection).toEqual(['el-1']);
    });

    it('includes viewport in user presence', async () => {
      mockOthers.mockReturnValue([
        {
          connectionId: 1,
          presence: {
            user: { id: 'user-1', name: 'Alice', color: '#FF0000' },
            viewport: { x: 0, y: 0, zoom: 2 },
          },
        },
      ]);
      
      const { useRoomPresence } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.users[0].viewport).toEqual({ x: 0, y: 0, zoom: 2 });
    });
  });

  describe('connectionStatus', () => {
    it('returns current status', async () => {
      mockStatus.mockReturnValue('connected');
      
      const { useRoomPresence } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.connectionStatus).toBe('connected');
    });

    it('returns reconnecting status', async () => {
      mockStatus.mockReturnValue('reconnecting');
      
      const { useRoomPresence } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.connectionStatus).toBe('reconnecting');
    });
  });

  describe('userCount', () => {
    it('returns 1 when alone', async () => {
      mockOthers.mockReturnValue([]);
      
      const { useRoomPresence } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.userCount).toBe(1);
    });

    it('counts all users including self', async () => {
      mockOthers.mockReturnValue([
        { connectionId: 1, presence: { user: {} } },
        { connectionId: 2, presence: { user: {} } },
      ]);
      
      const { useRoomPresence } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.userCount).toBe(3);
    });
  });
});

describe('useRoomConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStatus.mockReturnValue('connected');
  });

  it('returns connection status', async () => {
    const { useRoomConnection } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
    const { result } = renderHook(() => useRoomConnection());
    
    expect(result.current.status).toBe('connected');
  });

  it('returns room ID', async () => {
    const { useRoomConnection } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
    const { result } = renderHook(() => useRoomConnection());
    
    expect(result.current.roomId).toBe('test-room');
  });

  it('returns isConnected boolean', async () => {
    mockStatus.mockReturnValue('connected');
    const { useRoomConnection } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
    const { result } = renderHook(() => useRoomConnection());
    
    expect(result.current.isConnected).toBe(true);
  });

  it('returns false for isConnected when not connected', async () => {
    mockStatus.mockReturnValue('connecting');
    const { useRoomConnection } = await import('@thinkix/collaboration/providers/liveblocks/hooks');
    const { result } = renderHook(() => useRoomConnection());
    
    expect(result.current.isConnected).toBe(false);
  });
});
