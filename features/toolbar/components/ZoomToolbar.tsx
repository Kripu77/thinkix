'use client';

import { useState } from 'react';
import { useBoard } from '@plait-board/react-board';
import { BoardTransforms, ATTACHED_ELEMENT_CLASS_NAME } from '@plait/core';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@thinkix/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@thinkix/ui';
import { cn } from '@thinkix/ui';

const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

export function ZoomToolbar() {
  const board = useBoard();
  const [isOpen, setIsOpen] = useState(false);

  if (!board) return null;

  const currentZoom = board.viewport?.zoom || 1;
  const zoomPercentage = Math.round(currentZoom * 100);

  const handleZoomIn = () => {
    const newZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
    BoardTransforms.updateZoom(board, newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
    BoardTransforms.updateZoom(board, newZoom);
  };

  const handleFitToScreen = () => {
    BoardTransforms.fitViewport(board);
    setIsOpen(false);
  };

  const handleResetZoom = () => {
    BoardTransforms.updateZoom(board, 1);
    setIsOpen(false);
  };

  return (
    <div
      className={cn(
        'absolute bottom-4 left-4 z-50 inline-flex items-center gap-0.5 rounded-lg border bg-background/95 backdrop-blur p-1 shadow-lg',
        ATTACHED_ELEMENT_CLASS_NAME
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleZoomOut}
        disabled={currentZoom <= MIN_ZOOM}
        title="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="h-8 min-w-[60px] px-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
            title="Zoom options"
          >
            {zoomPercentage}%
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="min-w-[140px]">
          <DropdownMenuItem onClick={handleFitToScreen}>
            Fit to screen
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleResetZoom}>
            100%
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleZoomIn}
        disabled={currentZoom >= MAX_ZOOM}
        title="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
