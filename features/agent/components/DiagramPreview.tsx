'use client';

import { Board, Wrapper, useBoard } from '@plait-board/react-board';
import { BoardTransforms, ThemeColorMode, type PlaitElement, type PlaitPlugin, type PlaitTheme } from '@plait/core';
import { withGroup, withText } from '@plait/common';
import { withDraw } from '@plait/draw';
import { withMind } from '@plait/mind';
import { FileText, Loader2, Network } from 'lucide-react';
import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { addTextRenderer } from '@/features/board/plugins/add-text-renderer';
import { syncElementsForBoardTheme, THINKIX_MIND_THEME_COLORS } from '@/features/board/utils';
import { getBoardThemeMode } from '@thinkix/shared';

interface DiagramPreviewProps {
  type: 'mermaid' | 'mindmap';
  content: string;
  theme?: PlaitTheme;
}

interface PreviewState {
  elements: PlaitElement[];
  kindLabel: string;
}

const PREVIEW_PADDING = 32;
const DEFAULT_PREVIEW_SIZE = { width: 540, height: 172 };

const PREVIEW_PLUGINS: PlaitPlugin[] = [
  withDraw,
  withMind,
  withGroup,
  withText,
  addTextRenderer,
];

const PREVIEW_OPTIONS = {
  readonly: true,
  hideScrollbar: true,
  disabledScrollOnNonFocus: true,
  viewportScroll: false,
  themeColors: THINKIX_MIND_THEME_COLORS,
};

function getMermaidKindLabel(content: string): string {
  const firstLine = content
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)
    ?.toLowerCase();

  if (!firstLine) {
    return 'Diagram';
  }

  if (firstLine.startsWith('flowchart') || firstLine.startsWith('graph')) {
    return 'Flowchart';
  }
  if (firstLine.startsWith('sequencediagram')) {
    return 'Sequence Diagram';
  }
  if (firstLine.startsWith('classdiagram')) {
    return 'Class Diagram';
  }
  if (firstLine.startsWith('erdiagram')) {
    return 'ER Diagram';
  }
  if (firstLine.startsWith('statediagram')) {
    return 'State Diagram';
  }

  return 'Diagram';
}

function previewMindmapElement(text: string, parseMarkdownToMindElement: (value: string) => unknown) {
  const result = parseMarkdownToMindElement(text);
  if (!result || typeof result !== 'object') {
    return null;
  }

  return {
    ...(result as Record<string, unknown>),
    points: [[0, 0]] as [number, number][],
  } as unknown as PlaitElement;
}

function isPointTuple(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  );
}

function collectPoints(value: unknown, points: [number, number][]): void {
  if (isPointTuple(value)) {
    points.push(value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectPoints(entry, points));
    return;
  }

  if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => collectPoints(entry, points));
  }
}

function getPreviewViewport(
  elements: PlaitElement[],
  previewWidth: number,
  previewHeight: number,
): { origination: [number, number]; zoom: number } | null {
  if (elements.length === 0) {
    return null;
  }

  const points: [number, number][] = [];
  collectPoints(elements, points);

  if (points.length === 0) {
    return null;
  }

  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);
  const availableWidth = Math.max(previewWidth - PREVIEW_PADDING * 2, 1);
  const availableHeight = Math.max(previewHeight - PREVIEW_PADDING * 2, 1);
  const fitScale = Math.min(
    availableWidth / width,
    availableHeight / height,
  );
  const zoom = Math.max(0.12, Math.min(fitScale, 1));
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;

  return {
    origination: [
      centerX - previewWidth / (2 * zoom),
      centerY - previewHeight / (2 * zoom),
    ],
    zoom,
  };
}

function PreviewFallback({ kindLabel }: { kindLabel: string }) {
  const Icon = kindLabel === 'Class Diagram' ? FileText : Network;

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
        <div className="flex size-10 items-center justify-center rounded-2xl border border-border/60 bg-background/90 shadow-sm">
          <Icon className="size-4" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-foreground/80">{kindLabel}</p>
          <p className="text-[11px]">Preview available on the board</p>
        </div>
      </div>
    </div>
  );
}

