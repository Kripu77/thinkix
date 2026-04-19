import type { PlaitElement } from '@plait/core';
import {
  getBoardInkColors,
  getBoardFillColors,
  LIGHT_BOARD_INK,
  DARK_BOARD_INK,
  LIGHT_BOARD_FILLS,
  DARK_BOARD_FILLS,
  STARRY_BOARD_FILLS,
  type BoardThemeMode,
} from '@thinkix/shared';
import { getThinkixMindRootFill, isThinkixMindRootFill } from './mind-theme';

type RichTextLeaf = {
  text?: string;
  color?: string;
  [key: string]: unknown;
};

type SlateTextValue = {
  children?: RichTextLeaf[];
  [key: string]: unknown;
};

type ArrowTextValue = {
  text?: SlateTextValue;
  [key: string]: unknown;
};

type ThemeSyncElement = PlaitElement & {
  strokeColor?: string;
  color?: string;
  fill?: string;
  shape?: string;
  isRoot?: boolean;
  text?: SlateTextValue;
  texts?: ArrowTextValue[];
  children?: PlaitElement[];
  data?: {
    topic?: SlateTextValue;
    [key: string]: unknown;
  };
};

function normalizeColorToken(color: string): string {
  const value = color.trim().toLowerCase();

  if (value === '#000') {
    return '#000000';
  }

  if (value === '#fff') {
    return '#ffffff';
  }

  const rgbMatch = value.match(
    /^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(?:[\s,\/]+([01]?(?:\.\d+)?))?\s*\)$/,
  );
  if (rgbMatch) {
    const [, r, g, b, alpha] = rgbMatch;
    if (alpha && Number(alpha) === 0) {
      return value;
    }

    const toHex = (channel: string) =>
      Number(channel).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  return value;
}

function parseRgb(color: string): { r: number; g: number; b: number; a: number } | null {
  const value = color.trim().toLowerCase();

  const shortHex = value.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  if (shortHex) {
    const [, r, g, b] = shortHex;
    return {
      r: parseInt(r + r, 16),
      g: parseInt(g + g, 16),
      b: parseInt(b + b, 16),
      a: 1,
    };
  }

  const longHex = value.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/);
  if (longHex) {
    const [, r, g, b] = longHex;
    return { r: parseInt(r, 16), g: parseInt(g, 16), b: parseInt(b, 16), a: 1 };
  }

  const rgbMatch = value.match(
    /^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(?:[\s,\/]+([01]?(?:\.\d+)?))?\s*\)$/,
  );
  if (rgbMatch) {
    const [, r, g, b, alpha] = rgbMatch;
    return {
      r: Number(r),
      g: Number(g),
      b: Number(b),
      a: alpha === undefined ? 1 : Number(alpha),
    };
  }

  return null;
}

function relativeLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function isLightFill(fill: string): boolean {
  const rgb = parseRgb(fill);
  if (!rgb || rgb.a === 0) {
    return false;
  }
  const luminance =
    0.2126 * relativeLuminance(rgb.r) +
    0.7152 * relativeLuminance(rgb.g) +
    0.0722 * relativeLuminance(rgb.b);
  return luminance > 0.5;
}

function hasOpaqueFill(fill: string | undefined): fill is string {
  if (typeof fill !== 'string') {
    return false;
  }
  const rgb = parseRgb(fill);
  return !!rgb && rgb.a > 0;
}

function resolveTextInkForFill(
  effectiveFill: string | undefined,
  theme: BoardThemeMode,
): string {
  if (hasOpaqueFill(effectiveFill)) {
    return isLightFill(effectiveFill) ? LIGHT_BOARD_INK.text : DARK_BOARD_INK.text;
  }
  return getBoardInkColors(theme).text;
}

function remapDefaultInk(color: string, theme: BoardThemeMode, kind: 'stroke' | 'text') {
  const normalized = normalizeColorToken(color);
  const lightValue = kind === 'stroke' ? LIGHT_BOARD_INK.stroke : LIGHT_BOARD_INK.text;
  const darkValue = kind === 'stroke' ? DARK_BOARD_INK.stroke : DARK_BOARD_INK.text;
  const target = getBoardInkColors(theme)[kind];

  if (normalized === lightValue || normalized === darkValue) {
    return target;
  }

  return color;
}

function remapDefaultFill(fill: string, theme: BoardThemeMode) {
  const normalized = normalizeColorToken(fill);
  const target = getBoardFillColors(theme);

  switch (normalized) {
    case LIGHT_BOARD_FILLS.surface:
    case DARK_BOARD_FILLS.surface:
    case STARRY_BOARD_FILLS.surface:
      return target.surface;
    case LIGHT_BOARD_FILLS.mutedSurface:
    case DARK_BOARD_FILLS.mutedSurface:
    case STARRY_BOARD_FILLS.mutedSurface:
      return target.mutedSurface;
    case LIGHT_BOARD_FILLS.accentSurface:
    case DARK_BOARD_FILLS.accentSurface:
    case STARRY_BOARD_FILLS.accentSurface:
      return target.accentSurface;
    case LIGHT_BOARD_FILLS.noteSurface:
    case DARK_BOARD_FILLS.noteSurface:
    case STARRY_BOARD_FILLS.noteSurface:
      return target.noteSurface;
    default:
      return fill;
  }
}

