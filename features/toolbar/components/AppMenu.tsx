'use client';

import { useState } from 'react';
import { FolderOpen, Save, Trash2, FileImage, ChevronRight, Menu, FileText } from 'lucide-react';
import { useBoard, useListRender } from '@plait-board/react-board';
import {
  BoardTransforms,
  PlaitBoard,
  PlaitElement,
  PlaitTheme,
  Viewport,
} from '@plait/core';
import { Button, cn } from '@thinkix/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@thinkix/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@thinkix/ui';
import {
  saveBoardToFile,
  loadBoardFromFile,
  exportAsSvg,
  exportAsPng,
  exportAsJpg,
} from '@thinkix/file-utils';
import { MarkdownToMindmapDialog } from '@/features/dialogs';
import posthog from 'posthog-js';

interface AppMenuProps {
  boardName?: string;
}

export function AppMenu({ boardName }: AppMenuProps) {
  const board = useBoard();
  const listRender = useListRender();
  const [isOpen, setIsOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isMarkdownDialogOpen, setIsMarkdownDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const clearAndLoad = (
    elements: PlaitElement[],
    viewport?: Viewport,
    theme?: PlaitTheme
  ) => {
    board.children = elements;
    board.viewport = viewport || { zoom: 1 };
    if (theme) {
      board.theme = theme;
    }
    listRender.update(board.children, {
      board: board,
      parent: board,
      parentG: PlaitBoard.getElementHost(board),
    });
    BoardTransforms.fitViewport(board);
  };

  const handleOpenFile = async () => {
    setIsOpen(false);
    setIsLoading(true);
    try {
      const data = await loadBoardFromFile();
      if (data) {
        clearAndLoad(data.elements, data.viewport, data.theme);
        posthog.capture('board_file_opened', { board_name: boardName, element_count: data.elements.length });
      }
    } catch (error) {
      console.error('Failed to load file:', error);
      posthog.captureException(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFile = async () => {
    setIsOpen(false);
    setIsSaving(true);
    try {
      await saveBoardToFile(board, boardName);
      posthog.capture('board_file_saved', { board_name: boardName, element_count: board.children.length });
    } catch (error) {
      console.error('Failed to save file:', error);
      posthog.captureException(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportSvg = async () => {
    setIsOpen(false);
    setIsExporting(true);
    try {
      await exportAsSvg(board, boardName);
      posthog.capture('board_exported', { format: 'svg', board_name: boardName });
    } catch (error) {
      console.error('Failed to export SVG:', error);
      posthog.captureException(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPng = async (transparent: boolean) => {
    setIsOpen(false);
    setIsExporting(true);
    try {
      await exportAsPng(board, transparent, boardName);
      posthog.capture('board_exported', { format: 'png', transparent, board_name: boardName });
    } catch (error) {
      console.error('Failed to export PNG:', error);
      posthog.captureException(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJpg = async () => {
    setIsOpen(false);
    setIsExporting(true);
    try {
      await exportAsJpg(board, boardName);
      posthog.capture('board_exported', { format: 'jpg', board_name: boardName });
    } catch (error) {
      console.error('Failed to export JPG:', error);
      posthog.captureException(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearBoard = () => {
    setIsOpen(false);
    setIsClearDialogOpen(true);
  };

  const confirmClearBoard = () => {
    setIsClearDialogOpen(false);
    const elementCount = board.children.length;
    clearAndLoad([]);
    posthog.capture('board_cleared', { board_name: boardName, element_count: elementCount });
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="default"
            className={cn(
              "gap-2 h-9 px-3",
              "max-[1024px]:h-8 max-[1024px]:px-2"
            )}
            disabled={isExporting || isSaving || isLoading}
            data-testid="app-menu-button"
          >
            <Menu className="h-5 w-5 max-[1024px]:h-4 max-[1024px]:w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48" side="bottom" sideOffset={4}>
          <DropdownMenuItem onSelect={handleOpenFile} disabled={isLoading}>
            <FolderOpen className="h-5 w-5 mr-2" />
            Open File
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleSaveFile} disabled={isSaving}>
            <Save className="h-5 w-5 mr-2" />
            Save File
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FileImage className="h-5 w-5 mr-2" />
              Export Image
              <ChevronRight className="h-4 w-4 ml-auto" />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-40">
              <DropdownMenuItem onSelect={handleExportSvg} disabled={isExporting}>
                SVG
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExportPng(true)} disabled={isExporting}>
                PNG (Transparent)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExportPng(false)} disabled={isExporting}>
                PNG (White BG)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleExportJpg} disabled={isExporting}>
                JPG
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => { setIsOpen(false); setIsMarkdownDialogOpen(true); }}
          >
            <FileText className="h-5 w-5 mr-2" />
            Markdown To Mind Map
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleClearBoard}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Clear Board
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear Board</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear the board? This action cannot be undone.
              All elements will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsClearDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmClearBoard}
            >
              Clear Board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MarkdownToMindmapDialog
        open={isMarkdownDialogOpen}
        onOpenChange={setIsMarkdownDialogOpen}
      />
    </>
  );
}