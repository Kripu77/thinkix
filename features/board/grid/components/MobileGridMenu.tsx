'use client';

import { useState, useCallback } from 'react';
import { useBoard } from '@plait-board/react-board';
import { Grid3X3, Check } from 'lucide-react';
import { Button } from '@thinkix/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@thinkix/ui';
import { cn } from '@thinkix/ui';
import { useBoardState } from '@/features/board/hooks/use-board-state';
import { getGridConfig, setGridConfig } from '../grid-plugin';
import type { GridType, GridDensity, BoardBackground } from '../types';
import { GRID_DENSITIES, DEFAULT_BOARD_BACKGROUND } from '../types';

const GRID_TYPES: { type: GridType; label: string }[] = [
  { type: 'blank', label: 'Blank' },
  { type: 'dot', label: 'Dots' },
  { type: 'square', label: 'Lines' },
  { type: 'blueprint', label: 'Blueprint' },
  { type: 'isometric', label: 'Isometric' },
  { type: 'ruled', label: 'Ruled' },
];

export function MobileGridMenu() {
  const board = useBoard();
  const { state } = useBoardState();
  const [isOpen, setIsOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<BoardBackground | null>(null);

  const getCurrentConfig = useCallback(() => {
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
        >
          <Grid3X3 className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="w-56 p-4">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-1 pb-2">
          Background
        </DropdownMenuLabel>
        
        <div className="space-y-1">
          {GRID_TYPES.map((item) => (
            <button
              key={item.type}
              onClick={() => handleGridTypeChange(item.type)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                currentConfig.type === item.type && 'bg-accent'
              )}
            >
              <span>{item.label}</span>
              {currentConfig.type === item.type && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
        
        {currentConfig.type !== 'blank' && (
          <>
            <DropdownMenuSeparator className="my-3" />
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-1 pb-2">
              Spacing
            </DropdownMenuLabel>
            <div className="flex gap-1.5 px-1">
              {GRID_DENSITIES.map((density) => (
                <button
                  key={density}
                  onClick={() => handleDensityChange(density)}
                  className={cn(
                    'flex-1 h-9 text-xs font-medium rounded-md transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    currentConfig.density === density 
                      ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' 
                      : 'bg-muted/50'
                  )}
                >
                  {density}
                </button>
              ))}
            </div>
            
            {(currentConfig.type === 'square' ||
              currentConfig.type === 'blueprint' ||
              currentConfig.type === 'isometric' ||
              currentConfig.type === 'ruled') && (
              <>
                <DropdownMenuSeparator className="my-3" />
                <DropdownMenuCheckboxItem
                  checked={currentConfig.showMajor}
                  onCheckedChange={handleShowMajorChange}
                  className="px-1"
                >
                  <span className="text-sm">Major grid</span>
                </DropdownMenuCheckboxItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
