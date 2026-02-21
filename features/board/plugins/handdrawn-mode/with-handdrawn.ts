import { PlaitBoard, PlaitPlugin } from '@plait/core';
import type { HanddrawnConfig, HanddrawnPreset } from './config';
import { HANDDRAWN_PRESETS, DEFAULT_HANDDRAWN_CONFIG } from './config';

export const BOARD_TO_HANDDRAWN = new WeakMap<PlaitBoard, boolean>();
export const BOARD_TO_HANDDRAWN_CONFIG = new WeakMap<PlaitBoard, HanddrawnConfig>();

const HANDDRAWN_FILTER_ID = 'thinkix-handdrawn-filter';

export function isHanddrawn(board: PlaitBoard): boolean {
  return BOARD_TO_HANDDRAWN.get(board) ?? false;
}

export function getHanddrawnConfig(board: PlaitBoard): HanddrawnConfig {
  return BOARD_TO_HANDDRAWN_CONFIG.get(board) ?? DEFAULT_HANDDRAWN_CONFIG;
}

function configToFilterParams(config: HanddrawnConfig) {
  const baseFrequency = 0.01 + (config.roughness / 5) * 0.07;
  const scale = 1 + (config.bowing / 10) * 7;
  const numOctaves = Math.round(2 + (config.roughness / 5) * 3);
  
  return { baseFrequency, scale, numOctaves };
}

function createHanddrawnFilter(config: HanddrawnConfig): string {
  const { baseFrequency, scale, numOctaves } = configToFilterParams(config);
  
  return `
    <svg width="0" height="0" style="position:absolute;pointer-events:none">
      <defs>
        <filter id="${HANDDRAWN_FILTER_ID}" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="${baseFrequency.toFixed(3)}" numOctaves="${numOctaves}" seed="1" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="${scale.toFixed(1)}" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
    </svg>
  `;
}

function ensureHanddrawnFilter(config: HanddrawnConfig): void {
  const existing = document.getElementById(HANDDRAWN_FILTER_ID);
  if (existing) {
    existing.closest('svg')?.remove();
  }
  
  const container = document.createElement('div');
  container.innerHTML = createHanddrawnFilter(config);
  document.body.appendChild(container.firstElementChild!);
}

function applyHanddrawnFilterToBoard(board: PlaitBoard): void {
  if (!isHanddrawn(board)) return;
  
  const config = getHanddrawnConfig(board);
  ensureHanddrawnFilter(config);
  
  const host = PlaitBoard.getHost(board);
  if (host) {
    host.classList.add('handdrawn-mode');
    (host as Element & { style: CSSStyleDeclaration }).style.filter = `url(#${HANDDRAWN_FILTER_ID})`;
  }
}

function removeHanddrawnFilterFromBoard(board: PlaitBoard): void {
  const host = PlaitBoard.getHost(board);
  if (host) {
    host.classList.remove('handdrawn-mode');
    (host as Element & { style: CSSStyleDeclaration }).style.filter = '';
  }
}

export function setHanddrawn(
  board: PlaitBoard, 
  enabled: boolean, 
  presetOrConfig?: HanddrawnPreset | HanddrawnConfig
): void {
  const config = typeof presetOrConfig === 'string' 
    ? HANDDRAWN_PRESETS[presetOrConfig] 
    : (presetOrConfig ?? DEFAULT_HANDDRAWN_CONFIG);
  
  BOARD_TO_HANDDRAWN.set(board, enabled);
  BOARD_TO_HANDDRAWN_CONFIG.set(board, config);
  
  if (enabled) {
    ensureHanddrawnFilter(config);
    applyHanddrawnFilterToBoard(board);
  } else {
    removeHanddrawnFilterFromBoard(board);
  }
}

export const withHanddrawn: PlaitPlugin = (board: PlaitBoard) => {
  return board;
};

export { HANDDRAWN_PRESETS, DEFAULT_HANDDRAWN_CONFIG };
export type { HanddrawnConfig, HanddrawnPreset };
