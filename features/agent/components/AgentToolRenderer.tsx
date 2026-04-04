'use client';

import { cn } from '@/lib/utils';
import type { DynamicToolUIPart, ToolUIPart } from 'ai';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CopyIcon,
  FolderOpenIcon,
  GlobeIcon,
  HomeIcon,
  LayersIcon,
  MousePointer2Icon,
  PencilIcon,
  PlusIcon,
  ScanSearchIcon,
  TerminalIcon,
  Trash2Icon,
  XCircleIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { DiagramPreview } from './DiagramPreview';
import { LsTreeView } from './LsTreeView';
import { WebSearchResults } from './WebSearchResults';
import { Shimmer } from './ai-elements/shimmer';
import type {
  BoardListData,
  CommandResultData,
  ElementListData,
  RunToolOutput,
} from '../tools/result-types';
import type { WebSearchToolOutput } from '@thinkix/ai/tools';

type ToolPart = ToolUIPart | DynamicToolUIPart;

function parseRunCommand(input: unknown): string {
  if (!input || typeof input !== 'object') return '';
  const command = (input as Record<string, unknown>).command;
  if (typeof command !== 'string') return '';
  return command.trim().split(/\s+/)[0] || '';
}

function parseWriteCommand(
  input: unknown,
): { type: string; preview: string; content: string } | null {
  if (!input || typeof input !== 'object') return null;
  const command = (input as Record<string, unknown>).command;
  if (typeof command !== 'string') return null;

  const match = command.match(/^write\s+(mermaid|mindmap)\s+["']([\s\S]+?)["']\s*$/);
  if (!match) {
    const looseMatch = command.match(/^write\s+(mermaid|mindmap)(?:\s+([\s\S]*))?$/);
    if (!looseMatch) return null;
    const type = looseMatch[1];
    const rawContent = looseMatch[2]?.trim() ?? '';
    const content = rawContent.replace(/^["']/, '').replace(/["']$/, '');
    return { type, preview: extractDiagramPreview(type, content), content };
  }

  const type = match[1];
  const content = match[2];
  return { type, preview: extractDiagramPreview(type, content), content };
}

function extractDiagramPreview(type: string, content: string): string {
  if (type === 'mermaid') {
    const firstLine = content.split('\n')[0].trim();

    if (firstLine.startsWith('flowchart') || firstLine.startsWith('graph')) {
      const nodeMatch = content.match(/\[([^\]]+)\]|\(([^)]+)\)|\{([^}]+)\}|([A-Za-z]+)\s*---/);
      if (nodeMatch) {
        const label = nodeMatch[1] || nodeMatch[2] || nodeMatch[3] || nodeMatch[4];
        if (label && label.length < 30) return `flowchart: ${label}`;
      }
      return 'flowchart';
    }

    if (firstLine.startsWith('sequenceDiagram')) return 'sequence diagram';
    if (firstLine.startsWith('classDiagram')) return 'class diagram';
    if (firstLine.startsWith('erDiagram')) return 'ER diagram';
    if (firstLine.startsWith('stateDiagram')) return 'state diagram';

    return 'diagram';
  }

  if (type === 'mindmap') {
    const rootMatch = content.match(/^#\s+(.+)$/m);
    if (rootMatch) {
      const topic = rootMatch[1].trim();
      return topic.length > 40 ? `${topic.slice(0, 40)}...` : topic;
    }
    return 'mind map';
  }

  return type;
}

function getMermaidKindLabel(content: string): string {
  const firstLine = content
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)
    ?.toLowerCase();

  if (!firstLine) return 'Diagram';
  if (firstLine.startsWith('flowchart') || firstLine.startsWith('graph')) return 'Flowchart';
  if (firstLine.startsWith('sequencediagram')) return 'Sequence Diagram';
  if (firstLine.startsWith('classdiagram')) return 'Class Diagram';
  if (firstLine.startsWith('erdiagram')) return 'ER Diagram';
  if (firstLine.startsWith('statediagram')) return 'State Diagram';
  return 'Diagram';
}

function getDiagramTitle(type: string, content: string): string {
  const cleanTitle = (value: string) =>
    value.trim().replace(/^["']+|["']+$/g, '');

  if (type === 'mindmap') {
    const rootMatch = content.match(/^#\s+(.+)$/m);
    if (rootMatch) {
      return cleanTitle(rootMatch[1]);
    }
    return 'Mind Map';
  }

  const titleMatch = content.match(/^\s*title\s+(.+)$/im);
  if (titleMatch) {
    return cleanTitle(titleMatch[1]);
  }

  const kindLabel = getMermaidKindLabel(content);
  if (kindLabel === 'Flowchart') {
    const labelMatch = content.match(/\[([^\]]+)\]|\(\(([^)]+)\)\)|\(([^)]+)\)|\{([^}]+)\}/);
    const label = labelMatch?.[1] || labelMatch?.[2] || labelMatch?.[3] || labelMatch?.[4];
    return label ? cleanTitle(label) : kindLabel;
  }

  if (kindLabel === 'Class Diagram') {
    const classMatch = content.match(/^\s*class\s+([A-Za-z0-9_]+)/m);
    return classMatch?.[1] ? cleanTitle(classMatch[1]) : kindLabel;
  }

  if (kindLabel === 'ER Diagram') {
    const entityMatch = content.match(/^\s*([A-Za-z0-9_]+)\s+\|\|--/m);
    return entityMatch?.[1] ? cleanTitle(entityMatch[1]) : kindLabel;
  }

  return kindLabel;
}

