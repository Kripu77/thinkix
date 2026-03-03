import type { ReactNode } from 'react';
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
    avatar: identity.avatarDataUrl,
  };
}

export function getOrCreateUser(): CollaborationUser {
  const stored = getStoredUser();
  if (stored) return stored;
  const newUser = createAnonymousUser();
  setStoredUser(newUser);
  return newUser;
}

export interface BoardElement {
  id: string;
  type?: string;
  [key: string]: unknown;
}

export function isValidBoardElement(value: unknown): value is BoardElement {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const element = value as Record<string, unknown>;
  
  if (typeof element['id'] !== 'string' || element['id'].trim().length === 0) {
    return false;
  }
  
  if ('type' in element && typeof element['type'] !== 'string') {
    return false;
  }
  
  return true;
}

export function validateBoardElements(elements: unknown[]): { valid: BoardElement[]; invalid: unknown[] } {
  const valid: BoardElement[] = [];
  const invalid: unknown[] = [];
  
  for (const element of elements) {
    if (isValidBoardElement(element)) {
      valid.push(element);
    } else {
      invalid.push(element);
    }
  }
  
  return { valid, invalid };
}

export interface SyncState {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
}

export interface UndoState {
  canUndo: boolean;
  canRedo: boolean;
  undoStackSize: number;
  redoStackSize: number;
}

export interface PresenceConfig {
  throttleMs: number;
  idleTimeoutMs: number;
}

export interface AdapterConfig {
  presence: PresenceConfig;
  pageSize: number;
}

export const DEFAULT_PRESENCE_CONFIG: PresenceConfig = {
  throttleMs: 50,
  idleTimeoutMs: 30000,
};

export const DEFAULT_ADAPTER_CONFIG: AdapterConfig = {
  presence: DEFAULT_PRESENCE_CONFIG,
  pageSize: 50,
};

export type BoardOperation = 
  | { type: 'insert'; element: BoardElement; index?: number }
  | { type: 'update'; id: string; changes: Record<string, unknown> }
  | { type: 'delete'; id: string }
  | { type: 'move'; id: string; newIndex: number }
  | { type: 'batch'; operations: BoardOperation[] };

export interface OperationMetadata {
  timestamp: number;
  clientId: string;
  operationId: string;
}

export type OperationWithMetadata = BoardOperation & OperationMetadata;

export interface ConnectionAdapterConfig {
  cursorThrottleMs: number;
  cursorIdleTimeoutMs: number;
  syncDebounceMs: number;
  presencePageSize: number;
  enableOfflineQueue: boolean;
  maxRetries: number;
}

export const DEFAULT_CONNECTION_CONFIG: ConnectionAdapterConfig = {
  cursorThrottleMs: 50,
  cursorIdleTimeoutMs: 30000,
  syncDebounceMs: 16,
  presencePageSize: 50,
  enableOfflineQueue: true,
  maxRetries: 3,
};

export interface CollaborationAdapter {
  readonly name: string;
  
  Provider: React.FC<{
    children: ReactNode;
    user: CollaborationUser;
    config?: Partial<AdapterConfig>;
    authEndpoint?: string;
    publicKey?: string;
  }>;
  
  Room: React.FC<{
    roomId: string;
    initialElements?: BoardElement[];
    children: ReactNode;
  }>;
  
  useSync(): {
    elements: BoardElement[];
    setElements: (elements: BoardElement[]) => void;
    syncState: SyncState;
  };
  
  usePresence(): {
    updateCursor: (cursor: Cursor | null) => void;
    updateSelection: (selection: string[]) => void;
    updateViewport: (viewport: ViewportState) => void;
    others: UserPresence[];
    connectionStatus: ConnectionStatus;
  };
}
