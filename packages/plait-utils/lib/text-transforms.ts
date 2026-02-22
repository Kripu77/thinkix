import { Transforms, PlaitBoard, getSelectedElements } from '@plait/core';
import type { PlaitElement } from '@plait/core';
import type { Element as SlateElement, BaseText } from 'slate';
import type { TextMarks } from '@thinkix/shared';
import { getTextAccessor, type TextAccessor } from './text-accessor';

export type { TextMarks } from '@thinkix/shared';

interface RichText extends BaseText {
  bold?: boolean;
  italic?: boolean;
  underlined?: boolean;
  strike?: boolean;
  color?: string;
  'font-size'?: string | number;
}

type MarkKey = 'bold' | 'italic' | 'underlined' | 'strike';

function isRichText(node: unknown): node is RichText {
  return (
    typeof node === 'object' &&
    node !== null &&
    'text' in node &&
    typeof (node as RichText).text === 'string'
  );
}

function addMark(text: SlateElement, mark: MarkKey, value: boolean): SlateElement {
  return {
    ...text,
    children: text.children.map((child) =>
      isRichText(child) ? { ...child, [mark]: value } : child
    ),
  };
}

function removeMark(text: SlateElement, mark: MarkKey): SlateElement {
  return {
    ...text,
    children: text.children.map((child) => {
      if (!isRichText(child)) return child;
      const { [mark]: omitted, ...rest } = child;
      void omitted;
      return rest;
    }),
  };
}

function getMarkValue(text: SlateElement, mark: MarkKey): boolean | undefined {
  for (const child of text.children) {
    if (isRichText(child) && child[mark] === true) return true;
    if (isRichText(child) && child[mark] === false) return false;
  }
  return undefined;
}

function withTextColors(text: SlateElement, color: string | null): SlateElement {
  return {
    ...text,
    children: text.children.map((child) => {
      if (!isRichText(child)) return child;
      if (color === null) {
        const { color: omitted, ...rest } = child;
        void omitted;
        return rest;
      }
      return { ...child, color };
    }),
  };
}

function withFontSize(text: SlateElement, fontSize: string | null): SlateElement {
  return {
    ...text,
    children: text.children.map((child) => {
      if (!isRichText(child)) return child;
      if (fontSize === null) {
        const { 'font-size': omitted, ...rest } = child;
        void omitted;
        return rest;
      }
      return { ...child, 'font-size': fontSize };
    }),
  };
}

function applyTextChange(
  board: PlaitBoard,
  elements: PlaitElement[],
  transform: (text: SlateElement, accessor: TextAccessor) => SlateElement
): void {
  elements.forEach((element) => {
    const accessor = getTextAccessor(board, element);
    if (!accessor) return;

    const text = accessor.get(element);
    if (!text) return;

    const newText = transform(text, accessor);
    const path = PlaitBoard.findPath(board, element);
    if (path) {
      accessor.set(board, element, path, newText, Transforms);
    }
  });
}

export function applyTextMark(
  board: PlaitBoard,
  mark: MarkKey,
  elements?: PlaitElement[]
): void {
  const targetElements = elements ?? getSelectedElements(board);
  applyTextChange(board, targetElements, (text, accessor) => {
    const element = targetElements.find((el) => accessor.get(el) === text);
    const currentValue = element ? getMarkValue(text, mark) : undefined;
    return currentValue ? removeMark(text, mark) : addMark(text, mark, true);
  });
}

export function applyTextColor(
  board: PlaitBoard,
  color: string | null,
  elements?: PlaitElement[]
): void {
  const targetElements = elements ?? getSelectedElements(board);
  applyTextChange(board, targetElements, (text) => withTextColors(text, color));
}

export function applyFontSize(
  board: PlaitBoard,
  fontSize: string,
  elements?: PlaitElement[]
): void {
  const targetElements = elements ?? getSelectedElements(board);
  applyTextChange(board, targetElements, (text) => withFontSize(text, fontSize));
}

export function getTextMarks(element: PlaitElement, board?: PlaitBoard): TextMarks {
  const defaultMarks: TextMarks = {
    bold: undefined,
    italic: undefined,
    underlined: undefined,
    strike: undefined,
    color: undefined,
    fontSize: undefined,
  };

  let text: SlateElement | null = null;
  
  if (board) {
    const accessor = getTextAccessor(board, element);
    text = accessor?.get(element) ?? null;
  } else {
    text = (element as { text?: SlateElement }).text ?? null;
  }

  if (!text?.children) return defaultMarks;

  const marks: TextMarks = { ...defaultMarks };

  for (const mark of ['bold', 'italic', 'underlined', 'strike'] as MarkKey[]) {
    marks[mark] = getMarkValue(text, mark);
  }

  for (const child of text.children) {
    if (isRichText(child)) {
      if (child.color) marks.color = child.color;
      if (child['font-size']) marks.fontSize = child['font-size'];
    }
  }

  return marks;
}