function isRunToolOutput(output: unknown): output is RunToolOutput {
  if (!output || typeof output !== 'object') {
    return false;
  }

  const candidate = output as Record<string, unknown>;
  return (
    candidate.type === 'run-result' &&
    typeof candidate.text === 'string' &&
    typeof candidate.exitCode === 'number' &&
    typeof candidate.kind === 'string' &&
    typeof candidate.summary === 'string'
  );
}

function getRunOutput(output: unknown): RunToolOutput | null {
  return isRunToolOutput(output) ? output : null;
}

function isBoardListData(data: CommandResultData | undefined): data is BoardListData {
  return Boolean(data && 'boards' in data && Array.isArray(data.boards));
}

function isElementListData(data: CommandResultData | undefined): data is ElementListData {
  return Boolean(data && 'diagrams' in data && Array.isArray(data.diagrams));
}

function isWebSearchToolOutput(output: unknown): output is WebSearchToolOutput {
  return Boolean(
    output &&
      typeof output === 'object' &&
      'query' in output &&
      'count' in output &&
      'results' in output &&
      typeof (output as Record<string, unknown>).query === 'string' &&
      typeof (output as Record<string, unknown>).count === 'number' &&
      Array.isArray((output as Record<string, unknown>).results),
  );
}

function summarizeElementList(data: ElementListData): string {
  const parts: string[] = [];
  const diagramCount = data.diagrams.length;
  const diagramElements = data.diagrams.reduce(
    (total, diagram) => total + diagram.shapes.length + diagram.lines.length + diagram.other.length,
    0,
  );

  if (diagramCount > 0) {
    parts.push(
      `${diagramCount} diagram${diagramCount === 1 ? '' : 's'} (${diagramElements} element${diagramElements === 1 ? '' : 's'})`,
    );
  }

  const counts = data.standalone.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.category] = (acc[entry.category] ?? 0) + 1;
    return acc;
  }, {});

  const labels: Record<string, string> = {
    shape: 'shape',
    sticky: 'sticky',
    text: 'text',
    mind: 'mind map',
    line: 'line',
    image: 'image',
    scribble: 'scribble',
    unknown: 'other',
  };

  for (const [category, count] of Object.entries(counts)) {
    const singular = labels[category] ?? category;
    const plural = singular.endsWith('s') ? singular : `${singular}s`;
    parts.push(`${count} ${count === 1 ? singular : plural}`);
  }

  return parts.length > 0 ? `Found ${parts.join(', ')}` : 'Board is empty';
}