function ReadonlyBoardPreview({
  elements,
  frameSize,
  theme,
}: {
  elements: PlaitElement[];
  frameSize: { width: number; height: number };
  theme: PlaitTheme;
}) {
  return (
    <Wrapper value={elements} options={PREVIEW_OPTIONS} plugins={PREVIEW_PLUGINS} theme={theme}>
      <PreviewViewportController elements={elements} frameSize={frameSize} />
      <Board className="h-full w-full pointer-events-none" />
    </Wrapper>
  );
}

function PreviewViewportController({
  elements,
  frameSize,
}: {
  elements: PlaitElement[];
  frameSize: { width: number; height: number };
}) {
  const board = useBoard();

  useEffect(() => {
    const viewport = getPreviewViewport(elements, frameSize.width, frameSize.height);
    if (!viewport) {
      return;
    }

    BoardTransforms.updateViewport(board, viewport.origination, viewport.zoom);
  }, [board, elements, frameSize.height, frameSize.width]);

  return null;
}

export function DiagramPreview({ type, content, theme }: DiagramPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deferredContent = useDeferredValue(content);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [frameSize, setFrameSize] = useState(DEFAULT_PREVIEW_SIZE);
  const resolvedTheme = theme ?? { themeColorMode: ThemeColorMode.default };
  const themeMode = getBoardThemeMode(resolvedTheme);
  const [previewState, setPreviewState] = useState<PreviewState>({
    elements: [],
    kindLabel: type === 'mindmap' ? 'Mind Map' : getMermaidKindLabel(content),
  });

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    const updateSize = () => {
      const nextWidth = Math.max(1, Math.round(frame.clientWidth));
      const nextHeight = Math.max(1, Math.round(frame.clientHeight));

      setFrameSize((current) => {
        if (current.width === nextWidth && current.height === nextHeight) {
          return current;
        }

        return {
          width: nextWidth,
          height: nextHeight,
        };
      });
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(frame);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function parse() {
      setLoading(true);
      setError(null);

      try {
        if (type === 'mindmap') {
          const { parseMarkdownToMindElement } = await import('@thinkix/plait-utils');
          const element = previewMindmapElement(deferredContent, parseMarkdownToMindElement);

          if (!cancelled) {
            setPreviewState({
              elements: element ? syncElementsForBoardTheme([element], themeMode) : [],
              kindLabel: 'Mind Map',
            });
          }

          return;
        }

        const { parseMermaidToBoard } = await import('@thinkix/mermaid-to-thinkix');
        const result = await parseMermaidToBoard(deferredContent);

        if (!cancelled) {
          setPreviewState({
            elements: syncElementsForBoardTheme(result.elements as PlaitElement[], themeMode),
            kindLabel: getMermaidKindLabel(deferredContent),
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to parse preview');
          setPreviewState({
            elements: [],
            kindLabel: type === 'mindmap' ? 'Mind Map' : getMermaidKindLabel(deferredContent),
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void parse();

    return () => {
      cancelled = true;
    };
  }, [deferredContent, themeMode, type]);

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/[0.18]">
      <div className="relative h-[188px] overflow-hidden rounded-[11px] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(15,23,42,0.9))]">
        <div className="h-full w-full p-2.5">
          <div
            className="h-full w-full overflow-hidden rounded-[10px] border border-border/60 bg-background/88"
            ref={frameRef}
          >
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/92 px-2.5 py-1 text-[11px] text-muted-foreground shadow-sm">
                  <Loader2 className="size-3 animate-spin" />
                  Rendering
                </div>
              </div>
            ) : error ? (
              <PreviewFallback kindLabel={previewState.kindLabel} />
            ) : previewState.elements.length > 0 ? (
              <ReadonlyBoardPreview
                elements={previewState.elements}
                frameSize={frameSize}
                theme={resolvedTheme}
              />
            ) : (
              <PreviewFallback kindLabel={previewState.kindLabel} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
