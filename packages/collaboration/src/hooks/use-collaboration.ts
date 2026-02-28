'use client';

import { useState, useCallback, useEffect } from 'react';

export interface UseCollaborationState {
  isEnabled: boolean;
  roomId: string | null;
  toggleCollaboration: () => void;
  enableCollaboration: (roomId: string) => void;
  disableCollaboration: () => void;
}

const STORAGE_KEY_ENABLED = 'thinkix:collaboration:enabled';
const STORAGE_KEY_ROOM = 'thinkix:collaboration:roomId';

export function useCollaborationState(defaultRoomId?: string): UseCollaborationState {
  const [isEnabled, setIsEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(STORAGE_KEY_ENABLED) === 'true';
    } catch {
      return false;
    }
  });

  const [roomId, setRoomId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(STORAGE_KEY_ROOM) || defaultRoomId || null;
    } catch {
      return defaultRoomId || null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ENABLED, String(isEnabled));
    } catch {
      // Ignore storage errors
    }
  }, [isEnabled]);

  useEffect(() => {
    try {
      if (roomId) {
        localStorage.setItem(STORAGE_KEY_ROOM, roomId);
      } else {
        localStorage.removeItem(STORAGE_KEY_ROOM);
      }
    } catch {
      // Ignore storage errors
    }
  }, [roomId]);

  const enableCollaboration = useCallback((room: string) => {
    setRoomId(room);
    setIsEnabled(true);
  }, []);

  const disableCollaboration = useCallback(() => {
    setIsEnabled(false);
  }, []);

  const toggleCollaboration = useCallback(() => {
    if (isEnabled) {
      disableCollaboration();
    } else if (roomId) {
      setIsEnabled(true);
    }
  }, [isEnabled, roomId, disableCollaboration]);

  return {
    isEnabled,
    roomId,
    toggleCollaboration,
    enableCollaboration,
    disableCollaboration,
  };
}
