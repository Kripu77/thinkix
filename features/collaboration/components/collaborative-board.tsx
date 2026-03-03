'use client';

import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import {
  useYjsCollaboration,
  useCollaborationRoom,
  setStoredUser,
  ShareButton,
  NicknameDialog,
  useCursorTracking,
  CursorOverlay,
  CollaborationErrorBoundary,
  useSyncBus,
  logger,
  type BoardElement,
} from '@thinkix/collaboration';
import { Button } from '@thinkix/ui';
import { UserCircle2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useBoardState } from '@/features/board/hooks/use-board-state';

interface CollaborativeBoardProps {
  children: ReactNode;
}

function UserAvatar({ avatarDataUrl, size = 20 }: { avatarDataUrl?: string; size?: number }) {
  if (!avatarDataUrl) {
    return <UserCircle2 className="h-4 w-4" />;
  }
  
  return (
    <img 
      src={avatarDataUrl}
      alt="User avatar"
      className="rounded-full flex-shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

function generateElementsHash(elements: BoardElement[]): string {
  try {
    const hashContent = elements.map(el => {
      const { id, type, ...rest } = el;
      const propsHash = JSON.stringify(rest);
      return `${id}:${type || ''}:${propsHash}`;
    }).join('|||');
    
    let hash = 0;
     for (let i = 0; i < hashContent.length; i++) {
       const char = hashContent.charCodeAt(i);
       hash = ((hash << 5) - hash) + char;
       hash |= 0;
     }
    return hash.toString(36);
  } catch (error) {
    logger.error('Error generating elements hash', error instanceof Error ? error : undefined);
    return Date.now().toString(36);
  }
}

function CollaborativeBoardInner({ children }: CollaborativeBoardProps) {
  const { board } = useBoardState();
  const { elements, isLocalChange, setElements, syncState } = useYjsCollaboration();
  const { syncBus } = useSyncBus();
  const lastElementsHashRef = useRef<string>('');
  const isSyncingRef = useRef(false);
  const offlineQueueRef = useRef<BoardElement[][]>([]);
  const hasReceivedElementsRef = useRef(false);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);

  const { cursors } = useCursorTracking({
    board,
    enabled: syncState.isConnected,
    throttleIntervalMs: 50,
    idleTimeoutMs: 30000,
  });

  useEffect(() => {
    if (!board || isLocalChange || isSyncingRef.current) return;
    
    if (elements.length > 0) {
      hasReceivedElementsRef.current = true;
    }
    
    if (elements.length === 0 && !hasReceivedElementsRef.current) return;
    
    const hash = generateElementsHash(elements);
    if (hash === lastElementsHashRef.current) return;
    
    lastElementsHashRef.current = hash;
    
    // eslint-disable-next-line react-hooks/immutability -- Plait board model requires direct mutation
    board.children = elements as unknown as typeof board.children;
    
    syncBus.emitRemoteChange(elements);
  }, [elements, isLocalChange, board, syncBus]);

  useEffect(() => {
    if (!board) return;
    
    const unsubscribe = syncBus.subscribeToLocalChanges((localElements: BoardElement[]) => {
      const hash = generateElementsHash(localElements);
      
      if (hash === lastElementsHashRef.current) return;

      if (!syncState.isConnected) {
        offlineQueueRef.current.push([...localElements]);
        setShowOfflineWarning(true);
        lastElementsHashRef.current = hash;
        return;
      }
      
      if (isSyncingRef.current) return;
      
      isSyncingRef.current = true;
      lastElementsHashRef.current = hash;
      setElements(localElements);
      
      queueMicrotask(() => {
        isSyncingRef.current = false;
      });
    });

    return unsubscribe;
  }, [board, syncState.isConnected, setElements, syncBus]);

  useEffect(() => {
    if (syncState.isConnected && offlineQueueRef.current.length > 0) {
      const queuedElements = offlineQueueRef.current.pop();
      offlineQueueRef.current = [];
      setShowOfflineWarning(false);
      
      if (queuedElements) {
        const hash = generateElementsHash(queuedElements);
        lastElementsHashRef.current = hash;
        setElements(queuedElements);
      }
    }
  }, [syncState.isConnected, setElements]);

  useEffect(() => {
    if (!syncState.isConnected) {
      const timer = setTimeout(() => setShowOfflineWarning(true), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowOfflineWarning(false);
    }
  }, [syncState.isConnected]);

  return (
    <>
      {children}
      <CursorOverlay cursors={cursors} board={board} />
      {showOfflineWarning && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 shadow-lg">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-700">Changes will sync when reconnected</span>
        </div>
      )}
    </>
  );
}

export function CollaborativeBoard({ children }: CollaborativeBoardProps) {
  return (
    <CollaborationErrorBoundary>
      <CollaborativeBoardInner>{children}</CollaborativeBoardInner>
    </CollaborationErrorBoundary>
  );
}

interface CollaborationStatusBarProps {
  roomId: string;
  onDisableCollaboration?: () => void;
}

export function CollaborationStatusBar({ roomId, onDisableCollaboration }: CollaborationStatusBarProps) {
  const { user, syncState, userCount, updatePresence } = useCollaborationRoom();
  const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);

  const isConnected = syncState.isConnected;
  const isReconnecting = syncState.isSyncing;

  const handleRetry = useCallback(() => {
    updatePresence({
      user: {
        name: user.name,
        color: user.color,
        avatar: user.avatar,
      },
    });
  }, [updatePresence, user]);

  const handleUpdateUser = useCallback((name: string) => {
    const updatedUser = { ...user, name };
    updatePresence({ user: { name } });
    setStoredUser(updatedUser);
  }, [user, updatePresence]);

  return (
    <>
      <div className="hidden lg:flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1 shadow-sm">
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3 text-green-500" />
            <span className="text-xs text-gray-600">
              {userCount === 1 ? 'Just you' : `${userCount} online`}
            </span>
            <ShareButton roomId={roomId} />
          </>
        ) : isReconnecting ? (
          <>
            <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
            <span className="text-xs text-gray-600">Reconnecting...</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 text-red-500" />
            <span className="text-xs text-gray-600">Disconnected</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              className="h-5 px-2 text-xs"
            >
              Retry
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setNicknameDialogOpen(true)}
          className="h-6 w-6 p-0 overflow-hidden"
        >
          <UserAvatar avatarDataUrl={user.avatar} size={16} />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDisableCollaboration}
          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
        >
          <span className="text-base leading-none">×</span>
        </Button>
      </div>

      <div className="lg:hidden flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 shadow-sm">
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3 text-green-500" />
            <span className="text-xs text-gray-600">{userCount}</span>
          </>
        ) : isReconnecting ? (
          <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
        ) : (
          <WifiOff className="h-3 w-3 text-red-500" />
        )}
      </div>

      {nicknameDialogOpen && (
        <NicknameDialog
          open={nicknameDialogOpen}
          onOpenChange={setNicknameDialogOpen}
          currentName={user.name}
          onSave={handleUpdateUser}
        />
      )}
    </>
  );
}

export { CollaborationPanel } from '@thinkix/collaboration';
