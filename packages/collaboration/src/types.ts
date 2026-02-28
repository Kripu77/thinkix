import { generateUserIdentity } from './user-identity';

export interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  avatar?: string;
}

export interface Cursor {
  x: number;
  y: number;
  pointer?: 'mouse' | 'pen' | 'touch';
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export interface UserPresence {
  user: CollaborationUser;
  cursor?: Cursor;
  selection?: string[];
  viewport?: ViewportState;
}

export type ConnectionStatus = 'initial' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface RoomState {
  roomId: string | null;
  status: ConnectionStatus;
  users: UserPresence[];
  localUser: CollaborationUser | null;
}

export interface CollaborationConfig {
  enabled: boolean;
  roomId: string | null;
  user: CollaborationUser;
}

export interface BoardSyncState {
  isSyncing: boolean;
  lastSyncedAt: number | null;
  pendingChanges: number;
}

export const USER_COLORS = [
  '#E57373',
  '#81C784',
  '#64B5F6',
  '#FFD54F',
  '#BA68C8',
  '#4DD0E1',
  '#F06292',
  '#AED581',
  '#FF8A65',
  '#7986CB',
  '#4DB6AC',
  '#FFB74D',
  '#7986CB',
  '#F48FB1',
  '#80CBC4',
  '#81C784',
  '#9575CD',
  '#4FC3F7',
  '#FFCC80',
  '#A5D6A7',
] as const;

export function hashUserIdToColorIndex(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % USER_COLORS.length;
}

export function generateUserColor(userId: string): string {
  return USER_COLORS[hashUserIdToColorIndex(userId)];
}

export function generateAnonymousUserId(): string {
  return `anon_${crypto.randomUUID()}`;
}

const STORAGE_KEY_USER = 'thinkix:collaboration:user';

export function getStoredUser(): CollaborationUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USER);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export function setStoredUser(user: CollaborationUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } catch {
    // Ignore storage errors
  }
}

export function createAnonymousUser(): CollaborationUser {
  const id = generateAnonymousUserId();
  const identity = generateUserIdentity(id);
  return {
    id,
    name: identity.nickname,
    color: generateUserColor(id),
    avatar: identity.avatarSvg,
  };
}

export function getOrCreateUser(): CollaborationUser {
  const stored = getStoredUser();
  if (stored) return stored;
  const newUser = createAnonymousUser();
  setStoredUser(newUser);
  return newUser;
}
