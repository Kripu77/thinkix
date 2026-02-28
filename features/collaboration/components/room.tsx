'use client';

import { ReactNode, useState } from 'react';
import {
  RoomProvider,
  ClientSideSuspense,
} from '@liveblocks/react/suspense';
import { getOrCreateUser, CollaborationProvider } from '@thinkix/collaboration';
import type { PlaitElement } from '@plait/core';

interface RoomProps {
  children: ReactNode;
  roomId: string;
  initialElements?: PlaitElement[];
}

export function Room({ children, roomId, initialElements }: RoomProps) {
  const [user] = useState(() => getOrCreateUser());

  return (
    <CollaborationProvider user={user} authEndpoint="/api/collaboration/auth">
      <RoomProvider id={roomId} initialStorage={() => ({ elements: initialElements ?? [], version: 1 })}>
        <ClientSideSuspense fallback={<div className="text-sm text-gray-500">Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </CollaborationProvider>
  );
}

interface LiveblocksProviderOnlyProps {
  children: ReactNode;
}

export function LiveblocksProviderOnly({ children }: LiveblocksProviderOnlyProps) {
  const [user] = useState(() => getOrCreateUser());

  return (
    <CollaborationProvider user={user} authEndpoint="/api/collaboration/auth">
      {children}
    </CollaborationProvider>
  );
}
