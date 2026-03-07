export const STORAGE_KEYS = {
  HANDDRAWN: 'thinkix:handdrawn',
  GRID_BACKGROUND: 'thinkix:grid-background',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
