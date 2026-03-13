import type { Cursor, CollaborationUser } from './types';
import type { Viewport } from './utils/viewport';
 
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
 
export type CursorUpdateCallback = (cursor: Cursor | null) => void;
export type CursorsChangeCallback = (cursors: Map<string, CursorState>) => void;
 
const THROTTLE_INTERVAL_MS = 50;
const IDLE_TIMEOUT_MS = 30000;
const CLEANUP_INTERVAL_MS = 5000;
 
export class CursorManager {
  private readonly cursors: Map<string, CursorState> = new Map();
  private lastUpdateTimestamp: number = 0;
  private pendingUpdate: { x: number; y: number } | null = null;
  private pendingPointer: 'mouse' | 'pen' | 'touch' | undefined = undefined;
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null;
  private trailingTimerId: ReturnType<typeof setTimeout> | null = null;
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
    this.clearTrailingTimer();
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
    const documentX = (clientX - containerRect.left - viewport.offsetX) / viewport.zoom;
    const documentY = (clientY - containerRect.top - viewport.offsetY) / viewport.zoom;
    
    this.pendingUpdate = { x: documentX, y: documentY };
    this.pendingPointer = pointerType;
 
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTimestamp;
 
    if (timeSinceLastUpdate >= this.throttleIntervalMs) {
      this.clearTrailingTimer();
      this.flushPendingUpdate();
    } else if (!this.trailingTimerId) {
      const remaining = this.throttleIntervalMs - timeSinceLastUpdate;
      this.trailingTimerId = setTimeout(() => {
        this.trailingTimerId = null;
        if (this.pendingUpdate) {
          this.flushPendingUpdate();
        }
      }, remaining);
    }
  }
 
  handlePointerLeave(): void {
    this.pendingUpdate = null;
    this.clearTrailingTimer();
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
 
  getCursorScreenState(cursor: CursorState, viewport: Viewport): CursorState & { screenX: number; screenY: number } {
    const screenX = cursor.documentX * viewport.zoom + viewport.offsetX;
    const screenY = cursor.documentY * viewport.zoom + viewport.offsetY;
    return { ...cursor, screenX, screenY };
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
 
  private clearTrailingTimer(): void {
    if (this.trailingTimerId) {
      clearTimeout(this.trailingTimerId);
      this.trailingTimerId = null;
    }
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
 
const PRESENCE_PAGE_SIZE = 50;
 
export function getVisibleCursors(
  cursors: Map<string, CursorState>,
  viewport: Viewport,
  screenWidth: number,
  screenHeight: number
): Map<string, CursorState> {
  const result = new Map<string, CursorState>();
  const margin = 100;
 
  for (const [id, cursor] of cursors) {
    const screenX = cursor.documentX * viewport.zoom + viewport.offsetX;
    const screenY = cursor.documentY * viewport.zoom + viewport.offsetY;
 
    if (screenX < -margin || screenX > screenWidth + margin) continue;
    if (screenY < -margin || screenY > screenHeight + margin) continue;
 
    result.set(id, cursor);
  }
 
  return result;
}
 
export function paginateCursors(
  cursors: Map<string, CursorState>,
  page: number,
  pageSize: number = PRESENCE_PAGE_SIZE
): Map<string, CursorState> {
  const result = new Map<string, CursorState>();
  const start = page * pageSize;
  let index = 0;
 
  for (const [id, cursor] of cursors) {
    if (index >= start && index < start + pageSize) {
      result.set(id, cursor);
    }
    index++;
    if (result.size >= pageSize) break;
  }
 
  return result;
}
 
export function getActiveCursors(
  cursors: Map<string, CursorState>,
  idleTimeoutMs: number = IDLE_TIMEOUT_MS
): Map<string, CursorState> {
  const result = new Map<string, CursorState>();
  const now = Date.now();
 
  for (const [id, cursor] of cursors) {
    if (now - cursor.lastUpdated <= idleTimeoutMs) {
      result.set(id, cursor);
    }
  }
 
  return result;
}