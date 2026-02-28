'use client';

import { memo, useCallback, useId } from 'react';
import { HelpCircle } from 'lucide-react';
import { Button, cn } from '@thinkix/ui';
import { CanvasModeCard } from './CanvasModeCard';
import { GridSpacingSelector } from './GridSpacingSelector';
import { MajorGridSelect } from './MajorGridSelect';
import { AdvancedSection } from './AdvancedSection';
import type { GridType, GridDensity, BoardBackground, AdvancedSettings } from '../types';
import { CANVAS_MODE_ORDER, supportsMajorGrid } from '../constants';
import { DEFAULT_ADVANCED_SETTINGS } from '../types';

export interface CanvasModePanelProps {
  readonly config: BoardBackground;
  readonly onTypeChange: (type: GridType) => void;
  readonly onDensityChange: (density: GridDensity) => void;
  readonly onShowMajorChange: (showMajor: boolean) => void;
  readonly advancedSettings?: AdvancedSettings;
  readonly onAdvancedSettingsChange?: (settings: AdvancedSettings) => void;
  readonly disabled?: boolean;
}

export const CanvasModePanel = memo(function CanvasModePanel({
  config,
  onTypeChange,
  onDensityChange,
  onShowMajorChange,
  advancedSettings = DEFAULT_ADVANCED_SETTINGS,
  onAdvancedSettingsChange,
  disabled = false,
}: CanvasModePanelProps) {
  const radiogroupId = useId();
  const { type, density, showMajor } = config;

  const isBlankMode = type === 'blank';
  const shouldShowMajorGrid = supportsMajorGrid(type) && !isBlankMode;

  const handleTypeSelect = useCallback((newType: GridType) => {
    onTypeChange(newType);
  }, [onTypeChange]);

  const handleDensityChange = useCallback((newDensity: GridDensity) => {
    onDensityChange(newDensity);
  }, [onDensityChange]);

  const handleShowMajorChange = useCallback((checked: boolean) => {
    onShowMajorChange(checked);
  }, [onShowMajorChange]);

  const handleAdvancedSettingsChange = useCallback((settings: AdvancedSettings) => {
    onAdvancedSettingsChange?.(settings);
  }, [onAdvancedSettingsChange]);

  return (
    <div className="w-72 p-4" data-testid="canvas-mode-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">
          Canvas Mode
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full"
          title="Help"
        >
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>

      <div
        id={radiogroupId}
        role="radiogroup"
        aria-label="Canvas mode selection"
        className="grid grid-cols-2 gap-1.5"
      >
        {CANVAS_MODE_ORDER.map((gridType) => (
          <CanvasModeCard
            key={gridType}
            type={gridType}
            isSelected={type === gridType}
            onSelect={handleTypeSelect}
            disabled={disabled}
          />
        ))}
      </div>

      <div
        className={cn(
          'mt-4 pt-4 border-t border-border transition-opacity duration-200',
          isBlankMode && 'opacity-0 pointer-events-none'
        )}
        aria-hidden={isBlankMode}
        inert={isBlankMode || undefined}
        data-testid="grid-settings-container"
      >
        <div className="mb-3">
          <h3 className="text-xs font-medium text-muted-foreground mb-2 px-0.5">Grid Spacing</h3>
          <GridSpacingSelector
            value={density}
            onChange={handleDensityChange}
            disabled={disabled}
          />
        </div>

        <div
          className={cn(
            'mt-3 transition-opacity duration-200',
            !shouldShowMajorGrid && 'opacity-0 pointer-events-none'
          )}
          aria-hidden={!shouldShowMajorGrid}
          data-testid="major-grid-container"
        >
          <MajorGridSelect
            checked={showMajor}
            onChange={handleShowMajorChange}
            disabled={disabled}
          />
        </div>

        {onAdvancedSettingsChange && (
          <AdvancedSection
            settings={advancedSettings}
            onSettingsChange={handleAdvancedSettingsChange}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
});
