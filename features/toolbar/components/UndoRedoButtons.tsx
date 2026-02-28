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
import { cn } from '@thinkix/ui';
import posthog from 'posthog-js';

export function UndoRedoButtons() {
  const board = useBoard();
  const { state } = useBoardState();

  if (!board) return null;

  const isUndoDisabled = board.history ? board.history.undos.length === 0 : true;
  const isRedoDisabled = board.history ? board.history.redos.length === 0 : true;

  const handleUndo = () => {
    const undoCount = board.history?.undos.length || 0;
    posthog.capture('undo_triggered', { 
      undo_stack_size: undoCount,
      redo_stack_size: board.history?.redos.length || 0,
    });
    board.undo();
  };

  const handleRedo = () => {
    const redoCount = board.history?.redos.length || 0;
    posthog.capture('redo_triggered', { 
      redo_stack_size: redoCount,
      undo_stack_size: board.history?.undos.length || 0,
    });
    board.redo();
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
              disabled={isUndoDisabled}
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
              disabled={isRedoDisabled}
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
