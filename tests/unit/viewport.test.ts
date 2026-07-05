import { describe, it, expect } from 'vitest';
import { screenToDocument, documentToScreen, getViewport, type Viewport } from '@thinkix/collaboration/utils';
import type { PlaitBoard } from '@plait/core';

describe('Viewport Utilities', () => {
  describe('getViewport', () => {
    it('returns zoom and origination from board viewport', () => {
      const mockBoard = {
        viewport: {
          zoom: 1.5,
          origination: [100, 200],
        },
      } as unknown as PlaitBoard;

      const result = getViewport(mockBoard);

      expect(result.zoom).toBe(1.5);
      expect(result.originationX).toBe(100);
      expect(result.originationY).toBe(200);
    });

    it('returns default values when viewport is undefined', () => {
      const mockBoard = {} as unknown as PlaitBoard;

      const result = getViewport(mockBoard);

      expect(result.zoom).toBe(1);
      expect(result.originationX).toBe(0);
      expect(result.originationY).toBe(0);
    });

    it('defaults origination to zero when board has not initialized it', () => {
      const mockBoard = {
        viewport: {
          zoom: 2,
        },
      } as unknown as PlaitBoard;

      const result = getViewport(mockBoard);

      expect(result.zoom).toBe(2);
      expect(result.originationX).toBe(0);
      expect(result.originationY).toBe(0);
    });

    it('handles extreme zoom values', () => {
      const mockBoard = {
        viewport: {
          zoom: 0.001,
          origination: [0, 0],
        },
      } as unknown as PlaitBoard;

      const result = getViewport(mockBoard);

      expect(result.zoom).toBe(0.001);
    });

    it('handles large origination values', () => {
      const mockBoard = {
        viewport: {
          zoom: 1,
          origination: [-100000, 100000],
        },
      } as unknown as PlaitBoard;

      const result = getViewport(mockBoard);

      expect(result.originationX).toBe(-100000);
      expect(result.originationY).toBe(100000);
    });
  });

  describe('screenToDocument', () => {
    const defaultViewport: Viewport = { zoom: 1, originationX: 0, originationY: 0 };
    const defaultRect = new DOMRect(0, 0, 800, 600);

    it('converts screen coordinates with default viewport', () => {
      const result = screenToDocument(100, 200, defaultRect, defaultViewport);

      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });

    it('converts with zoom > 1', () => {
      const viewport: Viewport = { zoom: 2, originationX: 0, originationY: 0 };
      const result = screenToDocument(200, 400, defaultRect, viewport);

      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });

    it('converts with zoom < 1', () => {
      const viewport: Viewport = { zoom: 0.5, originationX: 0, originationY: 0 };
      const result = screenToDocument(100, 200, defaultRect, viewport);

      expect(result.x).toBe(200);
      expect(result.y).toBe(400);
    });

    it('accounts for positive origination (panned right/down)', () => {
      const viewport: Viewport = { zoom: 1, originationX: 100, originationY: 50 };
      const result = screenToDocument(200, 150, defaultRect, viewport);

      expect(result.x).toBe(300);
      expect(result.y).toBe(200);
    });

    it('accounts for negative origination (panned left/up)', () => {
      const viewport: Viewport = { zoom: 1, originationX: -100, originationY: -50 };
      const result = screenToDocument(100, 100, defaultRect, viewport);

      expect(result.x).toBe(0);
      expect(result.y).toBe(50);
    });

    it('accounts for container rect offset', () => {
      const rect = new DOMRect(100, 50, 800, 600);
      const result = screenToDocument(200, 150, rect, defaultViewport);

      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });

    it('handles combined zoom and origination', () => {
      const viewport: Viewport = { zoom: 2, originationX: -200, originationY: -100 };
      const result = screenToDocument(400, 300, defaultRect, viewport);

      expect(result.x).toBe(0);
      expect(result.y).toBe(50);
    });

    it('handles zero screen coordinates', () => {
      const result = screenToDocument(0, 0, defaultRect, defaultViewport);

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('handles negative screen coordinates', () => {
      const result = screenToDocument(-100, -200, defaultRect, defaultViewport);

      expect(result.x).toBe(-100);
      expect(result.y).toBe(-200);
    });

    it('handles floating point coordinates', () => {
      const viewport: Viewport = { zoom: 1.5, originationX: 10.5, originationY: 20.5 };
      const result = screenToDocument(100.25, 200.75, defaultRect, viewport);

      expect(result.x).toBeCloseTo(100.25 / 1.5 + 10.5, 10);
      expect(result.y).toBeCloseTo(200.75 / 1.5 + 20.5, 10);
    });

    it('handles very large screen coordinates', () => {
      const result = screenToDocument(100000, 200000, defaultRect, defaultViewport);

      expect(result.x).toBe(100000);
      expect(result.y).toBe(200000);
    });
  });

  describe('documentToScreen', () => {
    const defaultViewport: Viewport = { zoom: 1, originationX: 0, originationY: 0 };

    it('converts document coordinates with default viewport', () => {
      const result = documentToScreen(100, 200, defaultViewport);

      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });

    it('converts with zoom > 1', () => {
      const viewport: Viewport = { zoom: 2, originationX: 0, originationY: 0 };
      const result = documentToScreen(100, 200, viewport);

      expect(result.x).toBe(200);
      expect(result.y).toBe(400);
    });

    it('converts with zoom < 1', () => {
      const viewport: Viewport = { zoom: 0.5, originationX: 0, originationY: 0 };
      const result = documentToScreen(200, 400, viewport);

      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });

    it('accounts for positive origination', () => {
      const viewport: Viewport = { zoom: 1, originationX: 100, originationY: 50 };
      const result = documentToScreen(100, 200, viewport);

      expect(result.x).toBe(0);
      expect(result.y).toBe(150);
    });

    it('accounts for negative origination', () => {
      const viewport: Viewport = { zoom: 1, originationX: -100, originationY: -50 };
      const result = documentToScreen(100, 200, viewport);

      expect(result.x).toBe(200);
      expect(result.y).toBe(250);
    });

    it('handles combined zoom and origination', () => {
      const viewport: Viewport = { zoom: 2, originationX: 100, originationY: 50 };
      const result = documentToScreen(200, 150, viewport);

      expect(result.x).toBe(200);
      expect(result.y).toBe(200);
    });

    it('handles zero document coordinates', () => {
      const result = documentToScreen(0, 0, defaultViewport);

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('handles negative document coordinates', () => {
      const result = documentToScreen(-100, -200, defaultViewport);

      expect(result.x).toBe(-100);
      expect(result.y).toBe(-200);
    });

    it('handles floating point coordinates', () => {
      const viewport: Viewport = { zoom: 1.5, originationX: 10.5, originationY: 20.5 };
      const result = documentToScreen(100.25, 200.75, viewport);

      expect(result.x).toBeCloseTo((100.25 - 10.5) * 1.5, 10);
      expect(result.y).toBeCloseTo((200.75 - 20.5) * 1.5, 10);
    });
  });

  describe('round-trip conversion', () => {
    it('maintains coordinates through screen -> document -> screen round-trip', () => {
      const viewports: Viewport[] = [
        { zoom: 1, originationX: 0, originationY: 0 },
        { zoom: 2, originationX: 100, originationY: 50 },
        { zoom: 0.5, originationX: -200, originationY: -100 },
        { zoom: 1.5, originationX: 0, originationY: 0 },
      ];

      const rect = new DOMRect(0, 0, 800, 600);

      viewports.forEach((viewport) => {
        const originalX = 500;
        const originalY = 300;

        const doc = screenToDocument(originalX, originalY, rect, viewport);
        const screen = documentToScreen(doc.x, doc.y, viewport);

        expect(screen.x).toBeCloseTo(originalX, 10);
        expect(screen.y).toBeCloseTo(originalY, 10);
      });
    });

    it('maintains coordinates through document -> screen -> document round-trip', () => {
      const viewports: Viewport[] = [
        { zoom: 1, originationX: 0, originationY: 0 },
        { zoom: 2, originationX: 100, originationY: 50 },
        { zoom: 0.5, originationX: -200, originationY: -100 },
      ];

      const rect = new DOMRect(0, 0, 800, 600);

      viewports.forEach((viewport) => {
        const originalDocX = 500;
        const originalDocY = 300;

        const screen = documentToScreen(originalDocX, originalDocY, viewport);
        const doc = screenToDocument(screen.x, screen.y, rect, viewport);

        expect(doc.x).toBeCloseTo(originalDocX, 10);
        expect(doc.y).toBeCloseTo(originalDocY, 10);
      });
    });
  });

  describe('cross-client consistency', () => {
    it('a point captured in one client projects onto the same board point in a client with different zoom, pan, and window size', () => {
      const boardPoint = { x: 500, y: 300 };

      const viewportA: Viewport = { zoom: 0.5, originationX: -400, originationY: -100 };
      const rectA = new DOMRect(0, 0, 1400, 900);

      const viewportB: Viewport = { zoom: 1.5, originationX: 350, originationY: 220 };
      const rectB = new DOMRect(60, 40, 900, 700);

      const clientA = {
        x: (boardPoint.x - viewportA.originationX) * viewportA.zoom + rectA.left,
        y: (boardPoint.y - viewportA.originationY) * viewportA.zoom + rectA.top,
      };

      const wire = screenToDocument(clientA.x, clientA.y, rectA, viewportA);
      expect(wire.x).toBeCloseTo(boardPoint.x, 10);
      expect(wire.y).toBeCloseTo(boardPoint.y, 10);

      const screenB = documentToScreen(wire.x, wire.y, viewportB);
      expect(screenB.x + rectB.left).toBeCloseTo(
        (boardPoint.x - viewportB.originationX) * viewportB.zoom + rectB.left,
        10
      );
      expect(screenB.y + rectB.top).toBeCloseTo(
        (boardPoint.y - viewportB.originationY) * viewportB.zoom + rectB.top,
        10
      );
    });
  });
});
