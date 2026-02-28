'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStorage, useMutation, useSelf } from '@liveblocks/react/suspense';
import type { PlaitElement, PlaitBoard } from '@plait/core';
import { usePresence } from '../providers/liveblocks/hooks';

interface UseBoardSyncOptions {
  board: PlaitBoard | null;
  enabled: boolean;
  onRemoteChange?: (elements: PlaitElement[]) => void;
}

export function useBoardSync({ board, enabled, onRemoteChange }: UseBoardSyncOptions) {
  const elements = useStorage((root) => root.elements);
  const self = useSelf();
  
  const boardRef = useRef(board);
  const lastSyncedElementsRef = useRef<string>('');
  const isRemoteUpdateRef = useRef(false);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  const pushElements = useMutation(({ storage }, newElements: PlaitElement[]) => {
    storage.set('elements', newElements as never);
  }, []);

  useEffect(() => {
    if (!enabled || !elements || isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    const elementsArray = elements as unknown as PlaitElement[];
    const elementsJson = JSON.stringify(elementsArray);
    if (elementsJson === lastSyncedElementsRef.current) {
      return;
    }

    lastSyncedElementsRef.current = elementsJson;
    onRemoteChange?.(elementsArray);
  }, [elements, enabled, onRemoteChange]);

  const syncToRemote = useCallback((newElements: PlaitElement[]) => {
    if (!enabled) return;
    
    const newJson = JSON.stringify(newElements);
    if (newJson === lastSyncedElementsRef.current) return;

    lastSyncedElementsRef.current = newJson;
    isRemoteUpdateRef.current = true;
    pushElements(newElements);
  }, [enabled, pushElements]);

  return {
    remoteElements: elements as unknown as PlaitElement[],
    syncToRemote,
    isConnected: !!self.connectionId,
  };
}

export function useBoardCursorTracking(board: PlaitBoard | null, enabled: boolean) {
  const { updateCursor } = usePresence();

  useEffect(() => {
    if (!enabled || !board) return;

    const handlePointerMove = (e: Event) => {
      const pointerEvent = e as PointerEvent;
      const target = pointerEvent.target as SVGElement | HTMLElement;
      const svg = target.closest('svg');
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const x = (pointerEvent.clientX - rect.left - board.viewport.offsetX) / board.viewport.zoom;
      const y = (pointerEvent.clientY - rect.top - board.viewport.offsetY) / board.viewport.zoom;

      updateCursor({ x, y, pointer: pointerEvent.pointerType as 'mouse' | 'pen' | 'touch' });
    };

    const handlePointerLeave = () => {
      updateCursor(null);
    };

    const boardEl = document.querySelector('.plait-board-container') || document.querySelector('svg');
    if (!boardEl) return;

    boardEl.addEventListener('pointermove', handlePointerMove as EventListener, { passive: true });
    boardEl.addEventListener('pointerleave', handlePointerLeave as EventListener, { passive: true });

    return () => {
      boardEl.removeEventListener('pointermove', handlePointerMove as EventListener);
      boardEl.removeEventListener('pointerleave', handlePointerLeave as EventListener);
    };
  }, [board, enabled, updateCursor]);
}
