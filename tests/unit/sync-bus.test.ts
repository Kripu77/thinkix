import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { SyncBusProvider, useSyncBus } from '@thinkix/collaboration';
import type { BoardElement } from '@thinkix/collaboration';

const wrapper = ({ children }: { children: ReactNode }) => 
  createElement(SyncBusProvider, null, children);

describe('SyncBus', () => {
  describe('subscribeToLocalChanges', () => {
    it('calls callback when emitLocalChange is triggered', () => {
      const callback = vi.fn();
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      const { result } = renderHook(() => {
        const { syncBus, emitLocalChange } = useSyncBus();
        syncBus.subscribeToLocalChanges(callback);
        return { emitLocalChange };
      }, { wrapper });

      act(() => {
        result.current.emitLocalChange(elements);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(elements);
    });

    it('supports multiple subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      const { result } = renderHook(() => {
        const { syncBus, emitLocalChange } = useSyncBus();
        syncBus.subscribeToLocalChanges(callback1);
        syncBus.subscribeToLocalChanges(callback2);
        return { emitLocalChange };
      }, { wrapper });

      act(() => {
        result.current.emitLocalChange(elements);
      });

      expect(callback1).toHaveBeenCalledWith(elements);
      expect(callback2).toHaveBeenCalledWith(elements);
    });

    it('unsubscribe stops receiving events', () => {
      const callback = vi.fn();
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      const { result } = renderHook(() => {
        const { syncBus, emitLocalChange } = useSyncBus();
        const unsubscribe = syncBus.subscribeToLocalChanges(callback);
        return { emitLocalChange, unsubscribe };
      }, { wrapper });

      act(() => {
        result.current.emitLocalChange(elements);
      });
      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.unsubscribe();
        result.current.emitLocalChange(elements);
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('handles multiple unsubscribes independently', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      const { result } = renderHook(() => {
        const { syncBus, emitLocalChange } = useSyncBus();
        const unsub1 = syncBus.subscribeToLocalChanges(callback1);
        syncBus.subscribeToLocalChanges(callback2);
        return { emitLocalChange, unsub1 };
      }, { wrapper });

      act(() => {
        result.current.unsub1();
        result.current.emitLocalChange(elements);
      });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('handles empty subscriber list gracefully', () => {
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      const { result } = renderHook(() => {
        const { emitLocalChange } = useSyncBus();
        return { emitLocalChange };
      }, { wrapper });

      expect(() => {
        act(() => {
          result.current.emitLocalChange(elements);
        });
      }).not.toThrow();
    });
  });

  describe('subscribeToRemoteChanges', () => {
    it('calls callback when emitRemoteChange is triggered', () => {
      const callback = vi.fn();
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      const { result } = renderHook(() => {
        const { syncBus } = useSyncBus();
        syncBus.subscribeToRemoteChanges(callback);
        return { syncBus };
      }, { wrapper });

      act(() => {
        result.current.syncBus.emitRemoteChange(elements);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(elements);
    });

    it('supports multiple subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      const { result } = renderHook(() => {
        const { syncBus } = useSyncBus();
        syncBus.subscribeToRemoteChanges(callback1);
        syncBus.subscribeToRemoteChanges(callback2);
        return { syncBus };
      }, { wrapper });

      act(() => {
        result.current.syncBus.emitRemoteChange(elements);
      });

      expect(callback1).toHaveBeenCalledWith(elements);
      expect(callback2).toHaveBeenCalledWith(elements);
    });

    it('unsubscribe stops receiving events', () => {
      const callback = vi.fn();
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      const { result } = renderHook(() => {
        const { syncBus } = useSyncBus();
        const unsubscribe = syncBus.subscribeToRemoteChanges(callback);
        return { syncBus, unsubscribe };
      }, { wrapper });

      act(() => {
        result.current.syncBus.emitRemoteChange(elements);
      });
      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.unsubscribe();
        result.current.syncBus.emitRemoteChange(elements);
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does not receive local changes', () => {
      const remoteCallback = vi.fn();
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      const { result } = renderHook(() => {
        const { syncBus, emitLocalChange } = useSyncBus();
        syncBus.subscribeToRemoteChanges(remoteCallback);
        return { emitLocalChange };
      }, { wrapper });

      act(() => {
        result.current.emitLocalChange(elements);
      });

      expect(remoteCallback).not.toHaveBeenCalled();
    });
  });

  describe('isolation between local and remote', () => {
    it('local subscribers do not receive remote changes', () => {
      const localCallback = vi.fn();
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      const { result } = renderHook(() => {
        const { syncBus } = useSyncBus();
        syncBus.subscribeToLocalChanges(localCallback);
        return { syncBus };
      }, { wrapper });

      act(() => {
        result.current.syncBus.emitRemoteChange(elements);
      });

      expect(localCallback).not.toHaveBeenCalled();
    });

    it('both buses can emit independently', () => {
      const localCallback = vi.fn();
      const remoteCallback = vi.fn();
      const localElements: BoardElement[] = [{ id: 'local', type: 'test' }];
      const remoteElements: BoardElement[] = [{ id: 'remote', type: 'test' }];

      const { result } = renderHook(() => {
        const { syncBus, emitLocalChange } = useSyncBus();
        syncBus.subscribeToLocalChanges(localCallback);
        syncBus.subscribeToRemoteChanges(remoteCallback);
        return { syncBus, emitLocalChange };
      }, { wrapper });

      act(() => {
        result.current.emitLocalChange(localElements);
        result.current.syncBus.emitRemoteChange(remoteElements);
      });

      expect(localCallback).toHaveBeenCalledWith(localElements);
      expect(localCallback).toHaveBeenCalledTimes(1);
      expect(remoteCallback).toHaveBeenCalledWith(remoteElements);
      expect(remoteCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('handles empty elements array', () => {
      const callback = vi.fn();
      const elements: BoardElement[] = [];

      const { result } = renderHook(() => {
        const { syncBus, emitLocalChange } = useSyncBus();
        syncBus.subscribeToLocalChanges(callback);
        return { emitLocalChange };
      }, { wrapper });

      act(() => {
        result.current.emitLocalChange(elements);
      });

      expect(callback).toHaveBeenCalledWith([]);
    });

    it('handles large elements array', () => {
      const callback = vi.fn();
      const elements: BoardElement[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `element-${i}`,
        type: 'test',
        data: { value: i },
      }));

      const { result } = renderHook(() => {
        const { syncBus, emitLocalChange } = useSyncBus();
        syncBus.subscribeToLocalChanges(callback);
        return { emitLocalChange };
      }, { wrapper });

      act(() => {
        result.current.emitLocalChange(elements);
      });

      expect(callback).toHaveBeenCalledWith(elements);
      expect(callback.mock.calls[0][0]).toHaveLength(1000);
    });

    it('handles rapid successive emits', () => {
      const callback = vi.fn();

      const { result } = renderHook(() => {
        const { syncBus, emitLocalChange } = useSyncBus();
        syncBus.subscribeToLocalChanges(callback);
        return { emitLocalChange };
      }, { wrapper });

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.emitLocalChange([{ id: `element-${i}`, type: 'test' }]);
        }
      });

      expect(callback).toHaveBeenCalledTimes(100);
    });

    it('handles callback that throws error', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = vi.fn();

      const { result } = renderHook(() => {
        const { syncBus, emitLocalChange } = useSyncBus();
        syncBus.subscribeToLocalChanges(errorCallback);
        syncBus.subscribeToLocalChanges(normalCallback);
        return { emitLocalChange };
      }, { wrapper });

      expect(() => {
        act(() => {
          result.current.emitLocalChange([{ id: '1', type: 'test' }]);
        });
      }).not.toThrow();
      expect(errorCallback).toHaveBeenCalledTimes(1);
      expect(normalCallback).toHaveBeenCalledTimes(1);
    });
  });
});
