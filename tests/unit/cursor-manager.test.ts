import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CursorManager,
  createCursorManager,
  getVisibleCursors,
  paginateCursors,
  getActiveCursors,
  type Viewport,
  type CursorState,
} from '@thinkix/collaboration/hooks';
import { screenToDocument, documentToScreen } from '@thinkix/collaboration/utils';
import type { Cursor, CollaborationUser } from '@thinkix/collaboration';

describe('Coordinate Conversion', () => {
  const defaultViewport: Viewport = { zoom: 1, offsetX: 0, offsetY: 0 };
  const defaultRect = new DOMRect(0, 0, 800, 600);

  describe('screenToDocument', () => {
    it('converts screen coordinates to document coordinates with default viewport', () => {
      const result = screenToDocument(100, 200, defaultRect, defaultViewport);
      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });

    it('converts screen coordinates with zoom > 1', () => {
      const viewport: Viewport = { zoom: 2, offsetX: 0, offsetY: 0 };
      const result = screenToDocument(200, 400, defaultRect, viewport);
      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });

    it('converts screen coordinates with zoom < 1', () => {
      const viewport: Viewport = { zoom: 0.5, offsetX: 0, offsetY: 0 };
      const result = screenToDocument(100, 200, defaultRect, viewport);
      expect(result.x).toBe(200);
      expect(result.y).toBe(400);
    });

    it('accounts for pan offset', () => {
      const viewport: Viewport = { zoom: 1, offsetX: -500, offsetY: -300 };
      const result = screenToDocument(600, 400, defaultRect, viewport);
      expect(result.x).toBe(1100);
      expect(result.y).toBe(700);
    });

    it('accounts for both zoom and pan', () => {
      const viewport: Viewport = { zoom: 2, offsetX: -200, offsetY: -100 };
      const result = screenToDocument(400, 300, defaultRect, viewport);
      expect(result.x).toBe(300);
      expect(result.y).toBe(200);
    });

    it('accounts for container rect offset', () => {
      const rect = new DOMRect(100, 50, 800, 600);
      const result = screenToDocument(200, 150, rect, defaultViewport);
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });
  });

  describe('documentToScreen', () => {
    it('converts document coordinates to screen coordinates with default viewport', () => {
      const result = documentToScreen(100, 200, defaultViewport);
      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });

    it('converts document coordinates with zoom > 1', () => {
      const viewport: Viewport = { zoom: 2, offsetX: 0, offsetY: 0 };
      const result = documentToScreen(100, 200, viewport);
      expect(result.x).toBe(200);
      expect(result.y).toBe(400);
    });

    it('converts document coordinates with zoom < 1', () => {
      const viewport: Viewport = { zoom: 0.5, offsetX: 0, offsetY: 0 };
      const result = documentToScreen(200, 400, viewport);
      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });

    it('accounts for pan offset', () => {
      const viewport: Viewport = { zoom: 1, offsetX: 100, offsetY: 50 };
      const result = documentToScreen(500, 300, viewport);
      expect(result.x).toBe(600);
      expect(result.y).toBe(350);
    });

    it('accounts for both zoom and pan', () => {
      const viewport: Viewport = { zoom: 2, offsetX: 100, offsetY: 50 };
      const result = documentToScreen(200, 150, viewport);
      expect(result.x).toBe(500);
      expect(result.y).toBe(350);
    });
  });

  describe('round-trip conversion', () => {
    it('maintains coordinates through round-trip conversion', () => {
      const viewport: Viewport = { zoom: 1.5, offsetX: 200, offsetY: 100 };
      const originalDocX = 500;
      const originalDocY = 350;

      const screen = documentToScreen(originalDocX, originalDocY, viewport);
      const rect = new DOMRect(0, 0, 800, 600);
      const doc = screenToDocument(screen.x, screen.y, rect, viewport);

      expect(doc.x).toBeCloseTo(originalDocX, 10);
      expect(doc.y).toBeCloseTo(originalDocY, 10);
    });
  });
});

