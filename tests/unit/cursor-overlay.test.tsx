import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import type { PlaitBoard } from '@plait/core';
import type { CursorState } from '@thinkix/collaboration';

interface MockBoard {
  viewport: {
    zoom: number;
    offsetX: number;
    offsetY: number;
  };
}

describe('CursorOverlay', () => {
  const mockBoard: MockBoard = {
    viewport: {
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    },
  };

  const createCursorState = (overrides: Partial<CursorState> = {}): CursorState => ({
    connectionId: '1',
    documentX: 100,
    documentY: 200,
    userName: 'Test User',
    userColor: '#FF0000',
    lastUpdated: Date.now(),
    pointer: 'mouse',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const container = document.createElement('div');
    container.className = 'plait-board-container';
    container.appendChild(svg);
    document.body.appendChild(container);
    
    svg.getBoundingClientRect = () => new DOMRect(0, 0, 800, 600);
    
    vi.spyOn(document, 'querySelector').mockImplementation((selector) => {
      if (selector.includes('svg')) return svg;
      if (selector.includes('plait-board-container')) return container;
      return null;
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('returns null when no cursors', async () => {
      const { CursorOverlay } = await import('@thinkix/collaboration/components');
      const cursors = new Map<string, CursorState>();
      
      const { container } = render(
        createElement(CursorOverlay, {
          cursors,
          board: mockBoard as unknown as PlaitBoard,
        })
      );
      
      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('renders cursors when present', async () => {
      const cursors = new Map<string, CursorState>();
      cursors.set('1', createCursorState());
      
      const { CursorOverlay } = await import('@thinkix/collaboration/components');
      render(
        createElement(CursorOverlay, {
          cursors,
          board: mockBoard as unknown as PlaitBoard,
        })
      );
      
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeDefined();
      });
    });

    it('renders multiple cursors', async () => {
      const cursors = new Map<string, CursorState>();
      cursors.set('1', createCursorState({ userName: 'Alice', userColor: '#FF0000' }));
      cursors.set('2', createCursorState({ connectionId: '2', userName: 'Bob', userColor: '#00FF00' }));
      
      const { CursorOverlay } = await import('@thinkix/collaboration/components');
      render(
        createElement(CursorOverlay, {
          cursors,
          board: mockBoard as unknown as PlaitBoard,
        })
      );
      
      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeDefined();
        expect(screen.getByText('Bob')).toBeDefined();
      });
    });

    it('respects maxCursors limit', async () => {
      const cursors = new Map<string, CursorState>();
      for (let i = 0; i < 10; i++) {
        cursors.set(`${i}`, createCursorState({ 
          connectionId: `${i}`, 
          userName: `User ${i}` 
        }));
      }
      
      const { CursorOverlay } = await import('@thinkix/collaboration/components');
      render(
        createElement(CursorOverlay, {
          cursors,
          board: mockBoard as unknown as PlaitBoard,
          maxCursors: 3,
        })
      );
      
      await waitFor(() => {
        const renderedUsers = screen.getAllByText(/User \d/);
        expect(renderedUsers.length).toBeLessThanOrEqual(3);
      });
    });
  });

  describe('visibility', () => {
    it('filters out idle cursors', async () => {
      const oldCursor = createCursorState({
        lastUpdated: Date.now() - 60000,
      });
      
      const cursors = new Map<string, CursorState>();
      cursors.set('1', oldCursor);
      
      const { CursorOverlay } = await import('@thinkix/collaboration/components');
      const { container } = render(
        createElement(CursorOverlay, {
          cursors,
          board: mockBoard as unknown as PlaitBoard,
          idleTimeoutMs: 30000,
        })
      );
      
      await waitFor(() => {
        expect(container.querySelector('[class*="pointer-events-none"]')?.children.length ?? 0).toBe(0);
      });
    });
  });

  describe('null board handling', () => {
    it('handles null board gracefully', async () => {
      const cursors = new Map<string, CursorState>();
      cursors.set('1', createCursorState());
      
      const { CursorOverlay } = await import('@thinkix/collaboration/components');
      const { container } = render(
        createElement(CursorOverlay, {
          cursors,
          board: null,
        })
      );
      
      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });
});
