import {
  getSelectedElements,
  PlaitBoard,
  Point,
  throttleRAF,
  toViewBoxPoint,
  Transforms,
} from '@plait/core';
import { MindElement } from '@plait/mind';

const HANDLE_CLASS = 'mind-resize-handle';
const MIN_SIZE = 40;
const HANDLE_SIZE = 8;

type HandlePosition = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface ResizeState {
  element: MindElement;
  handle: HandlePosition;
  initialRect: { x: number; y: number; width: number; height: number };
  startPoint: Point;
}

const RESIZE_STATES = new WeakMap<PlaitBoard, ResizeState>();
const SVG_NS = 'http://www.w3.org/2000/svg';

function getState(board: PlaitBoard): ResizeState | undefined {
  return RESIZE_STATES.get(board);
}

function setState(board: PlaitBoard, state: ResizeState | undefined): void {
  if (state) {
    RESIZE_STATES.set(board, state);
  } else {
    RESIZE_STATES.delete(board);
  }
}

function getHandleFromEvent(event: MouseEvent): HandlePosition | null {
  const target = event.target as HTMLElement;
  const index = target?.dataset.index;
  return index !== undefined ? parseInt(index, 10) as HandlePosition : null;
}

function getHandlePositions(rect: {
  x: number;
  y: number;
  width: number;
  height: number;
}): Array<{ x: number; y: number }> {
  const { x, y, width, height } = rect;
  return [
    { x: x, y: y },
    { x: x + width / 2, y: y },
    { x: x + width, y: y },
    { x: x + width, y: y + height / 2 },
    { x: x + width, y: y + height },
    { x: x + width / 2, y: y + height },
    { x: x, y: y + height },
    { x: x, y: y + height / 2 },
  ];
}

function getElementRectangle(board: PlaitBoard, element: MindElement): { x: number; y: number; width: number; height: number } | null {
  const path = PlaitBoard.findPath(board, element);
  if (!path) return null;

  const g = document.querySelector(`[data-node-key="${path.join(',')}"]`);
  if (!g) return null;

  const mindRect = g.querySelector('.mind-node-rect');
  if (mindRect instanceof SVGRectElement) {
    return {
      x: parseFloat(mindRect.getAttribute('x') || '0'),
      y: parseFloat(mindRect.getAttribute('y') || '0'),
      width: parseFloat(mindRect.getAttribute('width') || '0'),
      height: parseFloat(mindRect.getAttribute('height') || '0'),
    };
  }

  return null;
}

function addHandle(
  svg: SVGSVGElement,
  index: HandlePosition,
  rect: { x: number; y: number; width: number; height: number }
): SVGRectElement {
  const positions = getHandlePositions(rect);
  const pos = positions[index];

  const handle = document.createElementNS(SVG_NS, 'rect');
  handle.setAttribute('x', String(pos.x - HANDLE_SIZE));
  handle.setAttribute('y', String(pos.y - HANDLE_SIZE));
  handle.setAttribute('width', String(HANDLE_SIZE * 2));
  handle.setAttribute('height', String(HANDLE_SIZE * 2));
  handle.setAttribute('fill', '#6366f1');
  handle.setAttribute('stroke', 'white');
  handle.setAttribute('stroke-width', '2');
  handle.setAttribute('class', HANDLE_CLASS);
  handle.setAttribute('data-index', String(index));

  const cursors = ['nw-resize', 'n-resize', 'ne-resize', 'e-resize', 'se-resize', 's-resize', 'sw-resize', 'w-resize'];
  handle.style.cursor = cursors[index];
  handle.style.pointerEvents = 'all';

  svg.appendChild(handle);
  return handle;
}

function clearHandles(): void {
  document.querySelectorAll(`.${HANDLE_CLASS}`).forEach((h) => h.remove());
}

function updateHandles(board: PlaitBoard): void {
  clearHandles();

  const selected = getSelectedElements(board).filter((e) =>
    MindElement.isMindElement(board, e)
  ) as MindElement[];

  if (selected.length !== 1) return;

  const element = selected[0];
  const rect = getElementRectangle(board, element);
  const svg = document.querySelector('.board-active-svg') as SVGSVGElement;

  if (!svg || !rect) return;

  for (let i = 0; i < 8; i++) {
    addHandle(svg, i as HandlePosition, rect);
  }
}

