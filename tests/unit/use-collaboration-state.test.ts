import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

vi.stubGlobal('localStorage', mockStorage);

describe('useCollaborationState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('returns disabled state when no defaultRoomId provided', async () => {
      const { useCollaborationState } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => useCollaborationState(undefined));

      expect(result.current.isEnabled).toBe(false);
    });

    it('returns disabled state when defaultRoomId is null', async () => {
      const { useCollaborationState } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => useCollaborationState(null as unknown as undefined));

      expect(result.current.isEnabled).toBe(false);
    });

    it('returns disabled state when defaultRoomId is empty string', async () => {
      const { useCollaborationState } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => useCollaborationState(''));

      expect(result.current.isEnabled).toBe(false);
    });

    it('returns roomId from defaultRoomId when provided', async () => {
      const { useCollaborationState } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => useCollaborationState('room-123'));

      expect(result.current.roomId).toBe('room-123');
    });
  });

  describe('enableCollaboration', () => {
    it('enables collaboration when called with valid roomId', async () => {
      const { useCollaborationState } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => useCollaborationState('room-123'));

      expect(result.current.isEnabled).toBe(false);

      act(() => {
        result.current.enableCollaboration('room-123');
      });

      expect(result.current.isEnabled).toBe(true);
    });

    it('sets roomId when called', async () => {
      const { useCollaborationState } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => useCollaborationState('room-123'));

      act(() => {
        result.current.enableCollaboration('room-456');
      });

      expect(result.current.roomId).toBe('room-456');
    });

    it('persists enabled state to localStorage', async () => {
      const { useCollaborationState } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => useCollaborationState('room-123'));

      act(() => {
        result.current.enableCollaboration('room-123');
      });

      expect(mockStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('disableCollaboration', () => {
    it('disables collaboration when called', async () => {
      const { useCollaborationState } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => useCollaborationState('room-123'));

      act(() => {
        result.current.enableCollaboration('room-123');
      });
      expect(result.current.isEnabled).toBe(true);

      act(() => {
        result.current.disableCollaboration();
      });
      expect(result.current.isEnabled).toBe(false);
    });

    it('persists disabled state to localStorage', async () => {
      const { useCollaborationState } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => useCollaborationState('room-123'));

      act(() => {
        result.current.enableCollaboration('room-123');
      });

      act(() => {
        result.current.disableCollaboration();
      });

      expect(mockStorage.setItem).toHaveBeenCalledWith('thinkix:collaboration:enabled', 'false');
    });
  });

  describe('toggleCollaboration', () => {
    it('enables collaboration when currently disabled and roomId exists', async () => {
      const { useCollaborationState } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => useCollaborationState('room-123'));

      expect(result.current.isEnabled).toBe(false);

      act(() => {
        result.current.toggleCollaboration();
      });

      expect(result.current.isEnabled).toBe(true);
    });

    it('disables collaboration when currently enabled', async () => {
      const { useCollaborationState } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => useCollaborationState('room-123'));

      act(() => {
        result.current.enableCollaboration('room-123');
      });

      act(() => {
        result.current.toggleCollaboration();
      });

      expect(result.current.isEnabled).toBe(false);
    });

    it('does not enable when roomId is null', async () => {
      const { useCollaborationState } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => useCollaborationState(null));

      act(() => {
        result.current.toggleCollaboration();
      });

      expect(result.current.isEnabled).toBe(false);
    });
  });

  describe('state persistence', () => {
    it('restores enabled state from localStorage', async () => {
      mockStorage.getItem.mockImplementation((key: string) => {
        if (key === 'thinkix:collaboration:enabled') return 'true';
        if (key === 'thinkix:collaboration:roomId') return 'room-123';
        return null;
      });

      const { useCollaborationState } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => useCollaborationState('room-123'));

      expect(result.current.isEnabled).toBe(true);
    });

    it('handles corrupted localStorage data', async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { useCollaborationState } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => useCollaborationState('room-123'));

      expect(result.current.isEnabled).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles rapid enable/disable calls', async () => {
      const { useCollaborationState } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => useCollaborationState('room-123'));

      act(() => {
        result.current.enableCollaboration('room-123');
        result.current.disableCollaboration();
        result.current.enableCollaboration('room-123');
        result.current.disableCollaboration();
      });

      expect(result.current.isEnabled).toBe(false);
    });

    it('handles enable with different roomId than hook was initialized with', async () => {
      const { useCollaborationState } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => useCollaborationState('room-123'));

      act(() => {
        result.current.enableCollaboration('room-456');
      });

      expect(result.current.roomId).toBe('room-456');
      expect(result.current.isEnabled).toBe(true);
    });
  });
});
