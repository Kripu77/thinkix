import { describe, it, expect, vi } from 'vitest';
import type { PlaitBoard } from '@plait/core';
import {
  enhanceSvgWithBoardBackground,
  getBackgroundColor,
  getSvgFrame,
} from '@thinkix/file-utils';

describe('getBackgroundColor', () => {
  it('should return white background for blank grid type in light theme', () => {
    const mockGetGridConfig = vi.fn().mockReturnValue({ type: 'blank' });
    const board = {
      theme: { themeColorMode: 'light' },
      getGridConfig: mockGetGridConfig,
    } as unknown as PlaitBoard;
    expect(getBackgroundColor(board)).toBe('#ffffff');
  });

  it('should return blueprint background for blueprint grid type', () => {
    const mockGetGridConfig = vi.fn().mockReturnValue({ type: 'blueprint' });
    const board = {
      theme: { themeColorMode: 'light' },
      getGridConfig: mockGetGridConfig,
    } as unknown as PlaitBoard;
    expect(getBackgroundColor(board)).toBe('#e8f4fc');
  });

  it('should return ruled background for ruled grid type', () => {
    const mockGetGridConfig = vi.fn().mockReturnValue({ type: 'ruled' });
    const board = {
      theme: { themeColorMode: 'light' },
      getGridConfig: mockGetGridConfig,
    } as unknown as PlaitBoard;
    expect(getBackgroundColor(board)).toBe('#f8f8f5');
  });

  it('should return dark ruled background for dark theme', () => {
    const mockGetGridConfig = vi.fn().mockReturnValue({ type: 'ruled' });
    const board = {
      theme: { themeColorMode: 'dark' },
      getGridConfig: mockGetGridConfig,
    } as unknown as PlaitBoard;
    expect(getBackgroundColor(board)).toBe('#18181b');
  });

  it('should return starry ruled background for starry theme', () => {
    const mockGetGridConfig = vi.fn().mockReturnValue({ type: 'ruled' });
    const board = {
      theme: { themeColorMode: 'starry' },
      getGridConfig: mockGetGridConfig,
    } as unknown as PlaitBoard;
    expect(getBackgroundColor(board)).toBe('#10293d');
  });

  it('should return white background for dot grid type in light theme', () => {
    const mockGetGridConfig = vi.fn().mockReturnValue({ type: 'dot' });
    const board = {
      theme: { themeColorMode: 'light' },
      getGridConfig: mockGetGridConfig,
    } as unknown as PlaitBoard;
    expect(getBackgroundColor(board)).toBe('#ffffff');
  });

  it('should return white background for square grid type in light theme', () => {
    const mockGetGridConfig = vi.fn().mockReturnValue({ type: 'square' });
    const board = {
      theme: { themeColorMode: 'light' },
      getGridConfig: mockGetGridConfig,
    } as unknown as PlaitBoard;
    expect(getBackgroundColor(board)).toBe('#ffffff');
  });

  it('should return white background for isometric grid type in light theme', () => {
    const mockGetGridConfig = vi.fn().mockReturnValue({ type: 'isometric' });
    const board = {
      theme: { themeColorMode: 'light' },
      getGridConfig: mockGetGridConfig,
    } as unknown as PlaitBoard;
    expect(getBackgroundColor(board)).toBe('#ffffff');
  });

  it('should return dark background for blank with dark theme', () => {
    const mockGetGridConfig = vi.fn().mockReturnValue({ type: 'blank' });
    const board = {
      theme: { themeColorMode: 'dark' },
      getGridConfig: mockGetGridConfig,
    } as unknown as PlaitBoard;
    expect(getBackgroundColor(board)).toBe('#1a1a1a');
  });

  it('should return dark blueprint background for blueprint with dark theme', () => {
    const mockGetGridConfig = vi.fn().mockReturnValue({ type: 'blueprint' });
    const board = {
      theme: { themeColorMode: 'dark' },
      getGridConfig: mockGetGridConfig,
    } as unknown as PlaitBoard;
    expect(getBackgroundColor(board)).toBe('#1a2a3a');
  });

  it('should return soft background for soft theme', () => {
    const mockGetGridConfig = vi.fn().mockReturnValue({ type: 'blank' });
    const board = {
      theme: { themeColorMode: 'soft' },
      getGridConfig: mockGetGridConfig,
    } as unknown as PlaitBoard;
    expect(getBackgroundColor(board)).toBe('#f5f5f5');
  });

  it('should return retro background for retro theme', () => {
    const mockGetGridConfig = vi.fn().mockReturnValue({ type: 'blank' });
    const board = {
      theme: { themeColorMode: 'retro' },
      getGridConfig: mockGetGridConfig,
    } as unknown as PlaitBoard;
    expect(getBackgroundColor(board)).toBe('#f9f8ed');
  });

  it('should return starry background for starry theme', () => {
    const mockGetGridConfig = vi.fn().mockReturnValue({ type: 'blank' });
    const board = {
      theme: { themeColorMode: 'starry' },
      getGridConfig: mockGetGridConfig,
    } as unknown as PlaitBoard;
    expect(getBackgroundColor(board)).toBe('#0d2537');
  });
});

describe('enhanceSvgWithBoardBackground', () => {
  const svg = '<svg width="100" height="80" viewBox="-20,-20,140,120"><g data-board-content="true" /></svg>';

  it('parses Plait export SVG dimensions', () => {
    expect(getSvgFrame(svg)).toEqual({
      x: -20,
      y: -20,
      width: 140,
      height: 120,
      rasterWidth: 100,
      rasterHeight: 80,
    });
  });

  it('injects line grid markup before exported board content', () => {
    const board = {
      theme: { themeColorMode: 'light' },
      getGridConfig: vi.fn().mockReturnValue({ type: 'square', density: 24, showMajor: true }),
    } as unknown as PlaitBoard;

    const result = enhanceSvgWithBoardBackground(svg, board, true);

    expect(result).toContain('data-thinkix-export-background-layer="true"');
    expect(result).toContain('data-thinkix-export-background="true"');
    expect(result).toContain('<pattern id="thinkix-export-grid-square-minor"');
    expect(result).toContain('<pattern id="thinkix-export-grid-square-major"');
    expect(result.indexOf('data-thinkix-export-background-layer')).toBeLessThan(
      result.indexOf('data-board-content'),
    );
  });

  it('exports dots without forcing a flat background when transparent', () => {
    const board = {
      theme: { themeColorMode: 'light' },
      getGridConfig: vi.fn().mockReturnValue({ type: 'dot', density: 16, showMajor: false }),
    } as unknown as PlaitBoard;

    const result = enhanceSvgWithBoardBackground(svg, board, false);

    expect(result).toContain('<circle');
    expect(result).toContain('data-thinkix-export-grid-fill="true"');
    expect(result).not.toContain('data-thinkix-export-background="true"');
  });
});
