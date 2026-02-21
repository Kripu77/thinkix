import type { Options } from 'roughjs/bin/core';

export interface HanddrawnConfig {
  roughness: number;
  bowing: number;
  strokeWidth: number;
  fillStyle: Options['fillStyle'];
  fillWeight: number;
  hachureAngle: number;
  hachureGap: number;
}

export const HANDDRAWN_PRESETS = {
  subtle: {
    roughness: 0.5,
    bowing: 0.5,
    strokeWidth: 1,
    fillStyle: 'solid' as const,
    fillWeight: 0.3,
    hachureAngle: -41,
    hachureGap: 6,
  } satisfies HanddrawnConfig,
  
  default: {
    roughness: 1.4,
    bowing: 1,
    strokeWidth: 1,
    fillStyle: 'solid' as const,
    fillWeight: 0.5,
    hachureAngle: -41,
    hachureGap: 4,
  } satisfies HanddrawnConfig,
  
  strong: {
    roughness: 2.5,
    bowing: 2,
    strokeWidth: 1.5,
    fillStyle: 'solid' as const,
    fillWeight: 0.8,
    hachureAngle: -41,
    hachureGap: 3,
  } satisfies HanddrawnConfig,
  
  excalidraw: {
    roughness: 1.4,
    bowing: 1,
    strokeWidth: 1,
    fillStyle: 'solid' as const,
    fillWeight: 0.5,
    hachureAngle: -41,
    hachureGap: 4,
  } satisfies HanddrawnConfig,
  
  sketchbook: {
    roughness: 3,
    bowing: 3,
    strokeWidth: 1.5,
    fillStyle: 'hachure' as const,
    fillWeight: 1,
    hachureAngle: -30,
    hachureGap: 5,
  } satisfies HanddrawnConfig,
  
  blueprint: {
    roughness: 0.8,
    bowing: 0.3,
    strokeWidth: 1,
    fillStyle: 'solid' as const,
    fillWeight: 0.3,
    hachureAngle: 45,
    hachureGap: 8,
  } satisfies HanddrawnConfig,
};

export type HanddrawnPreset = keyof typeof HANDDRAWN_PRESETS;

export const DEFAULT_HANDDRAWN_CONFIG: HanddrawnConfig = HANDDRAWN_PRESETS.excalidraw;

export function toRoughOptions(config: HanddrawnConfig, overrides?: Partial<Options>): Options {
  return {
    roughness: config.roughness,
    bowing: config.bowing,
    stroke: '#000',
    strokeWidth: config.strokeWidth,
    fill: 'none',
    fillStyle: config.fillStyle,
    fillWeight: config.fillWeight,
    hachureAngle: config.hachureAngle,
    hachureGap: config.hachureGap,
    ...overrides,
  };
}
