'use client';

import { useState } from 'react';
import { FolderOpen, Save, Trash2, FileImage, ChevronRight, Menu, Users, Link2, UserCircle2 } from 'lucide-react';
import { MindMapIcon } from '@/shared/constants/icons';
import { useBoard, useListRender } from '@plait-board/react-board';
import {
  BoardTransforms,
  PlaitElement,
  PlaitTheme,
  PlaitBoard,
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
  DropdownMenuLabelItem,
  DropdownMenuShortcut,
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
import { MarkdownToMindmapDialog, MermaidToBoardDialog, MermaidIcon } from '@/features/dialogs';
import { NicknameDialog, useOptionalSyncBus, type CollaborationUser, validateBoardElements, logger } from '@thinkix/collaboration';
import { THEME } from '@/shared/constants';
import posthog from 'posthog-js';

export type { CollaborationUser };

interface AppMenuProps {
  boardName?: string;
  onEnableCollaboration?: () => void;
  collaboration?: {
    enabled: boolean;
    user: CollaborationUser;
    userCount: number;
    roomId: string;
    onShare: () => void;
    onChangeNickname: (name: string) => void;
    onLeave: () => void;
  };
}

export function AppMenu({ boardName, onEnableCollaboration, collaboration }: AppMenuProps) {
  const board = useBoard();
  const listRender = useListRender();
  const syncBusContext = useOptionalSyncBus();
  const [isOpen, setIsOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isMarkdownDialogOpen, setIsMarkdownDialogOpen] = useState(false);
  const [isMermaidDialogOpen, setIsMermaidDialogOpen] = useState(false);
  const [isNicknameDialogOpen, setIsNicknameDialogOpen] = useState(false);
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

        if (syncBusContext) {
          const { valid, invalid } = validateBoardElements(data.elements);
          if (invalid.length > 0) {
            logger.warn(`Skipped ${invalid.length} invalid board elements during file load`, { invalidCount: invalid.length });
          }
          syncBusContext.emitLocalChange(valid);
        } else {
          logger.debug('SyncBus not available, skipping file load sync');
        }

        posthog.capture('board_file_opened', { board_name: boardName, element_count: data.elements.length });
      }
    } catch (error) {
      logger.error('Failed to load file', error instanceof Error ? error : undefined);
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
      logger.error('Failed to save file', error instanceof Error ? error : undefined);
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
      logger.error('Failed to export SVG', error instanceof Error ? error : undefined);
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
      logger.error('Failed to export PNG', error instanceof Error ? error : undefined);
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
      logger.error('Failed to export JPG', error instanceof Error ? error : undefined);
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

    if (syncBusContext) {
      syncBusContext.emitLocalChange([]);
    } else {
      logger.debug('SyncBus not available, skipping clear board sync');
    }

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
              'gap-2 h-9 px-3.5',
              'max-[1024px]:h-8 max-[1024px]:px-2.5'
            )}
            disabled={isExporting || isSaving || isLoading}
            data-testid="app-menu-button"
          >
            <Menu className="h-5 w-5 max-[1024px]:h-4 max-[1024px]:w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className={THEME.dropdown.content}
          data-testid="app-menu-content"
          side="bottom"
          sideOffset={4}
        >
          <DropdownMenuLabelItem>File</DropdownMenuLabelItem>

          <DropdownMenuItem
            data-testid="app-menu-open-file"
            disabled={isLoading}
            onSelect={handleOpenFile}
          >
            <FolderOpen className={THEME.dropdown.icon} />
            Open File
            <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            data-testid="app-menu-save-file"
            disabled={isSaving}
            onSelect={handleSaveFile}
          >
            <Save className={THEME.dropdown.icon} />
            Save File
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuSeparator className={THEME.dropdown.separator} />

          <DropdownMenuLabelItem>Export</DropdownMenuLabelItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger data-testid="app-menu-export-trigger">
              <FileImage className={THEME.dropdown.icon} />
              Export Image
              <ChevronRight className="h-4 w-4 ml-auto" />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className={THEME.dropdown.content}>
              <DropdownMenuItem
                data-testid="app-menu-export-svg"
                disabled={isExporting}
                onSelect={handleExportSvg}
              >
                SVG
              </DropdownMenuItem>
              <DropdownMenuItem
                data-testid="app-menu-export-png-transparent"
                disabled={isExporting}
                onSelect={() => handleExportPng(true)}
              >
                PNG (Transparent)
              </DropdownMenuItem>
              <DropdownMenuItem
                data-testid="app-menu-export-png-white"
                disabled={isExporting}
                onSelect={() => handleExportPng(false)}
              >
                PNG (White BG)
              </DropdownMenuItem>
              <DropdownMenuItem
                data-testid="app-menu-export-jpg"
                disabled={isExporting}
                onSelect={handleExportJpg}
              >
                JPG
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator className={THEME.dropdown.separator} />

          <DropdownMenuLabelItem>Import</DropdownMenuLabelItem>

          <DropdownMenuItem
            onSelect={() => { setIsOpen(false); setIsMarkdownDialogOpen(true); }}
            className={THEME.dropdown.item}
            data-testid="app-menu-import-markdown"
          >
            <MindMapIcon className={THEME.dropdown.icon} />
            Markdown to Mind Map
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => { setIsOpen(false); setIsMermaidDialogOpen(true); }}
            className={THEME.dropdown.item}
            data-testid="app-menu-import-mermaid"
          >
            <MermaidIcon className={THEME.dropdown.icon} />
            Mermaid to Board
          </DropdownMenuItem>

          <DropdownMenuSeparator className={THEME.dropdown.separator} />

          <DropdownMenuItem
            onSelect={handleClearBoard}
            className={THEME.dropdown.itemDestructive}
            data-testid="app-menu-clear-board"
          >
            <Trash2 className={THEME.dropdown.icon} />
            Clear Board
          </DropdownMenuItem>

          {!collaboration?.enabled && onEnableCollaboration && (
            <>
              <DropdownMenuSeparator className="lg:hidden" />
              <DropdownMenuItem
                className="lg:hidden"
                data-testid="app-menu-start-collaboration"
                onSelect={() => { setIsOpen(false); onEnableCollaboration(); }}
              >
                <Users className={THEME.dropdown.icon} />
                Start Collaborating
              </DropdownMenuItem>
            </>
          )}

          {collaboration?.enabled && (
            <>
              <DropdownMenuSeparator className="lg:hidden" />
              <div className="lg:hidden">
                <DropdownMenuLabelItem>Collaboration</DropdownMenuLabelItem>
                <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{collaboration.userCount} online</span>
                </div>
                <DropdownMenuItem
                  className="lg:hidden"
                  data-testid="app-menu-share-board"
                  onSelect={() => { setIsOpen(false); collaboration.onShare(); }}
                >
                  <Link2 className={THEME.dropdown.icon} />
                  Share Board
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="lg:hidden"
                  data-testid="app-menu-change-nickname"
                  onSelect={() => { setIsOpen(false); setIsNicknameDialogOpen(true); }}
                >
                  <UserCircle2 className={THEME.dropdown.icon} />
                  Change Nickname
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(THEME.dropdown.itemDestructive, 'lg:hidden')}
                  data-testid="app-menu-leave-collaboration"
                  onSelect={() => { setIsOpen(false); collaboration.onLeave(); }}
                >
                  <Users className={THEME.dropdown.icon} />
                  Leave Collaboration
                </DropdownMenuItem>
              </div>
            </>
          )}
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
              data-testid="clear-board-cancel"
              variant="outline"
              onClick={() => setIsClearDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-testid="clear-board-confirm"
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

      <MermaidToBoardDialog
        open={isMermaidDialogOpen}
        onOpenChange={setIsMermaidDialogOpen}
      />

      {collaboration?.enabled && (
        <NicknameDialog
          open={isNicknameDialogOpen}
          onOpenChange={setIsNicknameDialogOpen}
          currentName={collaboration.user.name}
          onSave={(name) => {
            collaboration.onChangeNickname(name);
          }}
        />
      )}
    </>
  );
}