describe('CursorManager', () => {
  let onCursorUpdate: ReturnType<typeof vi.fn>;
  let onCursorsChange: ReturnType<typeof vi.fn>;
  let manager: CursorManager;

  beforeEach(() => {
    vi.useFakeTimers();
    onCursorUpdate = vi.fn();
    onCursorsChange = vi.fn();
  });

  afterEach(() => {
    manager?.destroy();
    vi.useRealTimers();
  });

  describe('creation and lifecycle', () => {
    it('creates manager with default options', () => {
      manager = createCursorManager(onCursorUpdate);
      expect(manager).toBeInstanceOf(CursorManager);
    });

    it('creates manager with custom options', () => {
      manager = createCursorManager(onCursorUpdate, onCursorsChange, {
        throttleIntervalMs: 100,
        idleTimeoutMs: 60000,
        cleanupIntervalMs: 10000,
      });
      expect(manager).toBeInstanceOf(CursorManager);
    });

    it('starts tracking when startTracking is called', () => {
      manager = createCursorManager(onCursorUpdate, onCursorsChange);
      manager.startTracking();
      expect(onCursorUpdate).not.toHaveBeenCalled();
    });

    it('sends null cursor when stopTracking is called', () => {
      manager = createCursorManager(onCursorUpdate, onCursorsChange);
      manager.startTracking();
      manager.stopTracking();
      expect(onCursorUpdate).toHaveBeenCalledWith(null);
    });

    it('cleans up resources on destroy', () => {
      manager = createCursorManager(onCursorUpdate, onCursorsChange);
      manager.startTracking();
      manager.destroy();
      expect(manager.getCursorCount()).toBe(0);
    });
  });

  describe('throttling', () => {
    const throttleMs = 50;
    const rect = new DOMRect(0, 0, 800, 600);
    const viewport: Viewport = { zoom: 1, offsetX: 0, offsetY: 0 };

    beforeEach(() => {
      manager = createCursorManager(onCursorUpdate, onCursorsChange, {
        throttleIntervalMs: throttleMs,
      });
      manager.startTracking();
    });

    it('throttles rapid pointer movements', () => {
      manager.handlePointerMove(100, 200, rect, viewport);
      expect(onCursorUpdate).toHaveBeenCalledTimes(1);

      manager.handlePointerMove(150, 250, rect, viewport);
      expect(onCursorUpdate).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(throttleMs);
      manager.handlePointerMove(200, 300, rect, viewport);
      expect(onCursorUpdate).toHaveBeenCalledTimes(2);
    });

    it('flushes pending update on next pointer move after throttle interval', () => {
      manager.handlePointerMove(100, 200, rect, viewport);
      expect(onCursorUpdate).toHaveBeenLastCalledWith({
        x: 100,
        y: 200,
        pointer: 'mouse',
      });

      manager.handlePointerMove(150, 250, rect, viewport);
      expect(onCursorUpdate).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(throttleMs);

      manager.handlePointerMove(200, 300, rect, viewport);
      expect(onCursorUpdate).toHaveBeenCalledTimes(2);
      expect(onCursorUpdate).toHaveBeenLastCalledWith({
        x: 200,
        y: 300,
        pointer: 'mouse',
      });
    });

    it('handles pointer leave by clearing cursor', () => {
      manager.handlePointerMove(100, 200, rect, viewport);
      expect(onCursorUpdate).toHaveBeenCalledWith(expect.objectContaining({ x: 100, y: 200 }));

      manager.handlePointerLeave();
      expect(onCursorUpdate).toHaveBeenCalledWith(null);
    });
  });

  describe('remote cursor state management', () => {
    const user1: CollaborationUser = { id: 'user1', name: 'Alice', color: '#FF0000' };
    const user2: CollaborationUser = { id: 'user2', name: 'Bob', color: '#00FF00' };

    beforeEach(() => {
      manager = createCursorManager(onCursorUpdate, onCursorsChange);
      manager.startTracking();
    });

    it('adds remote cursor', () => {
      const cursor: Cursor = { x: 100, y: 200 };
      manager.updateRemoteCursor('conn1', user1, cursor);

      expect(onCursorsChange).toHaveBeenCalled();
      expect(manager.getCursorCount()).toBe(1);
    });

    it('updates existing remote cursor', () => {
      const cursor1: Cursor = { x: 100, y: 200 };
      manager.updateRemoteCursor('conn1', user1, cursor1);

      const cursor2: Cursor = { x: 150, y: 250 };
      manager.updateRemoteCursor('conn1', user1, cursor2);

      expect(manager.getCursorCount()).toBe(1);
      const cursors = manager.getAllCursorStates();
      const state = cursors.get('conn1');
      expect(state?.documentX).toBe(150);
      expect(state?.documentY).toBe(250);
    });

    it('removes cursor when cursor is undefined', () => {
      const cursor: Cursor = { x: 100, y: 200 };
      manager.updateRemoteCursor('conn1', user1, cursor);
      expect(manager.getCursorCount()).toBe(1);

      manager.updateRemoteCursor('conn1', user1, undefined);
      expect(manager.getCursorCount()).toBe(0);
    });

    it('handles multiple remote cursors', () => {
      manager.updateRemoteCursor('conn1', user1, { x: 100, y: 200 });
      manager.updateRemoteCursor('conn2', user2, { x: 300, y: 400 });

      expect(manager.getCursorCount()).toBe(2);
    });

    it('removes cursor by connection id', () => {
      manager.updateRemoteCursor('conn1', user1, { x: 100, y: 200 });
      manager.removeRemoteCursor('conn1');

      expect(manager.getCursorCount()).toBe(0);
    });

    it('removes disconnected cursors', () => {
      manager.updateRemoteCursor('conn1', user1, { x: 100, y: 200 });
      manager.updateRemoteCursor('conn2', user2, { x: 300, y: 400 });

      manager.removeDisconnectedCursors(new Set(['conn1']));

      expect(manager.getCursorCount()).toBe(1);
      const cursors = manager.getAllCursorStates();
      expect(cursors.has('conn1')).toBe(true);
      expect(cursors.has('conn2')).toBe(false);
    });
  });

  describe('idle cursor cleanup', () => {
    const idleTimeoutMs = 1000;
    const cleanupIntervalMs = 500;
    const user1: CollaborationUser = { id: 'user1', name: 'Alice', color: '#FF0000' };

    beforeEach(() => {
      manager = createCursorManager(onCursorUpdate, onCursorsChange, {
        idleTimeoutMs,
        cleanupIntervalMs,
      });
      manager.startTracking();
    });

    it('removes cursors that exceed idle timeout', async () => {
      manager.updateRemoteCursor('conn1', user1, { x: 100, y: 200 });
      expect(manager.getCursorCount()).toBe(1);

      vi.advanceTimersByTime(idleTimeoutMs + cleanupIntervalMs);

      expect(manager.getCursorCount()).toBe(0);
    });

    it('keeps cursors that are still active', async () => {
      manager.updateRemoteCursor('conn1', user1, { x: 100, y: 200 });

      vi.advanceTimersByTime(idleTimeoutMs / 2);
      manager.updateRemoteCursor('conn1', user1, { x: 150, y: 250 });

      vi.advanceTimersByTime(cleanupIntervalMs);

      expect(manager.getCursorCount()).toBe(1);
    });
  });

  describe('cursor screen state conversion', () => {
    const user1: CollaborationUser = { id: 'user1', name: 'Alice', color: '#FF0000' };
    const viewport: Viewport = { zoom: 2, offsetX: 100, offsetY: 50 };

    beforeEach(() => {
      manager = createCursorManager(onCursorUpdate, onCursorsChange);
      manager.startTracking();
    });

    it('converts cursor document coordinates to screen coordinates', () => {
      manager.updateRemoteCursor('conn1', user1, { x: 200, y: 150 });

      const cursors = manager.getAllCursorStates();
      const cursor = cursors.get('conn1');
      expect(cursor).toBeDefined();

      const screenState = manager.getCursorScreenState(cursor!, viewport);
      expect(screenState.screenX).toBe(500);
      expect(screenState.screenY).toBe(350);
    });
  });
});

