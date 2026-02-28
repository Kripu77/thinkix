'use client';

import { memo } from 'react';
import { cn } from '@thinkix/ui';

export interface MajorGridSelectProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly disabled?: boolean;
}

export const MajorGridSelect = memo(function MajorGridSelect({
  checked,
  onChange,
  disabled = false,
}: MajorGridSelectProps) {
  return (
    <div className="flex items-center justify-between" data-testid="major-grid-select">
      <span className="text-xs font-medium text-muted-foreground px-0.5">Major Grid</span>
      <button
        type="button"
        role="switch"
        aria-label="Major Grid"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
          'transition-colors duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          checked ? 'bg-primary' : 'bg-input'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0',
            'transition duration-200 ease-in-out',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
});
