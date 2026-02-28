'use client';

import { useState, useCallback } from 'react';
import { useBoard } from '@plait-board/react-board';
import { Grid3X3 } from 'lucide-react';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@thinkix/ui';
import { useBoardState } from '@/features/board/hooks/use-board-state';
import { getGridConfig, setGridConfig } from '../grid-plugin';
import type { GridType, GridDensity, BoardBackground } from '../types';
import { DEFAULT_BOARD_BACKGROUND } from '../types';
import { CanvasModePanel } from './CanvasModePanel';

export function MobileGridMenu() {
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
      setGridConfig(board, { type });
      setLocalConfig(prev => prev ? { ...prev, type } : { ...getGridConfig(board), type });
    }
  }, [board]);

  const handleDensityChange = useCallback((density: GridDensity) => {
    if (board) {
      setGridConfig(board, { density });
      setLocalConfig(prev => prev ? { ...prev, density } : { ...getGridConfig(board), density });
    }
  }, [board]);

  const handleShowMajorChange = useCallback((showMajor: boolean) => {
    if (board) {
      setGridConfig(board, { showMajor });
      setLocalConfig(prev => prev ? { ...prev, showMajor } : { ...getGridConfig(board), showMajor });
    }
  }, [board]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setLocalConfig(null);
    }
  }, []);

  if (!board || !state.isMobile) return null;

  const currentConfig = getCurrentConfig();

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 flex items-center justify-center"
          aria-label="Canvas mode"
          data-testid="canvas-mode-trigger-mobile"
        >
          <Grid3X3 className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom">
        <CanvasModePanel
          config={currentConfig}
          onTypeChange={handleGridTypeChange}
          onDensityChange={handleDensityChange}
          onShowMajorChange={handleShowMajorChange}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
