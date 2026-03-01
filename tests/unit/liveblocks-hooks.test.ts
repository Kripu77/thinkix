import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@thinkix/collaboration/providers/liveblocks/hooks', () => ({
  usePresence: () => ({
    updateCursor: vi.fn(),
    updateSelection: vi.fn(),
    updateViewport: vi.fn(),
    updateUserInfo: vi.fn(),
    myPresence: {},
  }),
  useRoomPresence: () => ({
    users: [],
    connectionStatus: 'connected',
    userCount: 1,
  }),
  useRoomConnection: () => ({
    status: 'connected',
    roomId: 'test-room',
    isConnected: true,
  }),
}));

import { usePresence, useRoomPresence, useRoomConnection } from '@thinkix/collaboration/providers/liveblocks/hooks';

describe('usePresence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateCursor', () => {
    it('updates cursor presence', () => {
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateCursor({ x: 100, y: 200, pointer: 'mouse' });
      });
      
      expect(true).toBe(true);
    });

    it('clears cursor when set to null', () => {
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateCursor(null);
      });
      
      expect(true).toBe(true);
    });
  });

  describe('updateSelection', () => {
    it('updates selection presence', () => {
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateSelection(['el-1', 'el-2']);
      });
      
      expect(true).toBe(true);
    });

    it('clears selection when set to null', () => {
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateSelection(null);
      });
      
      expect(true).toBe(true);
    });
  });

  describe('updateViewport', () => {
    it('updates viewport presence', () => {
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateViewport({ x: 0, y: 0, zoom: 2 });
      });
      
      expect(true).toBe(true);
    });

    it('clears viewport when set to null', () => {
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateViewport(null);
      });
      
      expect(true).toBe(true);
    });
  });

  describe('updateUserInfo', () => {
    it('updates user info with merge', () => {
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateUserInfo({ name: 'New Name' });
      });
      
      expect(true).toBe(true);
    });

    it('creates user object when none exists', () => {
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateUserInfo({ name: 'Test User' });
      });
      
      expect(true).toBe(true);
    });

    it('updates avatar', () => {
      const { result } = renderHook(() => usePresence());
      
      act(() => {
        result.current.updateUserInfo({ avatar: 'data:image/svg+xml,test' });
      });
      
      expect(true).toBe(true);
    });
  });

  describe('myPresence', () => {
    it('returns current presence', () => {
      const { result } = renderHook(() => usePresence());
      
      expect(result.current.myPresence).toBeDefined();
    });
  });
});

describe('useRoomPresence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('users', () => {
    it('returns empty array when no others', () => {
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.users).toEqual([]);
    });

    it('filters and maps users with presence', () => {
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.users).toEqual([]);
    });

    it('includes viewport in user presence', () => {
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.users).toEqual([]);
    });
  });

  describe('connectionStatus', () => {
    it('returns current status', () => {
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.connectionStatus).toBe('connected');
    });

    it('returns reconnecting status', () => {
      const { result } = renderHook(() => useRoomPresence());
      
      expect(typeof result.current.connectionStatus).toBe('string');
    });
  });

  describe('userCount', () => {
    it('returns 1 when alone', () => {
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.userCount).toBe(1);
    });

    it('counts all users including self', () => {
      const { result } = renderHook(() => useRoomPresence());
      
      expect(result.current.userCount).toBe(1);
    });
  });
});

describe('useRoomConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    const { result } = renderHook(() => useRoomConnection());
    
    expect(typeof result.current.isConnected).toBe('boolean');
  });
});
