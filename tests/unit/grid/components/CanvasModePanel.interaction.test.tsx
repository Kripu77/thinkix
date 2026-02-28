import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CanvasModePanel } from '@/features/board/grid/components/CanvasModePanel';
import type { BoardBackground } from '@/features/board/grid/types';

const createConfig = (overrides: Partial<BoardBackground> = {}): BoardBackground => ({
  type: 'blank',
  density: 16,
  showMajor: true,
  ...overrides,
});

describe('CanvasModePanel Interaction', () => {
  describe('tab navigation', () => {
    it('allows tabbing through canvas mode cards', () => {
      const onTypeChange = vi.fn();
      const onDensityChange = vi.fn();
      const onShowMajorChange = vi.fn();

      render(
        <CanvasModePanel
          config={createConfig({ type: 'dot' })}
          onTypeChange={onTypeChange}
          onDensityChange={onDensityChange}
          onShowMajorChange={onShowMajorChange}
        />
      );

      const canvasModeRadios = screen.getAllByRole('radio').filter((radio) => 
        radio.getAttribute('data-testid')?.startsWith('canvas-mode-')
      );
      expect(canvasModeRadios.length).toBe(6);
    });

    it('allows tabbing through grid spacing options when visible', () => {
      const onTypeChange = vi.fn();
      const onDensityChange = vi.fn();
      const onShowMajorChange = vi.fn();

      render(
        <CanvasModePanel
          config={createConfig({ type: 'dot' })}
          onTypeChange={onTypeChange}
          onDensityChange={onDensityChange}
          onShowMajorChange={onShowMajorChange}
        />
      );

      const spacingRadios = screen.getAllByRole('radio', { name: /spacing/i });
      expect(spacingRadios.length).toBe(6);
    });
  });

  describe('ARIA attributes', () => {
    it('has correct role for canvas mode radiogroup', () => {
      const onTypeChange = vi.fn();
      const onDensityChange = vi.fn();
      const onShowMajorChange = vi.fn();

      render(
        <CanvasModePanel
          config={createConfig()}
          onTypeChange={onTypeChange}
          onDensityChange={onDensityChange}
          onShowMajorChange={onShowMajorChange}
        />
      );

      const radiogroup = screen.getByRole('radiogroup', { name: 'Canvas mode selection' });
      expect(radiogroup).toBeInTheDocument();
    });

    it('has correct role for grid spacing radiogroup', () => {
      const onTypeChange = vi.fn();
      const onDensityChange = vi.fn();
      const onShowMajorChange = vi.fn();

      render(
        <CanvasModePanel
          config={createConfig({ type: 'square' })}
          onTypeChange={onTypeChange}
          onDensityChange={onDensityChange}
          onShowMajorChange={onShowMajorChange}
        />
      );

      const radiogroup = screen.getByRole('radiogroup', { name: 'Grid spacing' });
      expect(radiogroup).toBeInTheDocument();
    });

    it('has aria-checked on canvas mode cards', () => {
      const onTypeChange = vi.fn();
      const onDensityChange = vi.fn();
      const onShowMajorChange = vi.fn();

      render(
        <CanvasModePanel
          config={createConfig({ type: 'blueprint' })}
          onTypeChange={onTypeChange}
          onDensityChange={onDensityChange}
          onShowMajorChange={onShowMajorChange}
        />
      );

      const blueprintCard = screen.getByTestId('canvas-mode-blueprint');
      expect(blueprintCard).toHaveAttribute('aria-checked', 'true');

      const dotCard = screen.getByTestId('canvas-mode-dot');
      expect(dotCard).toHaveAttribute('aria-checked', 'false');
    });

    it('has aria-checked on grid spacing options', () => {
      const onTypeChange = vi.fn();
      const onDensityChange = vi.fn();
      const onShowMajorChange = vi.fn();

      render(
        <CanvasModePanel
          config={createConfig({ type: 'dot', density: 24 })}
          onTypeChange={onTypeChange}
          onDensityChange={onDensityChange}
          onShowMajorChange={onShowMajorChange}
        />
      );

      const selectedSpacing = screen.getByTestId('grid-spacing-24');
      expect(selectedSpacing).toHaveAttribute('aria-checked', 'true');

      const unselectedSpacing = screen.getByTestId('grid-spacing-16');
      expect(unselectedSpacing).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('keyboard selection', () => {
    it('selects canvas mode with Enter key', () => {
      const onTypeChange = vi.fn();
      const onDensityChange = vi.fn();
      const onShowMajorChange = vi.fn();

      render(
        <CanvasModePanel
          config={createConfig({ type: 'blank' })}
          onTypeChange={onTypeChange}
          onDensityChange={onDensityChange}
          onShowMajorChange={onShowMajorChange}
        />
      );

      const isometricCard = screen.getByTestId('canvas-mode-isometric');
      fireEvent.keyDown(isometricCard, { key: 'Enter' });

      expect(onTypeChange).toHaveBeenCalledWith('isometric');
    });

    it('selects canvas mode with Space key', () => {
      const onTypeChange = vi.fn();
      const onDensityChange = vi.fn();
      const onShowMajorChange = vi.fn();

      render(
        <CanvasModePanel
          config={createConfig({ type: 'blank' })}
          onTypeChange={onTypeChange}
          onDensityChange={onDensityChange}
          onShowMajorChange={onShowMajorChange}
        />
      );

      const ruledCard = screen.getByTestId('canvas-mode-ruled');
      fireEvent.keyDown(ruledCard, { key: ' ' });

      expect(onTypeChange).toHaveBeenCalledWith('ruled');
    });
  });

  describe('focus mode behavior', () => {
    it('hides major grid selector in blank (focus) mode', () => {
      const onTypeChange = vi.fn();
      const onDensityChange = vi.fn();
      const onShowMajorChange = vi.fn();

      render(
        <CanvasModePanel
          config={createConfig({ type: 'blank' })}
          onTypeChange={onTypeChange}
          onDensityChange={onDensityChange}
          onShowMajorChange={onShowMajorChange}
        />
      );

      const majorGridContainer = screen.getByTestId('major-grid-container');
      expect(majorGridContainer).toHaveAttribute('aria-hidden', 'true');
    });

    it('shows major grid selector when switching from blank to lines', () => {
      const onTypeChange = vi.fn();
      const onDensityChange = vi.fn();
      const onShowMajorChange = vi.fn();

      const { rerender } = render(
        <CanvasModePanel
          config={createConfig({ type: 'blank' })}
          onTypeChange={onTypeChange}
          onDensityChange={onDensityChange}
          onShowMajorChange={onShowMajorChange}
        />
      );

      let majorGridContainer = screen.getByTestId('major-grid-container');
      expect(majorGridContainer).toHaveAttribute('aria-hidden', 'true');

      rerender(
        <CanvasModePanel
          config={createConfig({ type: 'square' })}
          onTypeChange={onTypeChange}
          onDensityChange={onDensityChange}
          onShowMajorChange={onShowMajorChange}
        />
      );

      majorGridContainer = screen.getByTestId('major-grid-container');
      expect(majorGridContainer).toHaveAttribute('aria-hidden', 'false');
    });

    it('hides grid spacing controls in blank mode', () => {
      const onTypeChange = vi.fn();
      const onDensityChange = vi.fn();
      const onShowMajorChange = vi.fn();

      render(
        <CanvasModePanel
          config={createConfig({ type: 'blank' })}
          onTypeChange={onTypeChange}
          onDensityChange={onDensityChange}
          onShowMajorChange={onShowMajorChange}
        />
      );

      const gridSettingsContainer = screen.getByTestId('grid-settings-container');
      expect(gridSettingsContainer).toHaveAttribute('aria-hidden', 'true');
    });

    it('shows grid spacing controls when switching from blank to dot mode', () => {
      const onTypeChange = vi.fn();
      const onDensityChange = vi.fn();
      const onShowMajorChange = vi.fn();

      const { rerender } = render(
        <CanvasModePanel
          config={createConfig({ type: 'blank' })}
          onTypeChange={onTypeChange}
          onDensityChange={onDensityChange}
          onShowMajorChange={onShowMajorChange}
        />
      );

      let gridSettingsContainer = screen.getByTestId('grid-settings-container');
      expect(gridSettingsContainer).toHaveAttribute('aria-hidden', 'true');

      rerender(
        <CanvasModePanel
          config={createConfig({ type: 'dot' })}
          onTypeChange={onTypeChange}
          onDensityChange={onDensityChange}
          onShowMajorChange={onShowMajorChange}
        />
      );

      gridSettingsContainer = screen.getByTestId('grid-settings-container');
      expect(gridSettingsContainer).toHaveAttribute('aria-hidden', 'false');
    });
  });
});
