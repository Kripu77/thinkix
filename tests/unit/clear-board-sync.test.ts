import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { SyncBusProvider, useSyncBus } from '@thinkix/collaboration';
import type { BoardElement } from '@thinkix/collaboration';

describe('Clear Board Sync', () => {
  const wrapper = ({ children }: { children: ReactNode }) => 
    createElement(SyncBusProvider, null, children);

  describe('emitLocalChange with empty array', () => {
    it('emits empty array when board is cleared', () => {
      const callback = vi.fn();
      
      const { result } = renderHook(() => {
        const { syncBus, emitLocalChange } = useSyncBus();
        syncBus.subscribeToLocalChanges(callback);
        return { emitLocalChange };
      }, { wrapper });

      act(() => {
        result.current.emitLocalChange([]);
      });
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith([]);
    });

    it('empty array sync clears remote elements', () => {
      const localCallback = vi.fn();
      const remoteCallback = vi.fn();
      
      const { result } = renderHook(() => {
        const { syncBus, emitLocalChange } = useSyncBus();
        syncBus.subscribeToLocalChanges(localCallback);
        syncBus.subscribeToRemoteChanges(remoteCallback);
        return { emitLocalChange };
      }, { wrapper });

      act(() => {
        result.current.emitLocalChange([]);
      });
      
      expect(localCallback).toHaveBeenCalledWith([]);
      expect(remoteCallback).not.toHaveBeenCalled();
    });

    it('clears existing elements before new elements are loaded', () => {
      const callback = vi.fn();
      const existingElements: BoardElement[] = [
        { id: '1', type: 'shape' },
        { id: '2', type: 'text' },
      ];
      const newElements: BoardElement[] = [
        { id: '3', type: 'shape' },
      ];
      
      const { result } = renderHook(() => {
        const { syncBus, emitLocalChange } = useSyncBus();
        syncBus.subscribeToLocalChanges(callback);
        return { emitLocalChange };
      }, { wrapper });

      act(() => {
        result.current.emitLocalChange(existingElements);
      });
      expect(callback).toHaveBeenCalledWith(existingElements);
      
      act(() => {
        result.current.emitLocalChange(newElements);
      });
      expect(callback).toHaveBeenCalledWith(newElements);
    });
  });

  describe('file open sync', () => {
    it('emits loaded elements when file is opened', () => {
      const callback = vi.fn();
      const loadedElements: BoardElement[] = [
        { id: 'loaded-1', type: 'mindmap' },
        { id: 'loaded-2', type: 'draw' },
      ];
      
      const { result } = renderHook(() => {
        const { syncBus, emitLocalChange } = useSyncBus();
        syncBus.subscribeToLocalChanges(callback);
        return { emitLocalChange };
      }, { wrapper });

      act(() => {
        result.current.emitLocalChange(loadedElements);
      });
      
      expect(callback).toHaveBeenCalledWith(loadedElements);
    });

    it('file open with empty file emits empty array', () => {
      const callback = vi.fn();
      
      const { result } = renderHook(() => {
        const { syncBus, emitLocalChange } = useSyncBus();
        syncBus.subscribeToLocalChanges(callback);
        return { emitLocalChange };
      }, { wrapper });

      act(() => {
        result.current.emitLocalChange([]);
      });
      
      expect(callback).toHaveBeenCalledWith([]);
    });
  });

  describe('sync isolation', () => {
    it('clear operation does not trigger remote callback', () => {
      const remoteCallback = vi.fn();
      
      const { result } = renderHook(() => {
        const { syncBus, emitLocalChange } = useSyncBus();
        syncBus.subscribeToRemoteChanges(remoteCallback);
        return { emitLocalChange };
      }, { wrapper });

      act(() => {
        result.current.emitLocalChange([]);
      });
      
      expect(remoteCallback).not.toHaveBeenCalled();
    });

    it('multiple clear operations are tracked independently', () => {
      const callback = vi.fn();
      
      const { result } = renderHook(() => {
        const { syncBus, emitLocalChange } = useSyncBus();
        syncBus.subscribeToLocalChanges(callback);
        return { emitLocalChange };
      }, { wrapper });

      act(() => {
        result.current.emitLocalChange([{ id: '1', type: 'shape' }]);
        result.current.emitLocalChange([]);
        result.current.emitLocalChange([{ id: '2', type: 'text' }]);
        result.current.emitLocalChange([]);
      });
      
      expect(callback).toHaveBeenCalledTimes(4);
      expect(callback).toHaveBeenNthCalledWith(2, []);
      expect(callback).toHaveBeenNthCalledWith(4, []);
    });
  });

  describe('edge cases', () => {
    it('handles rapid clear and restore operations', () => {
      const callback = vi.fn();
      
      const { result } = renderHook(() => {
        const { syncBus, emitLocalChange } = useSyncBus();
        syncBus.subscribeToLocalChanges(callback);
        return { emitLocalChange };
      }, { wrapper });

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.emitLocalChange([{ id: `el-${i}`, type: 'shape' }]);
          result.current.emitLocalChange([]);
        }
      });
      
      expect(callback).toHaveBeenCalledTimes(20);
    });

    it('handles empty array gracefully', () => {
      const callback = vi.fn();
      
      const { result } = renderHook(() => {
        const { syncBus, emitLocalChange } = useSyncBus();
        syncBus.subscribeToLocalChanges(callback);
        return { emitLocalChange };
      }, { wrapper });

      act(() => {
        result.current.emitLocalChange([]);
      });
      
      expect(callback).toHaveBeenCalledWith([]);
    });
  });
});
