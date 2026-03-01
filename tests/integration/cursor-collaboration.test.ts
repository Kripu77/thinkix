import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CursorManager,
  createCursorManager,
  screenToDocument,
  documentToScreen,
  type Viewport,
} from '@thinkix/collaboration/hooks';
import type { CollaborationUser } from '@thinkix/collaboration';

describe('Multi-User Cursor Scenarios', () => {
  let manager: CursorManager;
  let onCursorUpdate: ReturnType<typeof vi.fn>;
  let onCursorsChange: ReturnType<typeof vi.fn>;

  const viewport: Viewport = { zoom: 1, offsetX: 0, offsetY: 0 };
  const rect = new DOMRect(0, 0, 800, 600);

  const users: CollaborationUser[] = [
    { id: 'user1', name: 'Alice', color: '#FF0000' },
    { id: 'user2', name: 'Bob', color: '#00FF00' },
    { id: 'user3', name: 'Charlie', color: '#0000FF' },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    onCursorUpdate = vi.fn();
    onCursorsChange = vi.fn();
    manager = createCursorManager(onCursorUpdate, onCursorsChange, {
      throttleIntervalMs: 50,
      idleTimeoutMs: 1000,
      cleanupIntervalMs: 500,
    });
    manager.startTracking();
  });

  afterEach(() => {
    manager.destroy();
    vi.useRealTimers();
  });

  describe('Cursor Movement', () => {
    it('tracks multiple users moving simultaneously', () => {
      manager.updateRemoteCursor('conn1', users[0], { x: 100, y: 100 });
      manager.updateRemoteCursor('conn2', users[1], { x: 200, y: 200 });
      manager.updateRemoteCursor('conn3', users[2], { x: 300, y: 300 });

      expect(manager.getCursorCount()).toBe(3);

      const cursors = manager.getAllCursorStates();
      expect(cursors.get('conn1')?.documentX).toBe(100);
      expect(cursors.get('conn2')?.documentX).toBe(200);
      expect(cursors.get('conn3')?.documentX).toBe(300);
    });

    it('updates cursor positions correctly', () => {
      manager.updateRemoteCursor('conn1', users[0], { x: 100, y: 100 });
      expect(cursors => cursors.get('conn1')?.documentX).toBeDefined();

      manager.updateRemoteCursor('conn1', users[0], { x: 500, y: 500 });
      
      const cursors = manager.getAllCursorStates();
      expect(cursors.get('conn1')?.documentX).toBe(500);
      expect(cursors.get('conn1')?.documentY).toBe(500);
    });

    it('handles rapid position updates', () => {
      const positions = [
        { x: 100, y: 100 },
        { x: 150, y: 120 },
        { x: 200, y: 140 },
        { x: 250, y: 160 },
        { x: 300, y: 180 },
      ];

      positions.forEach(pos => {
        manager.updateRemoteCursor('conn1', users[0], pos);
      });

      const cursors = manager.getAllCursorStates();
      expect(cursors.get('conn1')?.documentX).toBe(300);
      expect(cursors.get('conn1')?.documentY).toBe(180);
    });
  });

  describe('Disconnect Cleanup', () => {
    it('removes cursors when users disconnect', () => {
      manager.updateRemoteCursor('conn1', users[0], { x: 100, y: 100 });
      manager.updateRemoteCursor('conn2', users[1], { x: 200, y: 200 });

      expect(manager.getCursorCount()).toBe(2);

      manager.removeDisconnectedCursors(new Set(['conn1']));

      expect(manager.getCursorCount()).toBe(1);
      const cursors = manager.getAllCursorStates();
      expect(cursors.has('conn1')).toBe(true);
      expect(cursors.has('conn2')).toBe(false);
    });

    it('handles all users disconnecting', () => {
      manager.updateRemoteCursor('conn1', users[0], { x: 100, y: 100 });
      manager.updateRemoteCursor('conn2', users[1], { x: 200, y: 200 });

      manager.removeDisconnectedCursors(new Set());

      expect(manager.getCursorCount()).toBe(0);
    });

    it('clears all cursors', () => {
      manager.updateRemoteCursor('conn1', users[0], { x: 100, y: 100 });
      manager.updateRemoteCursor('conn2', users[1], { x: 200, y: 200 });

      manager.clearAllCursors();

      expect(manager.getCursorCount()).toBe(0);
    });
  });

  describe('Zoom/Pan Correctness', () => {
    const testViewports: { name: string; viewport: Viewport }[] = [
      { name: 'default', viewport: { zoom: 1, offsetX: 0, offsetY: 0 } },
      { name: 'zoomed in', viewport: { zoom: 2, offsetX: 0, offsetY: 0 } },
      { name: 'zoomed out', viewport: { zoom: 0.5, offsetX: 0, offsetY: 0 } },
      { name: 'panned', viewport: { zoom: 1, offsetX: -500, offsetY: -300 } },
      { name: 'zoomed and panned', viewport: { zoom: 1.5, offsetX: -200, offsetY: -100 } },
    ];

    testViewports.forEach(({ name, viewport }) => {
      it(`maintains cursor position under ${name}`, () => {
        const documentX = 500;
        const documentY = 300;

        manager.updateRemoteCursor('conn1', users[0], { x: documentX, y: documentY });

        const cursors = manager.getAllCursorStates();
        const cursor = cursors.get('conn1');

        expect(cursor?.documentX).toBe(documentX);
        expect(cursor?.documentY).toBe(documentY);

        const screen = manager.getCursorScreenState(cursor!, viewport);
        const expectedScreenX = documentX * viewport.zoom + viewport.offsetX;
        const expectedScreenY = documentY * viewport.zoom + viewport.offsetY;

        expect(screen.screenX).toBe(expectedScreenX);
        expect(screen.screenY).toBe(expectedScreenY);
      });
    });

    it('cursor follows correct transformation path', () => {
      const clientX = 600;
      const clientY = 400;
      const testViewport: Viewport = { zoom: 2, offsetX: 100, offsetY: 50 };

      const doc = screenToDocument(clientX, clientY, rect, testViewport);
      expect(doc.x).toBe((600 - 0 - 100) / 2);
      expect(doc.y).toBe((400 - 0 - 50) / 2);

      const screen = documentToScreen(doc.x, doc.y, testViewport);
      expect(screen.x).toBeCloseTo(clientX, 5);
      expect(screen.y).toBeCloseTo(clientY, 5);
    });
  });

  describe('Idle Timeout', () => {
    it('removes cursors after idle timeout', () => {
      manager.updateRemoteCursor('conn1', users[0], { x: 100, y: 100 });

      vi.advanceTimersByTime(1000 + 500);

      expect(manager.getCursorCount()).toBe(0);
    });

    it('keeps active cursors', () => {
      manager.updateRemoteCursor('conn1', users[0], { x: 100, y: 100 });

      vi.advanceTimersByTime(500);
      manager.updateRemoteCursor('conn1', users[0], { x: 150, y: 150 });

      vi.advanceTimersByTime(500);

      expect(manager.getCursorCount()).toBe(1);
    });
  });

  describe('Pointer Types', () => {
    it('tracks different pointer types', () => {
      manager.updateRemoteCursor('conn1', users[0], { x: 100, y: 100, pointer: 'mouse' });
      manager.updateRemoteCursor('conn2', users[1], { x: 200, y: 200, pointer: 'pen' });
      manager.updateRemoteCursor('conn3', users[2], { x: 300, y: 300, pointer: 'touch' });

      const cursors = manager.getAllCursorStates();
      expect(cursors.get('conn1')?.pointer).toBe('mouse');
      expect(cursors.get('conn2')?.pointer).toBe('pen');
      expect(cursors.get('conn3')?.pointer).toBe('touch');
    });
  });

  describe('Local Cursor Tracking', () => {
    it('throttles local cursor updates', () => {
      manager.handlePointerMove(100, 200, rect, viewport);
      expect(onCursorUpdate).toHaveBeenCalledTimes(1);

      manager.handlePointerMove(150, 250, rect, viewport);
      expect(onCursorUpdate).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(50);
      manager.handlePointerMove(200, 300, rect, viewport);
      expect(onCursorUpdate).toHaveBeenCalledTimes(2);
    });

    it('sends null cursor on pointer leave', () => {
      manager.handlePointerMove(100, 200, rect, viewport);
      manager.handlePointerLeave();

      expect(onCursorUpdate).toHaveBeenCalledWith(null);
    });
  });
});
