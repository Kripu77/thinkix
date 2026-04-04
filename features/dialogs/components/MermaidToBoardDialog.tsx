'use client';

import { useState, useCallback, useEffect, useDeferredValue } from 'react';
import { useBoard } from '@plait-board/react-board';
import { type PlaitElement, PlaitPlugin } from '@plait/core';
import { withDraw } from '@plait/draw';
import { withMind } from '@plait/mind';
import { withGroup, withText } from '@plait/common';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@thinkix/ui';
import { Button } from '@thinkix/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@thinkix/ui';
import { focusAndRevealElements, insertElementsSafely } from '@/features/board/utils';
import { parseMermaidToBoard } from '@thinkix/mermaid-to-thinkix';
import posthog from 'posthog-js';
import { Board, Wrapper } from '@plait-board/react-board';
import { addTextRenderer } from '@/features/board/plugins/add-text-renderer';
import { createLogger } from '@thinkix/shared';

const logger = createLogger('dialog:mermaid-to-board');

const MERMAID_EXAMPLE = `flowchart TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Fix it]
    C --> E[Deploy]
    D --> E`;

const MERMAID_LINK_EXAMPLE = `flowchart LR
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[Car]`;

const MERMAID_COMPLEX_EXAMPLE = `flowchart TB
    subgraph Frontend ["Client Side"]
        A[React] --> B[Redux]
        B --> C[Components]
    end

    subgraph Backend ["Server Side"]
        D[API Routes] --> E[Controllers]
        E --> F[Database]
    end

    C --> D
    F --> G[(Data)]
    A --> H[Auth]
    H --> D`;

const MERMAID_SEQUENCE_EXAMPLE = `sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Health Check
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!`;

const MERMAID_CLASS_EXAMPLE = `classDiagram
    direction LR

    class User {
        +id: UUID
        +email: string
        +name: string
        +login()
        +updateProfile()
    }

    class Workspace {
        +id: UUID
        +name: string
        +createProject()
        +inviteMember()
    }

    class Project {
        +id: UUID
        +title: string
        +status: string
        +archive()
    }

    class Task {
        +id: UUID
        +title: string
        +priority: int
        +updateStatus()
    }

    class Comment {
        +id: UUID
        +content: string
        +createdAt: Date
    }

    class Notification {
        +id: UUID
        +type: string
        +markRead()
    }

    Workspace "1" --> "*" Project : contains
    Project "1" --> "*" Task : manages
    Task "1" --> "*" Comment : discussion
    User "*" --> "*" Workspace : member
    User "1" --> "*" Task : assigned
    User "1" --> "*" Notification : receives`;

interface MermaidToBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ExampleType = 'simple' | 'link' | 'complex' | 'sequence' | 'class';

const EXAMPLES: Record<ExampleType, { value: string; label: string }> = {
  simple: { value: MERMAID_EXAMPLE, label: 'Simple Flowchart' },
  link: { value: MERMAID_LINK_EXAMPLE, label: 'With Link Labels' },
  complex: { value: MERMAID_COMPLEX_EXAMPLE, label: 'Complex with Subgraphs' },
  sequence: { value: MERMAID_SEQUENCE_EXAMPLE, label: 'Sequence Diagram' },
  class: { value: MERMAID_CLASS_EXAMPLE, label: 'Class Diagram' },
};

