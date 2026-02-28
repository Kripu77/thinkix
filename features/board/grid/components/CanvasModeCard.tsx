'use client';

import { memo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@thinkix/ui';
import type { GridType } from '../types';
import { CANVAS_MODE_LABELS } from '../constants';

const GRID_TYPE_PREVIEWS: Record<GridType, React.ReactNode> = {
  blank: (
    <div className="w-full h-full rounded bg-muted/30 border border-border/50" />
  ),
  dot: (
    <div className="w-full h-full rounded bg-muted/30 border border-border/50 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-muted-foreground/60" aria-hidden="true">
        <circle cx="6" cy="6" r="1.5" fill="currentColor" />
        <circle cx="12" cy="6" r="1.5" fill="currentColor" />
        <circle cx="18" cy="6" r="1.5" fill="currentColor" />
        <circle cx="6" cy="12" r="1.5" fill="currentColor" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <circle cx="18" cy="12" r="1.5" fill="currentColor" />
        <circle cx="6" cy="18" r="1.5" fill="currentColor" />
        <circle cx="12" cy="18" r="1.5" fill="currentColor" />
        <circle cx="18" cy="18" r="1.5" fill="currentColor" />
      </svg>
    </div>
  ),
  square: (
    <div className="w-full h-full rounded bg-muted/30 border border-border/50 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-muted-foreground/60" aria-hidden="true">
        <line x1="8" y1="0" x2="8" y2="24" stroke="currentColor" strokeWidth="1" />
        <line x1="16" y1="0" x2="16" y2="24" stroke="currentColor" strokeWidth="1" />
        <line x1="0" y1="8" x2="24" y2="8" stroke="currentColor" strokeWidth="1" />
        <line x1="0" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  ),
  blueprint: (
    <div className="w-full h-full rounded bg-blue-50/50 border border-blue-200/50 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-400/70" aria-hidden="true">
        <line x1="8" y1="0" x2="8" y2="24" stroke="currentColor" strokeWidth="0.5" />
        <line x1="16" y1="0" x2="16" y2="24" stroke="currentColor" strokeWidth="0.5" />
        <line x1="0" y1="8" x2="24" y2="8" stroke="currentColor" strokeWidth="0.5" />
        <line x1="0" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="0.5" />
        <line x1="12" y1="0" x2="12" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.7" />
        <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      </svg>
    </div>
  ),
  isometric: (
    <div className="w-full h-full rounded bg-muted/30 border border-border/50 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-muted-foreground/60" aria-hidden="true">
        <line x1="12" y1="2" x2="4" y2="14" stroke="currentColor" strokeWidth="0.75" />
        <line x1="12" y1="2" x2="20" y2="14" stroke="currentColor" strokeWidth="0.75" />
        <line x1="4" y1="14" x2="12" y2="22" stroke="currentColor" strokeWidth="0.75" />
        <line x1="20" y1="14" x2="12" y2="22" stroke="currentColor" strokeWidth="0.75" />
      </svg>
    </div>
  ),
  ruled: (
    <div className="w-full h-full rounded bg-amber-50/50 border border-amber-200/50 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-500/70" aria-hidden="true">
        <line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="0.5" />
        <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="0.5" />
        <line x1="0" y1="18" x2="24" y2="18" stroke="currentColor" strokeWidth="0.5" />
        <line x1="8" y1="0" x2="8" y2="24" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  ),
};

export interface CanvasModeCardProps {
  readonly type: GridType;
  readonly isSelected: boolean;
  readonly onSelect: (type: GridType) => void;
  readonly disabled?: boolean;
}

export const CanvasModeCard = memo(function CanvasModeCard({
  type,
  isSelected,
  onSelect,
  disabled = false,
}: CanvasModeCardProps) {
  const handleClick = () => {
    if (!disabled) {
      onSelect(type);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
      event.preventDefault();
      onSelect(type);
    }
  };

  const label = CANVAS_MODE_LABELS[type];
  const preview = GRID_TYPE_PREVIEWS[type];

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={label}
      data-testid={`canvas-mode-${type}`}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex items-center gap-2 px-2.5 py-2 rounded-md transition-all duration-150',
        'border border-transparent',
        'hover:bg-accent/50',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isSelected && [
          'bg-accent/60',
          'border-primary/30',
        ]
      )}
    >
      <div className="relative w-7 h-7 flex-shrink-0" data-testid="canvas-mode-preview">
        {preview}
        {isSelected && (
          <div 
            className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-primary rounded-full flex items-center justify-center"
            data-testid="canvas-mode-checkmark"
          >
            <Check className="h-2 w-2 text-primary-foreground" aria-hidden="true" />
          </div>
        )}
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </button>
  );
});
