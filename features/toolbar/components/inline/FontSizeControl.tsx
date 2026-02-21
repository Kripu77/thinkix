'use client';

import { useState, useRef, useEffect } from 'react';
import { cn, Slider } from '@thinkix/ui';
import { Type } from 'lucide-react';

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 96];

interface FontSizeControlProps {
  currentFontSize: string;
  onChange: (size: string) => void;
}

export function FontSizeControl({
  currentFontSize = '16',
  onChange,
}: FontSizeControlProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const size = parseInt(currentFontSize, 10) || 16;

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          'inline-flex items-center gap-1 h-7 px-1.5 rounded-md text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
        )}
        onClick={() => setOpen(!open)}
      >
        <Type className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs">{size}</span>
      </button>

      {open && (
        <div
          ref={contentRef}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 rounded-md border bg-popover p-2 shadow-md',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          <div className="flex items-center gap-2 w-32">
            <Slider
              value={[size]}
              onValueChange={([value]) => onChange(String(value))}
              min={FONT_SIZES[0]}
              max={FONT_SIZES[FONT_SIZES.length - 1]}
              step={2}
              className="flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
