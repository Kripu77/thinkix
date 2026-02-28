export type GridType = 'dot' | 'square' | 'blueprint' | 'isometric' | 'ruled' | 'blank';

export type GridDensity = 8 | 12 | 16 | 24 | 32 | 48;

export interface BoardBackground {
  type: GridType;
  density: GridDensity;
  showMajor: boolean;
}

export const GRID_BACKGROUND_COLORS = {
  light: '#ffffff',
  dark: '#1a1a1a',
  blueprint: {
    light: '#e8f4fc',
    dark: '#1a2a3a',
  },
  ruled: '#f8f8f5',
} as const;
