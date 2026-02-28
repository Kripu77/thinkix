'use client';

import { useState, useCallback } from 'react';
import { useBoard } from '@plait-board/react-board';
import { getGridConfig, setGridConfig } from '../grid-plugin';
import type { GridType, GridDensity, BoardBackground } from '../types';
import { DEFAULT_BOARD_BACKGROUND } from '../types';

export function useGridConfig() {
  const board = useBoard();
  const [localConfig, setLocalConfig] = useState<BoardBackground | null>(null);

  const getCurrentConfig = useCallback((): BoardBackground => {
    if (localConfig) return localConfig;
    if (board) return getGridConfig(board);
    return DEFAULT_BOARD_BACKGROUND;
  }, [board, localConfig]);

  const handleGridTypeChange = useCallback((type: GridType) => {
    if (board) {
      setGridConfig(board, { type });
      setLocalConfig((prev) => 
        prev ? { ...prev, type } : { ...getGridConfig(board), type }
      );
    }
  }, [board]);

  const handleDensityChange = useCallback((density: GridDensity) => {
    if (board) {
      setGridConfig(board, { density });
      setLocalConfig((prev) => 
        prev ? { ...prev, density } : { ...getGridConfig(board), density }
      );
    }
  }, [board]);

  const handleShowMajorChange = useCallback((showMajor: boolean) => {
    if (board) {
      setGridConfig(board, { showMajor });
      setLocalConfig((prev) => 
        prev ? { ...prev, showMajor } : { ...getGridConfig(board), showMajor }
      );
    }
  }, [board]);

  const resetLocalConfig = useCallback(() => {
    setLocalConfig(null);
  }, []);

  return {
    board,
    currentConfig: getCurrentConfig(),
    handleGridTypeChange,
    handleDensityChange,
    handleShowMajorChange,
    resetLocalConfig,
  };
}
