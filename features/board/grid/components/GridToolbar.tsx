'use client';

import { useState, useCallback, useMemo } from 'react';
import { useBoard } from '@plait-board/react-board';
import { ATTACHED_ELEMENT_CLASS_NAME } from '@plait/core';
import { ChevronUp } from 'lucide-react';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@thinkix/ui';
import { cn } from '@thinkix/ui';
import { useBoardState } from '@/features/board/hooks/use-board-state';
import { THEME } from '@/shared/constants';
import { getGridConfig, setGridConfig } from '../grid-plugin';
import type { GridType, GridDensity, BoardBackground } from '../types';
import { DEFAULT_BOARD_BACKGROUND } from '../types';
import { CANVAS_MODE_LABELS } from '../constants';
import { CanvasModePanel } from './CanvasModePanel';
import posthog from 'posthog-js';

const GRID_TYPE_PREVIEWS: Record<GridType, React.ReactNode> = {
  blank: (
    <div data-testid="canvas-mode-preview-blank" className="w-8 h-8 rounded bg-muted/50 border border-border" />
  ),
  dot: (
    <div data-testid="canvas-mode-preview-dot" className="w-8 h-8 rounded bg-muted/50 border border-border flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-muted-foreground" aria-hidden="true">
        <circle cx="6" cy="6" r="1.5" fill="currentColor" />
        <circle cx="12" cy="6" r="1.5" fill="currentColor" />
        <circle cx="18" cy="6" r="1.5" fill="currentColor" />
        <circle cx="6" cy="12" r="1.5" fill="currentColor" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <circle cx="18" cy="12" r="1.5" fill="currentColor" />
        <circle cx="6" cy="18" r="1.5" fill="currentColor" />
        <circle cx="12" cy="18" r="1.5" fill="currentColor" />
        <circle cx="18" cy="18" r="1.5" fill="currentColor" />
      </svg>
    </div>
  ),
  square: (
    <div data-testid="canvas-mode-preview-square" className="w-8 h-8 rounded bg-muted/50 border border-border flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-muted-foreground" aria-hidden="true">
        <line x1="8" y1="0" x2="8" y2="24" stroke="currentColor" strokeWidth="1" />
        <line x1="16" y1="0" x2="16" y2="24" stroke="currentColor" strokeWidth="1" />
        <line x1="0" y1="8" x2="24" y2="8" stroke="currentColor" strokeWidth="1" />
        <line x1="0" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  ),
  blueprint: (
    <div data-testid="canvas-mode-preview-blueprint" className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-400" aria-hidden="true">
        <line x1="8" y1="0" x2="8" y2="24" stroke="currentColor" strokeWidth="0.5" />
        <line x1="16" y1="0" x2="16" y2="24" stroke="currentColor" strokeWidth="0.5" />
        <line x1="0" y1="8" x2="24" y2="8" stroke="currentColor" strokeWidth="0.5" />
        <line x1="0" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="0.5" />
        <line x1="12" y1="0" x2="12" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.7" />
        <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      </svg>
    </div>
  ),
  isometric: (
    <div data-testid="canvas-mode-preview-isometric" className="w-8 h-8 rounded bg-muted/50 border border-border flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-muted-foreground" aria-hidden="true">
        <line x1="12" y1="2" x2="4" y2="14" stroke="currentColor" strokeWidth="0.75" />
        <line x1="12" y1="2" x2="20" y2="14" stroke="currentColor" strokeWidth="0.75" />
        <line x1="4" y1="14" x2="12" y2="22" stroke="currentColor" strokeWidth="0.75" />
        <line x1="20" y1="14" x2="12" y2="22" stroke="currentColor" strokeWidth="0.75" />
      </svg>
    </div>
  ),
  ruled: (
    <div data-testid="canvas-mode-preview-ruled" className="w-8 h-8 rounded bg-amber-50 border border-amber-200 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-500" aria-hidden="true">
        <line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="0.5" />
        <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="0.5" />
        <line x1="0" y1="18" x2="24" y2="18" stroke="currentColor" strokeWidth="0.5" />
        <line x1="8" y1="0" x2="8" y2="24" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  ),
};

export function GridToolbar() {
  const board = useBoard();
  const { state } = useBoardState();
  const [isOpen, setIsOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<BoardBackground | null>(null);

  const getCurrentConfig = useCallback((): BoardBackground => {
    if (localConfig) return localConfig;
    if (board) return getGridConfig(board);
    return DEFAULT_BOARD_BACKGROUND;
  }, [board, localConfig]);

  const handleGridTypeChange = useCallback((type: GridType) => {
    if (board) {
      const previousType = getGridConfig(board).type;
      setGridConfig(board, { type });
      setLocalConfig((prev) => (prev ? { ...prev, type } : { ...getGridConfig(board), type }));
      posthog.capture('grid_type_changed', { 
        previous_type: previousType,
        new_type: type,
      });
    }
  }, [board]);

  const handleDensityChange = useCallback((density: GridDensity) => {
    if (board) {
      const previousDensity = getGridConfig(board).density;
      setGridConfig(board, { density });
      setLocalConfig((prev) => (prev ? { ...prev, density } : { ...getGridConfig(board), density }));
      posthog.capture('grid_spacing_changed', { 
        previous_density: previousDensity,
        new_density: density,
      });
    }
  }, [board]);

  const handleShowMajorChange = useCallback((showMajor: boolean) => {
    if (board) {
      setGridConfig(board, { showMajor });
      setLocalConfig((prev) => (prev ? { ...prev, showMajor } : { ...getGridConfig(board), showMajor }));
      posthog.capture('major_grid_toggled', { enabled: showMajor });
    }
  }, [board]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setLocalConfig(null);
    }
  }, []);

  const currentConfig = getCurrentConfig();

  const triggerContent = useMemo(() => {
    const preview = GRID_TYPE_PREVIEWS[currentConfig.type];
    const label = CANVAS_MODE_LABELS[currentConfig.type];
    return { preview, label };
  }, [currentConfig.type]);

  if (!board || state.isMobile) return null;

  return (
    <div
      data-testid="canvas-mode-toolbar"
      className={cn(
        'absolute bottom-4 right-4 inline-flex items-center gap-0.5 rounded-lg p-1',
        THEME.control.container,
        ATTACHED_ELEMENT_CLASS_NAME
      )}
    >
      <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 px-2 text-foreground hover:bg-accent/85"
            title="Canvas mode"
            data-testid="canvas-mode-trigger"
          >
            {triggerContent.preview}
            <span className="text-sm font-medium">{triggerContent.label}</span>
            <ChevronUp className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className={THEME.dropdown.content}>
          <CanvasModePanel
            config={currentConfig}
            onTypeChange={handleGridTypeChange}
            onDensityChange={handleDensityChange}
            onShowMajorChange={handleShowMajorChange}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
