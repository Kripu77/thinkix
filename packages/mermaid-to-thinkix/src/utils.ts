import type { MermaidContainerStyle, MermaidLabelStyle } from './types';

export function decodeEntities(text: string): string {
  return text
    .replace(/°°/g, '#')
    .replace(/°/g, '&')
    .replace(/¶ß/g, ';')
    .replace(/¶/g, ';');
}

export function entityCodesToText(input: string): string {
  const text = decodeEntities(input);

  const withDecimalCode = text
    .replace(/#(\d+);/g, '&#$1;')
    .replace(/#([a-z]+);/g, '&$1;');

  const textarea = typeof document !== 'undefined' ? document.createElement('textarea') : null;
  if (textarea) {
    textarea.innerHTML = withDecimalCode;
    return textarea.value;
  }

  return withDecimalCode
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/gi, (_, name) => {
      const map: Record<string, string> = {
        'amp': '&',
        'lt': '<',
        'gt': '>',
        'quot': '"',
        'apos': "'",
      };
      return map[name] || `&${name};`;
    });
}

export function removeMarkdown(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, '');
}

export function removeFontAwesomeIcons(text: string): string {
  return text.replace(/\s?(fa|fab):[a-zA-Z0-9-]+/g, '').trim();
}

export function normalizeText(text: string): string {
  if (!text) return '';

  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\\n/g, '\n')
    .replace(/<\/?(sub|small|i)>/gi, '')
    .trim();
}

export function cleanText(text: string, labelType?: 'markdown' | 'text'): string {
  let cleaned = text;

  if (labelType === 'markdown') {
    cleaned = removeMarkdown(cleaned);
  }

  cleaned = normalizeText(cleaned);
  cleaned = removeFontAwesomeIcons(cleaned);

  return cleaned;
}

export function parseStyleString(styleText: string | null | undefined): Record<string, string> {
  const styles: Record<string, string> = {};

  if (!styleText) return styles;

  styleText.split(';').forEach((property) => {
    const trimmed = property.trim();
    if (!trimmed) return;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) return;

    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();
    styles[key] = value;
  });

  return styles;
}

export function convertContainerStyle(
  style: MermaidContainerStyle
): Record<string, string | number> {
  const result: Record<string, string | number> = {};

  if (style.fill) {
    result.fill = style.fill;
  }

  if (style.stroke) {
    result.strokeColor = style.stroke;
  }

  if (style.strokeWidth) {
    const numeric = parseFloat(style.strokeWidth);
    if (!isNaN(numeric)) {
      result.strokeWidth = numeric;
    }
  }

  if (style.strokeDasharray) {
    result.strokeStyle = 'dashed';
  }

  return result;
}

export function convertLabelStyle(
  style: MermaidLabelStyle
): Record<string, string> {
  const result: Record<string, string> = {};

  if (style.color) {
    result.color = style.color;
  }

  return result;
}

export function isValidMermaidDefinition(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;

  const validStarters = [
    'flowchart',
    'graph',
    'sequencediagram',
    'classdiagram',
    'statediagram',
    'erdiagram',
    'gitgraph',
    'pie',
    'gantt',
    'journey',
    'mindmap',
    'timeline',
    'sankey',
    'block',
    'architecture',
  ];

  const firstLine = trimmed.split('\n')[0].toLowerCase().trim();
  return validStarters.some((starter) => firstLine.startsWith(starter));
}

let idCounter = 0;
export function generateId(prefix: string = 'mtt'): string {
  return `${prefix}-${++idCounter}`;
}

export function safeNumber(value: unknown, defaultValue: number): number {
  const num = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN;
  return isNaN(num) ? defaultValue : num;
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export interface TransformResult {
  transformX: number;
  transformY: number;
}

export function getTransformAttr(element: SVGElement): TransformResult {
  const transform = element.getAttribute('transform');
  const match = transform?.match(/translate\(([ \d.-]+),\s*([\d.-]+)\)/);

  return {
    transformX: match ? Number(match[1]) : 0,
    transformY: match ? Number(match[2]) : 0,
  };
}
      
export function encodeEntities(text: string): string {
  let txt = text;

  txt = txt.replace(/style[^;]*;\s*/g, (s) => {
    return s.replace(/#[a-fA-F0-9]+(?=[;,]|$)/g, '#');
  });
  txt = txt.replace(/classDef[^;]*;\s*/g, (s) => {
    return s.replace(/#[a-fA-F0-9]+(?=[;,]|$)/g, '#');
  });

  txt = txt.replace(/#(\d+);/g, '°°$1¶ß');

  return txt;
}
