'use client';

import { useState, useRef } from 'react';
import { MixedCanvasIcon, ChevronDown, Plus, Trash2, Pencil, Check } from '@/shared/constants/icons';
import { Button } from '@thinkix/ui';
import { cn } from '@thinkix/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from '@thinkix/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@thinkix/ui';
import { Input } from '@thinkix/ui';
import type { BoardMetadata } from '@thinkix/storage';
import { THEME } from '@/shared/constants';
import posthog from 'posthog-js';

interface BoardSwitcherProps {
  boards: BoardMetadata[];
  currentBoardId: string | null;
  onCreateBoard: (name: string) => void;
  onSelectBoard: (id: string) => void;
  onDeleteBoard: (id: string) => void;
  onRenameBoard: (id: string, name: string) => void;
  loading?: boolean;
}

export function BoardSwitcher({
  boards,
  currentBoardId,
  onCreateBoard,
  onSelectBoard,
  onDeleteBoard,
  onRenameBoard,
  loading = false,
}: BoardSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [boardName, setBoardName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const currentBoard = boards.find((b) => b.id === currentBoardId);

  const handleCreateBoard = () => {
    if (boardName.trim()) {
      onCreateBoard(boardName.trim());
      posthog.capture('board_created', { board_name: boardName.trim() });
      setIsCreateDialogOpen(false);
      setBoardName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateBoard();
    } else if (e.key === 'Escape') {
      setIsCreateDialogOpen(false);
      setBoardName('');
    }
  };

  const handleRename = async (id: string, name: string) => {
    if (!name.trim()) return;
    await onRenameBoard(id, name);
    posthog.capture('board_renamed', { board_id: id, new_name: name });
    setRenamingId(null);
    setNewName('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleRename(id, newName);
    } else if (e.key === 'Escape') {
      setRenamingId(null);
      setNewName('');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const boardToDelete = boards.find((b) => b.id === id);
    await onDeleteBoard(id);
    posthog.capture('board_deleted', { board_id: id, board_name: boardToDelete?.name });
  };

  const handleRenameStart = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setRenamingId(id);
    setNewName(name);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="default" className={cn(
            THEME.surface.floating,
            "gap-2 min-w-[200px] justify-start text-base",
            "hover:bg-accent/85",
            "max-[1024px]:min-w-[140px] max-[1024px]:text-sm"
          )}>
            <MixedCanvasIcon className="h-5 w-5 shrink-0 max-[1024px]:h-4 max-[1024px]:w-4" />
            <span className="truncate">
              {currentBoard?.name ?? (loading ? 'Loading...' : 'Select Board')}
            </span>
            <ChevronDown className="h-5 w-5 shrink-0 opacity-50 ml-auto max-[1024px]:h-4 max-[1024px]:w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent align="start" className={THEME.dropdown.content} side="bottom" sideOffset={4} data-no-autosave>
            {loading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Loading boards...
              </div>
            ) : (
              <>
                {boards.map((board) => (
                  <div
                    key={board.id}
                    className="group flex items-center gap-1"
                  >
                    {renamingId === board.id ? (
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => handleRenameKeyDown(e, board.id)}
                        onBlur={() => handleRename(board.id, newName)}
                        autoFocus
                        className="flex-1 px-3 py-2 text-sm bg-background border rounded-md"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <DropdownMenuItem
                          className="flex-1 py-2"
                          onClick={() => {
                            onSelectBoard(board.id);
                            posthog.capture('board_switched', { board_id: board.id, board_name: board.name });
                            setIsOpen(false);
                          }}
                        >
                          <span className="truncate">{board.name}</span>
                          {board.id === currentBoardId && (
                            <Check className="h-5 w-5 ml-auto text-primary" />
                          )}
                        </DropdownMenuItem>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 shrink-0"
                          onClick={(e: React.MouseEvent) => handleRenameStart(board.id, board.name, e)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 shrink-0 hover:text-destructive disabled:opacity-50"
                          onClick={(e: React.MouseEvent) => handleDelete(board.id, e)}
                          disabled={boards.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
                <DropdownMenuSeparator className={THEME.dropdown.separator} />
                <DropdownMenuItem
                  className="py-2.5"
                  onClick={() => {
                    setIsOpen(false);
                    setBoardName(`Board ${boards.length + 1}`);
                    setIsCreateDialogOpen(true);
                  }}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Board
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
            <DialogDescription>
              Enter a name for your new board. You can always rename it later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              ref={inputRef}
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Board name"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBoard} disabled={!boardName.trim()}>
              Create Board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
