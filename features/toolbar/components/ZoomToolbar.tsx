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
import { THEME } from '@/shared/constants';
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
      data-testid="zoom-toolbar"
      className={cn(
        THEME.control.container,
        ATTACHED_ELEMENT_CLASS_NAME
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className={THEME.control.button}
        onClick={handleZoomOut}
        disabled={currentZoom <= MIN_ZOOM}
        title="Zoom out"
      >
        <Minus className="h-[var(--tx-control-icon)] w-[var(--tx-control-icon)]" />
      </Button>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={THEME.control.percentage}
            title="Zoom options"
          >
            {zoomPercentage}%
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className={THEME.dropdown.content}>
          <DropdownMenuItem onClick={handleFitToScreen} className={THEME.dropdown.item}>
            Fit to screen
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleResetZoom} className={THEME.dropdown.item}>
            100%
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        className={THEME.control.button}
        onClick={handleZoomIn}
        disabled={currentZoom >= MAX_ZOOM}
        title="Zoom in"
      >
        <Plus className="h-[var(--tx-control-icon)] w-[var(--tx-control-icon)]" />
      </Button>
    </div>
  );
}
