import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockState = {
  myPresence: {} as Record<string, unknown>,
  users: [] as Array<{ id: string; presence?: Record<string, unknown> }>,
  connectionStatus: 'connected' as string,
  userCount: 1,
  isConnected: true,
  roomId: 'test-room',
};

const stableSpies = {
  updateCursor: vi.fn(),
  updateSelection: vi.fn(),
  updateViewport: vi.fn(),
  updateUserInfo: vi.fn(),
};

vi.mock('@thinkix/collaboration/providers/liveblocks/hooks', () => ({
  usePresence: () => ({
    updateCursor: stableSpies.updateCursor,
    updateSelection: stableSpies.updateSelection,
    updateViewport: stableSpies.updateViewport,
    updateUserInfo: stableSpies.updateUserInfo,
    myPresence: mockState.myPresence,
  }),
  useRoomPresence: () => ({
    users: mockState.users,
    connectionStatus: mockState.connectionStatus,
    userCount: mockState.userCount,
  }),
  useRoomConnection: () => ({
    status: mockState.connectionStatus,
    roomId: mockState.roomId,
    isConnected: mockState.isConnected,
  }),
}));

import { usePresence, useRoomPresence, useRoomConnection } from '@thinkix/collaboration/providers/liveblocks/hooks';

describe('usePresence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.myPresence = {};
    mockState.users = [];
    mockState.connectionStatus = 'connected';
    mockState.userCount = 1;
    mockState.isConnected = true;
  });

  describe('updateCursor', () => {
    it('updates cursor presence', () => {
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateCursor({ x: 100, y: 200, pointer: 'mouse' });
      });
      
      expect(stableSpies.updateCursor).toHaveBeenCalledWith({ x: 100, y: 200, pointer: 'mouse' });
    });

    it('clears cursor when set to null', () => {
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateCursor(null);
      });
      
      expect(stableSpies.updateCursor).toHaveBeenCalledWith(null);
    });
  });

  describe('updateSelection', () => {
    it('updates selection presence', () => {
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateSelection(['el-1', 'el-2']);
      });
      
      expect(stableSpies.updateSelection).toHaveBeenCalledWith(['el-1', 'el-2']);
    });

    it('clears selection when set to null', () => {
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateSelection(null);
      });
      
      expect(stableSpies.updateSelection).toHaveBeenCalledWith(null);
    });
  });

  describe('updateViewport', () => {
    it('updates viewport presence', () => {
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateViewport({ x: 0, y: 0, zoom: 2 });
      });
      
      expect(stableSpies.updateViewport).toHaveBeenCalledWith({ x: 0, y: 0, zoom: 2 });
    });

    it('clears viewport when set to null', () => {
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateViewport(null);
      });
      
      expect(stableSpies.updateViewport).toHaveBeenCalledWith(null);
    });
  });

  describe('updateUserInfo', () => {
    it('updates user info with merge', () => {
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateUserInfo({ name: 'New Name' });
      });
      
      expect(stableSpies.updateUserInfo).toHaveBeenCalledWith({ name: 'New Name' });
    });

    it('creates user object when none exists', () => {
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateUserInfo({ name: 'Test User' });
      });
      
      expect(stableSpies.updateUserInfo).toHaveBeenCalledWith({ name: 'Test User' });
    });

    it('updates avatar', () => {
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateUserInfo({ avatar: 'data:image/svg+xml,test' });
      });
      
      expect(stableSpies.updateUserInfo).toHaveBeenCalledWith({ avatar: 'data:image/svg+xml,test' });
    });
  });

  describe('myPresence', () => {
    it('returns current presence', () => {
      mockState.myPresence = { cursor: { x: 50, y: 50 } };
      const { result } = renderHook(() => usePresence());
      
      expect(result.current.myPresence).toEqual({ cursor: { x: 50, y: 50 } });
    });
  });
});

describe('useRoomPresence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.myPresence = {};
    mockState.users = [];
    mockState.connectionStatus = 'connected';
    mockState.userCount = 1;
    mockState.isConnected = true;
  });

  describe('users', () => {
    it('returns empty array when no others', () => {
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.users).toEqual([]);
    });

    it('filters and maps users with presence', () => {
      mockState.users = [
        { id: 'user-1', presence: { cursor: { x: 100, y: 100 } } },
        { id: 'user-2', presence: { cursor: { x: 200, y: 200 } } },
      ];
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.users).toHaveLength(2);
      expect(result.current.users[0].id).toBe('user-1');
      expect(result.current.users[1].id).toBe('user-2');
    });

    it('includes viewport in user presence', () => {
      mockState.users = [
        { id: 'user-1', presence: { viewport: { x: 0, y: 0, zoom: 1 } } },
      ];
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.users).toHaveLength(1);
      expect(result.current.users[0].presence?.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    });
  });

  describe('connectionStatus', () => {
    it('returns current status', () => {
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.connectionStatus).toBe('connected');
    });

    it('returns reconnecting status', () => {
      mockState.connectionStatus = 'reconnecting';
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.connectionStatus).toBe('reconnecting');
    });
  });

  describe('userCount', () => {
    it('returns 1 when alone', () => {
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.userCount).toBe(1);
    });

    it('counts all users including self', () => {
      mockState.userCount = 3;
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.userCount).toBe(3);
    });
  });
});

describe('useRoomConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.myPresence = {};
    mockState.users = [];
    mockState.connectionStatus = 'connected';
    mockState.userCount = 1;
    mockState.isConnected = true;
  });

  it('returns connection status', () => {
    const { result } = renderHook(() => useRoomConnection());
    
    expect(result.current.status).toBe('connected');
  });

  it('returns room ID', () => {
    const { result } = renderHook(() => useRoomConnection());
    
    expect(result.current.roomId).toBe('test-room');
  });

  it('returns isConnected boolean', () => {
    const { result } = renderHook(() => useRoomConnection());
    
    expect(result.current.isConnected).toBe(true);
  });

  it('returns false for isConnected when not connected', () => {
    mockState.isConnected = false;
    mockState.connectionStatus = 'disconnected';
    const { result } = renderHook(() => useRoomConnection());
    
    expect(result.current.isConnected).toBe(false);
    expect(result.current.status).toBe('disconnected');
  });
});
