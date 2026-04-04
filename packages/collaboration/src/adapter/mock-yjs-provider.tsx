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
import * as Y from 'yjs';
import type {
  CollaborationUser,
  AdapterConfig,
  BoardElement,
  SyncState,
  ConnectionStatus,
  UndoState,
  UserPresence,
} from '../types';
import { CollaborationRoomContext, type CollaborationRoomContextValue } from './collaboration-context';
import { YjsCollaborationContext } from './yjs-provider';

interface MockYjsContextValue {
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

const MockYjsContext = createContext<MockYjsContextValue | null>(null);
const LOCAL_ORIGIN = Symbol('mock-local-origin');

export function useMockYjsCollaboration(): MockYjsContextValue {
  const context = useContext(MockYjsContext);
  if (!context) {
    throw new Error('useMockYjsCollaboration must be used within MockYjsProvider');
  }
  return context;
}

interface MockYjsProviderProps {
  children: ReactNode;
  user: CollaborationUser;
  config?: AdapterConfig;
  roomId?: string;
  initialElements?: BoardElement[];
}

class MockBroadcastSync {
  private channel: BroadcastChannel | null = null;
  private listeners = new Set<(data: { elements: BoardElement[] }) => void>();

  constructor(roomId: string) {
    if (typeof window !== 'undefined') {
      this.channel = new BroadcastChannel(`thinkix-mock-sync:${roomId}`);
      this.channel.onmessage = (event) => {
        this.listeners.forEach((listener) => {
          try {
            listener(event.data);
          } catch {
          }
        });
      };
    }
  }

  broadcast(elements: BoardElement[]) {
    if (this.channel) {
      this.channel.postMessage({ elements });
    }
  }

