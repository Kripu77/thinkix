'use client';
 
import { useMemo, useEffect, useState, memo, type RefObject } from 'react';
import type { PlaitBoard } from '@plait/core';
import type { CursorState } from '../cursor-manager';
import { getVisibleCursors, getActiveCursors } from '../cursor-manager';
import { useViewport } from '../hooks/use-viewport';
 
interface CursorOverlayProps {
  cursors: Map<string, CursorState>;
  board: PlaitBoard | null;
  containerRef?: RefObject<Element | null>;
  maxCursors?: number;
  idleTimeoutMs?: number;
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
  avatarDataUrl,
  size = AVATAR_SIZE
}: {
  avatarDataUrl?: string;
  size?: number;
}) {
  if (!avatarDataUrl) return null;
 
  return (
    <img
      src={avatarDataUrl}
      alt=""
      className="rounded-full bg-white shadow-sm shrink-0"
      style={{ width: size, height: size }}
    />
  );
});
 
const CursorLabel = memo(function CursorLabel({
  name,
  color,
  avatarDataUrl,
}: {
  name: string;
  color: string;
  avatarDataUrl?: string;
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
      <AvatarIcon avatarDataUrl={avatarDataUrl} />
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
        avatarDataUrl={cursor.userAvatar}
      />
    </div>
  );
});
 
export function CursorOverlay({
  cursors,
  board,
  containerRef,
  maxCursors = 50,
  idleTimeoutMs = 30000,
}: CursorOverlayProps) {
  const viewport = useViewport(board);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
 
      useEffect(() => {
    const getContainer = (): Element | null => {
      if (containerRef?.current) {
        return containerRef.current;
      }
      // Fallback to DOM query for backward compatibility
      const container = document.querySelector('.plait-board-container') as HTMLElement | null;
      return container?.querySelector('svg') || container;
    };

    const update = () => {
      const container = getContainer();
      if (container) {
        setContainerRect(container.getBoundingClientRect());
      }
    };

    update();
    window.addEventListener('resize', update);

    const observer = new ResizeObserver(update);
    const container = getContainer();
    if (container) {
      observer.observe(container);
    }

    return () => {
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  }, [containerRef]);
 
  const renderableCursors = useMemo((): RenderableCursor[] => {
    if (!containerRect) return [];
 
    const activeCursors = getActiveCursors(cursors, idleTimeoutMs);
    const visible = getVisibleCursors(
      activeCursors,
      viewport,
      containerRect.width,
      containerRect.height
    );
 
    const result: RenderableCursor[] = [];
    let count = 0;
 
    visible.forEach((cursor, id) => {
      if (count >= maxCursors) return;
 
      result.push({
        id,
        screenX: cursor.documentX * viewport.zoom + viewport.offsetX + containerRect.left,
        screenY: cursor.documentY * viewport.zoom + viewport.offsetY + containerRect.top,
        userName: cursor.userName,
        userColor: cursor.userColor,
        userAvatar: cursor.userAvatar,
      });
      count++;
    });
 
    return result;
  }, [cursors, viewport, containerRect, idleTimeoutMs, maxCursors]);
 
  if (!board || renderableCursors.length === 0) return null;
 
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-[9999]">
      {renderableCursors.map((cursor) => (
        <RemoteCursor key={cursor.id} cursor={cursor} />
      ))}
    </div>
  );
}