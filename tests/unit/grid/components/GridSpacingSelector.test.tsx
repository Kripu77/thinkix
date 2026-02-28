import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GridSpacingSelector } from '@/features/board/grid/components/GridSpacingSelector';
import { GRID_DENSITIES } from '@/features/board/grid/types';

describe('GridSpacingSelector', () => {
  describe('rendering', () => {
    it('renders all 6 density options', () => {
      const onChange = vi.fn();

      render(
        <GridSpacingSelector
          value={16}
          onChange={onChange}
        />
      );

      GRID_DENSITIES.forEach((density) => {
        expect(screen.getByTestId(`grid-spacing-${density}`)).toBeInTheDocument();
      });
    });

    it('renders with correct selected value', () => {
      const onChange = vi.fn();

      render(
        <GridSpacingSelector
          value={24}
          onChange={onChange}
        />
      );

      const selectedOption = screen.getByTestId('grid-spacing-24');
      expect(selectedOption).toHaveAttribute('aria-checked', 'true');
    });

    it('renders with correct unselected values', () => {
      const onChange = vi.fn();

      render(
        <GridSpacingSelector
          value={16}
          onChange={onChange}
        />
      );

      const unselectedOption = screen.getByTestId('grid-spacing-32');
      expect(unselectedOption).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('selection state', () => {
    it('applies selected styling when selected', () => {
      const onChange = vi.fn();

      render(
        <GridSpacingSelector
          value={16}
          onChange={onChange}
        />
      );

      const selectedOption = screen.getByTestId('grid-spacing-16');
      expect(selectedOption).toHaveAttribute('aria-checked', 'true');
    });

    it('applies unselected styling when not selected', () => {
      const onChange = vi.fn();

      render(
        <GridSpacingSelector
          value={16}
          onChange={onChange}
        />
      );

      const unselectedOption = screen.getByTestId('grid-spacing-32');
      expect(unselectedOption).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('click interaction', () => {
    it('triggers onChange callback when clicked', () => {
      const onChange = vi.fn();

      render(
        <GridSpacingSelector
          value={16}
          onChange={onChange}
        />
      );

      fireEvent.click(screen.getByTestId('grid-spacing-32'));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(32);
    });

    it('does not trigger callback when disabled', () => {
      const onChange = vi.fn();

      render(
        <GridSpacingSelector
          value={16}
          onChange={onChange}
          disabled={true}
        />
      );

      fireEvent.click(screen.getByTestId('grid-spacing-32'));

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has role="radiogroup"', () => {
      const onChange = vi.fn();

      render(
        <GridSpacingSelector
          value={16}
          onChange={onChange}
        />
      );

      expect(screen.getByRole('radiogroup', { name: 'Grid spacing' })).toBeInTheDocument();
    });

    it('has role="radio" for each option', () => {
      const onChange = vi.fn();

      render(
        <GridSpacingSelector
          value={16}
          onChange={onChange}
        />
      );

      const radios = screen.getAllByRole('radio');
      expect(radios.length).toBe(6);
    });

    it('has correct aria-label for each option', () => {
      const onChange = vi.fn();

      render(
        <GridSpacingSelector
          value={16}
          onChange={onChange}
        />
      );

      expect(screen.getByLabelText('16px spacing')).toBeInTheDocument();
      expect(screen.getByLabelText('32px spacing')).toBeInTheDocument();
    });

    it('is disabled when disabled prop is true', () => {
      const onChange = vi.fn();

      render(
        <GridSpacingSelector
          value={16}
          onChange={onChange}
          disabled={true}
        />
      );

      const radios = screen.getAllByRole('radio');
      radios.forEach((radio) => {
        expect(radio).toBeDisabled();
      });
    });
  });
});