  subscribe(listener: (data: { elements: BoardElement[] }) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy() {
    if (this.channel) {
      this.channel.close();
    }
    this.listeners.clear();
  }
}

let mockRoomIdCounter = 0;

function createMockRoomId(): string {
  mockRoomIdCounter++;
  return `mock-room-${mockRoomIdCounter}-${crypto.randomUUID()}`;
}

export function MockYjsProvider({
  children,
  user,
  config,
  roomId: providedRoomId,
  initialElements = [],
}: MockYjsProviderProps) {
  const [roomId] = useState(() => providedRoomId ?? createMockRoomId());
  const [ydoc] = useState(() => new Y.Doc());
  const [yelements] = useState(() => ydoc.getMap<BoardElement>('elements'));
  const [elements, setElementsState] = useState<BoardElement[]>(initialElements);
  const [isLocalChange, setIsLocalChange] = useState(false);
  const [undoState, setUndoState] = useState<UndoState>({
    canUndo: false,
    canRedo: false,
    undoStackSize: 0,
    redoStackSize: 0,
  });
  const [syncState, setSyncState] = useState<SyncState>(() => ({
    isConnected: typeof navigator === 'undefined' ? true : navigator.onLine,
    isSyncing: false,
    lastSyncedAt: initialElements.length > 0 ? Date.now() : 0,
  }));
  
  const syncRef = useRef<MockBroadcastSync | null>(null);

  useEffect(() => {
    if (initialElements.length === 0) return;

    ydoc.transact(() => {
      yelements.clear();
      initialElements.forEach((element) => {
        yelements.set(element.id, element);
      });
    }, LOCAL_ORIGIN);
  }, [initialElements, ydoc, yelements]);

  useEffect(() => {
    syncRef.current = new MockBroadcastSync(roomId);
    
    const unsubscribe = syncRef.current.subscribe((data) => {
      setElementsState(prevElements => {
        const dataIsDifferent = data.elements.length !== prevElements.length ||
          data.elements.some((el, i) => {
            const prevEl = prevElements[i];
            if (!prevEl || el.id !== prevEl.id) return true;
            return JSON.stringify(el) !== JSON.stringify(prevEl);
          });
        
        if (dataIsDifferent) {
          setIsLocalChange(true);
          setTimeout(() => setIsLocalChange(false), 0);
          return data.elements;
        }
        return prevElements;
      });
    });

    return () => {
      unsubscribe();
      syncRef.current?.destroy();
    };
  }, [roomId]);

  useEffect(() => {
    const handleOnline = () => {
      setSyncState({
        isConnected: true,
        isSyncing: false,
        lastSyncedAt: Date.now(),
      });
    };

    const handleOffline = () => {
      setSyncState((current) => ({
        isConnected: false,
        isSyncing: current.isConnected,
        lastSyncedAt: current.lastSyncedAt,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const undoManager = useMemo(() => {
    return new Y.UndoManager(yelements, {
      trackedOrigins: new Set([LOCAL_ORIGIN]),
    });
  }, [yelements]);

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

  const setElements = useCallback((newElements: BoardElement[]) => {
    setIsLocalChange(true);
    
    ydoc.transact(() => {
      yelements.clear();
      newElements.forEach((el) => {
        yelements.set(el.id, el);
      });
    }, LOCAL_ORIGIN);

    setElementsState(newElements);
    setSyncState((current) => ({
      ...current,
      lastSyncedAt: Date.now(),
    }));
    
    if (syncRef.current) {
      syncRef.current.broadcast(newElements);
    }

    setTimeout(() => setIsLocalChange(false), 0);
  }, [ydoc, yelements]);

  const insertElement = useCallback((element: BoardElement) => {
    setElements([...elements, element]);
  }, [elements, setElements]);

  const updateElement = useCallback((id: string, changes: Record<string, unknown>) => {
    const newElements = elements.map((el) =>
      el.id === id ? { ...el, ...changes } : el
    );
    setElements(newElements);
  }, [elements, setElements]);

  const deleteElement = useCallback((id: string) => {
     setElements(elements.filter((el) => el.id !== id));
   }, [elements, setElements]);

  const updateElementsFromYElements = useCallback(() => {
    const newElements = Array.from(yelements.values());
    setElementsState(newElements);
    
    if (syncRef.current) {
      syncRef.current.broadcast(newElements);
    }
  }, [yelements]);

   const undo = useCallback(() => {
     if (undoManager.undoStack.length > 0) {
       undoManager.undo();
       updateElementsFromYElements();
     }
   }, [undoManager, updateElementsFromYElements]);

  const redo = useCallback(() => {
     if (undoManager.redoStack.length > 0) {
       undoManager.redo();
       updateElementsFromYElements();
     }
   }, [undoManager, updateElementsFromYElements]);

  const value = useMemo(() => ({
    ydoc,
    elements,
    isLocalChange,
    setElements,
    insertElement,
    updateElement,
    deleteElement,
    syncState,
    user,
    config: config ?? { presence: { throttleMs: 50, idleTimeoutMs: 30000 }, pageSize: 50 },
    undoState,
    undo,
    redo,
  }), [ydoc, elements, isLocalChange, setElements, insertElement, updateElement, deleteElement, syncState, user, config, undoState, undo, redo]);

  const roomContextValue = useMemo<CollaborationRoomContextValue>(() => ({
    user,
    others: [] as UserPresence[],
    userCount: 1,
    connectionStatus: syncState.isConnected
      ? ('connected' as ConnectionStatus)
      : syncState.isSyncing
        ? ('reconnecting' as ConnectionStatus)
        : ('disconnected' as ConnectionStatus),
    syncState,
    updatePresence: () => {},
    elements,
    setElements,
    isLocalChange,
    roomId,
    undoState,
    undo,
    redo,
  }), [user, syncState, elements, setElements, isLocalChange, roomId, undoState, undo, redo]);

  return (
    <MockYjsContext.Provider value={value}>
      <YjsCollaborationContext.Provider value={value}>
        <CollaborationRoomContext.Provider value={roomContextValue}>
          {children}
        </CollaborationRoomContext.Provider>
      </YjsCollaborationContext.Provider>
    </MockYjsContext.Provider>
  );
}
