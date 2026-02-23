'use client';

import { cn, useDropdownOpen, isNoColor } from '@thinkix/ui';
import { Slider } from '@thinkix/ui';
import { PaintBucket, Pencil, Check } from 'lucide-react';
import { StrokeStyle } from '@plait/common';
import {
  INLINE_COLORS,
  NO_COLOR_SWATCH,
  NO_COLOR_PATTERN,
  FILL_STYLE_OPTIONS,
  STROKE_STYLE_OPTIONS,
} from '@/shared/constants/inline-toolbar';

interface ColorDropdownProps {
  type: 'fill' | 'stroke';
  currentColor: string;
  onColorChange: (color: string) => void;
  showFillStyle?: boolean;
  fillStyle?: string;
  onFillStyleChange?: (style: string) => void;
  showStrokeStyle?: boolean;
  strokeStyle?: StrokeStyle | string;
  onStrokeStyleChange?: (style: StrokeStyle) => void;
  showStrokeWidth?: boolean;
  strokeWidth?: number;
  onStrokeWidthChange?: (width: number) => void;
}

export function ColorDropdown({
  type,
  currentColor,
  onColorChange,
  showFillStyle,
  fillStyle = 'solid',
  onFillStyleChange,
  showStrokeStyle,
  strokeStyle = StrokeStyle.solid,
  onStrokeStyleChange,
  showStrokeWidth,
  strokeWidth = 2,
  onStrokeWidthChange,
}: ColorDropdownProps) {
  const { open, toggle, triggerRef, contentRef } = useDropdownOpen();
  const Icon = type === 'fill' ? PaintBucket : Pencil;
  const label = type === 'fill' ? 'Fill' : 'Stroke';

  const isColorSelected = (color: string) => {
    if (color === NO_COLOR_SWATCH) {
      return isNoColor(currentColor);
    }
    return currentColor === color;
  };

  return (
    <div className="relative" data-testid={`${type}-dropdown`}>
      <button
        ref={triggerRef}
        type="button"
        data-testid={`${type}-button`}
        className={cn(
          'inline-flex items-center gap-1.5 h-8 px-2 rounded-md text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          open && 'bg-accent text-accent-foreground'
        )}
        onClick={toggle}
      >
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <div
          className="w-5 h-5 rounded-sm border border-border/50"
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
            'absolute top-full left-0 mt-1 z-50 w-72 rounded-md border bg-popover p-2 shadow-md',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          <div className="text-xs text-muted-foreground mb-2">{label} Color</div>
          <div className="grid grid-cols-6 gap-1.5 mb-3">
            {INLINE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                data-testid={`color-swatch-${color.replace('#', '')}`}
                data-color={color}
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

          {showStrokeWidth && onStrokeWidthChange && (
            <>
              <div className="h-px bg-border my-2" />
              <div className="text-xs text-muted-foreground mb-2">Stroke Width</div>
              <div className="flex items-center gap-3" data-testid="stroke-width-control">
                <span className="text-xs text-muted-foreground w-6" data-testid="stroke-width-value">{strokeWidth}px</span>
                <Slider
                  value={[strokeWidth]}
                  onValueChange={([value]) => onStrokeWidthChange(value)}
                  min={1}
                  max={20}
                  step={1}
                  className="flex-1"
                  data-testid="stroke-width-slider"
                />
              </div>
            </>
          )}

          {showStrokeStyle && onStrokeStyleChange && (
            <>
              <div className="h-px bg-border my-2" />
              <div className="text-xs text-muted-foreground mb-2">Stroke Style</div>
              <div className="flex items-center gap-1" data-testid="stroke-style-options">
                {STROKE_STYLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    data-testid={`stroke-style-${option.value}`}
                    className={cn(
                      'h-8 w-8 inline-flex items-center justify-center rounded-md transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      strokeStyle === option.value && 'bg-accent text-accent-foreground'
                    )}
                    onClick={() => onStrokeStyleChange(option.value)}
                    title={option.label}
                  >
                    <option.icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </>
          )}

          {showFillStyle && onFillStyleChange && (
            <>
              <div className="h-px bg-border my-2" />
              <div className="text-xs text-muted-foreground mb-2">Fill Pattern</div>
              <div className="grid grid-cols-6 gap-1" data-testid="fill-style-options">
                {FILL_STYLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    data-testid={`fill-style-${option.value}`}
                    className={cn(
                      'h-8 w-8 inline-flex items-center justify-center rounded-md transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      fillStyle === option.value && 'bg-accent text-accent-foreground'
                    )}
                    onClick={() => onFillStyleChange(option.value)}
                    title={option.label}
                  >
                    <option.icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
