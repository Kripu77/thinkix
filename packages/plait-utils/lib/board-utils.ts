import { getSelectedElements, type PlaitBoard, type PlaitElement } from '@plait/core';

export function getSelectedMindElements(board: PlaitBoard): PlaitElement[] {
  const selected = getSelectedElements(board);
  return selected;
}

export function getCanvasContext(board: PlaitBoard): string {
  const elements = board.children;
  const selected = getSelectedElements(board);

  return JSON.stringify({
    elements,
    selected: selected.map((e) => e.id),
    viewport: board.viewport,
  }, null, 2);
}

export function findElementById(board: PlaitBoard, id: string): PlaitElement | null {
  return board.children.find((e) => e.id === id) || null;
}

export { getSelectedElements } from '@plait/core';