describe('getVisibleCursors', () => {
  const viewport: Viewport = { zoom: 1, offsetX: 0, offsetY: 0 };
  const screenWidth = 800;
  const screenHeight = 600;

  function createCursorState(id: string, x: number, y: number): CursorState {
    return {
      userId: id,
      userName: `User ${id}`,
      userColor: '#FF0000',
      documentX: x,
      documentY: y,
      lastUpdated: Date.now(),
    };
  }

  it('returns empty map for empty input', () => {
    const result = getVisibleCursors(new Map(), viewport, screenWidth, screenHeight);
    expect(result.size).toBe(0);
  });

  it('returns cursors within viewport', () => {
    const cursors = new Map<string, CursorState>();
    cursors.set('1', createCursorState('1', 100, 100));
    cursors.set('2', createCursorState('2', 400, 300));

    const result = getVisibleCursors(cursors, viewport, screenWidth, screenHeight);
    expect(result.size).toBe(2);
  });

  it('filters out cursors outside screen bounds', () => {
    const cursors = new Map<string, CursorState>();
    cursors.set('inside', createCursorState('inside', 400, 300));
    cursors.set('outside-left', createCursorState('outside-left', -200, 300));
    cursors.set('outside-right', createCursorState('outside-right', 1000, 300));
    cursors.set('outside-top', createCursorState('outside-top', 400, -200));
    cursors.set('outside-bottom', createCursorState('outside-bottom', 400, 800));

    const result = getVisibleCursors(cursors, viewport, screenWidth, screenHeight);
    expect(result.size).toBe(1);
    expect(result.has('inside')).toBe(true);
  });

  it('includes cursors within margin of screen bounds', () => {
    const cursors = new Map<string, CursorState>();
    cursors.set('near-left', createCursorState('near-left', -50, 300));
    cursors.set('near-right', createCursorState('near-right', 850, 300));
    cursors.set('near-top', createCursorState('near-top', 400, -50));
    cursors.set('near-bottom', createCursorState('near-bottom', 400, 650));

    const result = getVisibleCursors(cursors, viewport, screenWidth, screenHeight);
    expect(result.size).toBe(4);
  });

  it('filters cursors outside margin', () => {
    const cursors = new Map<string, CursorState>();
    cursors.set('far-left', createCursorState('far-left', -150, 300));
    cursors.set('far-right', createCursorState('far-right', 950, 300));

    const result = getVisibleCursors(cursors, viewport, screenWidth, screenHeight);
    expect(result.size).toBe(0);
  });

  it('accounts for zoom in visibility calculation', () => {
    const zoomedViewport: Viewport = { zoom: 2, offsetX: 0, offsetY: 0 };
    const cursors = new Map<string, CursorState>();
    cursors.set('1', createCursorState('1', 200, 150));

    const result = getVisibleCursors(cursors, zoomedViewport, screenWidth, screenHeight);
    expect(result.size).toBe(1);
  });

  it('accounts for pan offset in visibility calculation', () => {
    const pannedViewport: Viewport = { zoom: 1, offsetX: -500, offsetY: -300 };
    const cursors = new Map<string, CursorState>();
    cursors.set('visible', createCursorState('visible', 600, 400));
    cursors.set('hidden', createCursorState('hidden', 100, 100));

    const result = getVisibleCursors(cursors, pannedViewport, screenWidth, screenHeight);
    expect(result.has('visible')).toBe(true);
    expect(result.has('hidden')).toBe(false);
  });
});

