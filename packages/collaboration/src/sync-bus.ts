import type { BoardElement } from './types';

type ElementsChangeCallback = (elements: BoardElement[]) => void;

interface SyncBus {
  subscribeToLocalChanges(callback: ElementsChangeCallback): () => void;
  subscribeToRemoteChanges(callback: ElementsChangeCallback): () => void;
  emitLocalChange(elements: BoardElement[]): void;
  emitRemoteChange(elements: BoardElement[]): void;
}

class SyncBusImpl implements SyncBus {
  private localCallbacks = new Set<ElementsChangeCallback>();
  private remoteCallbacks = new Set<ElementsChangeCallback>();

  subscribeToLocalChanges(callback: ElementsChangeCallback): () => void {
    this.localCallbacks.add(callback);
    return () => this.localCallbacks.delete(callback);
  }

  subscribeToRemoteChanges(callback: ElementsChangeCallback): () => void {
    this.remoteCallbacks.add(callback);
    return () => this.remoteCallbacks.delete(callback);
  }

  emitLocalChange(elements: BoardElement[]): void {
    this.localCallbacks.forEach(cb => cb(elements));
  }

  emitRemoteChange(elements: BoardElement[]): void {
    this.remoteCallbacks.forEach(cb => cb(elements));
  }
}

let syncBusInstance: SyncBus | null = null;

export function getSyncBus(): SyncBus {
  if (!syncBusInstance) {
    syncBusInstance = new SyncBusImpl();
  }
  return syncBusInstance;
}

export function resetSyncBus(): void {
  syncBusInstance = null;
}

export type { SyncBus };
