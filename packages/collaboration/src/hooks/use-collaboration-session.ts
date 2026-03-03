'use client';

import { useCallback, useState, useEffect } from 'react';

const KEY_PREFIX = 'collab';
const KEY_INITIATOR = 'initiator';
const KEY_DIALOG_SEEN = 'dialog-seen';
const KEY_DISABLED = 'disabled';

function buildKey(type: string, roomId: string): string {
  return `${KEY_PREFIX}-${type}:${roomId}`;
}

function getSessionItem(key: string | null): boolean {
  if (!key || typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function setSessionItem(key: string | null, value: boolean): void {
  if (!key || typeof window === 'undefined') return;
  try {
    if (value) {
      sessionStorage.setItem(key, 'true');
    } else {
      sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors
  }
}

interface UseCollaborationSessionReturn {
  markAsInitiator: () => void;
  clearInitiator: () => void;
  isInitiator: boolean;
  markDialogSeen: () => void;
  wasDialogSeen: boolean;
  markAsDisabled: () => void;
  clearDisabled: () => void;
  wasDisabled: boolean;
  clearAll: () => void;
}

export function useCollaborationSession(roomId: string | null): UseCollaborationSessionReturn {
  const initiatorKey = roomId ? buildKey(KEY_INITIATOR, roomId) : null;
  const dialogSeenKey = roomId ? buildKey(KEY_DIALOG_SEEN, roomId) : null;
  const disabledKey = roomId ? buildKey(KEY_DISABLED, roomId) : null;

  const [isInitiator, setIsInitiator] = useState(() => getSessionItem(initiatorKey));
  const [wasDialogSeen, setWasDialogSeen] = useState(() => getSessionItem(dialogSeenKey));
  const [wasDisabled, setWasDisabled] = useState(() => getSessionItem(disabledKey));

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setIsInitiator(getSessionItem(initiatorKey));
    setWasDialogSeen(getSessionItem(dialogSeenKey));
    setWasDisabled(getSessionItem(disabledKey));
  }, [initiatorKey, dialogSeenKey, disabledKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const markAsInitiator = useCallback(() => {
    setSessionItem(initiatorKey, true);
    setIsInitiator(true);
  }, [initiatorKey]);

  const clearInitiator = useCallback(() => {
    setSessionItem(initiatorKey, false);
    setIsInitiator(false);
  }, [initiatorKey]);

  const markDialogSeen = useCallback(() => {
    setSessionItem(dialogSeenKey, true);
    setWasDialogSeen(true);
  }, [dialogSeenKey]);

  const markAsDisabled = useCallback(() => {
    setSessionItem(disabledKey, true);
    setWasDisabled(true);
  }, [disabledKey]);

  const clearDisabled = useCallback(() => {
    setSessionItem(disabledKey, false);
    setWasDisabled(false);
  }, [disabledKey]);

  const clearAll = useCallback(() => {
    setSessionItem(initiatorKey, false);
    setSessionItem(dialogSeenKey, false);
    setSessionItem(disabledKey, false);
    setIsInitiator(false);
    setWasDialogSeen(false);
    setWasDisabled(false);
  }, [initiatorKey, dialogSeenKey, disabledKey]);

  return {
    markAsInitiator,
    clearInitiator,
    isInitiator,
    markDialogSeen,
    wasDialogSeen,
    markAsDisabled,
    clearDisabled,
    wasDisabled,
    clearAll,
  };
}
