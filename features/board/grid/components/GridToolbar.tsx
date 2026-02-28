'use client';

import { useState, useCallback } from 'react';
import { useBoard } from '@plait-board/react-board';
import { ATTACHED_ELEMENT_CLASS_NAME } from '@plait/core';
import { Grid3X3, ChevronUp, Check, Circle, Square, Hexagon, LayoutGrid, AlignLeft } from 'lucide-react';
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

const GRID_TYPES: { type: GridType; label: string; icon: React.ReactNode; preview: React.ReactNode }[] = [
  {
    type: 'blank',
    label: 'Blank',
    icon: <Circle className="h-4 w-4" />,
    preview: (
      <div className="w-8 h-8 rounded bg-muted/50 border border-border" />
    ),
  },
  {
    type: 'dot',
    label: 'Dots',
    icon: <LayoutGrid className="h-4 w-4" />,
    preview: (
      <div className="w-8 h-8 rounded bg-muted/50 border border-border flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-muted-foreground">
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
  },
  {
    type: 'square',
    label: 'Lines',
    icon: <Grid3X3 className="h-4 w-4" />,
    preview: (
      <div className="w-8 h-8 rounded bg-muted/50 border border-border flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-muted-foreground">
          <line x1="8" y1="0" x2="8" y2="24" stroke="currentColor" strokeWidth="1" />
          <line x1="16" y1="0" x2="16" y2="24" stroke="currentColor" strokeWidth="1" />
          <line x1="0" y1="8" x2="24" y2="8" stroke="currentColor" strokeWidth="1" />
          <line x1="0" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
    ),
  },
  {
    type: 'blueprint',
    label: 'Blueprint',
    icon: <Square className="h-4 w-4" />,
    preview: (
      <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-400">
          <line x1="8" y1="0" x2="8" y2="24" stroke="currentColor" strokeWidth="0.5" />
          <line x1="16" y1="0" x2="16" y2="24" stroke="currentColor" strokeWidth="0.5" />
          <line x1="0" y1="8" x2="24" y2="8" stroke="currentColor" strokeWidth="0.5" />
          <line x1="0" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="0.5" />
          <line x1="12" y1="0" x2="12" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.7" />
          <line x1="12" y1="0" x2="12" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.7" />
        </svg>
      </div>
    ),
  },
  {
    type: 'isometric',
    label: 'Isometric',
    icon: <Hexagon className="h-4 w-4" />,
    preview: (
      <div className="w-8 h-8 rounded bg-muted/50 border border-border flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-muted-foreground">
          <line x1="12" y1="2" x2="4" y2="14" stroke="currentColor" strokeWidth="0.75" />
          <line x1="12" y1="2" x2="20" y2="14" stroke="currentColor" strokeWidth="0.75" />
          <line x1="4" y1="14" x2="12" y2="22" stroke="currentColor" strokeWidth="0.75" />
          <line x1="20" y1="14" x2="12" y2="22" stroke="currentColor" strokeWidth="0.75" />
        </svg>
      </div>
    ),
  },
  {
    type: 'ruled',
    label: 'Ruled',
    icon: <AlignLeft className="h-4 w-4" />,
    preview: (
      <div className="w-8 h-8 rounded bg-amber-50 border border-amber-200 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-500">
          <line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="0.5" />
          <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="0.5" />
          <line x1="0" y1="18" x2="24" y2="18" stroke="currentColor" strokeWidth="0.5" />
          <line x1="8" y1="0" x2="8" y2="24" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    ),
  },
];

export function GridToolbar() {
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
      setLocalConfig((prev) => (prev ? { ...prev, type } : { ...getGridConfig(board), type }));
    }
  }, [board]);

  const handleDensityChange = useCallback((density: GridDensity) => {
    if (board) {
      setGridConfig(board, { density });
      setLocalConfig((prev) => (prev ? { ...prev, density } : { ...getGridConfig(board), density }));
    }
  }, [board]);

  const handleShowMajorChange = useCallback((showMajor: boolean) => {
    if (board) {
      setGridConfig(board, { showMajor });
      setLocalConfig((prev) => (prev ? { ...prev, showMajor } : { ...getGridConfig(board), showMajor }));
    }
  }, [board]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setLocalConfig(null);
    }
  }, []);

  if (!board || state.isMobile) return null;

  const currentConfig = getCurrentConfig();
  const currentType = GRID_TYPES.find((t) => t.type === currentConfig.type);

  return (
    <div
      className={cn(
        'absolute bottom-4 right-4 inline-flex items-center gap-0.5 rounded-lg border bg-background/95 backdrop-blur p-1 shadow-lg',
        ATTACHED_ELEMENT_CLASS_NAME
      )}
    >
      <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 gap-2"
            title="Canvas mode"
          >
            {currentType?.preview}
            <span className="text-sm font-medium">{currentType?.label}</span>
            <ChevronUp className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-72 p-6">
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-1 pb-3">
            Canvas Mode
          </DropdownMenuLabel>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {GRID_TYPES.map((item) => (
              <button
                key={item.type}
                onClick={() => handleGridTypeChange(item.type)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all duration-150',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                  currentConfig.type === item.type && 'bg-accent/50 ring-1 ring-primary/50'
                )}
              >
                <div className="relative">
                  {item.preview}
                  {currentConfig.type === item.type && (
                    <div className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-2 w-2 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {currentConfig.type !== 'blank' && (
            <>
              <DropdownMenuSeparator className="my-3" />
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-1 pb-2">
                Grid Spacing
              </DropdownMenuLabel>
              <div className="flex gap-1.5 px-1">
                {GRID_DENSITIES.map((density) => (
                  <button
                    key={density}
                    onClick={() => handleDensityChange(density)}
                    className={cn(
                      'flex-1 h-9 text-xs font-medium rounded-md transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-ring',
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
                    <span className="text-sm">Show major grid</span>
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