function MermaidToBoardDialog({ open, onOpenChange }: MermaidToBoardDialogProps) {
  const board = useBoard();
  const [text, setText] = useState(MERMAID_EXAMPLE);
  const [elements, setElements] = useState<PlaitElement[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExample, setSelectedExample] = useState<ExampleType>('simple');
  const [error, setError] = useState<string | null>(null);

  const deferredText = useDeferredValue(text.trim());

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!deferredText) {
        setElements([]);
        setWarnings([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      try {
        const result = await parseMermaidToBoard(deferredText);
        setElements(result.elements as PlaitElement[]);
        setWarnings(result.warnings || []);
        setError(null);
      } catch (err) {
        logger.error('Failed to parse mermaid', err instanceof Error ? err : undefined);

        let userFacingError = 'Could not parse diagram';
        if (err instanceof Error) {
          const message = err.message.toLowerCase();

          if (message.includes('syntax') || message.includes('parse')) {
            userFacingError = `Mermaid syntax error: ${err.message}`;
          } else if (message.includes('diagram type') || message.includes('unsupported')) {
            userFacingError = 'Unsupported diagram type. Try: flowchart, sequenceDiagram, or classDiagram';
          } else if (message.includes('mermaid')) {
            userFacingError = `Mermaid parsing error: ${err.message}`;
          } else {
            userFacingError = `Could not parse diagram: ${err.message}`;
          }
        }

        setElements([]);
        setWarnings([userFacingError]);
        setError(userFacingError);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [deferredText]);

  const plugins: PlaitPlugin[] = [withDraw, withMind, withGroup, withText, addTextRenderer];
  const boardOptions = {
    readonly: true,
    hideScrollbar: true,
    disabledScrollOnNonFocus: true,
    viewportScroll: false,
  };

  const handleInsert = useCallback(() => {
    if (elements.length === 0) return;

    try {
      const previousCount = board.children.length;
      insertElementsSafely(board, elements);
      const insertedElements = board.children.slice(previousCount);
      focusAndRevealElements(
        board,
        insertedElements.length > 0 ? insertedElements : elements,
      );
      posthog.capture('mermaid_to_board_inserted', {
        element_count: elements.length,
        diagram_length: text.trim().length,
        diagram_type: selectedExample,
      });
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to insert elements', err instanceof Error ? err : undefined);
      setError(`Failed to insert: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [board, elements, text, selectedExample, onOpenChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleInsert();
      }
    },
    [handleInsert]
  );

  const isValid = elements.length > 0;

  const handleExampleChange = (value: ExampleType) => {
    setSelectedExample(value);
    setText(EXAMPLES[value].value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Mermaid to Board</DialogTitle>
          <DialogDescription>
            Convert Mermaid diagrams to board elements. Supports flowcharts, sequence diagrams, and class diagrams.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 px-6 pb-6">
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Mermaid Syntax</label>
              <Select value={selectedExample} onValueChange={handleExampleChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXAMPLES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <textarea
              className="flex-1 min-h-[250px] p-3 rounded-md border bg-background font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter mermaid syntax (flowchart, sequenceDiagram, classDiagram)..."
              spellCheck={false}
              aria-label="Mermaid input"
            />
            <div className="text-xs text-muted-foreground mt-2">
              Supported: flowchart, sequenceDiagram, classDiagram
            </div>
          </div>

          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">
                Preview {isLoading && '(Parsing...)'}
              </label>
              <span className="text-xs text-muted-foreground">
                {elements.length} elements
                {warnings.length > 0 && ` · ${warnings.length} warnings`}
              </span>
            </div>
            <div className="flex-1 min-h-[250px] rounded-md border bg-muted/30 relative overflow-hidden">
              {error ? (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="text-sm text-destructive text-center">
                    <div className="font-semibold mb-1">Parse Error</div>
                    <div className="font-normal">{error}</div>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  Parsing...
                </div>
              ) : isValid ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Wrapper value={elements} options={boardOptions} plugins={plugins}>
                    <Board />
                  </Wrapper>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Enter mermaid syntax to preview
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center px-6 pb-6 pt-2">
          <div className="text-xs text-muted-foreground">
            Press <kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">⌘</kbd> + <kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">Enter</kbd> to insert
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInsert}
              disabled={!isValid || isLoading}
            >
              Insert to Board
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground px-6 pb-4 pt-0">
          <a
            href="https://mermaid.js.org/intro/syntax-reference.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Syntax reference
          </a>
          {' · '}
          <a
            href="https://mermaid.js.org/syntax/sequenceDiagram.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Sequence diagrams
          </a>
          {' · '}
          <a
            href="https://mermaid.js.org/syntax/classDiagram.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Class diagrams
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { MermaidToBoardDialog };
