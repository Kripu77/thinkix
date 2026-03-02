export type {
  CollaborationUser,
  Cursor,
  ViewportState,
  UserPresence,
  ConnectionStatus,
  BoardElement,
  SyncState,
  UndoState,
  PresenceConfig,
  AdapterConfig,
  CollaborationAdapter,
} from '../types';

export {
  USER_COLORS,
  hashUserIdToColorIndex,
  generateUserColor,
  generateAnonymousUserId,
  getStoredUser,
  setStoredUser,
  createAnonymousUser,
  getOrCreateUser,
  DEFAULT_PRESENCE_CONFIG,
  DEFAULT_ADAPTER_CONFIG,
} from '../types';

export {
  YjsProvider,
  YjsRoom,
  useYjsCollaboration,
  useOptionalYjsCollaboration,
  Y,
} from './yjs-provider';

export {
  useCollaborationRoom,
  useOptionalCollaborationRoom,
  CollaborationRoomContext,
  type CollaborationRoomContextValue,
} from './collaboration-context';
