'use client';

import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useMyPresence, useOthers } from '@liveblocks/react/suspense';
import {
  useYjsCollaboration,
  setStoredUser,
  ShareButton,
  NicknameDialog,
  useCursorTracking,
  CursorOverlay,
  CollaborationErrorBoundary,
  getSyncBus,
  type BoardElement,
} from '@thinkix/collaboration';
import { Button } from '@thinkix/ui';
import { UserCircle2, Wifi, WifiOff } from 'lucide-react';
import { useBoardState } from '@/features/board/hooks/use-board-state';

interface CollaborativeBoardProps {
  children: ReactNode;
}

function UserAvatar({ avatarSvg, size = 20 }: { avatarSvg?: string; size?: number }) {
  if (!avatarSvg) {
    return <UserCircle2 className="h-4 w-4" />;
  }
  
  return (
    <div 
      className="rounded-full overflow-hidden flex-shrink-0"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: avatarSvg }}
    />
  );
}

function CollaborativeBoardInner({ children }: CollaborativeBoardProps) {
  const { board } = useBoardState();
  const { user, elements, isLocalChange, setElements, syncState } = useYjsCollaboration();
  const [, updateMyPresence] = useMyPresence();
  const lastElementsJsonRef = useRef<string>('');
  const isSyncingRef = useRef(false);

  useEffect(() => {
    updateMyPresence({ 
      user: { 
        id: user.id, 
        name: user.name, 
        color: user.color,
        avatar: user.avatar,
      } 
    });
  }, [user, updateMyPresence]);

  const { cursors } = useCursorTracking({
    board,
    enabled: syncState.isConnected,
    throttleIntervalMs: 50,
    idleTimeoutMs: 30000,
  });

  useEffect(() => {
    if (!board || isLocalChange || isSyncingRef.current) return;
    if (elements.length === 0) return;
    
    const elementsJson = JSON.stringify(elements);
    if (elementsJson === lastElementsJsonRef.current) return;
    
    lastElementsJsonRef.current = elementsJson;
    
    // eslint-disable-next-line react-hooks/immutability -- Plait board model requires direct mutation
    board.children = elements as unknown as typeof board.children;
    
    const syncBus = getSyncBus();
    syncBus.emitRemoteChange(elements);
  }, [elements, isLocalChange, board]);

  useEffect(() => {
    if (!board) return;

    const syncBus = getSyncBus();
    
    const unsubscribe = syncBus.subscribeToLocalChanges((localElements: BoardElement[]) => {
      if (!syncState.isConnected || isSyncingRef.current) return;
      
      const json = JSON.stringify(localElements);
      
      if (json === lastElementsJsonRef.current) return;
      
      isSyncingRef.current = true;
      lastElementsJsonRef.current = json;
      setElements(localElements);
      
      queueMicrotask(() => {
        isSyncingRef.current = false;
      });
    });

    return unsubscribe;
  }, [board, syncState.isConnected, setElements]);

  return (
    <>
      {children}
      <CursorOverlay cursors={cursors} board={board} />
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
  const { user, syncState } = useYjsCollaboration();
  const [, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);

  const userCount = others.length + 1;
  const isConnected = syncState.isConnected;
  const isReconnecting = syncState.isSyncing;

  const handleRetry = useCallback(() => {
    // Force presence refresh by updating user
    updateMyPresence({ 
      user: { 
        id: user.id, 
        name: user.name, 
        color: user.color,
        avatar: user.avatar,
      } 
    });
  }, [updateMyPresence, user]);

  const handleUpdateUser = useCallback((name: string) => {
    const updatedUser = { ...user, name };
    updateMyPresence({ 
      user: { ...user, name, avatar: user.avatar } 
    });
    setStoredUser(updatedUser);
  }, [user, updateMyPresence]);

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
          <UserAvatar avatarSvg={user.avatar} size={16} />
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
