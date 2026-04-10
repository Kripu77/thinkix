'use client';

import { useEffect, useRef } from 'react';
import type { PlaitBoard } from '@plait/core';
import { useBoardStore } from '@thinkix/storage';

interface UseAutoSaveOptions {
  board: PlaitBoard | null;
  enabled?: boolean;
}

export function useAutoSave({ board, enabled = true }: UseAutoSaveOptions) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveBoard = useBoardStore((s) => s.saveBoard);
  const currentBoard = useBoardStore((s) => s.currentBoard);

  const boardRef = useRef<PlaitBoard | null>(board);
  const currentBoardRef = useRef(currentBoard);
  const saveBoardRef = useRef(saveBoard);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { currentBoardRef.current = currentBoard; }, [currentBoard]);
  useEffect(() => { saveBoardRef.current = saveBoard; }, [saveBoard]);

  useEffect(() => {
    if (!board || !enabled) return;

    const handlePointerUp = () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      saveTimerRef.current = setTimeout(() => {
        const b = boardRef.current;
        const cb = currentBoardRef.current;

        if (!b || !cb?.id) return;

        saveBoardRef.current({
          id: cb.id,
          name: cb.name,
          elements: b.children,
          viewport: { x: b.viewport.x ?? 0, y: b.viewport.y ?? 0, zoom: b.viewport.zoom ?? 1 },
          theme: b.theme ?? cb.theme,
          createdAt: cb.createdAt,
          updatedAt: Date.now(),
        });
      }, 500);
    };

    const boardEl = document.querySelector('.plait-board-container') || document.querySelector('svg');
    if (!boardEl) return;

    const options: AddEventListenerOptions = { capture: true, passive: true };
    boardEl.addEventListener('pointerup', handlePointerUp, options);

    return () => {
      boardEl.removeEventListener('pointerup', handlePointerUp, { capture: true });
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [board, enabled]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);
}
