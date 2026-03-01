import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSyncBus, resetSyncBus } from '@thinkix/collaboration';
import type { BoardElement } from '@thinkix/collaboration';

describe('SyncBus', () => {
  beforeEach(() => {
    resetSyncBus();
  });

  afterEach(() => {
    resetSyncBus();
  });

  describe('singleton pattern', () => {
    it('returns the same instance on multiple calls', () => {
      const bus1 = getSyncBus();
      const bus2 = getSyncBus();
      expect(bus1).toBe(bus2);
    });

    it('returns new instance after reset', () => {
      const bus1 = getSyncBus();
      resetSyncBus();
      const bus2 = getSyncBus();
      expect(bus1).not.toBe(bus2);
    });
  });

  describe('subscribeToLocalChanges', () => {
    it('calls callback when emitLocalChange is triggered', () => {
      const bus = getSyncBus();
      const callback = vi.fn();
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      bus.subscribeToLocalChanges(callback);
      bus.emitLocalChange(elements);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(elements);
    });

    it('supports multiple subscribers', () => {
      const bus = getSyncBus();
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      bus.subscribeToLocalChanges(callback1);
      bus.subscribeToLocalChanges(callback2);
      bus.emitLocalChange(elements);

      expect(callback1).toHaveBeenCalledWith(elements);
      expect(callback2).toHaveBeenCalledWith(elements);
    });

    it('unsubscribe stops receiving events', () => {
      const bus = getSyncBus();
      const callback = vi.fn();
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      const unsubscribe = bus.subscribeToLocalChanges(callback);
      bus.emitLocalChange(elements);
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      bus.emitLocalChange(elements);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('handles multiple unsubscribes independently', () => {
      const bus = getSyncBus();
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      const unsub1 = bus.subscribeToLocalChanges(callback1);
      bus.subscribeToLocalChanges(callback2);

      unsub1();
      bus.emitLocalChange(elements);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('handles empty subscriber list gracefully', () => {
      const bus = getSyncBus();
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      expect(() => bus.emitLocalChange(elements)).not.toThrow();
    });
  });

  describe('subscribeToRemoteChanges', () => {
    it('calls callback when emitRemoteChange is triggered', () => {
      const bus = getSyncBus();
      const callback = vi.fn();
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      bus.subscribeToRemoteChanges(callback);
      bus.emitRemoteChange(elements);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(elements);
    });

    it('supports multiple subscribers', () => {
      const bus = getSyncBus();
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      bus.subscribeToRemoteChanges(callback1);
      bus.subscribeToRemoteChanges(callback2);
      bus.emitRemoteChange(elements);

      expect(callback1).toHaveBeenCalledWith(elements);
      expect(callback2).toHaveBeenCalledWith(elements);
    });

    it('unsubscribe stops receiving events', () => {
      const bus = getSyncBus();
      const callback = vi.fn();
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      const unsubscribe = bus.subscribeToRemoteChanges(callback);
      bus.emitRemoteChange(elements);
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      bus.emitRemoteChange(elements);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does not receive local changes', () => {
      const bus = getSyncBus();
      const remoteCallback = vi.fn();
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      bus.subscribeToRemoteChanges(remoteCallback);
      bus.emitLocalChange(elements);

      expect(remoteCallback).not.toHaveBeenCalled();
    });
  });

  describe('isolation between local and remote', () => {
    it('local subscribers do not receive remote changes', () => {
      const bus = getSyncBus();
      const localCallback = vi.fn();
      const elements: BoardElement[] = [{ id: '1', type: 'test' }];

      bus.subscribeToLocalChanges(localCallback);
      bus.emitRemoteChange(elements);

      expect(localCallback).not.toHaveBeenCalled();
    });

    it('both buses can emit independently', () => {
      const bus = getSyncBus();
      const localCallback = vi.fn();
      const remoteCallback = vi.fn();
      const localElements: BoardElement[] = [{ id: 'local', type: 'test' }];
      const remoteElements: BoardElement[] = [{ id: 'remote', type: 'test' }];

      bus.subscribeToLocalChanges(localCallback);
      bus.subscribeToRemoteChanges(remoteCallback);

      bus.emitLocalChange(localElements);
      bus.emitRemoteChange(remoteElements);

      expect(localCallback).toHaveBeenCalledWith(localElements);
      expect(localCallback).toHaveBeenCalledTimes(1);
      expect(remoteCallback).toHaveBeenCalledWith(remoteElements);
      expect(remoteCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('handles empty elements array', () => {
      const bus = getSyncBus();
      const callback = vi.fn();
      const elements: BoardElement[] = [];

      bus.subscribeToLocalChanges(callback);
      bus.emitLocalChange(elements);

      expect(callback).toHaveBeenCalledWith([]);
    });

    it('handles large elements array', () => {
      const bus = getSyncBus();
      const callback = vi.fn();
      const elements: BoardElement[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `element-${i}`,
        type: 'test',
        data: { value: i },
      }));

      bus.subscribeToLocalChanges(callback);
      bus.emitLocalChange(elements);

      expect(callback).toHaveBeenCalledWith(elements);
      expect(callback.mock.calls[0][0]).toHaveLength(1000);
    });

    it('handles rapid successive emits', () => {
      const bus = getSyncBus();
      const callback = vi.fn();

      bus.subscribeToLocalChanges(callback);

      for (let i = 0; i < 100; i++) {
        bus.emitLocalChange([{ id: `element-${i}`, type: 'test' }]);
      }

      expect(callback).toHaveBeenCalledTimes(100);
    });

    it('handles callback that throws error', () => {
      const bus = getSyncBus();
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = vi.fn();

      bus.subscribeToLocalChanges(errorCallback);
      bus.subscribeToLocalChanges(normalCallback);

      expect(() => bus.emitLocalChange([{ id: '1', type: 'test' }])).not.toThrow();
      expect(errorCallback).toHaveBeenCalledTimes(1);
      expect(normalCallback).toHaveBeenCalledTimes(1);
    });
  });
});
