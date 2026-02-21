'use client';

import { cn, useDropdownOpen, isNoColor } from '@thinkix/ui';
import { Check, Palette } from 'lucide-react';
import {
  INLINE_COLORS,
  NO_COLOR_SWATCH,
  NO_COLOR_PATTERN,
} from '@/shared/constants/inline-toolbar';

interface TextColorDropdownProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

export function TextColorDropdown({
  currentColor,
  onColorChange,
}: TextColorDropdownProps) {
  const { open, toggle, triggerRef, contentRef } = useDropdownOpen();

  const isColorSelected = (color: string) => {
    if (color === NO_COLOR_SWATCH) {
      return isNoColor(currentColor);
    }
    return currentColor === color;
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          'inline-flex items-center gap-1 h-7 px-1.5 rounded-md text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
        )}
        onClick={toggle}
      >
        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
        <div
          className="w-4 h-4 rounded-sm border border-border/50"
          style={{
            backgroundColor: isNoColor(currentColor) ? 'transparent' : currentColor,
            ...(isNoColor(currentColor) ? NO_COLOR_PATTERN : {}),
          }}
        />
      </button>

      {open && (
        <div
          ref={contentRef}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'absolute top-full left-0 mt-1 z-50 w-64 rounded-md border bg-popover p-2 shadow-md',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          <div className="text-xs text-muted-foreground mb-2">Text Color</div>
          <div className="grid grid-cols-6 gap-1.5">
            {INLINE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  'relative rounded transition-all hover:scale-110 focus-visible:outline-none h-6 w-6',
                  color === NO_COLOR_SWATCH && 'bg-background'
                )}
                style={{
                  backgroundColor: isNoColor(color) ? undefined : color,
                  ...(isNoColor(color) ? NO_COLOR_PATTERN : {}),
                  boxShadow: isColorSelected(color) ? '0 0 0 2px var(--ring)' : undefined,
                  border: isColorSelected(color) ? 'none' : '1px solid var(--border)',
                }}
                onClick={() => onColorChange(color)}
              >
                {isColorSelected(color) && !isNoColor(color) && (
                  <Check className="absolute inset-0 h-full w-full p-1 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
