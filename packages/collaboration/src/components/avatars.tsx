'use client';

import { useMemo } from 'react';
import { useRoomPresence } from '../providers';

interface UserAvatarProps {
  name: string;
  color: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg';
}

function UserAvatar({ name, color, avatar, size = 'md' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const initial = name.charAt(0).toUpperCase();

  const avatarContent = avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatar}
      alt={name}
      className={`${sizeClasses[size]} rounded-full border-2 border-white object-cover shadow-sm`}
      title={name}
    />
  ) : (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full border-2 border-white font-semibold text-white shadow-sm`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {initial}
    </div>
  );

  return avatarContent;
}

interface LiveAvatarsProps {
  size?: 'sm' | 'md' | 'lg';
  maxVisible?: number;
}

export function LiveAvatars({ size = 'md', maxVisible = 4 }: LiveAvatarsProps) {
  const { users, userCount } = useRoomPresence();

  const visibleUsers = useMemo(() => {
    return users.slice(0, maxVisible);
  }, [users, maxVisible]);

  const hiddenCount = useMemo(() => {
    return Math.max(0, userCount - maxVisible);
  }, [userCount, maxVisible]);

  if (users.length === 0) return null;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visibleUsers.map((user) => (
          <UserAvatar
            key={user.user.id}
            name={user.user.name}
            color={user.user.color}
            avatar={user.user.avatar}
            size={size}
          />
        ))}
        {hiddenCount > 0 && (
          <div
            className={`${size === 'sm' ? 'w-6 h-6 text-xs' : size === 'md' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'} flex items-center justify-center rounded-full border-2 border-white bg-gray-500 font-semibold text-white shadow-sm`}
          >
            +{hiddenCount}
          </div>
        )}
      </div>
    </div>
  );
}

interface PresenceIndicatorProps {
  showAvatars?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PresenceIndicator({ showAvatars = true, size = 'md' }: PresenceIndicatorProps) {
  const { userCount, connectionStatus } = useRoomPresence();

  if (connectionStatus !== 'connected') {
    return (
      <div className="flex items-center gap-2 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
        <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
        <span>Connecting...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {showAvatars && <LiveAvatars size={size} />}
      <span className="text-xs text-gray-600">
        {userCount === 1 ? 'Just you' : `${userCount} online`}
      </span>
    </div>
  );
}
