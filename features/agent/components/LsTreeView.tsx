'use client';

import {
  FileTree,
  FileTreeFile,
  FileTreeFolder,
} from './ai-elements/file-tree';
import {
  BoxIcon,
  BrainIcon,
  FolderIcon,
  GitCommitHorizontalIcon,
  ImageIcon,
  PenToolIcon,
  SquareIcon,
  StickyNoteIcon,
  TypeIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import type {
  BoardListData,
  ElementEntryData,
  ElementListData,
} from '../tools/result-types';

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode }> = {
  shape: { label: 'Shapes', icon: <BoxIcon className="size-4 text-blue-500" /> },
  sticky: { label: 'Stickies', icon: <StickyNoteIcon className="size-4 text-yellow-500" /> },
  text: { label: 'Text', icon: <TypeIcon className="size-4 text-foreground/70" /> },
  mind: { label: 'Mind Maps', icon: <BrainIcon className="size-4 text-purple-500" /> },
  line: { label: 'Lines', icon: <GitCommitHorizontalIcon className="size-4 text-muted-foreground" /> },
  image: { label: 'Images', icon: <ImageIcon className="size-4 text-emerald-500" /> },
  scribble: { label: 'Scribbles', icon: <PenToolIcon className="size-4 text-orange-500" /> },
  unknown: { label: 'Other', icon: <SquareIcon className="size-4 text-muted-foreground" /> },
};

type LsTreeViewProps =
  | {
      kind: 'board-list';
      data: BoardListData;
    }
  | {
      kind: 'element-list';
      data: ElementListData;
    };

function groupStandaloneEntries(entries: ElementEntryData[]): Map<string, ElementEntryData[]> {
  const grouped = new Map<string, ElementEntryData[]>();

  for (const entry of entries) {
    const key = entry.category || 'unknown';
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)?.push(entry);
  }

  return grouped;
}

export function LsTreeView(props: LsTreeViewProps) {
  const categories = useMemo(
    () => (props.kind === 'element-list' ? groupStandaloneEntries(props.data.standalone) : new Map<string, ElementEntryData[]>()),
    [props],
  );

  const defaultExpanded = useMemo(() => {
    const keys = new Set<string>();

    if (props.kind === 'board-list') {
      if (props.data.boards.length > 0) {
        keys.add('/');
      }
      return keys;
    }

    for (const diagram of props.data.diagrams) {
      keys.add(diagram.id);
      keys.add(`${diagram.id}/shapes`);
      keys.add(`${diagram.id}/lines`);
      if (diagram.other.length > 0) {
        keys.add(`${diagram.id}/other`);
      }
    }

    for (const type of categories.keys()) {
      keys.add(type);
    }

    return keys;
  }, [categories, props]);

  if (props.kind === 'board-list') {
    if (props.data.boards.length === 0) {
      return <p className="py-1 text-xs text-muted-foreground">No boards found.</p>;
    }

    return (
      <FileTree className="text-xs" defaultExpanded={defaultExpanded}>
        <FileTreeFolder path="/" name="/">
          {props.data.boards.map((board) => (
            <FileTreeFile
              icon={<FolderIcon className="size-4 text-blue-500" />}
              key={board.id}
              name={board.path}
              path={board.path}
            >
              {board.isCurrent ? (
                <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
                  current
                </span>
              ) : null}
            </FileTreeFile>
          ))}
        </FileTreeFolder>
      </FileTree>
    );
  }

  if (props.data.diagrams.length === 0 && props.data.standalone.length === 0) {
    return <p className="py-1 text-xs text-muted-foreground">No elements found.</p>;
  }

  return (
    <FileTree className="text-xs" defaultExpanded={defaultExpanded}>
      {props.data.diagrams.map((diagram) => (
        <FileTreeFolder
          key={diagram.id}
          name={`Diagram (${diagram.label})`}
          path={diagram.id}
        >
          {diagram.shapes.length > 0 ? (
            <FileTreeFolder
              name={`Shapes (${diagram.shapes.length})`}
              path={`${diagram.id}/shapes`}
            >
              {diagram.shapes.map((entry) => (
                <FileTreeFile
                  icon={CATEGORY_META[entry.type]?.icon ?? CATEGORY_META.unknown.icon}
                  key={entry.id}
                  name={entry.label}
                  path={entry.id}
                />
              ))}
            </FileTreeFolder>
          ) : null}
          {diagram.lines.length > 0 ? (
            <FileTreeFolder
              name={`Lines (${diagram.lines.length})`}
              path={`${diagram.id}/lines`}
            >
              {diagram.lines.map((entry) => (
                <FileTreeFile
                  icon={CATEGORY_META.line.icon}
                  key={entry.id}
                  name={entry.label}
                  path={entry.id}
                />
              ))}
            </FileTreeFolder>
          ) : null}
          {diagram.other.length > 0 ? (
            <FileTreeFolder
              name={`Other (${diagram.other.length})`}
              path={`${diagram.id}/other`}
            >
              {diagram.other.map((entry) => (
                <FileTreeFile
                  icon={CATEGORY_META[entry.type]?.icon ?? CATEGORY_META.unknown.icon}
                  key={entry.id}
                  name={entry.label}
                  path={entry.id}
                />
              ))}
            </FileTreeFolder>
          ) : null}
        </FileTreeFolder>
      ))}

      {Array.from(categories.entries()).map(([type, entries]) => {
        const meta = CATEGORY_META[type] ?? CATEGORY_META.unknown;
        return (
          <FileTreeFolder
            key={type}
            name={`${meta.label} (${entries.length})`}
            path={type}
          >
            {entries.map((entry) => (
              <FileTreeFile
                icon={meta.icon}
                key={entry.id}
                name={entry.label}
                path={entry.id}
              />
            ))}
          </FileTreeFolder>
        );
      })}
    </FileTree>
  );
}
