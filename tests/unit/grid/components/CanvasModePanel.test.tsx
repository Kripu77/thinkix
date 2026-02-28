import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CanvasModePanel } from '@/features/board/grid/components/CanvasModePanel';
import type { BoardBackground } from '@/features/board/grid/types';
import { CANVAS_MODE_ORDER, GRID_TYPES_SUPPORTING_MAJOR } from '@/features/board/grid/constants';

const createConfig = (overrides: Partial<BoardBackground> = {}): BoardBackground => ({
  type: 'blank',
  density: 16,
  showMajor: true,
  ...overrides,
});

describe('CanvasModePanel', () => {
  describe('rendering', () => {
    it('renders canvas mode panel with test id', () => {
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

      expect(screen.getByTestId('canvas-mode-panel')).toBeInTheDocument();
    });

    it('renders all 6 canvas mode options', () => {
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

      CANVAS_MODE_ORDER.forEach((type) => {
        expect(screen.getByTestId(`canvas-mode-${type}`)).toBeInTheDocument();
      });
    });

    it('renders with correct selected mode', () => {
      const onTypeChange = vi.fn();
      const onDensityChange = vi.fn();
      const onShowMajorChange = vi.fn();

      render(
        <CanvasModePanel
          config={createConfig({ type: 'isometric' })}
          onTypeChange={onTypeChange}
          onDensityChange={onDensityChange}
          onShowMajorChange={onShowMajorChange}
        />
      );

      const selectedCard = screen.getByTestId('canvas-mode-isometric');
      expect(selectedCard).toHaveAttribute('aria-checked', 'true');

      const unselectedCard = screen.getByTestId('canvas-mode-dot');
      expect(unselectedCard).toHaveAttribute('aria-checked', 'false');
    });

    it('shows grid spacing in all non-blank modes', () => {
      const nonBlankTypes = CANVAS_MODE_ORDER.filter((type) => type !== 'blank');

      nonBlankTypes.forEach((type) => {
        const onTypeChange = vi.fn();
        const onDensityChange = vi.fn();
        const onShowMajorChange = vi.fn();

        const { unmount } = render(
          <CanvasModePanel
            config={createConfig({ type })}
            onTypeChange={onTypeChange}
            onDensityChange={onDensityChange}
            onShowMajorChange={onShowMajorChange}
          />
        );

        expect(screen.getByTestId('grid-spacing-16')).toBeInTheDocument();
        unmount();
      });
    });

    it('shows major grid selector in modes that support it', () => {
      GRID_TYPES_SUPPORTING_MAJOR.forEach((type) => {
        const onTypeChange = vi.fn();
        const onDensityChange = vi.fn();
        const onShowMajorChange = vi.fn();

        const { unmount } = render(
          <CanvasModePanel
            config={createConfig({ type })}
            onTypeChange={onTypeChange}
            onDensityChange={onDensityChange}
            onShowMajorChange={onShowMajorChange}
          />
        );

        const majorGridSwitch = screen.getByRole('switch');
        expect(majorGridSwitch).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('callbacks', () => {
    it('calls onTypeChange when mode is selected', () => {
      const onTypeChange = vi.fn();
      const onDensityChange = vi.fn();
      const onShowMajorChange = vi.fn();

      render(
        <CanvasModePanel
          config={createConfig({ type: 'square', showMajor: true })}
          onTypeChange={onTypeChange}
          onDensityChange={onDensityChange}
          onShowMajorChange={onShowMajorChange}
        />
      );

      fireEvent.click(screen.getByTestId('canvas-mode-isometric'));

      expect(onTypeChange).toHaveBeenCalledTimes(1);
      expect(onTypeChange).toHaveBeenCalledWith('isometric');
    });

    it('calls onDensityChange when spacing is changed', () => {
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

      fireEvent.click(screen.getByTestId('grid-spacing-24'));

      expect(onDensityChange).toHaveBeenCalledTimes(1);
      expect(onDensityChange).toHaveBeenCalledWith(24);
    });

    it('calls onShowMajorChange when major grid is toggled', () => {
      const onTypeChange = vi.fn();
      const onDensityChange = vi.fn();
      const onShowMajorChange = vi.fn();

      render(
        <CanvasModePanel
          config={createConfig({ type: 'square', showMajor: true })}
          onTypeChange={onTypeChange}
          onDensityChange={onDensityChange}
          onShowMajorChange={onShowMajorChange}
        />
      );

      fireEvent.click(screen.getByRole('switch'));

      expect(onShowMajorChange).toHaveBeenCalledTimes(1);
      expect(onShowMajorChange).toHaveBeenCalledWith(false);
    });
  });

  describe('accessibility', () => {
    it('has radiogroup for mode selection', () => {
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

    it('has radiogroup for grid spacing when visible', () => {
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

      expect(screen.getByRole('radiogroup', { name: 'Grid spacing' })).toBeInTheDocument();
    });
  });
});
