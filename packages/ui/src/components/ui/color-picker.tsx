'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@thinkix/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@thinkix/ui';
import { SizeSlider } from '@thinkix/ui';
import { NoColorIcon } from '@thinkix/ui';
import { CLASSIC_COLORS, NO_COLOR, WHITE } from '@/shared/constants/colors';
import { splitRows, isNoColor } from '@thinkix/ui';
import { cn } from '@thinkix/ui';

export interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  stroke?: string;
  onStrokeChange?: (stroke: string) => void;
  strokeWidth?: number;
  onStrokeWidthChange?: (width: number) => void;
  showStrokeControls?: boolean;
  showStrokeWidth?: boolean;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ColorPicker({
  color,
  onChange,
  stroke,
  onStrokeChange,
  strokeWidth = 2,
  onStrokeWidthChange,
  showStrokeControls = false,
  showStrokeWidth = false,
  disabled = false,
  onOpenChange,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'fill' | 'stroke'>('fill');

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  const handleColorSelect = (selectedColor: string) => {
    if (activeTab === 'fill') {
      onChange(selectedColor);
    } else if (onStrokeChange) {
      onStrokeChange(selectedColor);
    }
    handleOpenChange(false);
  };

  const currentColor = activeTab === 'fill' ? color : stroke;

  const colorRows = splitRows(CLASSIC_COLORS, 10);
  const colorOptions = [...colorRows.flat(), WHITE, NO_COLOR];

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'relative h-8 w-8 shrink-0 overflow-hidden rounded-md border',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          disabled={disabled}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: isNoColor(color) ? 'transparent' : color,
              backgroundImage: isNoColor(color)
                ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                : undefined,
              backgroundSize: isNoColor(color) ? '8px 8px' : undefined,
              backgroundPosition: isNoColor(color) ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
            }}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-64 p-0"
        sideOffset={4}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-3" onPointerDown={(e) => e.stopPropagation()}>
          {showStrokeControls && (
            <>
              <div className="flex gap-1 mb-3">
                <Button
                  variant={activeTab === 'fill' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setActiveTab('fill')}
                >
                  Fill
                </Button>
                <Button
                  variant={activeTab === 'stroke' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setActiveTab('stroke')}
                >
                  Stroke
                </Button>
              </div>
            </>
          )}

          <div className="grid grid-cols-10 gap-1 mb-3">
            {colorOptions.map((c, index) => {
              const isSelected = currentColor === c;
              const isNoColorOption = c === NO_COLOR;

              return (
                <button
                  key={`${c}-${index}`}
                  type="button"
                  className={cn(
                    'relative h-6 w-6 rounded-md border border-border transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer',
                    isNoColorOption && 'bg-background'
                  )}
                  style={{
                    backgroundColor: isNoColorOption ? undefined : c,
                    backgroundImage: isNoColorOption
                      ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                      : undefined,
                    backgroundSize: isNoColorOption ? '6px 6px' : undefined,
                    backgroundPosition: isNoColorOption ? '0 0, 0 3px, 3px -3px, -3px 0px' : undefined,
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleColorSelect(c);
                  }}
                >
                  {isSelected && (
                    <Check className="absolute inset-0 h-full w-full p-1 text-foreground drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]" />
                  )}
                  {isNoColorOption && !isSelected && (
                    <NoColorIcon className="absolute inset-0 h-full w-full p-1 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>

          {showStrokeWidth && (!showStrokeControls || activeTab === 'stroke') && onStrokeWidthChange && (
            <>
              <DropdownMenuSeparator />
              <div className="pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Stroke Width</span>
                  <span className="text-xs font-medium">{strokeWidth}px</span>
                </div>
                <SizeSlider
                  value={strokeWidth}
                  onChange={onStrokeWidthChange}
                  min={1}
                  max={20}
                  step={1}
                  size="sm"
                />
              </div>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
