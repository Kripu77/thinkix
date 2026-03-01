export * from './types';
export * from './providers';
export * from './hooks';
export * from './components';
export * from './user-identity';
export * from './cursor-manager';
export * from './utils';
export { getSyncBus, resetSyncBus, type SyncBus } from './sync-bus';

export {
  YjsProvider,
  YjsRoom,
  useYjsCollaboration,
  useOptionalYjsCollaboration,
  Y,
  DEFAULT_PRESENCE_CONFIG,
  DEFAULT_ADAPTER_CONFIG,
  useCollaborationRoom,
  useOptionalCollaborationRoom,
  type CollaborationRoomContextValue,
} from './adapter';

export type {
  BoardElement,
  SyncState,
  PresenceConfig,
  CollaborationAdapter,
} from './adapter';
