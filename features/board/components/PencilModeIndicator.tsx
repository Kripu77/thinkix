'use client';

import { Pencil, X } from 'lucide-react';
import { useBoardState } from '../hooks/use-board-state';
import { cn } from '@thinkix/ui';

export function PencilModeIndicator() {
  const { state, setPencilMode } = useBoardState();
  
  if (!state.isPencilMode) return null;
  
  const positionClass = state.isMobile 
    ? 'absolute top-20 right-4 z-50' 
    : 'absolute top-16 left-4 z-50';
  
  return (
    <div 
      role="status"
      aria-live="polite"
      aria-label="Pencil mode is active. Touch input is disabled for palm rejection."
      className={cn(
        positionClass,
        "inline-flex items-center gap-2 px-3 py-1.5",
        "rounded-lg border bg-amber-100 dark:bg-amber-900/50",
        "text-amber-800 dark:text-amber-200",
        "text-sm font-medium",
        "shadow-sm"
      )}
    >
      <Pencil className="h-4 w-4" aria-hidden="true" />
      <span>Pencil Mode</span>
      <button
        type="button"
        onClick={() => setPencilMode(false)}
        className="ml-1 p-0.5 rounded hover:bg-amber-200 dark:hover:bg-amber-800"
        aria-label="Exit pencil mode"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
