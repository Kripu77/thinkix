'use client';

import { RoomProvider as RoomProviderBase } from '@liveblocks/react/suspense';
import type { ReactNode } from 'react';
import type { PlaitElement } from '@plait/core';

export interface RoomProviderProps {
  roomId: string;
  children: ReactNode;
  initialElements?: PlaitElement[];
}

export function RoomProvider({ roomId, children, initialElements }: RoomProviderProps) {
  return (
    <RoomProviderBase
      id={roomId}
      initialStorage={() => ({
        elements: initialElements ?? [],
        version: 1,
      })}
    >
      {children}
    </RoomProviderBase>
  );
}

export { usePresence, useRoomPresence, useRoomConnection } from './hooks';