describe('paginateCursors', () => {
  function createCursorState(id: string): CursorState {
    return {
      userId: id,
      userName: `User ${id}`,
      userColor: '#FF0000',
      documentX: 0,
      documentY: 0,
      lastUpdated: Date.now(),
    };
  }

  it('returns empty map for empty input', () => {
    const result = paginateCursors(new Map(), 0);
    expect(result.size).toBe(0);
  });

  it('returns first page of cursors', () => {
    const cursors = new Map<string, CursorState>();
    for (let i = 0; i < 60; i++) {
      cursors.set(`cursor-${i}`, createCursorState(`cursor-${i}`));
    }

    const result = paginateCursors(cursors, 0, 50);
    expect(result.size).toBe(50);
  });

  it('returns second page of cursors', () => {
    const cursors = new Map<string, CursorState>();
    for (let i = 0; i < 100; i++) {
      cursors.set(`cursor-${i}`, createCursorState(`cursor-${i}`));
    }

    const page1 = paginateCursors(cursors, 0, 50);
    const page2 = paginateCursors(cursors, 1, 50);

    expect(page1.size).toBe(50);
    expect(page2.size).toBe(50);

    const page1Keys = Array.from(page1.keys());
    const page2Keys = Array.from(page2.keys());
    expect(page1Keys).not.toEqual(expect.arrayContaining(page2Keys));
  });

  it('returns partial last page', () => {
    const cursors = new Map<string, CursorState>();
    for (let i = 0; i < 75; i++) {
      cursors.set(`cursor-${i}`, createCursorState(`cursor-${i}`));
    }

    const result = paginateCursors(cursors, 1, 50);
    expect(result.size).toBe(25);
  });

  it('returns empty map for page beyond data', () => {
    const cursors = new Map<string, CursorState>();
    cursors.set('1', createCursorState('1'));

    const result = paginateCursors(cursors, 5, 50);
    expect(result.size).toBe(0);
  });

  it('respects custom page size', () => {
    const cursors = new Map<string, CursorState>();
    for (let i = 0; i < 30; i++) {
      cursors.set(`cursor-${i}`, createCursorState(`cursor-${i}`));
    }

    const result = paginateCursors(cursors, 0, 10);
    expect(result.size).toBe(10);
  });
});

