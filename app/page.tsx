'use client';

import { useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { BoardProvider } from '@/features/board/hooks/use-board-state';
import { BoardSwitcher, useBoardStore } from '@/features/storage';
import { LoadingLogo } from '@thinkix/ui';
import { 
  Room, 
  CollaborativeBoard, 
  CollaborationStatusBar,
  CollaborativeAppMenu,
  CollaborateButton,
} from '@/features/collaboration';
import { useCollaborationState } from '@thinkix/collaboration';
import { BoardLayoutSlots } from '@/features/board';

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

function BoardAppContent() {
  const searchParams = useSearchParams();
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

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleCreateBoard = async (name: string) => {
    await createBoard(name);
  };

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
        onEnableCollaboration={activeRoomId && !isEnabled ? () => enableCollaboration(activeRoomId) : undefined}
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
        onDisableCollaboration={disableCollaboration}
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

  const topRightSlot = activeRoomId && !isEnabled ? (
    <CollaborateButton onClick={() => enableCollaboration(activeRoomId)} />
  ) : undefined;

  const collaborativeTopRightSlot = (
    <CollaborationStatusBar 
      roomId={activeRoomId!} 
      onDisableCollaboration={disableCollaboration} 
    />
  );

  if (isEnabled && activeRoomId) {
    return (
      <Room roomId={activeRoomId} initialElements={currentBoard?.elements}>
        <CollaborativeBoard>
          <main className="w-screen h-screen overflow-hidden bg-background">
            <BoardCanvas boardData={currentBoard}>
              <BoardToolbar />
              <BoardLayoutSlots
                topLeft={collaborativeTopLeftSlot}
                bottomLeft={bottomLeftSlot}
                topRight={collaborativeTopRightSlot}
              />
            </BoardCanvas>
          </main>
        </CollaborativeBoard>
      </Room>
    );
  }

  return (
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
  );
}

function BoardApp() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center w-screen h-screen bg-background text-foreground">
        <LoadingLogo />
      </div>
    }>
      <BoardAppContent />
    </Suspense>
  );
}

export default function HomePage() {
  return (
    <BoardProvider>
      <BoardApp />
    </BoardProvider>
  );
}
