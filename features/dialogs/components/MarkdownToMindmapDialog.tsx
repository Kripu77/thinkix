'use client';

import { useState, useMemo, useCallback } from 'react';
import { useBoard, Board, Wrapper } from '@plait-board/react-board';
import {
  PlaitHistoryBoard,
  Transforms,
  type PlaitElement,
  type PlaitPlugin,
  type PlaitTheme,
} from '@plait/core';
import { withGroup } from '@plait/common';
import { withDraw } from '@plait/draw';
import { withMind } from '@plait/mind';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@thinkix/ui';
import { Button } from '@thinkix/ui';
import {
  focusAndRevealElements,
  insertElementDirect,
  syncElementsForBoardTheme,
  THINKIX_MIND_THEME_COLORS,
} from '@/features/board/utils';
import { parseMarkdownToMindElement } from '@thinkix/plait-utils';
import posthog from 'posthog-js';
import { getBoardThemeMode } from '@thinkix/shared';

const MARKDOWN_EXAMPLE = `# Project Title
Brief description of the project or topic.

## Core Idea
- Main concept or goal
- Key objectives
- Desired outcome

## Sections / Modules
### Module 1: [Name]
- Description
- Key points
  - Subpoint A
  - Subpoint B
- Tasks / Actions
  - Task 1
  - Task 2

### Module 2: [Name]
- Description
- Key points
  - Subpoint A
  - Subpoint B
- Tasks / Actions
  - Task 1
  - Task 2

## Challenges / Risks
- Challenge 1
- Challenge 2
- Mitigation strategies
  - Strategy A
  - Strategy B

## Resources / References
- Resource 1 (link or book)
- Resource 2 (link or book)

## Next Steps / Timeline
- Phase 1: [Date] – Tasks
- Phase 2: [Date] – Tasks
- Phase 3: [Date] – Tasks

## Notes / Ideas
- Idea 1
- Idea 2
- Idea 3`;

interface MarkdownToMindmapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function parseMarkdownForPreview(text: string): PlaitElement | null {
  const result = parseMarkdownToMindElement(text);
  if (!result) return null;
  return {
    ...result,
    points: [[0, 0]] as [number, number][],
  } as unknown as PlaitElement;
}

function parseMarkdownForInsert(text: string): PlaitElement | null {
  const result = parseMarkdownToMindElement(text);
  if (!result) return null;
  return result as unknown as PlaitElement;
}

const PREVIEW_PLUGINS: PlaitPlugin[] = [withDraw, withMind, withGroup];

const PREVIEW_OPTIONS = {
  readonly: true,
  hideScrollbar: false,
  disabledScrollOnNonFocus: true,
  themeColors: THINKIX_MIND_THEME_COLORS,
};

function PreviewCanvas({
  elements,
  theme,
}: {
  elements: PlaitElement[];
  theme: PlaitTheme;
}) {
  if (elements.length === 0) return null;

  return (
    <Wrapper value={elements} options={PREVIEW_OPTIONS} plugins={PREVIEW_PLUGINS} theme={theme}>
      <Board className="w-full h-full" />
    </Wrapper>
  );
}

export function MarkdownToMindmapDialog({ open, onOpenChange }: MarkdownToMindmapDialogProps) {
  const board = useBoard();
  const [text, setText] = useState(MARKDOWN_EXAMPLE);
  const boardThemeMode = useMemo(() => getBoardThemeMode(board.theme), [board.theme]);

  const previewElements = useMemo(() => {
    const mind = parseMarkdownForPreview(text.trim());
    return mind ? syncElementsForBoardTheme([mind], boardThemeMode) : [];
  }, [boardThemeMode, text]);

  const error = previewElements.length === 0 && text.trim().length > 0
    ? 'Failed to parse markdown'
    : null;

  const handleInsert = useCallback(() => {
    const insertElement = parseMarkdownForInsert(text.trim());
    if (!insertElement) return;

    const previousCount = board.children.length;
    insertElementDirect(board, insertElement);

    const insertedElement = board.children[previousCount] ?? insertElement;
    const [themedInsertedElement] = syncElementsForBoardTheme([insertedElement], boardThemeMode);

    if (themedInsertedElement && themedInsertedElement !== insertedElement) {
      PlaitHistoryBoard.withoutSaving(board, () => {
        Transforms.setNode(board, { ...themedInsertedElement }, [previousCount]);
      });
    }

    const focusedElement = board.children[previousCount] ?? themedInsertedElement ?? insertedElement;
    focusAndRevealElements(
      board,
      focusedElement ? [focusedElement] : [insertElement],
    );
    posthog.capture('markdown_to_mindmap_inserted', { markdown_length: text.trim().length });
    onOpenChange(false);
  }, [board, boardThemeMode, text, onOpenChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleInsert();
      }
    },
    [handleInsert]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Markdown to Mind Map</DialogTitle>
          <DialogDescription>
            Convert markdown lists to mind map diagrams
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2">Markdown</label>
            <textarea
              className="flex-1 min-h-[300px] p-3 rounded-md border bg-background font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter markdown..."
              spellCheck={false}
              aria-label="Markdown input"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Preview</label>
              <span className="text-xs text-muted-foreground">
                Ctrl/Cmd + Enter to insert
              </span>
            </div>
            <div className="flex-1 min-h-[300px] rounded-md border bg-muted/30 overflow-hidden">
              {error ? (
                <div className="flex items-center justify-center h-full text-destructive text-sm p-4">
                  {error}
                </div>
              ) : previewElements.length > 0 ? (
                <PreviewCanvas elements={previewElements} theme={board.theme} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Enter markdown to preview
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={previewElements.length === 0}>
            Insert to Board
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
