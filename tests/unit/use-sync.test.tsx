import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { PlaitBoard } from '@plait/core';

const mockStorage = { elements: [] };
const mockMutationFn = vi.fn();
const mockUpdateMyPresence = vi.fn();
const mockOthers = vi.fn(() => []);
const mockStatus = vi.fn(() => 'connected');
const mockRoom = { id: 'test-room' };

vi.mock('@liveblocks/react/suspense', () => ({
  useStorage: vi.fn((selector) => selector(mockStorage)),
  useMutation: vi.fn(() => mockMutationFn),
  useSelf: vi.fn(() => ({ connectionId: 'test-conn' })),
  useRoom: vi.fn(() => mockRoom),
  useMyPresence: vi.fn(() => [{}, mockUpdateMyPresence]),
  useOthers: vi.fn(() => mockOthers()),
  useStatus: vi.fn(() => mockStatus()),
}));

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
    it('exposes isConnected from hook', async () => {
      const { useBoardSync } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => 
        useBoardSync({ board: mockBoard as unknown as PlaitBoard, enabled: true })
      );
      
      expect(typeof result.current.isConnected).toBe('boolean');
    });
  });

  describe('remote elements', () => {
    it('exposes remoteElements', async () => {
      const { useBoardSync } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => 
        useBoardSync({ board: mockBoard as unknown as PlaitBoard, enabled: true })
      );
      
      expect(result.current.remoteElements).toEqual([]);
    });
  });

  describe('syncToRemote', () => {
    it('exposes syncToRemote function', async () => {
      const { useBoardSync } = await import('@thinkix/collaboration/hooks');
      const { result } = renderHook(() => 
        useBoardSync({ board: mockBoard as unknown as PlaitBoard, enabled: true })
      );
      
      expect(typeof result.current.syncToRemote).toBe('function');
    });
  });
});
