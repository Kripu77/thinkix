import {
  type PlaitBoard,
  type PlaitElement,
  type RectangleClient,
  getBoundingRectangleByElements,
  WritableClipboardOperationType,
} from '@plait/core';

const INSERTION_PADDING = 100;

export function getSafeInsertPosition(
  board: PlaitBoard,
  newElements: PlaitElement[],
  padding: number = INSERTION_PADDING
): [number, number] {
  const existingElements = board.children;

  if (existingElements.length === 0) {
    return [0, 0];
  }

  let existingBounds: RectangleClient | null = null;
  let newBounds: RectangleClient | null = null;

  try {
    existingBounds = getBoundingRectangleByElements(board, existingElements, true);
    newBounds = getBoundingRectangleByElements(board, newElements, true);
  } catch {
    return [0, 0];
  }

  if (!existingBounds || !newBounds) {
    return [0, 0];
  }

  const newX = existingBounds.x + existingBounds.width + padding;

  return [newX, existingBounds.y];
}

export function insertElementsSafely(
  board: PlaitBoard,
  elements: PlaitElement[],
  position?: [number, number]
): void {
  if (!elements.length) return;

  const insertPosition = position ?? getSafeInsertPosition(board, elements);
  const [x, y] = insertPosition;

  board.insertFragment(
    { elements: JSON.parse(JSON.stringify(elements)) },
    [x, y],
    WritableClipboardOperationType.paste
  );
}
