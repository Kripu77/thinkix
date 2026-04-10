'use client';

import { useState } from 'react';
import {
  Copy,
  Trash2,
} from 'lucide-react';

import { useBoard } from '@plait-board/react-board';
import {
  getSelectedElements,
  deleteFragment,
  duplicateElements,
} from '@plait/core';
import { Button } from '@thinkix/ui';
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
import { MobileGridMenu } from '@/features/board/grid/components';
import type { DrawingTool } from '@thinkix/shared';
import {
  SHAPE_TOOLS,
  BASIC_TOOLS,
  SHAPE_TOOL_CONFIGS,
  OTHER_TOOL_CONFIGS,
  SHAPE_DROPDOWN_ICON,
  ARROW_TOOL,
  HANDRAWN_ICON,
  DRAWING_SECTION_TOOLS,
  THEME,
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

  const handleToolPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const createToolClickHandler = (toolId: string) => () => {
    handleToolChange(toolId);
  };

  const isShapeActive = SHAPE_TOOLS.some((t) => t === activeTool);
  const activeShapeTool = SHAPE_TOOL_CONFIGS.find((t) => t.id === activeTool);
  const imageToolConfig = OTHER_TOOL_CONFIGS.find((t) => t.id === 'image');

  const buttonClass = THEME.toolbar.button;
  const buttonSelectedClass = THEME.toolbar.buttonSelected;
  const iconClass = `h-[var(--tx-toolbar-icon)] w-[var(--tx-toolbar-icon)]`;
  const separatorClass = isMobile ? THEME.toolbar.mobileSeparator : THEME.toolbar.separator;
  const mobileButtonClass = isMobile ? THEME.toolbar.mobileButton : '';

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
        <div className={THEME.toolbar.container} data-testid="board-toolbar">
          {BASIC_TOOLS.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`${buttonClass} ${mobileButtonClass} ${activeTool === tool.id ? buttonSelectedClass : ''}`}
                  aria-label={tool.label}
                  aria-pressed={activeTool === tool.id}
                  onPointerDown={handleToolPointerDown}
                  onClick={createToolClickHandler(tool.id)}
                >
                  <span className={iconClass}>{tool.icon}</span>
                </Button>
              </TooltipTrigger>
              {!isMobile && (
                <TooltipContent side="bottom">
                  <p>{tool.label}</p>
                </TooltipContent>
              )}
            </Tooltip>
          ))}

          <div className={separatorClass} />

          {DRAWING_SECTION_TOOLS.map((tool: typeof DRAWING_SECTION_TOOLS[number]) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`${buttonClass} ${mobileButtonClass} ${activeTool === tool.id ? buttonSelectedClass : ''}`}
                  aria-label={tool.label}
                  aria-pressed={activeTool === tool.id}
                  onPointerDown={handleToolPointerDown}
                  onClick={createToolClickHandler(tool.id)}
                >
                  <span className={iconClass}>{tool.icon}</span>
                </Button>
              </TooltipTrigger>
              {!isMobile && (
                <TooltipContent side="bottom">
                  <p>{tool.label}</p>
                </TooltipContent>
              )}
            </Tooltip>
          ))}

          <DropdownMenu
            open={isShapeMenuOpen}
            onOpenChange={setIsShapeMenuOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`${buttonClass} ${mobileButtonClass} ${isShapeActive ? buttonSelectedClass : ''}`}
                aria-label="Shapes"
                data-testid="shapes-dropdown-trigger"
              >
                <span className={iconClass}>
                  {activeShapeTool ? activeShapeTool.icon : SHAPE_DROPDOWN_ICON}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              side="bottom"
              className={THEME.dropdown.content}
            >
              {SHAPE_TOOL_CONFIGS.map((tool) => (
                <DropdownMenuItem
                  key={tool.id}
                  data-testid={`shape-tool-${tool.id}`}
                  onClick={() => {
                    handleToolChange(tool.id);
                    setIsShapeMenuOpen(false);
                  }}
                  className={`${THEME.dropdown.item} ${activeTool === tool.id ? THEME.dropdown.itemSelected : ''}`}
                >
                  <div className={THEME.dropdown.icon}>{tool.icon}</div>
                  <span>{tool.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`${buttonClass} ${mobileButtonClass} ${activeTool === 'arrow' ? buttonSelectedClass : ''}`}
                aria-label="Arrow"
                aria-pressed={activeTool === 'arrow'}
                onPointerDown={handleToolPointerDown}
                onClick={createToolClickHandler('arrow')}
              >
                <span className={iconClass}>{ARROW_TOOL.icon}</span>
              </Button>
            </TooltipTrigger>
            {!isMobile && (
              <TooltipContent side="bottom">
                <p>{ARROW_TOOL.label}</p>
              </TooltipContent>
            )}
          </Tooltip>

          <div className={separatorClass} />

          {OTHER_TOOL_CONFIGS.filter((tool) => tool.id !== 'image').map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`${buttonClass} ${mobileButtonClass} ${activeTool === tool.id ? buttonSelectedClass : ''}`}
                  aria-label={tool.label}
                  aria-pressed={activeTool === tool.id}
                  onPointerDown={handleToolPointerDown}
                  onClick={createToolClickHandler(tool.id)}
                >
                  <span className={iconClass}>{tool.icon}</span>
                </Button>
              </TooltipTrigger>
              {!isMobile && (
                <TooltipContent side="bottom">
                  <p>{tool.label}</p>
                </TooltipContent>
              )}
            </Tooltip>
          ))}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`${buttonClass} ${mobileButtonClass} ${activeTool === 'image' ? buttonSelectedClass : ''}`}
                aria-label="Image"
                aria-pressed={activeTool === 'image'}
                onPointerDown={handleToolPointerDown}
                onClick={createToolClickHandler('image')}
              >
                <span className={iconClass}>{imageToolConfig?.icon}</span>
              </Button>
            </TooltipTrigger>
            {!isMobile && (
              <TooltipContent side="bottom">
                <p>Image</p>
              </TooltipContent>
            )}
          </Tooltip>

          <div className={separatorClass} />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`${buttonClass} ${mobileButtonClass} ${handdrawn ? buttonSelectedClass : ''}`}
                onPointerDown={(e: React.PointerEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleHanddrawn();
                }}
              >
                <span className={iconClass}>{HANDRAWN_ICON}</span>
              </Button>
            </TooltipTrigger>
            {!isMobile && (
              <TooltipContent side="bottom">
                <p>{handdrawn ? 'Disable Handdrawn Mode' : 'Enable Handdrawn Mode'}</p>
              </TooltipContent>
            )}
          </Tooltip>

          {isMobile && (
            <>
              <div className={separatorClass} />
              <MobileGridMenu />
            </>
          )}

          {selectedElements.length > 0 && (
            <>
              <div className={separatorClass} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`${buttonClass} ${mobileButtonClass}`}
                    aria-label="Duplicate"
                    onPointerDown={(e: React.PointerEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      duplicateElements(board);
                    }}
                  >
                    <Copy className={iconClass} />
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
                    className={`${buttonClass} ${mobileButtonClass} hover:bg-destructive/10 hover:text-destructive`}
                    aria-label="Delete"
                    onPointerDown={(e: React.PointerEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteFragment(board);
                    }}
                  >
                    <Trash2 className={iconClass} />
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
