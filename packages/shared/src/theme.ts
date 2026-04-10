import { GRID_BACKGROUND_COLORS, type GridType } from './types';

export type BoardThemeMode =
  | 'default'
  | 'dark'
  | 'soft'
  | 'retro'
  | 'starry'
  | 'colorful';

export interface GridThemeColors {
  primary: string;
  secondary: string;
  major: string;
  background: string;
}

export interface BoardThemeOption {
  value: BoardThemeMode;
  label: string;
  swatchClassName: string;
}

export interface BoardInkColors {
  stroke: string;
  text: string;
}

export interface BoardFillColors {
  surface: string;
  mutedSurface: string;
  accentSurface: string;
  noteSurface: string;
}

export const DEFAULT_BOARD_THEME_MODE: BoardThemeMode = 'default';
export const LIGHT_BOARD_INK: BoardInkColors = {
  stroke: '#000000',
  text: '#000000',
};
export const DARK_BOARD_INK: BoardInkColors = {
  stroke: '#e5e7eb',
  text: '#f8fafc',
};
export const LIGHT_BOARD_FILLS: BoardFillColors = {
  surface: '#ffffff',
  mutedSurface: '#f0f0f0',
  accentSurface: '#ececff',
  noteSurface: '#ffffde',
};
export const DARK_BOARD_FILLS: BoardFillColors = {
  surface: '#1f2937',
  mutedSurface: '#262b33',
  accentSurface: '#1c2742',
  noteSurface: '#3b3320',
};
export const STARRY_BOARD_FILLS: BoardFillColors = {
  surface: '#17344b',
  mutedSurface: '#1b3a4f',
  accentSurface: '#1f3f60',
  noteSurface: '#3d3520',
};

export const BOARD_THEME_OPTIONS: BoardThemeOption[] = [
  {
    value: 'default',
    label: 'Light',
    swatchClassName: 'bg-white border-zinc-300',
  },
  {
    value: 'dark',
    label: 'Dark',
    swatchClassName: 'bg-zinc-950 border-zinc-700',
  },
  {
    value: 'soft',
    label: 'Soft',
    swatchClassName: 'bg-stone-100 border-stone-300',
  },
  {
    value: 'retro',
    label: 'Retro',
    swatchClassName: 'bg-amber-50 border-amber-300',
  },
  {
    value: 'starry',
    label: 'Starry',
    swatchClassName: 'bg-slate-950 border-sky-700',
  },
  {
    value: 'colorful',
    label: 'Colorful',
    swatchClassName: 'bg-cyan-50 border-cyan-300',
  },
];

export function isBoardThemeMode(value: unknown): value is BoardThemeMode {
  return BOARD_THEME_OPTIONS.some((theme) => theme.value === value);
}

export function getBoardThemeMode(
  theme?: { themeColorMode?: unknown } | null,
): BoardThemeMode {
  const themeColorMode = theme?.themeColorMode;
  return isBoardThemeMode(themeColorMode) ? themeColorMode : DEFAULT_BOARD_THEME_MODE;
}

export function isDarkBoardTheme(theme: BoardThemeMode): boolean {
  return theme === 'dark' || theme === 'starry';
}

export function getBoardInkColors(theme: BoardThemeMode): BoardInkColors {
  return isDarkBoardTheme(theme) ? DARK_BOARD_INK : LIGHT_BOARD_INK;
}

export function getBoardFillColors(theme: BoardThemeMode): BoardFillColors {
  if (theme === 'starry') {
    return STARRY_BOARD_FILLS;
  }

  return isDarkBoardTheme(theme) ? DARK_BOARD_FILLS : LIGHT_BOARD_FILLS;
}

export function getGridThemeColors(theme: BoardThemeMode): GridThemeColors {
  switch (theme) {
    case 'dark':
      return {
        primary: '#404040',
        secondary: '#333333',
        major: '#555555',
        background: GRID_BACKGROUND_COLORS.dark,
      };
    case 'soft':
      return {
        primary: '#c8c8c8',
        secondary: '#d8d8d8',
        major: '#a0a0a0',
        background: '#f5f5f5',
      };
    case 'retro':
      return {
        primary: '#c4b998',
        secondary: '#d4ccb8',
        major: '#a09070',
        background: '#f9f8ed',
      };
    case 'starry':
      return {
        primary: '#2a4a5d',
        secondary: '#1a3a4d',
        major: '#3a6a8d',
        background: '#0d2537',
      };
    case 'colorful':
      return {
        primary: '#a0d0e0',
        secondary: '#c0e0f0',
        major: '#70b0c8',
        background: GRID_BACKGROUND_COLORS.light,
      };
    case 'default':
    default:
      return {
        primary: '#d0d0d0',
        secondary: '#e8e8e8',
        major: '#a0a0a0',
        background: GRID_BACKGROUND_COLORS.light,
      };
  }
}

export function getBlueprintColors(theme: BoardThemeMode): GridThemeColors {
  switch (theme) {
    case 'dark':
    case 'starry':
      return {
        primary: '#3a6080',
        secondary: '#2a4a60',
        major: '#4a80a0',
        background: GRID_BACKGROUND_COLORS.blueprint.dark,
      };
    default:
      return {
        primary: '#a8c8d8',
        secondary: '#c8e0f0',
        major: '#7aa8c0',
        background: GRID_BACKGROUND_COLORS.blueprint.light,
      };
  }
}

export function getRuledColors(theme: BoardThemeMode): GridThemeColors {
  switch (theme) {
    case 'dark':
      return {
        primary: '#3b4048',
        secondary: '#5b6575',
        major: '#4b5563',
        background: '#18181b',
      };
    case 'starry':
      return {
        primary: '#34566e',
        secondary: '#547993',
        major: '#456983',
        background: '#10293d',
      };
    case 'soft':
      return {
        primary: '#cdc8bf',
        secondary: '#d9d4cc',
        major: '#bbb3a8',
        background: '#f6f3ef',
      };
    case 'retro':
      return {
        primary: '#cec39f',
        secondary: '#d9cfb1',
        major: '#b8a679',
        background: '#f7f1de',
      };
    case 'colorful':
      return {
        primary: '#c5d7ea',
        secondary: '#d6e5f5',
        major: '#9cb7cf',
        background: '#f7fbff',
      };
    case 'default':
    default:
      return {
        primary: '#d4d1ca',
        secondary: '#dfdcd6',
        major: '#bcb6aa',
        background: GRID_BACKGROUND_COLORS.ruled,
      };
  }
}

export function getBoardBackgroundColor(
  gridType: GridType,
  theme: BoardThemeMode,
): string {
  if (gridType === 'blueprint') {
    return getBlueprintColors(theme).background;
  }

  if (gridType === 'ruled') {
    return getRuledColors(theme).background;
  }

  return getGridThemeColors(theme).background;
}

export function rgba(hex: string, alpha: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
