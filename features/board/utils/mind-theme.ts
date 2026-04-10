import {
  MindThemeColors,
  type MindThemeColor,
} from '@plait/mind';
import {
  LIGHT_BOARD_INK,
  DARK_BOARD_INK,
  type BoardThemeMode,
} from '@thinkix/shared';

const ROOT_THEME_OVERRIDES: Record<BoardThemeMode, { fill: string; text: string }> = {
  default: {
    fill: '#f5f5f5',
    text: LIGHT_BOARD_INK.text,
  },
  dark: {
    fill: '#1f2937',
    text: DARK_BOARD_INK.text,
  },
  soft: {
    fill: '#ffffff',
    text: LIGHT_BOARD_INK.text,
  },
  retro: {
    fill: '#153d5d',
    text: '#ffffff',
  },
  starry: {
    fill: '#17344b',
    text: DARK_BOARD_INK.text,
  },
  colorful: {
    fill: '#e0f7ff',
    text: '#0f172a',
  },
};

const KNOWN_ROOT_FILLS = new Set(
  Object.values(ROOT_THEME_OVERRIDES).map((theme) => theme.fill.toLowerCase()),
);

export function getThinkixMindRootFill(theme: BoardThemeMode): string {
  return ROOT_THEME_OVERRIDES[theme].fill;
}

export function isThinkixMindRootFill(fill: string): boolean {
  return KNOWN_ROOT_FILLS.has(fill.trim().toLowerCase());
}

export const THINKIX_MIND_THEME_COLORS: MindThemeColor[] = MindThemeColors.map((themeColor) => {
  const mode = themeColor.mode as BoardThemeMode;
  const override = ROOT_THEME_OVERRIDES[mode] ?? ROOT_THEME_OVERRIDES.default;

  return {
    ...themeColor,
    rootFill: override.fill,
    rootTextColor: override.text,
  };
});
