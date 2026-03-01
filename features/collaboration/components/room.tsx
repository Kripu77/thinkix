'use client';

import { ReactNode, useState } from 'react';
import { 
  YjsProvider, 
  YjsRoom, 
  getOrCreateUser,
  type BoardElement,
} from '@thinkix/collaboration';

interface RoomProps {
  children: ReactNode;
  roomId: string;
  initialElements?: BoardElement[];
}

export function Room({ children, roomId, initialElements }: RoomProps) {
  const [user] = useState(() => getOrCreateUser());

  return (
    <YjsProvider user={user} authEndpoint="/api/collaboration/auth">
      <YjsRoom 
        roomId={roomId} 
        initialElements={initialElements} 
        user={user}
      >
        {children}
      </YjsRoom>
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
