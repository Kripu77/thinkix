'use client';

import { useCallback } from 'react';
import { useMyPresence, useOthers, useStatus, useRoom } from '@liveblocks/react/suspense';
import type { ConnectionStatus, Cursor, ViewportState, CollaborationUser, UserPresence } from '../../types';

type PresenceJson = {
  cursor?: { x: number; y: number; pointer?: 'mouse' | 'pen' | 'touch' };
  selection?: string[];
  viewport?: { x: number; y: number; zoom: number };
  user?: { id: string; name: string; color: string; avatar?: string };
};

const toCursor = (p: PresenceJson): Cursor | undefined =>
  p.cursor ? { x: p.cursor.x, y: p.cursor.y, pointer: p.cursor.pointer } : undefined;

const toViewport = (p: PresenceJson): ViewportState | undefined =>
  p.viewport ? { x: p.viewport.x, y: p.viewport.y, zoom: p.viewport.zoom } : undefined;

const toUser = (p: PresenceJson): CollaborationUser | undefined =>
  p.user ? { id: p.user.id, name: p.user.name, color: p.user.color, avatar: p.user.avatar } : undefined;

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
    .map((other) => {
      const p = other.presence as PresenceJson;
      return {
        user: toUser(p)!,
        cursor: toCursor(p),
        selection: p.selection,
        viewport: toViewport(p),
      };
    });

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
