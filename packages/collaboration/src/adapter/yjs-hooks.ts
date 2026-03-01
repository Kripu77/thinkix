import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import * as Y from 'yjs';
import { LiveblocksYjsProvider } from '@liveblocks/yjs';
import { useRoom, useStatus, useMyPresence, useOthers } from '@liveblocks/react/suspense';
import type { 
  BoardElement, 
  Cursor, 
  ViewportState, 
  UserPresence, 
  ConnectionStatus,
  SyncState,
} from '../types';

function createYjsResources() {
  const doc = new Y.Doc();
  const elements = doc.getMap<BoardElement>('elements');
  return { doc, elements };
}

export function useYjsSync() {
  const room = useRoom();
  const status = useStatus();
  const [resources] = useState(createYjsResources);
  const { doc: ydoc, elements: yelements } = resources;
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const providerRef = useRef<LiveblocksYjsProvider | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    providerRef.current = new LiveblocksYjsProvider(room, ydoc);

    return () => {
      providerRef.current?.destroy();
      providerRef.current = null;
      ydoc.destroy();
    };
  }, [room, ydoc]);

  const elements = useMemo(() => {
    return Array.from(yelements.values());
  }, [yelements]);

  const setElements = useCallback((newElements: BoardElement[]) => {
    ydoc.transact(() => {
      yelements.clear();
      newElements.forEach((el) => {
        yelements.set(el.id, el);
      });
    }, 'local');
  }, [ydoc, yelements]);

  const insertElement = useCallback((element: BoardElement) => {
    ydoc.transact(() => {
      yelements.set(element.id, element);
    }, 'local');
  }, [ydoc, yelements]);

  const updateElement = useCallback((id: string, changes: Record<string, unknown>) => {
    const current = yelements.get(id);
    if (!current) return;

    ydoc.transact(() => {
      yelements.set(id, { ...current, ...changes } as BoardElement);
    }, 'local');
  }, [ydoc, yelements]);

  const deleteElement = useCallback((id: string) => {
    ydoc.transact(() => {
      yelements.delete(id);
    }, 'local');
  }, [ydoc, yelements]);

  useEffect(() => {
    if (status === 'connected') {
      queueMicrotask(() => setLastSyncedAt(Date.now()));
    } else {
      queueMicrotask(() => setLastSyncedAt(null));
    }
  }, [status]);

  const syncState: SyncState = useMemo(() => ({
    isConnected: status === 'connected',
    isSyncing: status === 'connecting',
    lastSyncedAt,
  }), [status, lastSyncedAt]);

  return {
    ydoc,
    yelements,
    elements,
    setElements,
    insertElement,
    updateElement,
    deleteElement,
    syncState,
  };
}

interface UseYjsPresenceOptions {
  throttleMs?: number;
}

export function useYjsPresence(options: UseYjsPresenceOptions = {}) {
  const { throttleMs = 50 } = options;
  const [, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const status = useStatus();
  
  const lastCursorUpdateRef = useRef<number>(0);
  const pendingCursorRef = useRef<Cursor | null>(null);
  const throttleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushCursorUpdate = useCallback(() => {
    lastCursorUpdateRef.current = Date.now();
    updateMyPresence({ cursor: pendingCursorRef.current as unknown as undefined });
  }, [updateMyPresence]);

  const updateCursor = useCallback((cursor: Cursor | null) => {
    const now = Date.now();
    pendingCursorRef.current = cursor;

    if (now - lastCursorUpdateRef.current >= throttleMs) {
      flushCursorUpdate();
    } else if (!throttleTimeoutRef.current) {
      const delay = throttleMs - (now - lastCursorUpdateRef.current);
      throttleTimeoutRef.current = setTimeout(() => {
        flushCursorUpdate();
        throttleTimeoutRef.current = null;
      }, delay);
    }
  }, [throttleMs, flushCursorUpdate]);

  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);

  const updateSelection = useCallback((selection: string[]) => {
    updateMyPresence({ selection: selection as unknown as undefined });
  }, [updateMyPresence]);

  const updateViewport = useCallback((viewport: ViewportState) => {
    updateMyPresence({ viewport: viewport as unknown as undefined });
  }, [updateMyPresence]);

  const connectionStatus: ConnectionStatus = status;

  const othersPresence: UserPresence[] = useMemo(() => {
    return others
      .filter(other => other.presence.user)
      .map(other => ({
        connectionId: String(other.connectionId),
        user: other.presence.user as { id: string; name: string; color: string; avatar?: string },
        cursor: other.presence.cursor as Cursor | undefined,
        selection: other.presence.selection as string[] | undefined,
        viewport: other.presence.viewport as ViewportState | undefined,
      }));
  }, [others]);

  return {
    updateCursor,
    updateSelection,
    updateViewport,
    others: othersPresence,
    connectionStatus,
  };
}

export { Y };
