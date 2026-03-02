'use client';

import {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { LiveblocksProvider, RoomProvider, useRoom, useStatus, useMyPresence } from '@liveblocks/react/suspense';
import { LiveblocksYjsProvider } from '@liveblocks/yjs';
import * as Y from 'yjs';
import type {
  CollaborationUser,
  AdapterConfig,
  BoardElement,
  SyncState,
  Cursor,
  ViewportState,
  ConnectionStatus,
  UndoState,
} from '../types';

interface YjsCollaborationContextValue {
  ydoc: Y.Doc | null;
  elements: BoardElement[];
  isLocalChange: boolean;
  setElements: (elements: BoardElement[]) => void;
  insertElement: (element: BoardElement) => void;
  updateElement: (id: string, changes: Record<string, unknown>) => void;
  deleteElement: (id: string) => void;
  syncState: SyncState;
  user: CollaborationUser;
  config: AdapterConfig;
  undoState: UndoState;
  undo: () => void;
  redo: () => void;
}

const YjsCollaborationContext = createContext<YjsCollaborationContextValue | null>(null);

const LOCAL_ORIGIN = Symbol('local-origin');

export function useYjsCollaboration(): YjsCollaborationContextValue {
  const context = useContext(YjsCollaborationContext);
  if (!context) {
    throw new Error('useYjsCollaboration must be used within YjsCollaborationProvider');
  }
  return context;
}

export function useOptionalYjsCollaboration(): YjsCollaborationContextValue | null {
  return useContext(YjsCollaborationContext);
}

interface YjsProviderProps {
  children: ReactNode;
  user: CollaborationUser;
  config?: Partial<AdapterConfig>;
  authEndpoint?: string;
  publicKey?: string;
}

export function YjsProvider({
  children,
  user,
  config: userConfig,
  authEndpoint,
  publicKey,
}: YjsProviderProps) {
  const config: AdapterConfig = useMemo(() => ({
    presence: {
      throttleMs: userConfig?.presence?.throttleMs ?? 50,
      idleTimeoutMs: userConfig?.presence?.idleTimeoutMs ?? 30000
    },
    pageSize: userConfig?.pageSize ?? 50
  }), [userConfig]);

  const authEndpointFn = useMemo(() => {
    if (!authEndpoint) return undefined;
    return async (room?: string) => {
      const response = await fetch(authEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room,
          userId: user.id,
          userName: user.name,
          userColor: user.color,
        }),
      });
      return response.json();
    };
  }, [authEndpoint, user.id, user.name, user.color]);

  const fallbackKey = process.env['NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY'];
  const key = publicKey || fallbackKey;

  if (!authEndpointFn && !key) {
    if (typeof window !== 'undefined') {
      console.warn('YjsProvider: No auth endpoint or public key provided');
    }
    return <>{children}</>;
  }

  if (authEndpointFn) {
    return (
      <LiveblocksProvider
        authEndpoint={authEndpointFn}
        throttle={config.presence.throttleMs}
      >
        {children}
      </LiveblocksProvider>
    );
  }

  return (
    <LiveblocksProvider
      publicApiKey={key!}
      throttle={config.presence.throttleMs}
    >
      {children}
    </LiveblocksProvider>
  );
}

interface YjsRoomProps {
  roomId: string;
  initialElements?: BoardElement[];
  children: ReactNode;
  user: CollaborationUser;
  config?: AdapterConfig;
}

function createYjsResources() {
  const ydoc = new Y.Doc();
  const yelements = ydoc.getMap<BoardElement>('elements');
  const undoManager = new Y.UndoManager(yelements, {
    trackedOrigins: new Set([LOCAL_ORIGIN]),
  });
  return { ydoc, yelements, undoManager };
}

export function YjsRoom({
  roomId,
  initialElements,
  children,
  user,
  config,
}: YjsRoomProps) {
  const [resources] = useState(createYjsResources);
  const { ydoc, yelements, undoManager } = resources;

  return (
    <RoomProvider id={roomId} initialStorage={() => ({ elements: [], version: 1 })}>
      <YjsRoomInner
        ydoc={ydoc}
        yelements={yelements}
        undoManager={undoManager}
        initialElements={initialElements}
        user={user}
        config={config ?? { presence: { throttleMs: 50, idleTimeoutMs: 30000 }, pageSize: 50 }}
      >
        {children}
      </YjsRoomInner>
    </RoomProvider>
  );
}

interface YjsRoomInnerProps {
  ydoc: Y.Doc;
  yelements: Y.Map<BoardElement>;
  undoManager: Y.UndoManager;
  initialElements?: BoardElement[];
  user: CollaborationUser;
  config: AdapterConfig;
  children: ReactNode;
}

