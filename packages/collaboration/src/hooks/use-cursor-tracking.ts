'use client';

import { useEffect, useRef, useState } from 'react';
import { useMyPresence, useOthers } from '@liveblocks/react';
import type { PlaitBoard } from '@plait/core';
import {
  CursorManager,
  type CursorState,
  type Viewport,
  createCursorManager,
} from '../cursor-manager';
import type { Cursor, CollaborationUser } from '../types';

export interface UseCursorTrackingOptions {
  board: PlaitBoard | null;
  enabled: boolean;
  throttleIntervalMs?: number;
  idleTimeoutMs?: number;
}

export interface UseCursorTrackingReturn {
  cursors: Map<string, CursorState>;
}

function getViewport(board: PlaitBoard): Viewport {
  return {
    zoom: board.viewport?.zoom ?? 1,
    offsetX: board.viewport?.offsetX ?? 0,
    offsetY: board.viewport?.offsetY ?? 0,
  };
}

export function useCursorTracking({
  board,
  enabled,
  throttleIntervalMs,
  idleTimeoutMs,
}: UseCursorTrackingOptions): UseCursorTrackingReturn {
  const [, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const [cursors, setCursors] = useState<Map<string, CursorState>>(new Map());
  const managerRef = useRef<CursorManager | null>(null);
  const boardRef = useRef(board);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    if (!enabled) return;

    const handleCursorUpdate = (cursor: Cursor | null) => {
      (updateMyPresence as (patch: object) => void)({ cursor: cursor ?? undefined });
    };

    const handleCursorsChange = (newCursors: Map<string, CursorState>) => {
      setCursors(new Map(newCursors));
    };

    managerRef.current = createCursorManager(
      handleCursorUpdate,
      handleCursorsChange,
      { throttleIntervalMs, idleTimeoutMs }
    );

    managerRef.current.startTracking();

    return () => {
      managerRef.current?.destroy();
      managerRef.current = null;
    };
  }, [enabled, updateMyPresence, throttleIntervalMs, idleTimeoutMs]);

  useEffect(() => {
    if (!enabled || !managerRef.current) return;

    const manager = managerRef.current;
    let rafId: number | null = null;

    const handlePointerMove = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      
      const svg = target.closest('svg');
      if (!svg || !boardRef.current) return;

      const rect = svg.getBoundingClientRect();
      const viewport = getViewport(boardRef.current);

      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        manager.handlePointerMove(
          e.clientX,
          e.clientY,
          rect,
          viewport,
          e.pointerType as 'mouse' | 'pen' | 'touch'
        );
        rafId = null;
      });
    };

    const handlePointerLeave = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      
      const boardContainer = target.closest('.plait-board-container');
      if (!boardContainer) return;

      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      manager.handlePointerLeave();
    };

    document.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !managerRef.current) return;

    const manager = managerRef.current;
    const activeConnectionIds = new Set<string>();

    for (const other of others) {
      const connectionId = String(other.connectionId);
      activeConnectionIds.add(connectionId);

      const user = other.presence.user as CollaborationUser | undefined;
      const cursor = other.presence.cursor as Cursor | undefined;

      if (user) {
        manager.updateRemoteCursor(connectionId, user, cursor);
      }
    }

    manager.removeDisconnectedCursors(activeConnectionIds);
  }, [enabled, others]);

  return {
    cursors,
  };
}

export function useCursorScreenState(
  cursor: CursorState,
  viewport: Viewport
): CursorState & { screenX: number; screenY: number } {
  return {
    ...cursor,
    screenX: cursor.documentX * viewport.zoom + viewport.offsetX,
    screenY: cursor.documentY * viewport.zoom + viewport.offsetY,
  };
}
