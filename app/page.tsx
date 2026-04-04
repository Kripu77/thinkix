'use client';
 
import { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { BoardProvider } from '@/features/board/hooks/use-board-state';
import { BoardSwitcher, useBoardStore } from '@/features/storage';
import { LoadingLogo } from '@thinkix/ui';
import {
  Room,
  CollaborativeBoard,
  CollaborationStatusBar,
  CollaborativeAppMenu,
  CollaborateButton,
  CollaborationStartDialog,
} from '@/features/collaboration';
import { useCollaborationState, useCollaborationSession } from '@thinkix/collaboration';
import { BoardLayoutSlots } from '@/features/board';
import { Sparkles } from 'lucide-react';
import { Button } from '@thinkix/ui';
 
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
 
const AgentPane = dynamic(
  () => import('@/features/agent').then((mod) => mod.AgentPane),
  { ssr: false }
);

const DEFAULT_AGENT_WIDTH = 384;

function BoardAppContent() {
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentWidth, setAgentWidth] = useState(DEFAULT_AGENT_WIDTH);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomFromUrl = searchParams.get('room');
 
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setAgentOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
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
 
  const roomUrl = useMemo(() => {
    if (typeof window === 'undefined' || !roomFromUrl) return '';
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomFromUrl);
    return url.toString();
  }, [roomFromUrl]);
 
  const showStartDialog = useMemo(() => {
    return isEnabled && !!roomFromUrl && session.isInitiator && !session.wasDialogSeen;
  }, [isEnabled, roomFromUrl, session.isInitiator, session.wasDialogSeen]);

  const handleEnableCollaboration = useCallback(() => {
    const roomId = crypto.randomUUID();
    
    session.prepareAsCreator(roomId);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('room', roomId);
    router.push(`${pathname}?${params.toString()}`);
    
    enableCollaboration(roomId);
  }, [pathname, searchParams, router, enableCollaboration, session]);
 
  useEffect(() => {
    if (roomFromUrl && session.isInitiator === false) {
      if (session.checkAndConsumePendingCreator()) {
        session.markAsInitiator();
        session.clearDisabled();
      }
    }
  }, [roomFromUrl, session]);
 
  const handleDisableCollaboration = useCallback(() => {
    session.markAsDisabled();
    disableCollaboration();
    
    if (roomFromUrl) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('room');
      const newSearch = params.toString();
      router.push(newSearch ? `${pathname}?${newSearch}` : pathname);
    }
  }, [disableCollaboration, roomFromUrl, pathname, searchParams, router, session]);
 
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
 
  const aiToggleButton = (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setAgentOpen((prev) => !prev)}
      aria-label="Toggle Thinkix AI"
    >
      <Sparkles className="h-4 w-4" />
    </Button>
  );
 
  const topRightSlot = !isEnabled ? (
    <div className="flex items-center gap-2">
      {aiToggleButton}
      <CollaborateButton onClick={handleEnableCollaboration} />
    </div>
  ) : undefined;
 
  const collaborativeTopRightSlot = (
    <div className="flex items-center gap-2">
      {aiToggleButton}
      <CollaborationStatusBar
        roomId={activeRoomId!}
        onDisableCollaboration={handleDisableCollaboration}
      />
    </div>
  );
 
  if (isEnabled && activeRoomId) {
    return (
      <>
        <Room roomId={activeRoomId} initialElements={currentBoard?.elements}>
          <CollaborativeBoard>
            <div 
              className="relative w-screen h-screen overflow-hidden bg-background transition-[padding] duration-200"
              style={{ paddingRight: agentOpen ? `${agentWidth}px` : 0 }}
            >
              <BoardCanvas boardData={currentBoard}>
                <BoardToolbar />
                <BoardLayoutSlots
                  topLeft={collaborativeTopLeftSlot}
                  bottomLeft={bottomLeftSlot}
                  topRight={collaborativeTopRightSlot}
                />
              </BoardCanvas>
              <AgentPane 
                open={agentOpen} 
                onClose={() => setAgentOpen(false)}
                width={agentWidth}
                onWidthChange={setAgentWidth}
              />
            </div>
          </CollaborativeBoard>
        </Room>

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
      <div 
        className="relative w-screen h-screen overflow-hidden bg-background transition-[padding] duration-200"
        style={{ paddingRight: agentOpen ? `${agentWidth}px` : 0 }}
      >
        <BoardCanvas boardData={currentBoard}>
          <BoardToolbar />
          <BoardLayoutSlots
            topLeft={topLeftSlot}
            bottomLeft={bottomLeftSlot}
            topRight={topRightSlot}
          />
        </BoardCanvas>
        <AgentPane 
          open={agentOpen} 
          onClose={() => setAgentOpen(false)}
          width={agentWidth}
          onWidthChange={setAgentWidth}
        />
      </div>
 
      <CollaborationStartDialog
        open={showStartDialog}
        onOpenChange={handleDialogClose}
        roomUrl={roomUrl}
      />
    </>
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
