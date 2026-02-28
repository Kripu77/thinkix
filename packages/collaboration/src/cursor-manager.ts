import type { Cursor, CollaborationUser } from './types';

export interface Viewport {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface CursorState {
  userId: string;
  userName: string;
  userColor: string;
  userAvatar?: string;
  documentX: number;
  documentY: number;
  pointer?: 'mouse' | 'pen' | 'touch';
  lastUpdated: number;
}

export interface ScreenCoordinates {
  x: number;
  y: number;
}

export interface DocumentCoordinates {
  x: number;
  y: number;
}

export type CursorUpdateCallback = (cursor: Cursor | null) => void;
export type CursorsChangeCallback = (cursors: Map<string, CursorState>) => void;

const THROTTLE_INTERVAL_MS = 50;
const IDLE_TIMEOUT_MS = 30000;
const CLEANUP_INTERVAL_MS = 5000;

export function screenToDocument(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  viewport: Viewport
): DocumentCoordinates {
  const documentX = (clientX - containerRect.left - viewport.offsetX) / viewport.zoom;
  const documentY = (clientY - containerRect.top - viewport.offsetY) / viewport.zoom;
  return { x: documentX, y: documentY };
}

export function documentToScreen(
  documentX: number,
  documentY: number,
  viewport: Viewport
): ScreenCoordinates {
  const screenX = documentX * viewport.zoom + viewport.offsetX;
  const screenY = documentY * viewport.zoom + viewport.offsetY;
  return { x: screenX, y: screenY };
}

export class CursorManager {
  private readonly cursors: Map<string, CursorState> = new Map();
  private lastUpdateTimestamp: number = 0;
  private pendingUpdate: DocumentCoordinates | null = null;
  private pendingPointer: 'mouse' | 'pen' | 'touch' | undefined = undefined;
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null;
  private isTracking: boolean = false;

  constructor(
    private readonly onCursorUpdate: CursorUpdateCallback,
    private readonly onCursorsChange?: CursorsChangeCallback,
    private readonly throttleIntervalMs: number = THROTTLE_INTERVAL_MS,
    private readonly idleTimeoutMs: number = IDLE_TIMEOUT_MS,
    private readonly cleanupIntervalMs: number = CLEANUP_INTERVAL_MS
  ) {}

  startTracking(): void {
    if (this.isTracking) return;
    this.isTracking = true;
    this.startCleanupInterval();
  }

  stopTracking(): void {
    this.isTracking = false;
    this.pendingUpdate = null;
    this.stopCleanupInterval();
    this.onCursorUpdate(null);
  }

  handlePointerMove(
    clientX: number,
    clientY: number,
    containerRect: DOMRect,
    viewport: Viewport,
    pointerType: 'mouse' | 'pen' | 'touch' = 'mouse'
  ): void {
    const coords = screenToDocument(clientX, clientY, containerRect, viewport);
    
    this.pendingUpdate = coords;
    this.pendingPointer = pointerType;

    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTimestamp;

    if (timeSinceLastUpdate >= this.throttleIntervalMs) {
      this.flushPendingUpdate();
    }
  }

  handlePointerLeave(): void {
    this.pendingUpdate = null;
    this.flushPendingUpdate();
  }

  flushPendingUpdate(): void {
    if (!this.pendingUpdate) {
      this.onCursorUpdate(null);
      return;
    }

    this.lastUpdateTimestamp = Date.now();
    
    const cursor: Cursor = {
      x: this.pendingUpdate.x,
      y: this.pendingUpdate.y,
      pointer: this.pendingPointer,
    };
    
    this.onCursorUpdate(cursor);
    this.pendingUpdate = null;
  }

  updateRemoteCursor(
    connectionId: string,
    user: CollaborationUser,
    cursor: Cursor | undefined
  ): void {
    if (!cursor) {
      this.cursors.delete(connectionId);
    } else {
      const state: CursorState = {
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        userAvatar: user.avatar,
        documentX: cursor.x,
        documentY: cursor.y,
        pointer: cursor.pointer,
        lastUpdated: Date.now(),
      };
      this.cursors.set(connectionId, state);
    }
    
    this.onCursorsChange?.(new Map(this.cursors));
  }

  removeRemoteCursor(connectionId: string): void {
    if (this.cursors.delete(connectionId)) {
      this.onCursorsChange?.(new Map(this.cursors));
    }
  }

  removeDisconnectedCursors(activeConnectionIds: Set<string>): void {
    let changed = false;
    
    for (const connectionId of this.cursors.keys()) {
      if (!activeConnectionIds.has(connectionId)) {
        this.cursors.delete(connectionId);
        changed = true;
      }
    }
    
    if (changed) {
      this.onCursorsChange?.(new Map(this.cursors));
    }
  }

  getCursorScreenState(cursor: CursorState, viewport: Viewport): ScreenCoordinates & CursorState {
    const screen = documentToScreen(cursor.documentX, cursor.documentY, viewport);
    return {
      ...cursor,
      x: screen.x,
      y: screen.y,
    };
  }

  getAllCursorStates(): Map<string, CursorState> {
    return new Map(this.cursors);
  }

  getCursorCount(): number {
    return this.cursors.size;
  }

  clearAllCursors(): void {
    this.cursors.clear();
    this.onCursorsChange?.(new Map(this.cursors));
  }

  private startCleanupInterval(): void {
    if (this.cleanupIntervalId) return;
    
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupIdleCursors();
    }, this.cleanupIntervalMs);
  }

  private stopCleanupInterval(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  private cleanupIdleCursors(): void {
    const now = Date.now();
    let changed = false;
    
    for (const [connectionId, cursor] of this.cursors) {
      if (now - cursor.lastUpdated > this.idleTimeoutMs) {
        this.cursors.delete(connectionId);
        changed = true;
      }
    }
    
    if (changed) {
      this.onCursorsChange?.(new Map(this.cursors));
    }
  }

  destroy(): void {
    this.stopTracking();
    this.clearAllCursors();
  }
}

export function createCursorManager(
  onCursorUpdate: CursorUpdateCallback,
  onCursorsChange?: CursorsChangeCallback,
  options?: {
    throttleIntervalMs?: number;
    idleTimeoutMs?: number;
    cleanupIntervalMs?: number;
  }
): CursorManager {
  return new CursorManager(
    onCursorUpdate,
    onCursorsChange,
    options?.throttleIntervalMs,
    options?.idleTimeoutMs,
    options?.cleanupIntervalMs
  );
}
