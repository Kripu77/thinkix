'use client';

import { Undo, Redo } from 'lucide-react';
import { useBoard } from '@plait-board/react-board';
import { Button } from '@thinkix/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@thinkix/ui';
import { useBoardState } from '@/features/board/hooks/use-board-state';
import { useUndoRedo } from '@thinkix/collaboration';
import { cn } from '@thinkix/ui';
import posthog from 'posthog-js';

export function UndoRedoButtons() {
  const board = useBoard();
  const { state } = useBoardState();
  const { canUndo, canRedo, undoStackSize, redoStackSize, isCollaborationMode, undo, redo } = useUndoRedo(board);

  if (!board) return null;

  const handleUndo = () => {
    posthog.capture('undo_triggered', { 
      undo_stack_size: undoStackSize,
      redo_stack_size: redoStackSize,
      collaboration_mode: isCollaborationMode,
    });
    undo();
  };

  const handleRedo = () => {
    posthog.capture('redo_triggered', { 
      redo_stack_size: redoStackSize,
      undo_stack_size: undoStackSize,
      collaboration_mode: isCollaborationMode,
    });
    redo();
  };

  return (
    <div className={cn(
      "flex items-center gap-0.5 rounded-lg border bg-background/95 backdrop-blur px-1 py-1 shadow-lg",
      state.isMobile && "px-0.5 py-0.5"
    )}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 flex items-center justify-center rounded-md p-0",
                state.isMobile && "h-7 w-7"
              )}
              disabled={!canUndo}
              onPointerDown={(e: React.PointerEvent) => {
                e.preventDefault();
                e.stopPropagation();
                handleUndo();
              }}
            >
              <Undo className={cn("h-4 w-4", state.isMobile && "h-3.5 w-3.5")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Undo</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 flex items-center justify-center rounded-md p-0",
                state.isMobile && "h-7 w-7"
              )}
              disabled={!canRedo}
              onPointerDown={(e: React.PointerEvent) => {
                e.preventDefault();
                e.stopPropagation();
                handleRedo();
              }}
            >
              <Redo className={cn("h-4 w-4", state.isMobile && "h-3.5 w-3.5")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Redo</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
