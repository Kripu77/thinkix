'use client';

import { useState } from 'react';
import {
  Copy,
  Trash2,
  ChevronDown,
} from 'lucide-react';

import { useBoard } from '@plait-board/react-board';
import {
  getSelectedElements,
  deleteFragment,
  duplicateElements,
} from '@plait/core';
import { Button, cn } from '@thinkix/ui';
import { ToggleGroup, ToggleGroupItem } from '@thinkix/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@thinkix/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@thinkix/ui';
import { useBoardState } from '@/features/board/hooks/use-board-state';
import type { DrawingTool } from '@thinkix/shared';
import {
  SHAPE_TOOLS,
  BASIC_TOOLS,
  SHAPE_TOOL_CONFIGS,
  OTHER_TOOL_CONFIGS,
  TOOLBAR_ITEM_CLASS,
  BUTTON_CLASS,
  SHAPE_DROPDOWN_ICON,
  ARROW_TOOL,
  HANDRAWN_ICON,
  DRAWING_SECTION_TOOLS,
} from '@/shared/constants';

export function BoardToolbar() {
  const board = useBoard();
  const { state, setActiveTool, toggleHanddrawn } = useBoardState();
  const activeTool = state.activeTool;
  const handdrawn = state.handdrawn;
  const isMobile = state.isMobile;
  const [isShapeMenuOpen, setIsShapeMenuOpen] = useState(false);

  if (!board) return null;

  const selectedElements = getSelectedElements(board);

  const handleToolChange = (value: string) => {
    if (!value) return;
    setActiveTool(value as DrawingTool);
  };

  const isShapeActive = SHAPE_TOOLS.some((t) => t === activeTool);
  const activeShapeTool = SHAPE_TOOL_CONFIGS.find((t) => t.id === activeTool);

  const toolbarPositionClass = isMobile 
    ? 'absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)]' 
    : 'absolute top-4 left-1/2 -translate-x-1/2 z-50';

  const buttonSizeClass = isMobile ? 'h-8 w-8' : 'h-9 w-9';
  const iconSizeClass = isMobile ? 'h-4 w-4' : 'h-5 w-5';
  const separatorClass = isMobile ? 'mx-1 h-5 w-px bg-border' : 'mx-1.5 h-6 w-px bg-border';

  return (
    <TooltipProvider delayDuration={300}>
      <div className={toolbarPositionClass}>
        <div className="inline-flex items-center rounded-lg border bg-background/95 backdrop-blur px-1 py-1 shadow-lg overflow-x-auto w-full justify-center">
          <ToggleGroup
            type="single"
            value={activeTool}
            onValueChange={handleToolChange}
            className="items-center"
          >
            {BASIC_TOOLS.map((tool) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value={tool.id}
                    aria-label={tool.label}
                    className={`${TOOLBAR_ITEM_CLASS} ${buttonSizeClass} flex items-center justify-center`}
                  >
                    <span className={iconSizeClass}>{tool.icon}</span>
                  </ToggleGroupItem>
                </TooltipTrigger>
                {!isMobile && (
                  <TooltipContent side="bottom">
                    <p>{tool.label}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </ToggleGroup>

          <div className={separatorClass} />

          <ToggleGroup
            type="single"
            value={activeTool}
            onValueChange={handleToolChange}
            className="items-center"
          >
            {DRAWING_SECTION_TOOLS.map((tool: typeof DRAWING_SECTION_TOOLS[number]) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value={tool.id}
                    aria-label={tool.label}
                    className={`${TOOLBAR_ITEM_CLASS} ${buttonSizeClass} flex items-center justify-center`}
                  >
                    <span className={iconSizeClass}>{tool.icon}</span>
                  </ToggleGroupItem>
                </TooltipTrigger>
                {!isMobile && (
                  <TooltipContent side="bottom">
                    <p>{tool.label}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </ToggleGroup>

          <DropdownMenu
            open={isShapeMenuOpen}
            onOpenChange={setIsShapeMenuOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant={isShapeActive ? 'default' : 'ghost'}
                size="icon"
                className={`${BUTTON_CLASS} ${buttonSizeClass} flex items-center justify-center relative`}
                aria-label="Shapes"
              >
                <span className={iconSizeClass}>
                  {activeShapeTool ? activeShapeTool.icon : SHAPE_DROPDOWN_ICON}
                </span>
                {!isMobile && <ChevronDown className="h-2.5 w-2.5 absolute bottom-0 right-0.5 opacity-50" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              side="bottom"
              className="w-44"
            >
              {SHAPE_TOOL_CONFIGS.map((tool) => (
                <DropdownMenuItem
                  key={tool.id}
                  onClick={() => {
                    handleToolChange(tool.id);
                    setIsShapeMenuOpen(false);
                  }}
                  className={activeTool === tool.id ? 'bg-accent' : ''}
                >
                  <div className="flex items-center gap-2">
                    <span className="shrink-0">{tool.icon}</span>
                    <span>{tool.label}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === 'arrow' ? 'default' : 'ghost'}
                size="icon"
                className={`${BUTTON_CLASS} ${buttonSizeClass} flex items-center justify-center`}
                onPointerDown={(e: React.PointerEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToolChange('arrow');
                }}
              >
                <span className={iconSizeClass}>{ARROW_TOOL.icon}</span>
              </Button>
            </TooltipTrigger>
            {!isMobile && (
              <TooltipContent side="bottom">
                <p>{ARROW_TOOL.label}</p>
              </TooltipContent>
            )}
          </Tooltip>

          <div className={separatorClass} />

          <ToggleGroup
            type="single"
            value={activeTool}
            onValueChange={handleToolChange}
            className="items-center"
          >
            {OTHER_TOOL_CONFIGS.map((tool) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value={tool.id}
                    aria-label={tool.label}
                    className={`${TOOLBAR_ITEM_CLASS} ${buttonSizeClass} flex items-center justify-center`}
                  >
                    <span className={iconSizeClass}>{tool.icon}</span>
                  </ToggleGroupItem>
                </TooltipTrigger>
                {!isMobile && (
                  <TooltipContent side="bottom">
                    <p>{tool.label}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </ToggleGroup>

          <div className={separatorClass} />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`${buttonSizeClass} flex items-center justify-center ${handdrawn ? 'bg-accent text-accent-foreground' : ''}`}
                onPointerDown={(e: React.PointerEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleHanddrawn();
                }}
              >
                <span className={iconSizeClass}>{HANDRAWN_ICON}</span>
              </Button>
            </TooltipTrigger>
            {!isMobile && (
              <TooltipContent side="bottom">
                <p>{handdrawn ? 'Disable Handdrawn Mode' : 'Enable Handdrawn Mode'}</p>
              </TooltipContent>
            )}
          </Tooltip>

          {selectedElements.length > 0 && (
            <>
              <div className={separatorClass} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`${buttonSizeClass} flex items-center justify-center`}
                    onPointerDown={(e: React.PointerEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      duplicateElements(board);
                    }}
                  >
                    <Copy className={iconSizeClass} />
                  </Button>
                </TooltipTrigger>
                {!isMobile && (
                  <TooltipContent side="bottom">
                    <p>Duplicate</p>
                  </TooltipContent>
                )}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`${buttonSizeClass} flex items-center justify-center hover:bg-destructive/10 hover:text-destructive`}
                    onPointerDown={(e: React.PointerEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteFragment(board);
                    }}
                  >
                    <Trash2 className={iconSizeClass} />
                  </Button>
                </TooltipTrigger>
                {!isMobile && (
                  <TooltipContent side="bottom">
                    <p>Delete</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
