'use client';

import { cn } from '@/lib/utils';
import { CalendarIcon, ExternalLinkIcon, GlobeIcon, UserIcon } from 'lucide-react';
import type { WebSearchResult, WebSearchToolOutput } from '@thinkix/ai/tools';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isWebSearchResult(value: unknown): value is WebSearchResult {
  return (
    isRecord(value) &&
    typeof value.title === 'string' &&
    typeof value.url === 'string' &&
    typeof value.summary === 'string'
  );
}

function isWebSearchToolOutput(value: unknown): value is WebSearchToolOutput {
  return (
    isRecord(value) &&
    typeof value.query === 'string' &&
    typeof value.count === 'number' &&
    Array.isArray(value.results) &&
    value.results.every((result) => isWebSearchResult(result))
  );
}

function getDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function ResultCard({ result, index }: { result: WebSearchResult; index: number }) {
  return (
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex flex-col gap-1.5 rounded-lg border border-transparent p-3 transition-all',
        'hover:border-primary/20 hover:bg-accent/50',
      )}
    >
      <div className="flex items-start gap-2">
        <span className="w-4 shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground/60">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="line-clamp-2 text-sm font-medium leading-tight text-foreground transition-colors group-hover:text-primary">
              {result.title}
            </h4>
            <ExternalLinkIcon className="size-3 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
              <GlobeIcon className="size-2.5" />
              <span className="max-w-[140px] truncate">{getDomain(result.url)}</span>
            </div>
            {result.publishedDate ? (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                <CalendarIcon className="size-2.5" />
                <span>{result.publishedDate}</span>
              </div>
            ) : null}
            {result.author ? (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                <UserIcon className="size-2.5" />
                <span className="max-w-[80px] truncate">{result.author}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {result.summary ? (
        <p className="pl-6 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {result.summary}
        </p>
      ) : null}
    </a>
  );
}

interface WebSearchResultsProps {
  output: unknown;
}

export function WebSearchResults({ output }: WebSearchResultsProps) {
  const parsed = isWebSearchToolOutput(output) ? output : null;

  if (!parsed) {
    return (
      <div className="whitespace-pre-wrap text-xs text-muted-foreground">
        Invalid web search result
      </div>
    );
  }

  if (parsed.error) {
    return (
      <div className="whitespace-pre-wrap text-xs text-destructive">
        {parsed.error}
      </div>
    );
  }

  if (parsed.results.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No results found for &quot;{parsed.query}&quot;.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">&quot;{parsed.query}&quot;</span>
        </div>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {parsed.count} {parsed.count === 1 ? 'result' : 'results'}
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-border/50 bg-background/50 divide-y divide-border/50">
        {parsed.results.map((result, index) => (
          <ResultCard key={result.url} index={index} result={result} />
        ))}
      </div>
    </div>
  );
}
