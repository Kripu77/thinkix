export * from './types';
export * from './providers';
export * from './hooks';
export * from './components';
export * from './user-identity';
export * from './cursor-manager';

export {
  YjsProvider,
  YjsRoom,
  useYjsCollaboration,
  useOptionalYjsCollaboration,
  useYjsSync,
  useYjsPresence,
  Y,
  DEFAULT_PRESENCE_CONFIG,
  DEFAULT_ADAPTER_CONFIG,
} from './adapter';

export type {
  BoardElement,
  SyncState,
  PresenceConfig,
  CollaborationAdapter,
} from './adapter';
