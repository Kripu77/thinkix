'use client';

import { useEffect, useRef, Suspense, useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { BoardProvider, useBoardState } from '@/features/board/hooks/use-board-state';
import { BoardSwitcher, useBoardStore } from '@/features/storage';
import { LoadingLogo } from '@thinkix/ui';
import { 
  CollaborationStatusBar,
  CollaborativeAppMenu,
  CollaborateButton,
  CollaborationStartDialog,
} from '@/features/collaboration';
import {
  useCollaborationState,
  useCollaborationSession,
  SyncBusProvider,
  useSyncBus,
  useYjsCollaboration,
  getOrCreateUser,
  type BoardElement,
} from '@thinkix/collaboration';
import { MockYjsProvider } from '@thinkix/collaboration/test-utils';
import { BoardLayoutSlots } from '@/features/board';

const MockCollaborativeRoom = ({ children, roomId, initialElements }: { 
  children: React.ReactNode; 
  roomId?: string; 
  initialElements?: BoardElement[];
}) => {
  const [user] = useState(() => getOrCreateUser());
  
  return (
    <SyncBusProvider>
      <MockYjsProvider
        user={user}
        roomId={roomId}
        initialElements={initialElements}
      >
        {children}
      </MockYjsProvider>
    </SyncBusProvider>
  );
};

function hashElements(elements: BoardElement[]): string {
  try {
    return JSON.stringify(
      elements.map(({ id, type, ...rest }) => ({
        id,
        type,
        rest,
      })),
    );
  } catch {
    return `${Date.now()}:${elements.length}`;
  }
}

function MockCollaborationBridge() {
  const { board } = useBoardState();
  const { elements, isLocalChange, setElements, syncState } = useYjsCollaboration();
  const { syncBus } = useSyncBus();
  const lastElementsHashRef = useRef('');
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!board || isLocalChange || isSyncingRef.current) return;

    const hash = hashElements(elements);
    if (hash === lastElementsHashRef.current) return;

    lastElementsHashRef.current = hash;
    // eslint-disable-next-line react-hooks/immutability -- Plait board model requires direct mutation
    board.children = elements as unknown as typeof board.children;
    syncBus.emitRemoteChange(elements);
  }, [board, elements, isLocalChange, syncBus]);

  useEffect(() => {
    const unsubscribe = syncBus.subscribeToLocalChanges((localElements: BoardElement[]) => {
      if (!syncState.isConnected) {
        return;
      }

      const hash = hashElements(localElements);
      if (hash === lastElementsHashRef.current || isSyncingRef.current) {
        return;
      }

      isSyncingRef.current = true;
      lastElementsHashRef.current = hash;
      setElements(localElements);

      queueMicrotask(() => {
        isSyncingRef.current = false;
      });
    });

    return unsubscribe;
  }, [setElements, syncBus, syncState.isConnected]);

  return null;
}

const BoardCanvas = dynamic(
  () => import('@/features/board').then((mod) => mod.BoardCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full text-foreground">
        <LoadingLogo />
      </div>
    ),
  }
);

const BoardToolbar = dynamic(
  () => import('@/features/toolbar').then((mod) => mod.BoardToolbar),
  { ssr: false }
);

const UndoRedoButtons = dynamic(
  () => import('@/features/toolbar').then((mod) => mod.UndoRedoButtons),
  { ssr: false }
);

const ZoomToolbar = dynamic(
  () => import('@/features/toolbar').then((mod) => mod.ZoomToolbar),
  { ssr: false }
);

const AppMenu = dynamic(
  () => import('@/features/toolbar').then((mod) => mod.AppMenu),
  { ssr: false }
);

function TestBoardAppContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomFromUrl = searchParams.get('room');
  
  const { 
    initialize, 
    boards, 
    currentBoard, 
    isLoading, 
    createBoard, 
    switchBoard, 
    deleteBoard, 
    renameBoard 
  } = useBoardStore();

  const activeRoomId = roomFromUrl || currentBoard?.id || null;
  const { isEnabled, enableCollaboration, disableCollaboration } = useCollaborationState(activeRoomId ?? undefined);
  
  const session = useCollaborationSession(roomFromUrl);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (roomFromUrl && !isEnabled && !session.wasDisabled) {
      enableCollaboration(roomFromUrl);
    }
  }, [roomFromUrl, isEnabled, enableCollaboration, session.wasDisabled]);

  const handleCreateBoard = async (name: string) => {
    await createBoard(name);
  };

  const handleDialogClose = useCallback((open: boolean) => {
    if (!open && roomFromUrl) {
      session.markDialogSeen();
      session.clearInitiator();
    }
  }, [roomFromUrl, session]);

  const roomUrl = typeof window !== 'undefined' && roomFromUrl 
    ? `${window.location.origin}${pathname}?room=${roomFromUrl}`
    : '';

  const showStartDialog = useMemo(() => {
    return isEnabled && !!roomFromUrl && session.isInitiator && !session.wasDialogSeen;
  }, [isEnabled, roomFromUrl, session.isInitiator, session.wasDialogSeen]);

  const handleEnableCollaboration = useCallback(() => {
    const roomId = crypto.randomUUID();
    
    const url = `${pathname}?room=${roomId}`;
    router.push(url);
    
    enableCollaboration(roomId);
  }, [pathname, router, enableCollaboration]);

  useEffect(() => {
    if (roomFromUrl && session.isInitiator === false) {
      session.markAsInitiator();
      session.clearDisabled();
    }
  }, [roomFromUrl, session]);

  const handleDisableCollaboration = useCallback(() => {
    session.markAsDisabled();
    disableCollaboration();
    
    if (roomFromUrl) {
      router.push(pathname);
    }
  }, [disableCollaboration, roomFromUrl, pathname, router, session]);

  useEffect(() => {
    if (!roomFromUrl && session.wasDisabled === false) {
      session.markAsDisabled();
    }
  }, [roomFromUrl, session]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-background text-foreground">
        <LoadingLogo />
      </div>
    );
  }

  const topLeftSlot = (
    <>
      <BoardSwitcher
        boards={boards}
        currentBoardId={currentBoard?.id ?? null}
        onCreateBoard={handleCreateBoard}
        onSelectBoard={switchBoard}
        onDeleteBoard={deleteBoard}
        onRenameBoard={renameBoard}
      />
      <AppMenu 
        boardName={currentBoard?.name} 
        onEnableCollaboration={!isEnabled ? handleEnableCollaboration : undefined}
      />
    </>
  );

  const collaborativeTopLeftSlot = (
    <>
      <BoardSwitcher
        boards={boards}
        currentBoardId={currentBoard?.id ?? null}
        onCreateBoard={handleCreateBoard}
        onSelectBoard={switchBoard}
        onDeleteBoard={deleteBoard}
        onRenameBoard={renameBoard}
      />
      <CollaborativeAppMenu 
        boardName={currentBoard?.name} 
        onDisableCollaboration={handleDisableCollaboration}
        roomId={activeRoomId!}
      />
    </>
  );

  const bottomLeftSlot = (
    <>
      <ZoomToolbar />
      <UndoRedoButtons />
    </>
  );

  const topRightSlot = !isEnabled ? (
    <CollaborateButton onClick={handleEnableCollaboration} />
  ) : undefined;

  const collaborativeTopRightSlot = (
    <CollaborationStatusBar 
      roomId={activeRoomId!} 
      onDisableCollaboration={handleDisableCollaboration} 
    />
  );

  if (isEnabled && activeRoomId) {
    return (
      <>
        <MockCollaborativeRoom roomId={activeRoomId} initialElements={currentBoard?.elements}>
          <main className="w-screen h-screen overflow-hidden bg-background">
            <BoardCanvas boardData={currentBoard}>
              <MockCollaborationBridge />
              <BoardToolbar />
              <BoardLayoutSlots
                topLeft={collaborativeTopLeftSlot}
                bottomLeft={bottomLeftSlot}
                topRight={collaborativeTopRightSlot}
              />
            </BoardCanvas>
          </main>
        </MockCollaborativeRoom>
        
        <CollaborationStartDialog
          open={showStartDialog}
          onOpenChange={handleDialogClose}
          roomUrl={roomUrl}
        />
      </>
    );
  }

  return (
    <>
      <main className="w-screen h-screen overflow-hidden bg-background">
        <BoardCanvas boardData={currentBoard}>
          <BoardToolbar />
          <BoardLayoutSlots
            topLeft={topLeftSlot}
            bottomLeft={bottomLeftSlot}
            topRight={topRightSlot}
          />
        </BoardCanvas>
      </main>
      
      <CollaborationStartDialog
        open={showStartDialog}
        onOpenChange={handleDialogClose}
        roomUrl={roomUrl}
      />
    </>
  );
}

function TestBoardApp() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center w-screen h-screen bg-background text-foreground">
        <LoadingLogo />
      </div>
    }>
      <TestBoardAppContent />
    </Suspense>
  );
}

export default function TestCollaborationPage() {
  return (
    <BoardProvider>
      <TestBoardApp />
    </BoardProvider>
  );
}
