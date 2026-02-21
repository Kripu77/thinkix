'use client';

import { cn, useDropdownOpen } from '@thinkix/ui';
import { ArrowRight } from 'lucide-react';
import { ArrowLineMarkerType, ArrowLineShape } from '@plait/draw';
import { LINE_SHAPE_OPTIONS } from '@/shared/constants/inline-toolbar';
import { StartArrowIcon } from '@/shared/constants/icons';

interface ArrowDropdownProps {
  lineShape?: ArrowLineShape;
  onLineShapeChange: (shape: ArrowLineShape) => void;
  sourceMarker?: ArrowLineMarkerType;
  targetMarker?: ArrowLineMarkerType;
  onMarkerChange: (end: 'source' | 'target', marker: ArrowLineMarkerType) => void;
}

export function ArrowDropdown({
  lineShape = ArrowLineShape.straight,
  onLineShapeChange,
  sourceMarker,
  targetMarker,
  onMarkerChange,
}: ArrowDropdownProps) {
  const { open, toggle, triggerRef, contentRef } = useDropdownOpen();
  
  const currentShape = LINE_SHAPE_OPTIONS.find(o => o.value === lineShape) || LINE_SHAPE_OPTIONS[0];
  const CurrentIcon = currentShape.icon;

  const toggleMarker = (end: 'source' | 'target') => {
    const currentMarker = end === 'source' ? sourceMarker : targetMarker;
    const newMarker = currentMarker === ArrowLineMarkerType.arrow
      ? ArrowLineMarkerType.none
      : ArrowLineMarkerType.arrow;
    onMarkerChange(end, newMarker);
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          'inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
        )}
        onClick={toggle}
      >
        <CurrentIcon className="h-4 w-4" />
      </button>

      {open && (
        <div
          ref={contentRef}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'absolute top-full left-0 mt-1 z-50 w-48 rounded-md border bg-popover p-2 shadow-md',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          <div className="text-xs text-muted-foreground mb-2">Line Type</div>
          <div className="flex items-center gap-1 mb-3">
            {LINE_SHAPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'h-8 w-8 inline-flex items-center justify-center rounded-md transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  lineShape === option.value && 'bg-accent text-accent-foreground'
                )}
                onClick={() => onLineShapeChange(option.value)}
                title={option.label}
              >
                <option.icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          <div className="h-px bg-border my-2" />
          
          <div className="text-xs text-muted-foreground mb-2">Arrowheads</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cn(
                'h-8 px-3 inline-flex items-center gap-1.5 rounded-md transition-colors text-xs',
                'hover:bg-accent hover:text-accent-foreground',
                sourceMarker === ArrowLineMarkerType.arrow && 'bg-accent text-accent-foreground'
              )}
              onClick={() => toggleMarker('source')}
            >
              <StartArrowIcon className="h-3.5 w-3.5" />
              Start
            </button>
            <button
              type="button"
              className={cn(
                'h-8 px-3 inline-flex items-center gap-1.5 rounded-md transition-colors text-xs',
                'hover:bg-accent hover:text-accent-foreground',
                targetMarker === ArrowLineMarkerType.arrow && 'bg-accent text-accent-foreground'
              )}
              onClick={() => toggleMarker('target')}
            >
              <ArrowRight className="h-3.5 w-3.5" />
              End
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
