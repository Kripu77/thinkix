'use client';

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import type { BoardElement } from './types';
import { logger } from './logger';

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
    this.localCallbacks.forEach(cb => {
      try {
        cb(elements);
      } catch (error) {
        logger.error('Error in local change subscriber', error instanceof Error ? error : undefined);
      }
    });
  }

  emitRemoteChange(elements: BoardElement[]): void {
    this.remoteCallbacks.forEach(cb => {
      try {
        cb(elements);
      } catch (error) {
        logger.error('Error in remote change subscriber', error instanceof Error ? error : undefined);
      }
    });
  }
}

interface SyncBusContextValue {
  syncBus: SyncBus;
  emitLocalChange: (elements: BoardElement[]) => void;
}

const SyncBusContext = createContext<SyncBusContextValue | null>(null);

function createSyncBus(): SyncBusImpl {
  return new SyncBusImpl();
}

export function SyncBusProvider({ children }: { children: ReactNode }) {
  const [syncBus] = useState(createSyncBus);

  const emitLocalChange = useCallback((elements: BoardElement[]) => {
    syncBus.emitLocalChange(elements);
  }, [syncBus]);

  const value = useMemo(() => ({
    syncBus,
    emitLocalChange,
  }), [syncBus, emitLocalChange]);

  return (
    <SyncBusContext.Provider value={value}>
      {children}
    </SyncBusContext.Provider>
  );
}

export function useSyncBus(): SyncBusContextValue {
  const context = useContext(SyncBusContext);
  if (!context) {
    throw new Error('useSyncBus must be used within SyncBusProvider');
  }
  return context;
}

export function useOptionalSyncBus(): SyncBusContextValue | null {
  return useContext(SyncBusContext);
}

export type { SyncBus };
