import type { RoughSVG } from 'roughjs/bin/svg';
import type { Options } from 'roughjs/bin/core';
import type { PlaitBoard, PlaitElement } from '@plait/core';
import { PlaitHistoryBoard, Transforms } from '@plait/core';
import type { HanddrawnConfig } from './config';
import { getHanddrawnConfig } from './state';

export const ROUGH_DRAW_METHODS = new Set([
  'line',
  'rectangle',
  'ellipse',
  'circle',
  'linearPath',
  'polygon',
  'arc',
  'curve',
  'path',
]);

export const CURVE_OR_LINE_METHODS = new Set(['curve', 'linearPath', 'line']);

export const CLEAN_PATH_RE = /^[ML\s\d.e+-]+Z?$/;

export type Point = [number, number];

let currentDrawingElement: PlaitElement | null = null;

export function getCurrentDrawingElement(): PlaitElement | null {
  return currentDrawingElement;
}

export function setCurrentDrawingElement(element: PlaitElement | null): PlaitElement | null {
  const prev = currentDrawingElement;
  currentDrawingElement = element;
  return prev;
}

export function seedFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

export function parsePathToPoints(d: string): Point[] | null {
  const points: Point[] = [];
  const commands = d.trim().split(/(?=[ML])/);
  for (const cmd of commands) {
    const match = cmd.trim().match(/^[ML]\s+([\d.e+-]+)\s+([\d.e+-]+)/);
    if (!match) return null;
    points.push([parseFloat(match[1]), parseFloat(match[2])]);
  }
  return points.length >= 2 ? points : null;
}

export function createRoughSVGProxy(
  original: RoughSVG,
  board: PlaitBoard
): RoughSVG {
  return new Proxy(original, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof prop !== 'string' || !ROUGH_DRAW_METHODS.has(prop) || typeof value !== 'function') {
        return value;
      }
      return (...args: unknown[]) => {
        const config = getHanddrawnConfig(board);
        const element = getCurrentDrawingElement();
        const seed = element ? seedFromId(element.id) : 1;
        const scale = CURVE_OR_LINE_METHODS.has(prop) ? 0.35 : 1;
        const handdrawnOptions: Partial<Options> = {
          roughness: config.roughness * scale,
          bowing: config.bowing * scale,
          seed,
        };

        const lastArg = args[args.length - 1];
        if (lastArg && typeof lastArg === 'object' && !Array.isArray(lastArg)) {
          args[args.length - 1] = { ...lastArg, ...handdrawnOptions };
        } else {
          args.push(handdrawnOptions);
        }
        return value.apply(target, args);
      };
    },
  });
}

export function replaceCleanPathsWithRough(
  g: SVGGElement,
  roughSVG: RoughSVG,
  element: PlaitElement,
  config: HanddrawnConfig
): void {
  const LINE_SCALE = 0.5;
  const pathEls = g.querySelectorAll('path');

  for (const path of pathEls) {
    const d = path.getAttribute('d');
    if (!d || !CLEAN_PATH_RE.test(d.trim())) continue;

    const points = parsePathToPoints(d);
    if (!points) continue;

    const parent = path.parentElement;
    if (!parent) continue;

    const stroke = path.getAttribute('stroke');
    const strokeWidth = path.getAttribute('stroke-width');
    const roughOpts: Partial<Options> = {
      roughness: config.roughness * LINE_SCALE,
      bowing: config.bowing * LINE_SCALE,
      seed: seedFromId(element.id),
      ...(stroke ? { stroke } : {}),
      ...(strokeWidth ? { strokeWidth: parseFloat(strokeWidth) } : {}),
      fill: 'none',
    };

    const isClosedPath = d.trim().endsWith('Z');
    const roughG = isClosedPath
      ? roughSVG.polygon(points, roughOpts)
      : roughSVG.linearPath(points, roughOpts);

    const wrapper = parent.tagName === 'g' && parent !== (g as Element) ? parent : null;
    if (wrapper) {
      const mask = wrapper.getAttribute('mask');
      if (mask) roughG.setAttribute('mask', mask);
      const nonPathChildren = Array.from(wrapper.children).filter((c) => c !== path);
      for (const child of nonPathChildren) {
        roughG.appendChild(child);
      }
      wrapper.replaceWith(roughG);
    } else {
      path.replaceWith(roughG);
    }
  }
}

export function refreshBoardElements(board: PlaitBoard): void {
  if (!board.children.length) return;

  PlaitHistoryBoard.withoutSaving(board, () => {
    board.children.forEach((element: PlaitElement, index: number) => {
      Transforms.setNode(board, { ...element }, [index]);
    });
  });
}

export function getStoredHanddrawnPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('thinkix:handdrawn') === 'true';
  } catch {
    return false;
  }
}
