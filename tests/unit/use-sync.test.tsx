import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { PlaitBoard } from '@plait/core';
import { useBoardSync } from '@thinkix/collaboration/hooks';

interface MockBoard {
  viewport: { zoom: number; offsetX: number; offsetY: number };
  children: unknown[];
}

describe('useBoardSync', () => {
  const mockBoard: MockBoard = {
    viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
    children: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('exposes isConnected from hook', () => {
      const { result } = renderHook(() => 
        useBoardSync({ board: mockBoard as unknown as PlaitBoard, enabled: true })
      );
      
      expect(typeof result.current.isConnected).toBe('boolean');
    });
  });

  describe('remote elements', () => {
    it('exposes remoteElements', () => {
      const { result } = renderHook(() => 
        useBoardSync({ board: mockBoard as unknown as PlaitBoard, enabled: true })
      );
      
      expect(result.current.remoteElements).toEqual([]);
    });
  });

  describe('syncToRemote', () => {
    it('exposes syncToRemote function', () => {
      const { result } = renderHook(() => 
        useBoardSync({ board: mockBoard as unknown as PlaitBoard, enabled: true })
      );
      
      expect(typeof result.current.syncToRemote).toBe('function');
    });
  });
});
