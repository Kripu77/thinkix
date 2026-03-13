import { PlaitBoard, type PlaitElement } from '@plait/core';
import { Generator } from '@plait/common';
import type { RoughSVG } from 'roughjs/bin/svg';
import { PlaitDrawElement } from '@plait/draw';
import {
  isHanddrawn,
  getHanddrawnConfig,
  BOARD_TO_PROXY,
  setHanddrawnState,
} from './state';
import {
  createRoughSVGProxy,
  replaceCleanPathsWithRough,
  setCurrentDrawingElement,
  refreshBoardElements,
  getStoredHanddrawnPreference,
} from './helpers';
import { DEFAULT_HANDDRAWN_CONFIG } from './config';
import type { HanddrawnConfig, HanddrawnPreset } from './config';
import { HANDDRAWN_PRESETS } from './config';

let originalGetRoughSVG: typeof PlaitBoard.getRoughSVG | null = null;
let generatorPatched = false;

export function ensureGetRoughSVGPatched(): void {
  if (originalGetRoughSVG) return;

  originalGetRoughSVG = PlaitBoard.getRoughSVG;

  PlaitBoard.getRoughSVG = (board: PlaitBoard): RoughSVG => {
    if (isHanddrawn(board)) {
      let proxy = BOARD_TO_PROXY.get(board);
      if (!proxy) {
        proxy = createRoughSVGProxy(originalGetRoughSVG!(board), board);
        BOARD_TO_PROXY.set(board, proxy);
      }
      return proxy;
    }
    return originalGetRoughSVG!(board);
  };
}

export function patchGenerator(): void {
  if (generatorPatched) return;
  generatorPatched = true;

  const originalProcessDrawing = Generator.prototype.processDrawing;

  Generator.prototype.processDrawing = function (
    this: Generator & { board: PlaitBoard; g?: SVGGElement },
    element: PlaitElement,
    parentG: SVGGElement,
    data?: unknown
  ): void {
    const prev = setCurrentDrawingElement(element);
    try {
      originalProcessDrawing.call(this, element, parentG, data);
    } finally {
      setCurrentDrawingElement(prev);
    }

    if (!isHanddrawn(this.board) || !this.g) return;
    if (!PlaitDrawElement.isArrowLine(element) && !PlaitDrawElement.isVectorLine(element)) return;

    const config = getHanddrawnConfig(this.board);
    const roughSVG = PlaitBoard.getRoughSVG(this.board);
    replaceCleanPathsWithRough(this.g, roughSVG, element, config);
  };
}

export function setHanddrawn(
  board: PlaitBoard,
  enabled: boolean,
  presetOrConfig?: HanddrawnPreset | HanddrawnConfig
): void {
  const config =
    typeof presetOrConfig === 'string'
      ? HANDDRAWN_PRESETS[presetOrConfig]
      : presetOrConfig ?? DEFAULT_HANDDRAWN_CONFIG;

  setHanddrawnState(board, enabled, config);
  refreshBoardElements(board);
}

export function initializeHanddrawnFromStorage(board: PlaitBoard): void {
  if (getStoredHanddrawnPreference()) {
    setHanddrawnState(board, true, DEFAULT_HANDDRAWN_CONFIG);
  }
}
