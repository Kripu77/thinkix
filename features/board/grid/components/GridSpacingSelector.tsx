'use client';

import { memo } from 'react';
import { cn } from '@thinkix/ui';
import type { GridDensity } from '../types';
import { GRID_DENSITIES } from '../types';

export interface GridSpacingSelectorProps {
  readonly value: GridDensity;
  readonly onChange: (density: GridDensity) => void;
  readonly disabled?: boolean;
}

export const GridSpacingSelector = memo(function GridSpacingSelector({
  value,
  onChange,
  disabled = false,
}: GridSpacingSelectorProps) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Grid spacing">
      {GRID_DENSITIES.map((density) => {
        const isSelected = value === density;
        return (
          <button
            key={density}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${density}px spacing`}
            data-testid={`grid-spacing-${density}`}
            disabled={disabled}
            onClick={() => onChange(density)}
            className={cn(
              'flex-1 h-7 text-xs font-medium rounded-md transition-colors',
              'border border-border/50',
              'hover:bg-accent/50',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isSelected && [
                'bg-primary text-primary-foreground',
                'border-primary',
                'hover:bg-primary hover:text-primary-foreground',
              ]
            )}
          >
            {density}
          </button>
        );
      })}
    </div>
  );
});