function summarizeLsResult(result: RunToolOutput): string {
  if (result.kind === 'board-list' && isBoardListData(result.data)) {
    return result.data.boards.length === 0
      ? 'No boards'
      : `Found ${result.data.boards.length} board${result.data.boards.length === 1 ? '' : 's'}`;
  }

  if (result.kind === 'element-list' && isElementListData(result.data)) {
    return summarizeElementList(result.data);
  }

  return result.summary || 'Board is empty';
}

type WriteArtifact = {
  kindLabel: string;
  title: string;
  chips: string[];
};

function getWriteArtifact(part: ToolPart): WriteArtifact | null {
  const writeInfo = parseWriteCommand(part.input);
  if (!writeInfo) return null;

  const kindLabel =
    writeInfo.type === 'mindmap'
      ? 'Mind Map'
      : getMermaidKindLabel(writeInfo.content);
  const title = getDiagramTitle(writeInfo.type, writeInfo.content);
  const chips: string[] = [];
  const runOutput = getRunOutput(part.output);

  if (runOutput?.exitCode === 0) {
    const elementCountMatch = runOutput.text.match(/Created (\d+) element/);
    if (elementCountMatch?.[1]) {
      const elementCount = Number(elementCountMatch[1]);
      chips.push(`${elementCount} element${elementCount === 1 ? '' : 's'}`);
    }

    const shapeCount = (runOutput.text.match(/\bshape:/g) ?? []).length;
    if (shapeCount > 0) {
      chips.push(`${shapeCount} shape${shapeCount === 1 ? '' : 's'}`);
    }

    const lineCount = (runOutput.text.match(/\bline:/g) ?? []).length;
    if (lineCount > 0) {
      chips.push(`${lineCount} connection${lineCount === 1 ? '' : 's'}`);
    }
  }

  return {
    kindLabel,
    title,
    chips,
  };
}

type ToolIconConfig = {
  icon: ReactNode;
  runningClass: string;
};

const TOOL_ICONS: Record<string, ToolIconConfig> = {
  run: {
    icon: <TerminalIcon className="size-4" />,
    runningClass: 'animate-pulse',
  },
  web_search: {
    icon: <GlobeIcon className="size-4" />,
    runningClass: 'animate-pulse',
  },
};

const SUBCOMMAND_ICONS: Record<string, ToolIconConfig> = {
  ls: { icon: <LayersIcon className="size-4" />, runningClass: 'animate-pulse' },
  cd: { icon: <FolderOpenIcon className="size-4" />, runningClass: 'animate-pulse' },
  pwd: { icon: <HomeIcon className="size-4" />, runningClass: 'animate-pulse' },
  cat: { icon: <ScanSearchIcon className="size-4" />, runningClass: 'animate-pulse' },
  touch: { icon: <PlusIcon className="size-4" />, runningClass: 'animate-pulse' },
  mkdir: { icon: <FolderOpenIcon className="size-4" />, runningClass: 'animate-pulse' },
  rm: { icon: <Trash2Icon className="size-4" />, runningClass: 'animate-pulse' },
  rmdir: { icon: <Trash2Icon className="size-4" />, runningClass: 'animate-pulse' },
  cp: { icon: <CopyIcon className="size-4" />, runningClass: 'animate-pulse' },
  patch: { icon: <PencilIcon className="size-4" />, runningClass: 'animate-pulse' },
  write: { icon: <PlusIcon className="size-4" />, runningClass: 'animate-pulse' },
  select: { icon: <MousePointer2Icon className="size-4" />, runningClass: 'animate-pulse' },
};

