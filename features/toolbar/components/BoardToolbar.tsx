'use client';

import { useState } from 'react';
import {
  Undo,
  Redo,
  Copy,
  Trash2,
  ChevronDown,
  Pencil,
} from 'lucide-react';

import { useBoard } from '@plait-board/react-board';
import {
  getSelectedElements,
  deleteFragment,
  duplicateElements,
} from '@plait/core';
import { Button } from '@thinkix/ui';
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
} from '@/shared/constants';

export function BoardToolbar() {
  const board = useBoard();
  const { state, setActiveTool, toggleHanddrawn } = useBoardState();
  const activeTool = state.activeTool;
  const handdrawn = state.handdrawn;
  const [isShapeMenuOpen, setIsShapeMenuOpen] = useState(false);

  if (!board) return null;

  const selectedElements = getSelectedElements(board);
  const isUndoDisabled = board.history ? board.history.undos.length === 0 : true;
  const isRedoDisabled = board.history ? board.history.redos.length === 0 : true;

  const handleToolChange = (value: string) => {
    if (!value) return;
    setActiveTool(value as DrawingTool);
  };

  const isShapeActive = SHAPE_TOOLS.some((t) => t === activeTool);
  const activeShapeTool = SHAPE_TOOL_CONFIGS.find((t) => t.id === activeTool);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="inline-flex items-center gap-0.5 rounded-lg border bg-background/95 backdrop-blur p-1.5 shadow-lg">
          <ToggleGroup
            type="single"
            value={activeTool}
            onValueChange={handleToolChange}
          >
            {BASIC_TOOLS.map((tool) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value={tool.id}
                    aria-label={tool.label}
                    className={TOOLBAR_ITEM_CLASS}
                  >
                    {tool.icon}
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{tool.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </ToggleGroup>

          <div className="mx-1 h-7 w-px bg-border" />

          <DropdownMenu
            open={isShapeMenuOpen}
            onOpenChange={setIsShapeMenuOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant={isShapeActive ? 'default' : 'ghost'}
                size="icon"
                className={BUTTON_CLASS}
                aria-label="Shapes"
              >
                {activeShapeTool ? (
                  activeShapeTool.icon
                ) : (
                  <ChevronDown className="h-6 w-6" />
                )}
                <ChevronDown className="h-2.5 w-2.5 absolute bottom-0.5 right-0.5 opacity-50" />
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

          <div className="mx-1 h-7 w-px bg-border" />

          <ToggleGroup
            type="single"
            value={activeTool}
            onValueChange={handleToolChange}
          >
            {OTHER_TOOL_CONFIGS.map((tool) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value={tool.id}
                    aria-label={tool.label}
                    className={TOOLBAR_ITEM_CLASS}
                  >
                    {tool.icon}
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{tool.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </ToggleGroup>

          <div className="mx-1 h-7 w-px bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`${BUTTON_CLASS} ${handdrawn ? 'bg-accent text-accent-foreground' : ''}`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleHanddrawn();
                }}
              >
                <Pencil className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{handdrawn ? 'Disable Handdrawn Mode' : 'Enable Handdrawn Mode'}</p>
            </TooltipContent>
          </Tooltip>

          <div className="mx-1 h-7 w-px bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={BUTTON_CLASS}
                disabled={isUndoDisabled}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  board.undo();
                }}
              >
                <Undo className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Undo</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={BUTTON_CLASS}
                disabled={isRedoDisabled}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  board.redo();
                }}
              >
                <Redo className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Redo</p>
            </TooltipContent>
          </Tooltip>

          {selectedElements.length > 0 && (
            <>
              <div className="mx-1 h-5 w-px bg-border" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={BUTTON_CLASS}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      duplicateElements(board);
                    }}
                  >
                    <Copy className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Duplicate</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`${BUTTON_CLASS} hover:bg-destructive/10 hover:text-destructive`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteFragment(board);
                    }}
                  >
                    <Trash2 className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Delete</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
