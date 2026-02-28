'use client';

import { memo, useState, useId } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn, Slider, Toggle } from '@thinkix/ui';
import type { AdvancedSettings } from '../types';

export interface AdvancedSectionProps {
  readonly settings: AdvancedSettings;
  readonly onSettingsChange: (settings: AdvancedSettings) => void;
  readonly disabled?: boolean;
}

export const AdvancedSection = memo(function AdvancedSection({
  settings,
  onSettingsChange,
  disabled = false,
}: AdvancedSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  return (
    <div className="mt-3 pt-3 border-t border-border" data-testid="advanced-section">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1 w-full text-left',
          'text-xs font-medium text-muted-foreground',
          'hover:text-foreground transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <ChevronRight
          className={cn(
            'h-3 w-3 transition-transform duration-200',
            isOpen && 'rotate-90'
          )}
        />
        Advanced
      </button>

      {isOpen && (
        <div id={contentId} className="mt-3 space-y-3 pl-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Snap Strength</span>
            <div className="flex items-center gap-2 w-24">
              <Slider
                value={[settings.snapStrength]}
                onValueChange={([v]) => onSettingsChange({ ...settings, snapStrength: v })}
                disabled={disabled}
                min={0}
                max={100}
                step={1}
              />
              <span className="text-xs text-muted-foreground w-6 text-right">
                {settings.snapStrength}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Fade Grid</span>
            <Toggle
              pressed={settings.fadeGrid}
              onPressedChange={(pressed) => onSettingsChange({ ...settings, fadeGrid: pressed })}
              disabled={disabled}
              size="sm"
              className="h-6 px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {settings.fadeGrid ? 'On' : 'Off'}
            </Toggle>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Grid Opacity</span>
            <div className="flex items-center gap-2 w-24">
              <Slider
                value={[settings.gridOpacity]}
                onValueChange={([v]) => onSettingsChange({ ...settings, gridOpacity: v })}
                disabled={disabled}
                min={0}
                max={100}
                step={1}
              />
              <span className="text-xs text-muted-foreground w-6 text-right">
                {settings.gridOpacity}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
