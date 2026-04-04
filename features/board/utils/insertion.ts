import {
  type PlaitBoard,
  type PlaitElement,
  type RectangleClient,
  BoardTransforms,
  PlaitBoard as PlaitBoardStatic,
  PlaitElement as PlaitElementStatic,
  getBoundingRectangleByElements,
  getRectangleByElements,
  getViewportOrigination,
  WritableClipboardOperationType,
} from '@plait/core';
import { createLogger } from '@thinkix/shared';

const logger = createLogger('utils:insertion');

const INSERTION_PADDING = 100;
const FOCUS_PADDING = 96;
const MIN_FOCUS_ZOOM = 0.18;
const MAX_REVEAL_ELEMENTS = 24;
const VIEWPORT_ANIMATION_DURATION = 360;

const viewportAnimationFrames = new WeakMap<PlaitBoard, number>();
const revealScheduleFrames = new WeakMap<PlaitBoard, number>();

export interface ViewportFocusTarget {
  origination: [number, number];
  zoom: number;
}

interface RectLike {
  x: number;
  y: number;
  width: number;
  height: number;
}

function cancelFrame(
  frameMap: WeakMap<PlaitBoard, number>,
  board: PlaitBoard
): void {
  const frameId = frameMap.get(board);
  if (frameId !== undefined) {
    cancelAnimationFrame(frameId);
    frameMap.delete(board);
  }
}

function getElementsRectangle(
  board: PlaitBoard,
  elements: PlaitElement[]
): RectLike | null {
  if (!elements.length) return null;

  try {
    return getRectangleByElements(board, elements, true);
  } catch (err) {
    logger.error(
      'Failed to calculate mounted element bounds',
      err instanceof Error ? err : undefined
    );
  }

  try {
    return getBoundingRectangleByElements(board, elements, true);
  } catch (err) {
    logger.error(
      'Failed to calculate fallback element bounds',
      err instanceof Error ? err : undefined
    );
    return null;
  }
}

export function calculateFocusedViewport(
  bounds: RectLike,
  container: Pick<DOMRect, 'width' | 'height'>,
  currentZoom: number,
  padding: number = FOCUS_PADDING
): ViewportFocusTarget | null {
  if (
    !Number.isFinite(bounds.width) ||
    !Number.isFinite(bounds.height) ||
    bounds.width <= 0 ||
    bounds.height <= 0 ||
    !Number.isFinite(container.width) ||
    !Number.isFinite(container.height) ||
    container.width <= 0 ||
    container.height <= 0
  ) {
    return null;
  }

  const paddedWidth = bounds.width + padding * 2;
  const paddedHeight = bounds.height + padding * 2;
  const fitZoom = Math.min(
    container.width / paddedWidth,
    container.height / paddedHeight,
    1
  );
  const zoom = Math.max(
    MIN_FOCUS_ZOOM,
    Math.min(currentZoom, fitZoom)
  );
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  return {
    origination: [
      centerX - container.width / (2 * zoom),
      centerY - container.height / (2 * zoom),
    ],
    zoom,
  };
}

function animateViewport(
  board: PlaitBoard,
  target: ViewportFocusTarget
): void {
  cancelFrame(viewportAnimationFrames, board);

  const startOrigination = getViewportOrigination(board) ?? [0, 0];
  const startZoom = board.viewport.zoom;
  const deltaX = target.origination[0] - startOrigination[0];
  const deltaY = target.origination[1] - startOrigination[1];
  const deltaZoom = target.zoom - startZoom;
  const startTime = performance.now();

  if (
    Math.abs(deltaX) < 1 &&
    Math.abs(deltaY) < 1 &&
    Math.abs(deltaZoom) < 0.01
  ) {
    BoardTransforms.updateViewport(board, target.origination, target.zoom);
    return;
  }

  const tick = (now: number) => {
    const progress = Math.min(
      1,
      (now - startTime) / VIEWPORT_ANIMATION_DURATION
    );
    const eased = 1 - Math.pow(1 - progress, 3);

    BoardTransforms.updateViewport(
      board,
      [
        startOrigination[0] + deltaX * eased,
        startOrigination[1] + deltaY * eased,
      ],
      startZoom + deltaZoom * eased
    );

    if (progress < 1) {
      viewportAnimationFrames.set(board, requestAnimationFrame(tick));
      return;
    }

    viewportAnimationFrames.delete(board);
  };

  viewportAnimationFrames.set(board, requestAnimationFrame(tick));
}

