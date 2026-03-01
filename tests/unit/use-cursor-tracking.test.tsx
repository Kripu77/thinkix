import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { PlaitBoard } from '@plait/core';

const mockUpdateMyPresence = vi.fn();
const mockOthers = vi.fn(() => []);

vi.mock('@liveblocks/react', () => ({
  useMyPresence: () => [, mockUpdateMyPresence],
  useOthers: () => mockOthers(),
}));

interface MockBoard {
  viewport: {
    zoom: number;
    offsetX: number;
    offsetY: number;
  };
}

describe('useCursorTracking', () => {
  const mockBoard: MockBoard = {
    viewport: {
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOthers.mockReturnValue([]);
  });

  describe('initialization', () => {
    it('returns empty cursors map when disabled', async () => {
      const { useCursorTracking } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => 
        useCursorTracking({ board: mockBoard as unknown as PlaitBoard, enabled: false })
      );
      
      expect(result.current.cursors.size).toBe(0);
    });

    it('initializes cursor manager when enabled', async () => {
      const { useCursorTracking } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => 
        useCursorTracking({ board: mockBoard as unknown as PlaitBoard, enabled: true })
      );
      
      expect(result.current.cursors).toBeDefined();
    });
  });

  describe('remote cursor updates', () => {
    it('updates cursors from other users', async () => {
      mockOthers.mockReturnValue([
        {
          connectionId: 1,
          presence: {
            user: { id: 'user-1', name: 'Alice', color: '#FF0000' },
            cursor: { x: 100, y: 200 },
          },
        },
      ]);

      const { useCursorTracking } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => 
        useCursorTracking({ board: mockBoard as unknown as PlaitBoard, enabled: true })
      );
      
      await waitFor(() => {
        expect(result.current.cursors.size).toBe(1);
      });
    });

    it('handles multiple users', async () => {
      mockOthers.mockReturnValue([
        {
          connectionId: 1,
          presence: {
            user: { id: 'user-1', name: 'Alice', color: '#FF0000' },
            cursor: { x: 100, y: 200 },
          },
        },
        {
          connectionId: 2,
          presence: {
            user: { id: 'user-2', name: 'Bob', color: '#00FF00' },
            cursor: { x: 300, y: 400 },
          },
        },
      ]);

      const { useCursorTracking } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => 
        useCursorTracking({ board: mockBoard as unknown as PlaitBoard, enabled: true })
      );
      
      await waitFor(() => {
        expect(result.current.cursors.size).toBe(2);
      });
    });
  });

  describe('custom options', () => {
    it('uses custom throttle interval', async () => {
      const { useCursorTracking } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => 
        useCursorTracking({ 
          board: mockBoard as unknown as PlaitBoard, 
          enabled: true,
          throttleIntervalMs: 100,
        })
      );
      
      expect(result.current.cursors).toBeDefined();
    });

    it('uses custom idle timeout', async () => {
      const { useCursorTracking } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => 
        useCursorTracking({ 
          board: mockBoard as unknown as PlaitBoard, 
          enabled: true,
          idleTimeoutMs: 60000,
        })
      );
      
      expect(result.current.cursors).toBeDefined();
    });
  });
});

interface MockCursor {
  connectionId: string;
  documentX: number;
  documentY: number;
  userName: string;
  userColor: string;
  lastUpdated: number;
  pointer: 'mouse';
}

describe('useCursorScreenState', () => {
  it('converts document coordinates to screen coordinates', async () => {
    const { useCursorScreenState } = await import('@thinkix/collaboration/hooks');
    const cursor: MockCursor = {
      connectionId: '1',
      documentX: 100,
      documentY: 200,
      userName: 'Test',
      userColor: '#FF0000',
      lastUpdated: Date.now(),
      pointer: 'mouse',
    };
    const viewport = { zoom: 2, offsetX: 50, offsetY: 25 };
    
    const { result } = renderHook(() => 
      useCursorScreenState(cursor as MockCursor, viewport)
    );
    
    expect(result.current.screenX).toBe(250);
    expect(result.current.screenY).toBe(425);
  });

  it('handles zoom < 1', async () => {
    const { useCursorScreenState } = await import('@thinkix/collaboration/hooks');
    const cursor: MockCursor = {
      connectionId: '1',
      documentX: 200,
      documentY: 400,
      userName: 'Test',
      userColor: '#FF0000',
      lastUpdated: Date.now(),
      pointer: 'mouse',
    };
    const viewport = { zoom: 0.5, offsetX: 0, offsetY: 0 };
    
    const { result } = renderHook(() => 
      useCursorScreenState(cursor as MockCursor, viewport)
    );
    
    expect(result.current.screenX).toBe(100);
    expect(result.current.screenY).toBe(200);
  });
});
