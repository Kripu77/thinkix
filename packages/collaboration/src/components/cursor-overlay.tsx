'use client';

import { useMemo, useEffect, useState, memo, useRef } from 'react';
import type { PlaitBoard } from '@plait/core';
import type { CursorState } from '../cursor-manager';
import { getVisibleCursors, getActiveCursors } from '../cursor-manager';
import { getViewport, debounce, type Viewport } from '../utils';

interface CursorOverlayProps {
  cursors: Map<string, CursorState>;
  board: PlaitBoard | null;
  maxCursors?: number;
  idleTimeoutMs?: number;
  visibilityDebounceMs?: number;
}

interface RenderableCursor {
  id: string;
  screenX: number;
  screenY: number;
  userName: string;
  userColor: string;
  userAvatar?: string;
}

const CURSOR_SIZE = 24;
const CURSOR_LABEL_OFFSET_X = 16;
const CURSOR_LABEL_OFFSET_Y = 16;
const AVATAR_SIZE = 16;
const DEFAULT_VISIBILITY_DEBOUNCE_MS = 100;

const CursorIcon = memo(function CursorIcon({ color }: { color: string }) {
  return (
    <svg
      width={CURSOR_SIZE}
      height={CURSOR_SIZE}
      viewBox="0 0 24 24"
      fill="none"
      className="drop-shadow-md"
    >
      <path
        d="M5.5 3.5L19 12L12 13L9 20L5.5 3.5Z"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
});

const AvatarIcon = memo(function AvatarIcon({ 
  avatarSvg, 
  size = AVATAR_SIZE 
}: { 
  avatarSvg?: string; 
  size?: number;
}) {
  if (!avatarSvg) return null;
  
  return (
    <div 
      className="rounded-full overflow-hidden bg-white shadow-sm flex-shrink-0"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: avatarSvg }}
    />
  );
});

const CursorLabel = memo(function CursorLabel({
  name,
  color,
  avatarSvg,
}: {
  name: string;
  color: string;
  avatarSvg?: string;
}) {
  return (
    <div
      className="absolute flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium text-white shadow-sm"
      style={{
        backgroundColor: color,
        left: CURSOR_LABEL_OFFSET_X,
        top: CURSOR_LABEL_OFFSET_Y,
      }}
    >
      <AvatarIcon avatarSvg={avatarSvg} />
      <span>{name}</span>
    </div>
  );
});

const RemoteCursor = memo(function RemoteCursor({
  cursor,
}: {
  cursor: RenderableCursor;
}) {
  return (
    <div
      className="pointer-events-none absolute z-[100] will-change-transform"
      style={{
        transform: `translate(${cursor.screenX}px, ${cursor.screenY}px)`,
      }}
    >
      <CursorIcon color={cursor.userColor} />
      <CursorLabel 
        name={cursor.userName} 
        color={cursor.userColor} 
        avatarSvg={cursor.userAvatar}
      />
    </div>
  );
});

interface DebouncedViewportState {
  viewport: Viewport | null;
  containerRect: DOMRect | null;
}

export function CursorOverlay({ 
  cursors, 
  board, 
  maxCursors = 50,
  idleTimeoutMs = 30000,
  visibilityDebounceMs = DEFAULT_VISIBILITY_DEBOUNCE_MS,
}: CursorOverlayProps) {
  const [debouncedState, setDebouncedState] = useState<DebouncedViewportState>({
    viewport: null,
    containerRect: null,
  });
  const pendingStateRef = useRef<DebouncedViewportState | null>(null);

  useEffect(() => {
    const updateState = (viewport: Viewport | null, containerRect: DOMRect | null) => {
      pendingStateRef.current = { viewport, containerRect };
    };

    const flushUpdate = debounce(() => {
      if (pendingStateRef.current) {
        setDebouncedState(pendingStateRef.current);
      }
    }, visibilityDebounceMs);

    const handleUpdate = () => {
      const svg = document.querySelector(
        '.plait-board-container svg'
      ) as SVGSVGElement | null;
      
      if (board && svg) {
        const viewport = getViewport(board);
        const rect = svg.getBoundingClientRect();
        updateState(viewport, rect);
        flushUpdate();
      }
    };

    handleUpdate();
    window.addEventListener('resize', handleUpdate);

    const observer = new ResizeObserver(handleUpdate);
    const svg = document.querySelector(
      '.plait-board-container svg'
    ) as SVGSVGElement | null;
    if (svg) {
      observer.observe(svg);
    }

    return () => {
      window.removeEventListener('resize', handleUpdate);
      observer.disconnect();
    };
  }, [board, visibilityDebounceMs]);

  const visibleCursors = useMemo(() => {
    if (!debouncedState.viewport || !debouncedState.containerRect) {
      return new Map<string, CursorState>();
    }
    
    const screenWidth = debouncedState.containerRect.width;
    const screenHeight = debouncedState.containerRect.height;
    
    const activeCursors = getActiveCursors(cursors, idleTimeoutMs);
    
    return getVisibleCursors(
      activeCursors, 
      debouncedState.viewport, 
      screenWidth, 
      screenHeight
    );
  }, [cursors, debouncedState, idleTimeoutMs]);

  const renderableCursors = useMemo((): RenderableCursor[] => {
    const { viewport, containerRect } = debouncedState;
    if (!viewport || !containerRect) return [];

    const result: RenderableCursor[] = [];
    let count = 0;

    visibleCursors.forEach((cursor, id) => {
      if (count >= maxCursors) return;
      
      const screenX =
        cursor.documentX * viewport.zoom + 
        viewport.offsetX + 
        containerRect.left;
      const screenY =
        cursor.documentY * viewport.zoom + 
        viewport.offsetY + 
        containerRect.top;

      result.push({
        id,
        screenX,
        screenY,
        userName: cursor.userName,
        userColor: cursor.userColor,
        userAvatar: cursor.userAvatar,
      });
      count++;
    });

    return result;
  }, [visibleCursors, debouncedState, maxCursors]);

  if (renderableCursors.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-[9999]">
      {renderableCursors.map((cursor) => (
        <RemoteCursor key={cursor.id} cursor={cursor} />
      ))}
    </div>
  );
}