function calculateNewSize(
  state: ResizeState,
  currentPoint: Point
): { x: number; y: number; width: number; height: number } {
  const { initialRect, startPoint, handle } = state;
  const dx = currentPoint[0] - startPoint[0];
  const dy = currentPoint[1] - startPoint[1];

  let newX = initialRect.x;
  let newY = initialRect.y;
  let newWidth = initialRect.width;
  let newHeight = initialRect.height;

  switch (handle) {
    case 0:
      newWidth = Math.max(MIN_SIZE, initialRect.width - dx);
      newHeight = Math.max(MIN_SIZE, initialRect.height - dy);
      newX = initialRect.x + initialRect.width - newWidth;
      newY = initialRect.y + initialRect.height - newHeight;
      break;
    case 1:
      newHeight = Math.max(MIN_SIZE, initialRect.height - dy);
      newY = initialRect.y + initialRect.height - newHeight;
      break;
    case 2:
      newWidth = Math.max(MIN_SIZE, initialRect.width + dx);
      newHeight = Math.max(MIN_SIZE, initialRect.height - dy);
      newY = initialRect.y + initialRect.height - newHeight;
      break;
    case 3:
      newWidth = Math.max(MIN_SIZE, initialRect.width + dx);
      break;
    case 4:
      newWidth = Math.max(MIN_SIZE, initialRect.width + dx);
      newHeight = Math.max(MIN_SIZE, initialRect.height + dy);
      break;
    case 5:
      newHeight = Math.max(MIN_SIZE, initialRect.height + dy);
      break;
    case 6:
      newWidth = Math.max(MIN_SIZE, initialRect.width - dx);
      newHeight = Math.max(MIN_SIZE, initialRect.height + dy);
      newX = initialRect.x + initialRect.width - newWidth;
      break;
    case 7:
      newWidth = Math.max(MIN_SIZE, initialRect.width - dx);
      newX = initialRect.x + initialRect.width - newWidth;
      break;
  }

  return { x: newX, y: newY, width: newWidth, height: newHeight };
}

function updateElementSize(
  board: PlaitBoard,
  element: MindElement,
  newSize: { width: number; height: number }
): void {
  const path = PlaitBoard.findPath(board, element);
  if (!path) return;

  Transforms.setNode(board, {
    manualWidth: newSize.width,
    width: newSize.width,
    height: newSize.height,
  }, path);
}

export function addMindNodeResize(board: PlaitBoard): PlaitBoard {
  const { pointerDown, pointerMove, pointerUp } = board;

  board.pointerDown = (e: PointerEvent) => {
    const handle = getHandleFromEvent(e);
    if (handle !== null) {
      const selected = getSelectedElements(board).filter((el) =>
        MindElement.isMindElement(board, el)
      ) as MindElement[];

      if (selected.length === 1) {
        const rect = getElementRectangle(board, selected[0]);
        if (!rect) {
          pointerDown(e);
          return;
        }

        const point = toViewBoxPoint(board, [e.x, e.y]);
        setState(board, {
          element: selected[0],
          handle,
          initialRect: rect,
          startPoint: point,
        });
        return;
      }
    }
    pointerDown(e);
  };

  board.pointerMove = (e: PointerEvent) => {
    const state = getState(board);
    if (state) {
      e.preventDefault();

      throttleRAF(board, 'mind-resize', () => {
        const point = toViewBoxPoint(board, [e.x, e.y]);
        const newSize = calculateNewSize(state, point);
        updateElementSize(board, state.element, newSize);
      });

      return;
    }
    pointerMove(e);
  };

  board.pointerUp = (e: PointerEvent) => {
    const wasResizing = getState(board) !== undefined;
    if (wasResizing) {
      setState(board, undefined);
      setTimeout(() => updateHandles(board), 50);
      return;
    }
    pointerUp(e);
  };

  setTimeout(() => updateHandles(board), 100);

  return board;
}
