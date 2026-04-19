import type { PlaitElement } from '@plait/core';
import { idCreator } from '@plait/core';
import { createGeometryElement, BasicShapes } from '@plait/draw';
import {
  DEFAULT_STICKY_COLOR,
  STICKY_COLORS,
  STICKY_SUBTYPE,
  type StickyColorName,
} from '@/shared/constants';

const STICKY_TEXT_PADDING = 28;
const STICKY_LINE_HEIGHT = 22;
const STICKY_CHAR_WIDTH = 8;
const MIN_STICKY_SIZE = 130;
const MAX_STICKY_WIDTH = 280;

export function isStickyColorName(value: string): value is StickyColorName {
  return value in STICKY_COLORS;
}

export function estimateStickySize(text: string): {
  width: number;
  height: number;
} {
  if (!text) {
    return { width: MIN_STICKY_SIZE, height: MIN_STICKY_SIZE };
  }

  const lines = text.split(/\r?\n/);
  const longestLineLength = Math.max(...lines.map((line) => line.length), 1);

  const desiredContentWidth = Math.ceil(longestLineLength * STICKY_CHAR_WIDTH * 0.6);
  const width = Math.min(
    MAX_STICKY_WIDTH,
    Math.max(MIN_STICKY_SIZE, desiredContentWidth + STICKY_TEXT_PADDING),
  );

  const charsPerLine = Math.max(
    1,
    Math.floor((width - STICKY_TEXT_PADDING) / (STICKY_CHAR_WIDTH * 0.6)),
  );
  const wrappedLineCount = Math.max(
    1,
    lines.reduce(
      (count, line) => count + Math.max(1, Math.ceil(line.length / charsPerLine)),
      0,
    ),
  );
  const height = Math.max(
    MIN_STICKY_SIZE,
    wrappedLineCount * STICKY_LINE_HEIGHT + STICKY_TEXT_PADDING,
  );

  return { width, height };
}

export function createStickyNoteElement({
  points,
  text = '',
  color = DEFAULT_STICKY_COLOR,
  id = idCreator(),
}: {
  points: [[number, number], [number, number]];
  text?: string;
  color?: StickyColorName;
  id?: string;
}): PlaitElement {
  const palette = STICKY_COLORS[color];
  const textValue = {
    children: [{ text }],
    autoSize: true,
  };
  const element = createGeometryElement(
    BasicShapes.rectangle,
    points,
    textValue,
    {
      fill: palette.fill,
      strokeColor: palette.stroke,
      strokeWidth: 1,
    },
  );

  element.id = id;
  element.fillStyle = 'solid';
  element.subtype = STICKY_SUBTYPE;

  return element as unknown as PlaitElement;
}
