'use client';

import { ReactNode, useState } from 'react';
import { 
  YjsProvider, 
  YjsRoom, 
  SyncBusProvider,
  getOrCreateUser,
  type BoardElement,
} from '@thinkix/collaboration';
import type { PlaitTheme } from '@plait/core';

interface RoomProps {
  children: ReactNode;
  roomId: string;
  initialElements?: BoardElement[];
  initialTheme?: PlaitTheme;
}

export function Room({ children, roomId, initialElements, initialTheme }: RoomProps) {
  const [user] = useState(() => getOrCreateUser());

  return (
    <YjsProvider user={user} authEndpoint="/api/collaboration/auth">
      <SyncBusProvider>
        <YjsRoom 
          roomId={roomId} 
          initialElements={initialElements} 
          initialTheme={initialTheme}
          user={user}
        >
          {children}
        </YjsRoom>
      </SyncBusProvider>
    </YjsProvider>
  );
}

interface LiveblocksProviderOnlyProps {
  children: ReactNode;
}

export function LiveblocksProviderOnly({ children }: LiveblocksProviderOnlyProps) {
  const [user] = useState(() => getOrCreateUser());

  return (
    <YjsProvider user={user} authEndpoint="/api/collaboration/auth">
      {children}
    </YjsProvider>
  );
}

export { Room as CollaborationRoom };