describe('getActiveCursors', () => {
  function createCursorState(id: string, lastUpdated: number): CursorState {
    return {
      userId: id,
      userName: `User ${id}`,
      userColor: '#FF0000',
      documentX: 0,
      documentY: 0,
      lastUpdated,
    };
  }

  it('returns empty map for empty input', () => {
    const result = getActiveCursors(new Map());
    expect(result.size).toBe(0);
  });

  it('returns cursors within idle timeout', () => {
    const now = Date.now();
    const cursors = new Map<string, CursorState>();
    cursors.set('active', createCursorState('active', now - 1000));
    cursors.set('also-active', createCursorState('also-active', now - 5000));

    const result = getActiveCursors(cursors, 10000);
    expect(result.size).toBe(2);
  });

  it('filters out cursors beyond idle timeout', () => {
    const now = Date.now();
    const cursors = new Map<string, CursorState>();
    cursors.set('active', createCursorState('active', now - 1000));
    cursors.set('idle', createCursorState('idle', now - 60000));

    const result = getActiveCursors(cursors, 30000);
    expect(result.size).toBe(1);
    expect(result.has('active')).toBe(true);
  });

  it('uses default idle timeout when not specified', () => {
    const now = Date.now();
    const cursors = new Map<string, CursorState>();
    cursors.set('recent', createCursorState('recent', now - 10000));

    const result = getActiveCursors(cursors);
    expect(result.size).toBe(1);
  });

  it('handles boundary condition exactly at timeout', () => {
    const now = Date.now();
    const timeout = 30000;
    const cursors = new Map<string, CursorState>();
    cursors.set('at-boundary', createCursorState('at-boundary', now - timeout));
    cursors.set('just-over', createCursorState('just-over', now - timeout - 1));

    const result = getActiveCursors(cursors, timeout);
    expect(result.has('at-boundary')).toBe(true);
    expect(result.has('just-over')).toBe(false);
  });
});
