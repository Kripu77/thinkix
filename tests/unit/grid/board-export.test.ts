import { describe, it, expect, vi } from 'vitest';
import type { PlaitBoard } from '@plait/core';
import { getBackgroundColor } from '@thinkix/file-utils';

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
});
