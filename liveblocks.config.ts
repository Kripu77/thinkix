import type { PlaitElement } from '@plait/core';

declare global {
  interface Liveblocks {
    Presence: {
      cursor?: { x: number; y: number; pointer?: 'mouse' | 'pen' | 'touch' };
      selection?: string[];
      viewport?: { x: number; y: number; zoom: number };
      user?: {
        id: string;
        name: string;
        color: string;
        avatar?: string;
      };
    };

    Storage: {
      elements: PlaitElement[];
      version: number;
    };

    UserMeta: {
      id: string;
      info: {
        name: string;
        color: string;
        avatar?: string;
      };
    };

    RoomEvent: Record<string, never>;

    ThreadMetadata: Record<string, never>;

    RoomInfo: Record<string, never>;
  }
}

export {};
