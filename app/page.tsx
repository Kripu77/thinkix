'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { BoardProvider } from '@/features/board/hooks/use-board-state';
import { BoardSwitcher, useBoardStore } from '@/features/storage';
import { LoadingLogo } from '@thinkix/ui';

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
  {
    ssr: false,
  }
);

function BoardApp() {
  const { initialize, boards, currentBoard, isLoading, createBoard, switchBoard, deleteBoard, renameBoard } = useBoardStore();

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

  return (
    <main className="w-screen h-screen overflow-hidden bg-background">
      <BoardCanvas boardData={currentBoard}>
        <BoardToolbar />
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2" data-no-autosave>
          <BoardSwitcher
            boards={boards}
            currentBoardId={currentBoard?.id ?? null}
            onCreateBoard={handleCreateBoard}
            onSelectBoard={switchBoard}
            onDeleteBoard={deleteBoard}
            onRenameBoard={renameBoard}
          />
          <AppMenu boardName={currentBoard?.name} />
        </div>
      </BoardCanvas>
    </main>
  );
}

const AppMenu = dynamic(
  () => import('@/features/toolbar').then((mod) => mod.AppMenu),
  { ssr: false }
);

export default function HomePage() {
  return (
    <BoardProvider>
      <BoardApp />
    </BoardProvider>
  );
}
