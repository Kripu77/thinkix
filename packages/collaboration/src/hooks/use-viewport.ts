'use client';

import { useEffect, useState, useRef } from 'react';
import type { PlaitBoard } from '@plait/core';
import { getViewport, type Viewport } from '../utils';

const DEFAULT_VIEWPORT: Viewport = { zoom: 1, offsetX: 0, offsetY: 0 };

function viewportsEqual(a: Viewport, b: Viewport): boolean {
  return a.zoom === b.zoom && a.offsetX === b.offsetX && a.offsetY === b.offsetY;
}

export function useViewport(board: PlaitBoard | null): Viewport {
  const [viewport, setViewport] = useState<Viewport>(DEFAULT_VIEWPORT);
  const viewportRef = useRef(viewport);

  useEffect(() => {
    if (!board) return;

    const initial = getViewport(board);
    viewportRef.current = initial;
    setViewport(initial);

    const originalOnChange = board.onChange;
    let active = true;

    // eslint-disable-next-line react-hooks/immutability -- Plait requires patching onChange for viewport tracking
    board.onChange = () => {
      originalOnChange();
      if (!active) return;

      const hasViewportOp = board.operations.some(
        (op: { type: string }) => op.type === 'set_viewport'
      );

      if (hasViewportOp) {
        const next = getViewport(board);
        if (!viewportsEqual(viewportRef.current, next)) {
          viewportRef.current = next;
          setViewport(next);
        }
      }
    };

    return () => {
      active = false;
      board.onChange = originalOnChange;
    };
  }, [board]);

  return viewport;
}
