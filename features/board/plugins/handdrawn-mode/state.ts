import { PlaitBoard } from '@plait/core';
import type { RoughSVG } from 'roughjs/bin/svg';
import type { HanddrawnConfig } from './config';
import { DEFAULT_HANDDRAWN_CONFIG } from './config';

export const BOARD_TO_HANDDRAWN = new WeakMap<PlaitBoard, boolean>();
export const BOARD_TO_HANDDRAWN_CONFIG = new WeakMap<PlaitBoard, HanddrawnConfig>();
export const BOARD_TO_PROXY = new WeakMap<PlaitBoard, RoughSVG>();

export function isHanddrawn(board: PlaitBoard): boolean {
  return BOARD_TO_HANDDRAWN.get(board) ?? false;
}

export function getHanddrawnConfig(board: PlaitBoard): HanddrawnConfig {
  return BOARD_TO_HANDDRAWN_CONFIG.get(board) ?? DEFAULT_HANDDRAWN_CONFIG;
}

export function setHanddrawnState(
  board: PlaitBoard,
  enabled: boolean,
  config: HanddrawnConfig
): void {
  BOARD_TO_HANDDRAWN.set(board, enabled);
  BOARD_TO_HANDDRAWN_CONFIG.set(board, config);
  BOARD_TO_PROXY.delete(board);
}
