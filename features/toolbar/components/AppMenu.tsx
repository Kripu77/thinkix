'use client';

import { useState } from 'react';
import { FolderOpen, Save, Trash2, FileImage, ChevronRight, Menu, Users, Link2, UserCircle2, Palette, Check } from 'lucide-react';
import { MindMapIcon } from '@/shared/constants/icons';
import { useBoard, useListRender } from '@plait-board/react-board';
import {
  BoardTransforms,
  PlaitElement,
  PlaitTheme,
  PlaitBoard,
  Viewport,
  ThemeColorMode,
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
import { useBoardStore } from '@thinkix/storage';
import { MarkdownToMindmapDialog, MermaidToBoardDialog, MermaidIcon } from '@/features/dialogs';
import {
  NicknameDialog,
  useOptionalSyncBus,
  useOptionalYjsCollaboration,
  type CollaborationUser,
  type BoardElement,
  validateBoardElements,
  logger,
} from '@thinkix/collaboration';
import { THEME } from '@/shared/constants';
import { BOARD_THEME_OPTIONS, getBoardThemeMode, type BoardThemeMode } from '@thinkix/shared';
import { refreshGrid } from '@/features/board/grid';
import { syncElementsForBoardTheme } from '@/features/board/utils';
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

const THEME_PREVIEW_STYLES: Record<BoardThemeMode, { surface: string; accent: string }> = {
  default: {
    surface: 'bg-white border-zinc-200',
    accent: 'bg-zinc-100 border-zinc-300',
  },
  dark: {
    surface: 'bg-zinc-950 border-zinc-700',
    accent: 'bg-zinc-800 border-zinc-600',
  },
  soft: {
    surface: 'bg-stone-100 border-stone-300',
    accent: 'bg-stone-200 border-stone-400',
  },
  retro: {
    surface: 'bg-amber-50 border-amber-300',
    accent: 'bg-amber-200 border-amber-500',
  },
  starry: {
    surface: 'bg-slate-950 border-sky-700',
    accent: 'bg-slate-800 border-sky-500',
  },
  colorful: {
    surface: 'bg-cyan-50 border-cyan-300',
    accent: 'bg-cyan-200 border-cyan-500',
  },
};

export function AppMenu({ boardName, onEnableCollaboration, collaboration }: AppMenuProps) {
  const board = useBoard();
  const listRender = useListRender();
  const syncBusContext = useOptionalSyncBus();
  const collaborationContext = useOptionalYjsCollaboration();
  const currentBoard = useBoardStore((state) => state.currentBoard);
  const saveBoard = useBoardStore((state) => state.saveBoard);
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
    refreshGrid(board);
    BoardTransforms.fitViewport(board);
  };

  const persistCurrentBoard = async ({
    elements = board.children,
    viewport = {
      x: board.viewport.x ?? 0,
      y: board.viewport.y ?? 0,
      zoom: board.viewport.zoom ?? 1,
    },
    theme = board.theme,
  }: {
    elements?: PlaitElement[];
    viewport?: Viewport;
    theme?: PlaitTheme;
  } = {}) => {
    if (!currentBoard) {
      return;
    }

    await saveBoard({
      id: currentBoard.id,
      name: currentBoard.name,
      elements,
      viewport: {
        x: viewport.x ?? 0,
        y: viewport.y ?? 0,
        zoom: viewport.zoom ?? 1,
      },
      theme: theme ?? currentBoard.theme,
      createdAt: currentBoard.createdAt,
      updatedAt: Date.now(),
    });
  };

  const handleOpenFile = async () => {
    setIsOpen(false);
    setIsLoading(true);
    try {
      const data = await loadBoardFromFile();
      if (data) {
        clearAndLoad(data.elements, data.viewport, data.theme);
        await persistCurrentBoard({
          elements: data.elements,
          viewport: data.viewport,
          theme: data.theme ?? board.theme,
        });

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

  const handleThemeChange = async (themeColorMode: BoardThemeMode) => {
    setIsOpen(false);

    const theme: PlaitTheme = { themeColorMode: ThemeColorMode[themeColorMode] };
    const nextElements = syncElementsForBoardTheme(board.children, themeColorMode);

    board.children = nextElements;
    board.theme = theme;
    listRender.update(nextElements, {
      board,
      parent: board,
      parentG: PlaitBoard.getElementHost(board),
    });
    refreshGrid(board);

    if (collaborationContext) {
      collaborationContext.setBoardState(nextElements as unknown as BoardElement[], theme);
    }

    await persistCurrentBoard({ elements: nextElements, theme });

    posthog.capture('board_theme_changed', {
      board_name: boardName,
      theme: themeColorMode,
    });
  };

  const confirmClearBoard = () => {
    setIsClearDialogOpen(false);
    const elementCount = board.children.length;
    clearAndLoad([]);
    void persistCurrentBoard({
      elements: [],
      viewport: { x: board.viewport.x ?? 0, y: board.viewport.y ?? 0, zoom: board.viewport.zoom ?? 1 },
      theme: board.theme,
    });

    if (syncBusContext) {
      syncBusContext.emitLocalChange([]);
    } else {
      logger.debug('SyncBus not available, skipping clear board sync');
    }

    posthog.capture('board_cleared', { board_name: boardName, element_count: elementCount });
  };

  const currentThemeMode = getBoardThemeMode(board.theme);
  const currentThemeLabel =
    BOARD_THEME_OPTIONS.find((theme) => theme.value === currentThemeMode)?.label ?? 'Light';

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className={cn(
              THEME.surface.floating,
              'gap-2 h-9 px-3.5',
              'hover:bg-accent/85',
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

          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              data-testid="app-menu-theme-trigger"
              className={THEME.dropdown.item}
            >
              <Palette className={THEME.dropdown.icon} />
              Theme
              <DropdownMenuShortcut>{currentThemeLabel}</DropdownMenuShortcut>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className={cn(THEME.dropdown.content, 'min-w-[236px] p-1.5')}>
              <div className="space-y-1.5">
                <div className="px-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/90">
                    Board theme
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                {BOARD_THEME_OPTIONS.map((theme) => {
                  const selected = theme.value === currentThemeMode;
                  const preview = THEME_PREVIEW_STYLES[theme.value];

                  return (
                    <button
                      key={theme.value}
                      type="button"
                      data-testid={`app-menu-theme-${theme.value}`}
                      className={cn(
                        'group flex min-w-0 items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors',
                        'hover:bg-accent/70 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                        selected
                          ? 'border-primary/40 bg-accent/65 text-accent-foreground shadow-sm'
                          : 'border-border/70 bg-background/60 text-foreground'
                      )}
                      onClick={() => {
                        void handleThemeChange(theme.value);
                      }}
                    >
                      <span
                        className={cn(
                          'relative flex h-7 w-10 shrink-0 overflow-hidden rounded-md border shadow-sm',
                          preview.surface,
                        )}
                      >
                        <span className={cn('absolute inset-x-1 top-1 h-1 rounded-full border', preview.accent)} />
                        <span className={cn('absolute inset-x-2 bottom-1.5 h-2.5 rounded-sm border', preview.accent)} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{theme.label}</span>
                      </span>
                      <span
                        className={cn(
                          'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-opacity',
                          selected
                            ? 'border-primary/50 bg-primary/12 text-primary opacity-100'
                            : 'border-border/70 text-muted-foreground opacity-0 group-hover:opacity-100'
                        )}
                      >
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    </button>
                  );
                })}
                </div>
              </div>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

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
