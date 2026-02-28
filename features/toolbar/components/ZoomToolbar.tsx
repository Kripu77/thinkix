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
import { useBoardState } from '@/features/board/hooks/use-board-state';
import posthog from 'posthog-js';

const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

export function ZoomToolbar() {
  const board = useBoard();
  const { state } = useBoardState();
  const [isOpen, setIsOpen] = useState(false);

  // Hidden on mobile: touch devices use pinch-to-zoom gesture instead
  if (!board || state.isMobile) return null;

  const currentZoom = board.viewport?.zoom || 1;
  const zoomPercentage = Math.round(currentZoom * 100);

  const handleZoomIn = () => {
    const newZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
    BoardTransforms.updateZoom(board, newZoom);
    posthog.capture('zoom_changed', { 
      action: 'zoom_in',
      previous_zoom: currentZoom,
      new_zoom: newZoom,
      zoom_percentage: Math.round(newZoom * 100),
    });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
    BoardTransforms.updateZoom(board, newZoom);
    posthog.capture('zoom_changed', { 
      action: 'zoom_out',
      previous_zoom: currentZoom,
      new_zoom: newZoom,
      zoom_percentage: Math.round(newZoom * 100),
    });
  };

  const handleFitToScreen = () => {
    BoardTransforms.fitViewport(board);
    setIsOpen(false);
    const newZoom = board.viewport?.zoom || 1;
    posthog.capture('zoom_fit_to_screen', { zoom: Math.round(newZoom * 100) });
  };

  const handleResetZoom = () => {
    BoardTransforms.updateZoom(board, 1);
    setIsOpen(false);
    posthog.capture('zoom_reset', { previous_zoom: currentZoom });
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border bg-background/95 backdrop-blur p-1 shadow-lg',
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
