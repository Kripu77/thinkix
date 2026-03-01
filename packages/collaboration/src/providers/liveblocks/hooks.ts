'use client';

import { useCallback } from 'react';
import { useMyPresence, useOthers, useStatus, useRoom } from '@liveblocks/react/suspense';
import type { ConnectionStatus, Cursor, ViewportState, CollaborationUser, UserPresence } from '../../types';

export function usePresence() {
  const [myPresence, updateMyPresence] = useMyPresence();

  const updateCursor = useCallback((cursor: Cursor | null) => {
    updateMyPresence({ cursor: cursor ?? undefined } as Parameters<typeof updateMyPresence>[0]);
  }, [updateMyPresence]);

  const updateSelection = useCallback((selection: string[] | null) => {
    updateMyPresence({ selection: selection ?? undefined } as Parameters<typeof updateMyPresence>[0]);
  }, [updateMyPresence]);

  const updateViewport = useCallback((viewport: ViewportState | null) => {
    updateMyPresence({ viewport: viewport ?? undefined } as Parameters<typeof updateMyPresence>[0]);
  }, [updateMyPresence]);

  const updateUserInfo = useCallback((userUpdate: Partial<CollaborationUser>) => {
    const currentUser = myPresence.user as CollaborationUser | undefined;
    updateMyPresence({
      user: {
        ...(currentUser ?? { id: '', name: '', color: '' }),
        ...userUpdate,
      },
    } as Parameters<typeof updateMyPresence>[0]);
  }, [updateMyPresence, myPresence.user]);

  return {
    myPresence,
    updateCursor,
    updateSelection,
    updateViewport,
    updateUserInfo,
  };
}

export function useRoomPresence() {
  const others = useOthers();
  const status = useStatus();

  const users: UserPresence[] = others
    .filter((other) => other.presence.user)
    .map((other) => ({
      user: other.presence.user as unknown as CollaborationUser,
      cursor: other.presence.cursor as unknown as Cursor | undefined,
      selection: other.presence.selection as unknown as string[] | undefined,
      viewport: other.presence.viewport as unknown as ViewportState | undefined,
    }));

  const connectionStatus: ConnectionStatus = status;

  return {
    users,
    connectionStatus,
    userCount: others.length + 1,
  };
}

export function useRoomConnection() {
  const status = useStatus();
  const room = useRoom();

  return {
    status: status as ConnectionStatus,
    roomId: room.id,
    isConnected: status === 'connected',
  };
}