const SUBCOMMAND_TITLES: Record<string, { running: string; done: (result: RunToolOutput) => string }> = {
  ls: {
    running: 'Scanning board',
    done: summarizeLsResult,
  },
  cd: {
    running: 'Switching board',
    done: (result) => result.summary || result.text.split('\n')[0] || 'Switched board',
  },
  pwd: {
    running: 'Getting location',
    done: (result) => result.summary || result.text || 'Got location',
  },
  cat: {
    running: 'Reading element',
    done: () => 'Read element details',
  },
  touch: {
    running: 'Creating element',
    done: (result) => result.summary || result.text || 'Created element',
  },
  mkdir: {
    running: 'Creating board',
    done: (result) => result.summary || result.text.split('\n')[0] || 'Created board',
  },
  rm: {
    running: 'Removing elements',
    done: (result) => result.summary || result.text || 'Removed elements',
  },
  rmdir: {
    running: 'Removing board',
    done: (result) => result.summary || result.text.split('\n')[0] || 'Removed board',
  },
  cp: {
    running: 'Duplicating element',
    done: (result) => result.summary || result.text || 'Duplicated element',
  },
  patch: {
    running: 'Updating element',
    done: (result) => result.summary || result.text || 'Updated element',
  },
  write: {
    running: 'Creating elements',
    done: (result) => result.summary || result.text || 'Created elements',
  },
  select: {
    running: 'Selecting elements',
    done: (result) => result.summary || result.text || 'Selected elements',
  },
};

const TOOL_TITLES: Record<string, { running: string; done: (result?: unknown) => string }> = {
  run: {
    running: 'Executing command',
    done: (result) => {
      if (!result) return 'Command complete';
      if (isRunToolOutput(result)) {
        if (result.exitCode !== 0) {
          const firstLine = result.text.split('\n')[0];
          return firstLine.startsWith('[error]')
            ? firstLine.replace('[error] ', '')
            : firstLine;
        }

        return result.summary || result.text.split('\n')[0] || 'Command complete';
      }
      return 'Invalid run result';
    },
  },
  web_search: {
    running: 'Searching the web',
    done: (result) => {
      if (isWebSearchToolOutput(result)) {
        if (result.error) {
          return result.error;
        }

        return result.count === 0
          ? 'No web results'
          : `Found ${result.count} result${result.count === 1 ? '' : 's'}`;
      }
      return 'Invalid web search result';
    },
  },
};

function getToolName(part: ToolPart): string {
  return part.type === 'dynamic-tool'
    ? part.toolName
    : part.type.slice('tool-'.length);
}

function getSubcommand(part: ToolPart): string {
  return getToolName(part) === 'run' ? parseRunCommand(part.input) : '';
}

function getIconConfig(part: ToolPart): ToolIconConfig {
  const name = getToolName(part);
  if (name === 'run') {
    return SUBCOMMAND_ICONS[getSubcommand(part)] ?? TOOL_ICONS.run;
  }
  return TOOL_ICONS[name] ?? TOOL_ICONS.run;
}

function isRunning(state: ToolPart['state']): boolean {
  return state === 'input-available' || state === 'input-streaming';
}

function isError(state: ToolPart['state']): boolean {
  return state === 'output-error' || state === 'output-denied';
}

function hasErrorOutput(part: ToolPart): boolean {
  if (isError(part.state) || part.errorText) return true;
  if (part.state === 'output-available') {
    const runOutput = getToolName(part) === 'run' ? getRunOutput(part.output) : null;
    return runOutput?.exitCode !== undefined ? runOutput.exitCode !== 0 : false;
  }
  return false;
}

function getTitle(part: ToolPart): string {
  const name = getToolName(part);

  if (name === 'run') {
    const subcommand = getSubcommand(part);

    if (subcommand === 'write') {
      const writeInfo = parseWriteCommand(part.input);
      const isDone = part.state === 'output-available' || isError(part.state);

      if (writeInfo) {
        if (isDone) {
          if (part.errorText) {
            return part.errorText;
          }

          const runOutput = getRunOutput(part.output);
          if (!runOutput) {
            return 'Invalid run result';
          }

          const countMatch = runOutput.text.match(/Created (\d+) element/);
          const count = countMatch?.[1];

          if (runOutput.exitCode !== 0) {
            return runOutput.text.split('\n')[0];
          }

          const artifact = getWriteArtifact(part);
          return artifact
            ? `Created ${artifact.kindLabel}`
            : `Created ${writeInfo.preview}${count ? ` (${count} elements)` : ''}`;
        }

        const artifact = getWriteArtifact(part);
        return artifact ? `Creating ${artifact.kindLabel}` : `Creating ${writeInfo.preview}`;
      }
    }

    const config = SUBCOMMAND_TITLES[subcommand];
    if (config) {
      if (part.state === 'output-available' || isError(part.state)) {
        if (part.errorText) {
          return part.errorText;
        }
        const runOutput = getRunOutput(part.output);
        return runOutput ? config.done(runOutput) : 'Invalid run result';
      }

      return config.running;
    }
  }

  const config = TOOL_TITLES[name];
  if (!config) return name;

  if (part.state === 'output-available' || isError(part.state)) {
    return config.done(part.output as string | RunToolOutput | undefined);
  }

  return config.running;
}

