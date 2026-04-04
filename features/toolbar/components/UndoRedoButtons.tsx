'use client';

import { useEffect } from 'react';
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
import { THEME } from '@/shared/constants';
import posthog from 'posthog-js';

export function UndoRedoButtons() {
  const board = useBoard();
  const { state } = useBoardState();
  const { canUndo, canRedo, undoStackSize, redoStackSize, isCollaborationMode, undo, redo } = useUndoRedo(board);

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

  const iconClass = "h-[var(--tx-control-icon)] w-[var(--tx-control-icon)]";
  const mobileIconClass = cn(iconClass, state.isMobile && "h-3.5 w-3.5");
  const mobileButtonClass = state.isMobile ? "h-7 w-7" : "";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          !!target.closest(
            'input, textarea, select, [contenteditable="true"], [data-slate-editor="true"]',
          ))
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === 'z' && !event.shiftKey && canUndo) {
        event.preventDefault();
        undo();
        return;
      }

      if ((key === 'y' || (key === 'z' && event.shiftKey)) && canRedo) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canRedo, canUndo, redo, undo]);

  if (!board) return null;

  return (
    <div className={THEME.control.container}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(THEME.control.button, mobileButtonClass)}
              data-testid="undo-button"
              disabled={!canUndo}
              onPointerDown={(e: React.PointerEvent) => {
                e.preventDefault();
                e.stopPropagation();
                handleUndo();
              }}
            >
              <Undo className={mobileIconClass} />
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
              className={cn(THEME.control.button, mobileButtonClass)}
              data-testid="redo-button"
              disabled={!canRedo}
              onPointerDown={(e: React.PointerEvent) => {
                e.preventDefault();
                e.stopPropagation();
                handleRedo();
              }}
            >
              <Redo className={mobileIconClass} />
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