function revealElements(elements: PlaitElement[]): void {
  elements.slice(0, MAX_REVEAL_ELEMENTS).forEach((element, index) => {
    const group = PlaitElementStatic.getContainerG(element, {
      suppressThrow: true,
    });

    if (!group) {
      return;
    }

    const isLine = element.type?.includes('line') ?? false;
    const delay = Math.min(index * 28, 220);

    if (typeof group.animate === 'function') {
      group.style.transformBox = 'fill-box';
      group.style.transformOrigin = 'center center';
      group.animate(
        isLine
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [
              { opacity: 0, transform: 'translateY(14px) scale(0.94)' },
              { opacity: 1, transform: 'translateY(0) scale(1)' },
            ],
        {
          duration: isLine ? 260 : 420,
          delay,
          easing: isLine
            ? 'cubic-bezier(0.16, 1, 0.3, 1)'
            : 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both',
        }
      );
      return;
    }

    if (isLine) {
      return;
    }

    group.classList.remove('agent-reveal');
    group.getBoundingClientRect();
    group.classList.add('agent-reveal');
    window.setTimeout(() => {
      group.classList.remove('agent-reveal');
    }, 500);
  });
}

function flashBounds(board: PlaitBoard, bounds: RectLike): void {
  if (typeof document === 'undefined') return;

  const host = PlaitBoardStatic.getElementHost(board);
  if (!host) return;

  const inset = 28;
  const frame = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

  frame.setAttribute('x', String(bounds.x - inset));
  frame.setAttribute('y', String(bounds.y - inset));
  frame.setAttribute('width', String(bounds.width + inset * 2));
  frame.setAttribute('height', String(bounds.height + inset * 2));
  frame.setAttribute('rx', '24');
  frame.setAttribute('ry', '24');
  frame.setAttribute('fill', 'rgba(92, 138, 255, 0.06)');
  frame.setAttribute('stroke', 'rgba(92, 138, 255, 0.55)');
  frame.setAttribute('stroke-width', '2');
  frame.setAttribute('stroke-dasharray', '14 12');
  frame.setAttribute('pointer-events', 'none');
  frame.style.opacity = '0';

  host.appendChild(frame);

  if (typeof frame.animate === 'function') {
    const animation = frame.animate(
      [
        { opacity: 0, strokeDashoffset: 24 },
        { opacity: 1, strokeDashoffset: 12, offset: 0.35 },
        { opacity: 0, strokeDashoffset: 0 },
      ],
      {
        duration: 760,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards',
      }
    );

    animation.onfinish = () => {
      frame.remove();
    };
    return;
  }

  frame.style.opacity = '1';
  window.setTimeout(() => frame.remove(), 760);
}

export function focusAndRevealElements(
  board: PlaitBoard,
  elements: PlaitElement[]
): void {
  const boardRecord = board as unknown as { isRecursion?: unknown };

  if (
    !elements.length ||
    typeof requestAnimationFrame !== 'function' ||
    typeof boardRecord.isRecursion !== 'function'
  ) {
    return;
  }

  cancelFrame(revealScheduleFrames, board);

  const schedule = () => {
    const targetElements = elements.filter((element) =>
      PlaitElementStatic.hasMounted(element)
    );
    const visibleElements = targetElements.length > 0 ? targetElements : elements;
    const bounds = getElementsRectangle(board, visibleElements);

    if (!bounds) {
      return;
    }

    const containerRect = PlaitBoardStatic.getBoardContainer(board).getBoundingClientRect();
    const focusTarget = calculateFocusedViewport(
      bounds,
      containerRect,
      board.viewport.zoom
    );

    if (focusTarget) {
      animateViewport(board, focusTarget);
    }

    revealElements(visibleElements);
    flashBounds(board, bounds);
  };

  revealScheduleFrames.set(
    board,
    requestAnimationFrame(() => {
      revealScheduleFrames.set(board, requestAnimationFrame(schedule));
    })
  );
}

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
  } catch (err) {
    logger.error('Failed to calculate bounding rectangles for safe insertion', err instanceof Error ? err : undefined);
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

export function insertElementDirect(
  board: PlaitBoard,
  element: PlaitElement,
  preferredPosition?: [number, number]
): void {
  let position = preferredPosition;
  
  if (!position) {
    if (board.children.length === 0) {
      position = [0, 0];
    } else {
      try {
        const existingBounds = getBoundingRectangleByElements(board, board.children, true);
        if (existingBounds) {
          position = [existingBounds.x + existingBounds.width + INSERTION_PADDING, existingBounds.y];
        } else {
          position = [0, 0];
        }
      } catch {
        position = [0, 0];
      }
    }
  }
  
  const [x, y] = position;
  const elementWithPosition = {
    ...element,
    points: [[x, y]] as [number, number][],
  };
  
  const path = [board.children.length];
  const operation = { type: 'insert_node' as const, node: elementWithPosition, path };
  board.apply(operation);
}
