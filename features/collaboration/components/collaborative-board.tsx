'use client';

import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useStorage, useMutation, useSelf, useMyPresence } from '@liveblocks/react/suspense';
import {
  useCollaborationContext,
  useRoomPresence,
  setStoredUser,
  ShareButton,
  NicknameDialog,
  useCursorTracking,
  CursorOverlay,
} from '@thinkix/collaboration';
import { Button } from '@thinkix/ui';
import { UserCircle2 } from 'lucide-react';
import { useBoardState } from '@/features/board/hooks/use-board-state';
import type { PlaitElement } from '@plait/core';

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

export function CollaborativeBoard({ children }: CollaborativeBoardProps) {
  const { board } = useBoardState();
  const { user } = useCollaborationContext();
  const [, updateMyPresence] = useMyPresence();
  const userSetRef = useRef(false);

  const { cursors } = useCursorTracking({
    board,
    enabled: true,
    throttleIntervalMs: 50,
    idleTimeoutMs: 30000,
  });

  useBoardSyncHybrid(board);

  useEffect(() => {
    if (userSetRef.current) return;
    userSetRef.current = true;
    (updateMyPresence as (patch: object) => void)({ 
      user: { 
        id: user.id, 
        name: user.name, 
        color: user.color,
        avatar: user.avatar,
      } 
    });
  }, [user, updateMyPresence]);

  return (
    <>
      {children}
      <CursorOverlay cursors={cursors} board={board} />
    </>
  );
}

function useBoardSyncHybrid(board: ReturnType<typeof useBoardState>['board']) {
  const elements = useStorage((root: { elements: PlaitElement[] }) => root.elements);
  const self = useSelf();
  const lastSyncedRef = useRef<string>('');
  const isRemoteRef = useRef(false);

  const pushElements = useMutation(({ storage }, newElements: PlaitElement[]) => {
    storage.set('elements', newElements as never);
  }, []);

  useEffect(() => {
    if (!elements || isRemoteRef.current || !board) {
      isRemoteRef.current = false;
      return;
    }

    const remoteElements = elements;
    const json = JSON.stringify(remoteElements);
    if (json === lastSyncedRef.current) return;

    lastSyncedRef.current = json;
    // eslint-disable-next-line react-hooks/immutability -- Plait board model requires direct mutation
    board.children = remoteElements;

    window.dispatchEvent(new CustomEvent('thinkix:remote-elements-change', {
      detail: { elements: remoteElements }
    }));
  }, [elements, board]);

  useEffect(() => {
    if (!board) return;

    const handleLocalChange = (e: CustomEvent<{ elements: PlaitElement[] }>) => {
      const localElements = e.detail.elements;
      const json = JSON.stringify(localElements);
      if (json === lastSyncedRef.current) return;

      lastSyncedRef.current = json;
      isRemoteRef.current = true;
      pushElements(localElements);
    };

    window.addEventListener('thinkix:local-elements-change', handleLocalChange as EventListener);
    return () => {
      window.removeEventListener('thinkix:local-elements-change', handleLocalChange as EventListener);
    };
  }, [board, pushElements]);

  return { isConnected: !!self.connectionId };
}

interface CollaborationStatusBarProps {
  roomId: string;
  onDisableCollaboration?: () => void;
}

export function CollaborationStatusBar({ roomId, onDisableCollaboration }: CollaborationStatusBarProps) {
  const { user } = useCollaborationContext();
  const { userCount, connectionStatus } = useRoomPresence();
  const [, updateMyPresence] = useMyPresence();
  const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);

  const handleUpdateUser = useCallback((name: string) => {
    const updatedUser = { ...user, name };
    (updateMyPresence as (patch: object) => void)({ 
      user: { ...user, name, avatar: user.avatar } 
    });
    setStoredUser(updatedUser);
  }, [user, updateMyPresence]);

  return (
    <>
      <div className="hidden lg:flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1 shadow-sm">
        {connectionStatus === 'connected' ? (
          <>
            <span className="text-xs text-gray-600">
              {userCount === 1 ? 'Just you' : `${userCount} online`}
            </span>
            <ShareButton roomId={roomId} />
          </>
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
            Connecting...
          </div>
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
