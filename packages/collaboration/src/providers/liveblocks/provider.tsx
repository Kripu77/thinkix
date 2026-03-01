'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { LiveblocksProvider as LiveblocksProviderBase } from '@liveblocks/react/suspense';
import type { CollaborationUser } from '../../types';

interface CollaborationProviderProps {
  children: ReactNode;
  user: CollaborationUser;
  publicApiKey?: string;
  authEndpoint?: string;
}

interface CollaborationContextValue {
  user: CollaborationUser;
}

const CollaborationContext = createContext<CollaborationContextValue | null>(null);

export function useCollaborationContext(): CollaborationContextValue {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaborationContext must be used within CollaborationProvider');
  }
  return context;
}

export function CollaborationProvider({
  children,
  user,
  publicApiKey,
  authEndpoint,
}: CollaborationProviderProps) {
  const authEndpointFn = useMemo(() => {
    if (!authEndpoint) return undefined;
    return async (room?: string) => {
      const response = await fetch(authEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room,
          userId: user.id,
          userName: user.name,
          userColor: user.color,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    };
  }, [authEndpoint, user.id, user.name, user.color]);

  const contextValue = useMemo(() => ({ user }), [user]);

  const fallbackKey = process.env['NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY'];

  if (authEndpointFn) {
    return (
      <CollaborationContext.Provider value={contextValue}>
        <LiveblocksProviderBase authEndpoint={authEndpointFn} throttle={16}>
          {children}
        </LiveblocksProviderBase>
      </CollaborationContext.Provider>
    );
  }

  const key = publicApiKey || fallbackKey;
  if (!key) {
    console.warn('CollaborationProvider: No publicApiKey or authEndpoint provided, and NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY is not set');
    return <>{children}</>;
  }

  return (
    <CollaborationContext.Provider value={contextValue}>
      <LiveblocksProviderBase publicApiKey={key} throttle={16}>
        {children}
      </LiveblocksProviderBase>
    </CollaborationContext.Provider>
  );
}
