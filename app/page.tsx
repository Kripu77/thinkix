'use client';

import { useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { BoardProvider } from '@/features/board/hooks/use-board-state';
import { BoardSwitcher, useBoardStore } from '@/features/storage';
import { LoadingLogo, Button } from '@thinkix/ui';
import { Room, CollaborativeBoard, CollaborationStatusBar, useCollaborationContext, useRoomPresence } from '@/features/collaboration';
import { useCollaborationState, setStoredUser } from '@thinkix/collaboration';
import { Users } from 'lucide-react';

function CollaborativeAppMenu({ 
  boardName, 
  onDisableCollaboration,
  roomId,
}: { 
  boardName?: string; 
  onDisableCollaboration: () => void;
  roomId: string;
}) {
  const { user } = useCollaborationContext();
  const { userCount } = useRoomPresence();
  
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
      setStoredUser(updatedUser);
    },
    onLeave: onDisableCollaboration,
  };

  return <AppMenu boardName={boardName} collaboration={collaboration} />;
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

function BoardAppContent() {
  const searchParams = useSearchParams();
  const roomFromUrl = searchParams.get('room');
  
  const { initialize, boards, currentBoard, isLoading, createBoard, switchBoard, deleteBoard, renameBoard } = useBoardStore();

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

  const collaborationButton = activeRoomId && !isEnabled ? (
    <Button
      variant="outline"
      size="sm"
      onClick={() => enableCollaboration(activeRoomId)}
      className="hidden lg:flex items-center gap-1.5"
    >
      <Users className="h-4 w-4" />
      <span>Collaborate</span>
    </Button>
  ) : null;

  const mainContent = (
    <main className="w-screen h-screen overflow-hidden bg-background">
      <BoardCanvas boardData={currentBoard}>
        <BoardToolbar />
        <div 
          className="absolute z-[60] flex items-center gap-1.5 top-4 left-4 max-[1280px]:top-auto max-[1280px]:bottom-4 max-[1280px]:left-4" 
          data-no-autosave
        >
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
        </div>
        <div className="absolute bottom-4 left-4 z-50 flex items-center gap-3 max-[1024px]:bottom-4 max-[1024px]:right-4 max-[1024px]:left-auto">
          <ZoomToolbar />
          <UndoRedoButtons />
        </div>
        
        <div className="absolute top-4 right-4 z-[60]">
          {collaborationButton}
        </div>
      </BoardCanvas>
    </main>
  );

  if (isEnabled && activeRoomId) {
    return (
      <Room roomId={activeRoomId} initialElements={currentBoard?.elements}>
        <CollaborativeBoard>
          <main className="w-screen h-screen overflow-hidden bg-background">
            <BoardCanvas boardData={currentBoard}>
              <BoardToolbar />
              <div 
                className="absolute z-[60] flex items-center gap-1.5 top-4 left-4 max-[1280px]:top-auto max-[1280px]:bottom-4 max-[1280px]:left-4" 
                data-no-autosave
              >
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
                  roomId={activeRoomId}
                />
              </div>
              <div className="absolute bottom-4 left-4 z-50 flex items-center gap-3 max-[1024px]:bottom-4 max-[1024px]:right-4 max-[1024px]:left-auto">
                <ZoomToolbar />
                <UndoRedoButtons />
              </div>
              
              <div className="absolute top-4 right-4 z-[60]">
                <CollaborationStatusBar 
                  roomId={activeRoomId} 
                  onDisableCollaboration={disableCollaboration} 
                />
              </div>
            </BoardCanvas>
          </main>
        </CollaborativeBoard>
      </Room>
    );
  }

  return mainContent;
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
