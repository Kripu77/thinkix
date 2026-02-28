'use client';

import { useCallback } from 'react';
import { useMyPresence, useOthers, useStatus, useRoom } from '@liveblocks/react/suspense';
import type { ConnectionStatus, Cursor, ViewportState, CollaborationUser, UserPresence } from '../../types';

export function usePresence() {
  const [myPresence, updateMyPresence] = useMyPresence();

  const updateCursor = useCallback((cursor: Cursor | null) => {
    (updateMyPresence as (patch: object) => void)({ cursor });
  }, [updateMyPresence]);

  const updateSelection = useCallback((selection: string[] | null) => {
    (updateMyPresence as (patch: object) => void)({ selection });
  }, [updateMyPresence]);

  const updateViewport = useCallback((viewport: ViewportState | null) => {
    (updateMyPresence as (patch: object) => void)({ viewport });
  }, [updateMyPresence]);

  const updateUserInfo = useCallback((userUpdate: Partial<CollaborationUser>) => {
    const currentUser = myPresence.user as CollaborationUser | undefined;
    (updateMyPresence as (patch: object) => void)({
      user: {
        ...(currentUser ?? { id: '', name: '', color: '' }),
        ...userUpdate,
      },
    });
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
