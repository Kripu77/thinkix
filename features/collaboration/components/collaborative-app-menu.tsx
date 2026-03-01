'use client';

import dynamic from 'next/dynamic';
import { useCollaborationRoom, setStoredUser } from '@thinkix/collaboration';

const AppMenu = dynamic(
  () => import('@/features/toolbar').then((mod) => mod.AppMenu),
  { ssr: false }
);

interface CollaborativeAppMenuProps {
  boardName?: string;
  onDisableCollaboration: () => void;
  roomId: string;
}

export function CollaborativeAppMenu({ 
  boardName, 
  onDisableCollaboration,
  roomId,
}: CollaborativeAppMenuProps) {
  const { user, userCount, updatePresence } = useCollaborationRoom();
  
  const collaboration = {
    enabled: true,
    user,
    userCount,
    roomId,
    onShare: async () => {
      const url = `${window.location.origin}?room=${roomId}`;
      await navigator.clipboard.writeText(url);
    },
    onChangeNickname: (name: string) => {
      const updatedUser = { ...user, name };
      updatePresence({ user: { name } });
      setStoredUser(updatedUser);
    },
    onLeave: onDisableCollaboration,
  };

  return <AppMenu boardName={boardName} collaboration={collaboration} />;
}
