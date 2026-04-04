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

function setStoredEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ENABLED, String(enabled));
  } catch {
  }
}

function setStoredRoom(roomId: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (roomId) {
      localStorage.setItem(STORAGE_KEY_ROOM, roomId);
    } else {
      localStorage.removeItem(STORAGE_KEY_ROOM);
    }
  } catch {
  }
}

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
    setStoredEnabled(isEnabled);
  }, [isEnabled]);

  useEffect(() => {
    setStoredRoom(roomId);
  }, [roomId]);

  const enableCollaboration = useCallback((room: string) => {
    setRoomId(room);
    setIsEnabled(true);
    setStoredRoom(room);
    setStoredEnabled(true);
  }, []);

  const disableCollaboration = useCallback(() => {
    setRoomId(null);
    setIsEnabled(false);
    setStoredRoom(null);
    setStoredEnabled(false);
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