function isRootMindElement(element: ThemeSyncElement): boolean {
  return element.type === 'mindmap' && element.isRoot === true;
}

function syncSlateTextValue(
  text: SlateTextValue | undefined,
  theme: BoardThemeMode,
  effectiveFill?: string,
) {
  if (!text || !Array.isArray(text.children)) {
    return text;
  }

  let changed = false;
  const targetTextColor = resolveTextInkForFill(effectiveFill, theme);
  const nextChildren = text.children.map((child) => {
    if (!child || typeof child !== 'object' || typeof child.text !== 'string') {
      return child;
    }

    if (!child.color) {
      if (targetTextColor === LIGHT_BOARD_INK.text && !hasOpaqueFill(effectiveFill)) {
        return child;
      }

      changed = true;
      return { ...child, color: targetTextColor };
    }

    const normalized = normalizeColorToken(child.color);
    if (normalized !== LIGHT_BOARD_INK.text && normalized !== DARK_BOARD_INK.text) {
      return child;
    }

    if (normalized === targetTextColor) {
      return child;
    }

    changed = true;
    return { ...child, color: targetTextColor };
  });

  return changed ? { ...text, children: nextChildren } : text;
}

function syncElementForBoardTheme(
  element: ThemeSyncElement,
  theme: BoardThemeMode,
): ThemeSyncElement {
  let changed = false;
  const next: ThemeSyncElement = { ...element };
  const targetInk = getBoardInkColors(theme);
  const targetRootFill = isRootMindElement(element) ? getThinkixMindRootFill(theme) : null;

  if (typeof element.strokeColor === 'string') {
    const strokeColor = remapDefaultInk(element.strokeColor, theme, 'stroke');
    if (strokeColor !== element.strokeColor) {
      next.strokeColor = strokeColor;
      changed = true;
    }
  } else if (
    (element.type === 'geometry' && element.shape !== 'text') ||
    element.type === 'arrow' ||
    element.type === 'line'
  ) {
    next.strokeColor = targetInk.stroke;
    changed = true;
  }

  let effectiveFill: string | undefined;
  if (targetRootFill && (typeof element.fill !== 'string' || isThinkixMindRootFill(element.fill))) {
    effectiveFill = targetRootFill;
    if (element.fill !== targetRootFill) {
      next.fill = targetRootFill;
      changed = true;
    }
  } else if (typeof element.fill === 'string') {
    const fill = remapDefaultFill(element.fill, theme);
    effectiveFill = fill;
    if (fill !== element.fill) {
      next.fill = fill;
      changed = true;
    }
  }

  if (typeof element.color === 'string') {
    const color = remapDefaultInk(element.color, theme, 'text');
    if (color !== element.color) {
      next.color = color;
      changed = true;
    }
  } else if (targetInk.text !== LIGHT_BOARD_INK.text && element.type === 'text') {
    next.color = targetInk.text;
    changed = true;
  }

  const text = syncSlateTextValue(element.text, theme, effectiveFill);
  if (text !== element.text) {
    next.text = text;
    changed = true;
  }

  const topic = syncSlateTextValue(element.data?.topic, theme, effectiveFill);
  if (element.data && topic !== element.data.topic) {
    next.data = { ...element.data, topic };
    changed = true;
  }

  if (Array.isArray(element.texts)) {
    let textListChanged = false;
    const texts = element.texts.map((arrowText) => {
      const syncedText = syncSlateTextValue(arrowText.text, theme);
      if (syncedText === arrowText.text) {
        return arrowText;
      }

      textListChanged = true;
      return { ...arrowText, text: syncedText };
    });

    if (textListChanged) {
      next.texts = texts;
      changed = true;
    }
  }

  if (Array.isArray(element.children) && element.children.length > 0) {
    const children = syncElementsForBoardTheme(element.children, theme);
    if (children !== element.children) {
      next.children = children;
      changed = true;
    }
  }

  return changed ? next : element;
}

export function syncElementsForBoardTheme(
  elements: PlaitElement[],
  theme: BoardThemeMode,
): PlaitElement[] {
  let changed = false;

  const nextElements = elements.map((element) => {
    const synced = syncElementForBoardTheme(element as ThemeSyncElement, theme);
    if (synced !== element) {
      changed = true;
    }
    return synced;
  });

  return changed ? nextElements : elements;
}
