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
import { useBoardStore } from '@thinkix/storage';
import { getBoardThemeMode } from '@thinkix/shared';
import { refreshGrid } from '@/features/board/grid';
import { Button, cn } from '@thinkix/ui';
import { UserCircle2, AlertTriangle, X } from 'lucide-react';
import { useBoardState } from '@/features/board/hooks/use-board-state';
import { THEME } from '@/shared/constants';

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
  const { elements, theme, isLocalChange, setElements, syncState } = useYjsCollaboration();
  const { syncBus } = useSyncBus();
  const currentBoardId = useBoardStore((state) => state.currentBoard?.id);
  const currentBoardTheme = useBoardStore((state) => state.currentBoard?.theme);
  const updateBoardTheme = useBoardStore((state) => state.updateBoardTheme);
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
    if (!board || !theme) return;

    if (getBoardThemeMode(board.theme) !== getBoardThemeMode(theme)) {
      // eslint-disable-next-line react-hooks/immutability -- Plait board model requires direct mutation
      board.theme = theme;
      refreshGrid(board);
    }
  }, [board, theme]);

  useEffect(() => {
    if (!currentBoardId || !theme) return;
    if (currentBoardTheme && getBoardThemeMode(currentBoardTheme) === getBoardThemeMode(theme)) {
      return;
    }

    void updateBoardTheme(currentBoardId, theme);
  }, [currentBoardId, currentBoardTheme, theme, updateBoardTheme]);

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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 shadow-lg dark:border-yellow-800 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
          <span className="text-sm text-yellow-700 dark:text-yellow-400">Changes will sync when reconnected</span>
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
      <div
        className={cn(THEME.collab.container, 'hidden lg:flex')}
        data-testid="collaboration-status-bar"
      >
        {isConnected ? (
          <>
            <div className={cn(THEME.collab.statusDot, THEME.collab.statusConnected)} />
            <span className={THEME.collab.text} data-testid="collaboration-status-text">
              {userCount === 1 ? 'Just you' : `${userCount} online`}
            </span>
            <ShareButton dataTestId="collaboration-share-button" roomId={roomId} />
          </>
        ) : isReconnecting ? (
          <>
            <div className={THEME.collab.statusReconnecting} />
            <span className={THEME.collab.text} data-testid="collaboration-status-text">
              Reconnecting...
            </span>
          </>
        ) : (
          <>
            <div className={cn(THEME.collab.statusDot, THEME.collab.statusDisconnected)} />
            <span className={THEME.collab.text} data-testid="collaboration-status-text">
              Disconnected
            </span>
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
          data-testid="collaboration-nickname-button"
        >
          <UserAvatar avatarDataUrl={user.avatar} size={16} />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDisableCollaboration}
          className={THEME.collab.closeButton}
          data-testid="collaboration-leave-button"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div
        className={cn(THEME.collab.container, 'lg:hidden')}
        data-testid="collaboration-status-bar-mobile"
      >
        {isConnected ? (
          <>
            <div className={cn(THEME.collab.statusDot, THEME.collab.statusConnected)} />
            <span className={THEME.collab.text}>{userCount}</span>
          </>
        ) : isReconnecting ? (
          <div className={THEME.collab.statusReconnecting} />
        ) : (
          <div className={cn(THEME.collab.statusDot, THEME.collab.statusDisconnected)} />
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
