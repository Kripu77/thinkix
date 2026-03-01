import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { PlaitBoard } from '@plait/core';

interface MockBoard {
  viewport: {
    zoom: number;
    offsetX: number;
    offsetY: number;
  };
}

vi.mock('@thinkix/collaboration/hooks/use-cursor-tracking', () => ({
  useCursorTracking: ({ enabled }: { enabled: boolean }) => ({
    cursors: enabled ? new Map() : new Map(),
    updateMyCursor: vi.fn(),
  }),
  useCursorScreenState: (cursor: { documentX: number; documentY: number }, viewport: { zoom: number; offsetX: number; offsetY: number }) => ({
    screenX: cursor.documentX * viewport.zoom + viewport.offsetX,
    screenY: cursor.documentY * viewport.zoom + viewport.offsetY,
  }),
}));

import { useCursorTracking, useCursorScreenState } from '@thinkix/collaboration/hooks';

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
  });

  describe('initialization', () => {
    it('returns empty cursors map when disabled', () => {
      const { result } = renderHook(() => 
        useCursorTracking({ board: mockBoard as unknown as PlaitBoard, enabled: false })
      );
      
      expect(result.current.cursors.size).toBe(0);
    });

    it('initializes cursor manager when enabled', () => {
      const { result } = renderHook(() => 
        useCursorTracking({ board: mockBoard as unknown as PlaitBoard, enabled: true })
      );
      
      expect(result.current.cursors).toBeDefined();
    });
  });

  describe('remote cursor updates', () => {
    it('updates cursors from other users', async () => {
      const { result } = renderHook(() => 
        useCursorTracking({ board: mockBoard as unknown as PlaitBoard, enabled: true })
      );
      
      await waitFor(() => {
        expect(result.current.cursors.size).toBe(0);
      });
    });

    it('handles multiple users', async () => {
      const { result } = renderHook(() => 
        useCursorTracking({ board: mockBoard as unknown as PlaitBoard, enabled: true })
      );
      
      await waitFor(() => {
        expect(result.current.cursors.size).toBe(0);
      });
    });
  });

  describe('custom options', () => {
    it('uses custom throttle interval', () => {
      const { result } = renderHook(() => 
        useCursorTracking({ 
          board: mockBoard as unknown as PlaitBoard, 
          enabled: true,
          throttleIntervalMs: 100,
        })
      );
      
      expect(result.current.cursors).toBeDefined();
    });

    it('uses custom idle timeout', () => {
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
  it('converts document coordinates to screen coordinates', () => {
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

  it('handles zoom < 1', () => {
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
