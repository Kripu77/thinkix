import { PlaitBoard, type PlaitPlugin } from '@plait/core';
import {
  isHanddrawn,
  getHanddrawnConfig,
  BOARD_TO_HANDDRAWN,
  BOARD_TO_HANDDRAWN_CONFIG,
} from './state';
import { setHanddrawn, ensureGetRoughSVGPatched, patchGenerator, initializeHanddrawnFromStorage } from './patches';
import { HANDDRAWN_PRESETS, DEFAULT_HANDDRAWN_CONFIG } from './config';
import type { HanddrawnConfig, HanddrawnPreset } from './config';

export const withHanddrawn: PlaitPlugin = (board: PlaitBoard) => {
  ensureGetRoughSVGPatched();
  patchGenerator();
  initializeHanddrawnFromStorage(board);

  return board;
};

export {
  isHanddrawn,
  getHanddrawnConfig,
  setHanddrawn,
  BOARD_TO_HANDDRAWN,
  BOARD_TO_HANDDRAWN_CONFIG,
  HANDDRAWN_PRESETS,
  DEFAULT_HANDDRAWN_CONFIG,
};

export type { HanddrawnConfig, HanddrawnPreset };
