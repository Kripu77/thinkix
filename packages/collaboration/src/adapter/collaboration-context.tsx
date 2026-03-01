'use client';

import { createContext, useContext, useMemo, useEffect, useCallback } from 'react';
import { useMyPresence, useOthers, useStatus, useRoom } from '@liveblocks/react/suspense';
import type {
  CollaborationUser,
  Cursor,
  ViewportState,
  ConnectionStatus,
  UserPresence,
  SyncState,
  BoardElement,
} from '../types';
import { useYjsCollaboration } from './yjs-provider';

type PresencePatch = {
  cursor?: Cursor | null;
  selection?: string[];
  viewport?: ViewportState;
  user?: Partial<CollaborationUser>;
};

export interface CollaborationRoomContextValue {
  user: CollaborationUser;
  others: UserPresence[];
  userCount: number;
  connectionStatus: ConnectionStatus;
  syncState: SyncState;
  updatePresence: (presence: Partial<PresencePatch>) => void;
  elements: BoardElement[];
  setElements: (elements: BoardElement[]) => void;
  isLocalChange: boolean;
  roomId: string;
}

export const CollaborationRoomContext = createContext<CollaborationRoomContextValue | null>(null);

export function useCollaborationRoom(): CollaborationRoomContextValue {
  const yjsContext = useYjsCollaboration();
  const [, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const status = useStatus();
  const room = useRoom();

  const { user, elements, setElements, isLocalChange, syncState } = yjsContext;

  useEffect(() => {
    updateMyPresence({
      user: {
        id: user.id,
        name: user.name,
        color: user.color,
        avatar: user.avatar,
      },
    } as Parameters<typeof updateMyPresence>[0]);
  }, [user, updateMyPresence]);

  const updatePresence = useCallback((presence: Partial<PresencePatch>) => {
    const patch: PresencePatch = {};
    if ('cursor' in presence) {
      patch.cursor = presence.cursor ?? undefined;
    }
    if ('selection' in presence) {
      patch.selection = presence.selection;
    }
    if ('viewport' in presence) {
      patch.viewport = presence.viewport;
    }
    if ('user' in presence) {
      patch.user = {
        id: user.id,
        name: presence.user?.name ?? user.name,
        color: presence.user?.color ?? user.color,
        avatar: presence.user?.avatar ?? user.avatar,
      };
    }
    updateMyPresence(patch as unknown as Parameters<typeof updateMyPresence>[0]);
  }, [updateMyPresence, user]);

  const othersPresence = useMemo((): UserPresence[] => {
    return others
      .filter((other) => other.presence && 'user' in other.presence)
      .map((other) => {
        const presence = other.presence as Record<string, unknown>;
        return {
          user: presence.user as CollaborationUser,
          cursor: presence.cursor as Cursor | undefined,
          selection: presence.selection as string[] | undefined,
          viewport: presence.viewport as ViewportState | undefined,
        };
      });
  }, [others]);

  const connectionStatus: ConnectionStatus = useMemo(() => {
    switch (status) {
      case 'connected':
        return 'connected';
      case 'connecting':
        return 'connecting';
      case 'reconnecting':
        return 'reconnecting';
      case 'disconnected':
        return 'disconnected';
      default:
        return 'initial';
    }
  }, [status]);

  return useMemo(() => ({
    user,
    others: othersPresence,
    userCount: others.length + 1,
    connectionStatus,
    syncState,
    updatePresence,
    elements,
    setElements,
    isLocalChange,
    roomId: room.id,
  }), [
    user,
    othersPresence,
    others.length,
    connectionStatus,
    syncState,
    updatePresence,
    elements,
    setElements,
    isLocalChange,
    room.id,
  ]);
}

export function useOptionalCollaborationRoom(): CollaborationRoomContextValue | null {
  return useContext(CollaborationRoomContext);
}