function YjsRoomInner({
  ydoc,
  yelements,
  undoManager,
  initialElements,
  user,
  config,
  children,
}: YjsRoomInnerProps) {
  const room = useRoom();
  const status = useStatus();
  const [elements, setElementsState] = useState<BoardElement[]>([]);
  const [isLocalChange, setIsLocalChange] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [undoState, setUndoState] = useState<UndoState>({
    canUndo: false,
    canRedo: false,
    undoStackSize: 0,
    redoStackSize: 0,
  });
  
  const providerRef = useRef<LiveblocksYjsProvider | null>(null);
  const initialElementsSetRef = useRef(false);

  useEffect(() => {
    if (providerRef.current) return;

    const provider = new LiveblocksYjsProvider(room, ydoc);
    providerRef.current = provider;

    return () => {
      provider.destroy();
      providerRef.current = null;
    };
  }, [room, ydoc]);

  useEffect(() => {
    if (status !== 'connected') return;
    if (initialElementsSetRef.current) return;
    if (!initialElements || initialElements.length === 0) return;
    if (yelements.size > 0) return;
    
    initialElementsSetRef.current = true;
    
    ydoc.transact(() => {
      initialElements.forEach(el => {
        yelements.set(el.id, el);
      });
    }, 'init');
  }, [ydoc, yelements, initialElements, status]);

  useEffect(() => {
    const observer = (event: Y.YMapEvent<BoardElement>) => {
      const transaction = event.transaction;
      const isLocal = transaction?.local && transaction.origin === LOCAL_ORIGIN;
      
      const elementsArray = Array.from(yelements.values());
      setIsLocalChange(isLocal ?? false);
      setElementsState(elementsArray);
    };
    
    yelements.observe(observer);
    queueMicrotask(() => {
      const elementsArray = Array.from(yelements.values());
      if (elementsArray.length > 0) {
        setElementsState(elementsArray);
      }
    });
    
    return () => {
      yelements.unobserve(observer);
    };
  }, [yelements]);

  useEffect(() => {
    if (status === 'connected') {
      queueMicrotask(() => setLastSyncedAt(Date.now()));
    } else {
      queueMicrotask(() => setLastSyncedAt(null));
    }
  }, [status]);

  useEffect(() => {
    const updateUndoState = () => {
      setUndoState({
        canUndo: undoManager.undoStack.length > 0,
        canRedo: undoManager.redoStack.length > 0,
        undoStackSize: undoManager.undoStack.length,
        redoStackSize: undoManager.redoStack.length,
      });
    };

    updateUndoState();
    
    undoManager.on('stack-item-added', updateUndoState);
    undoManager.on('stack-item-popped', updateUndoState);
    undoManager.on('stack-cleared', updateUndoState);
    
    return () => {
      undoManager.off('stack-item-added', updateUndoState);
      undoManager.off('stack-item-popped', updateUndoState);
      undoManager.off('stack-cleared', updateUndoState);
    };
  }, [undoManager]);

  const undo = useCallback(() => {
    if (undoManager.undoStack.length > 0) {
      undoManager.undo();
    }
  }, [undoManager]);

  const redo = useCallback(() => {
    if (undoManager.redoStack.length > 0) {
      undoManager.redo();
    }
  }, [undoManager]);

  const setElements = useCallback((newElements: BoardElement[]) => {
    ydoc.transact(() => {
      yelements.clear();
      newElements.forEach(el => {
        yelements.set(el.id, el);
      });
    }, LOCAL_ORIGIN);
  }, [ydoc, yelements]);

  const insertElement = useCallback((element: BoardElement) => {
    ydoc.transact(() => {
      yelements.set(element.id, element);
    }, LOCAL_ORIGIN);
  }, [ydoc, yelements]);

  const updateElement = useCallback((id: string, changes: Record<string, unknown>) => {
    const current = yelements.get(id);
    if (!current) return;

    ydoc.transact(() => {
      yelements.set(id, { ...current, ...changes } as BoardElement);
    }, LOCAL_ORIGIN);
  }, [ydoc, yelements]);

  const deleteElement = useCallback((id: string) => {
    ydoc.transact(() => {
      yelements.delete(id);
    }, LOCAL_ORIGIN);
  }, [ydoc, yelements]);

  const syncState: SyncState = useMemo(() => ({
    isConnected: status === 'connected',
    isSyncing: status === 'connecting',
    lastSyncedAt,
  }), [status, lastSyncedAt]);

  const contextValue = useMemo<YjsCollaborationContextValue>(() => ({
    ydoc,
    elements,
    isLocalChange,
    setElements,
    insertElement,
    updateElement,
    deleteElement,
    syncState,
    user,
    config,
    undoState,
    undo,
    redo,
  }), [
    ydoc,
    elements,
    isLocalChange,
    setElements,
    insertElement,
    updateElement,
    deleteElement,
    syncState,
    user,
    config,
    undoState,
    undo,
    redo,
  ]);

  return (
    <YjsCollaborationContext.Provider value={contextValue}>
      {children}
    </YjsCollaborationContext.Provider>
  );
}

interface UseYjsPresenceOptions {
  throttleMs?: number;
}

export function useYjsPresence(options: UseYjsPresenceOptions = {}) {
  const { throttleMs = 50 } = options;
  const [, updateMyPresence] = useMyPresence();
  const status = useStatus();
  
  const lastCursorUpdateRef = useRef<number>(0);
  const pendingCursorRef = useRef<Cursor | null>(null);
  const throttleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushCursorUpdate = useCallback(() => {
    lastCursorUpdateRef.current = Date.now();
    const cursor = pendingCursorRef.current;
    updateMyPresence({ cursor: cursor ?? undefined } as Parameters<typeof updateMyPresence>[0]);
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
    updateMyPresence({ selection } as Parameters<typeof updateMyPresence>[0]);
  }, [updateMyPresence]);

  const updateViewport = useCallback((viewport: ViewportState) => {
    updateMyPresence({ viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom } } as Parameters<typeof updateMyPresence>[0]);
  }, [updateMyPresence]);

  const connectionStatus: ConnectionStatus = status;

  return {
    updateCursor,
    updateSelection,
    updateViewport,
    connectionStatus,
  };
}

export { Y };