function formatToolValue(value: unknown): string {
  if (isRunToolOutput(value)) return value.text;
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return JSON.stringify(value, null, 2);
}

function ToolIcon({ part }: { part: ToolPart }) {
  const config = getIconConfig(part);
  const running = isRunning(part.state);
  const error = hasErrorOutput(part);
  const done = part.state === 'output-available' && !error;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center transition-colors',
        running && config.runningClass,
        done && 'text-green-600',
        error && 'text-red-600',
        !done && !error && 'text-muted-foreground',
      )}
    >
      {config.icon}
    </span>
  );
}

function StatusBadge({ part }: { part: ToolPart }) {
  const error = hasErrorOutput(part);
  const done = part.state === 'output-available' && !error;

  if (error) {
    return <XCircleIcon className="size-3.5 text-red-600" />;
  }

  if (done) {
    return <CheckCircleIcon className="size-3.5 text-green-600" />;
  }

  return null;
}

function OutputPanel({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: unknown;
  tone?: 'default' | 'error';
}) {
  const text = formatToolValue(value);
  if (!text) return null;

  return (
    <div className="space-y-1">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <pre
        className={cn(
          'overflow-x-auto rounded-md border px-3 py-2 text-xs whitespace-pre-wrap break-words',
          tone === 'error'
            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-950 dark:bg-red-950/20 dark:text-red-300'
            : 'border-border/70 bg-background/80 text-foreground',
        )}
      >
        {text}
      </pre>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="space-y-2 py-1" data-testid="tool-loading-block">
      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      <div className="space-y-2 rounded-lg border border-border/60 bg-background/60 p-3">
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

function ArtifactChip({ label }: { label: string }) {
  return (
    <span className="rounded-md border border-border/70 bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {label}
    </span>
  );
}

function WriteToolHeader({ part }: { part: ToolPart }) {
  const artifact = getWriteArtifact(part);
  const running = isRunning(part.state);
  const error = hasErrorOutput(part);

  if (!artifact || error) {
    const title = getTitle(part);
    return (
      <span
        className={cn(
          'truncate text-xs font-medium',
          error ? 'text-red-600' : 'text-muted-foreground',
        )}
      >
        {running ? <Shimmer className="text-xs">{title}</Shimmer> : title}
      </span>
    );
  }

  const eyebrow = running ? `Creating ${artifact.kindLabel}` : `Created ${artifact.kindLabel}`;

  return (
    <div className="min-w-0 space-y-1">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-600">
        {running ? <Shimmer className="text-[10px]">{eyebrow}</Shimmer> : eyebrow}
      </div>
      <div className="truncate text-[13px] font-semibold text-foreground">
        {artifact.title}
      </div>
      {!running ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {artifact.chips.map((chip) => (
            <ArtifactChip key={chip} label={chip} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ToolExpandedContent({ part }: { part: ToolPart }) {
  const name = getToolName(part);
  const output = part.output;
  const running = isRunning(part.state);
  const subcommand = getSubcommand(part);

  if (name === 'run' && subcommand === 'ls' && part.state === 'output-available') {
    const result = getRunOutput(output);
    if (
      result &&
      result.exitCode === 0 &&
      result.kind === 'board-list' &&
      isBoardListData(result.data)
    ) {
      return <LsTreeView kind="board-list" data={result.data} />;
    }

    if (
      result &&
      result.exitCode === 0 &&
      result.kind === 'element-list' &&
      isElementListData(result.data)
    ) {
      return <LsTreeView kind="element-list" data={result.data} />;
    }
  }

  if (name === 'run' && subcommand === 'write') {
    const writeInfo = parseWriteCommand(part.input);

    if (running) {
      return <LoadingBlock />;
    }

    if (part.state === 'output-available') {
      const runOutput = getRunOutput(output);
      if (!runOutput) {
        return (
          <div className="space-y-3">
            <OutputPanel label="Command" value={part.input} />
            <OutputPanel label="Output" tone="error" value="Invalid run result" />
          </div>
        );
      }

      if (runOutput.exitCode === 0 && writeInfo) {
        return (
          <div className="space-y-2">
            <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
              <DiagramPreview
                content={writeInfo.content}
                type={writeInfo.type as 'mermaid' | 'mindmap'}
              />
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          <OutputPanel label="Command" value={part.input} />
          <OutputPanel
            label="Output"
            tone={runOutput.exitCode === 0 ? 'default' : 'error'}
            value={part.errorText || runOutput.text}
          />
        </div>
      );
    }
  }

  if (name === 'web_search') {
    if (running) {
      return <LoadingBlock />;
    }
    if (part.state === 'output-available') {
      return <WebSearchResults output={output} />;
    }
  }

  if (name === 'run' && part.state === 'output-available') {
    const runOutput = getRunOutput(output);
    return (
      <div className="space-y-3">
        <OutputPanel label="Command" value={part.input} />
        <OutputPanel
          label="Output"
          tone={runOutput?.exitCode === 0 ? 'default' : 'error'}
          value={part.errorText || runOutput?.text || 'Invalid run result'}
        />
      </div>
    );
  }

  if (running) {
    return (
      <div className="space-y-3">
        <OutputPanel label="Input" value={part.input} />
        <LoadingBlock />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <OutputPanel label="Input" value={part.input} />
      {part.errorText ? (
        <OutputPanel label="Error" tone="error" value={part.errorText} />
      ) : null}
      <OutputPanel label="Output" value={part.output} />
    </div>
  );
}

type AgentToolRendererProps = {
  part: ToolPart;
};

export function AgentToolRenderer({ part }: AgentToolRendererProps) {
  const title = getTitle(part);
  const running = isRunning(part.state);
  const error = hasErrorOutput(part);
  const isWriteCommand = getToolName(part) === 'run' && getSubcommand(part) === 'write';
  const [expanded, setExpanded] = useState(false);
  const isExpanded = expanded;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border/70 bg-background shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors',
        isWriteCommand && !error && 'border-emerald-200/60 shadow-[0_1px_2px_rgba(16,185,129,0.08)] dark:border-emerald-900/40',
      )}
    >
      <button
        className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left"
        onClick={() => {
          setExpanded((current) => !current);
        }}
        type="button"
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className={cn(
              'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background shadow-sm',
              isWriteCommand && !error && 'border-emerald-200/80 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/30',
            )}
          >
            <ToolIcon part={part} />
          </div>
          <div className="min-w-0 flex-1">
            {isWriteCommand ? (
              <WriteToolHeader part={part} />
            ) : (
              <span
                className={cn(
                  'truncate text-xs font-medium',
                  error ? 'text-red-600' : 'text-muted-foreground',
                )}
              >
                {running ? <Shimmer className="text-xs">{title}</Shimmer> : title}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge part={part} />
          <ChevronDownIcon
            className={cn(
              'mt-0.5 size-4 text-muted-foreground transition-transform',
              isExpanded && 'rotate-180',
            )}
          />
        </div>
      </button>

      {isExpanded ? (
        <div className="space-y-2 border-t border-border/60 px-3 pb-3 pt-2.5">
          <ToolExpandedContent part={part} />
        </div>
      ) : null}
    </div>
  );
}
