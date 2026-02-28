import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, createEvent } from '@testing-library/react';
import { CanvasModeCard } from '@/features/board/grid/components/CanvasModeCard';
import type { GridType } from '@/features/board/grid/types';

const ALL_GRID_TYPES: GridType[] = ['blank', 'dot', 'square', 'blueprint', 'isometric', 'ruled'];

const EXPECTED_LABELS: Record<GridType, string> = {
  blank: 'Focus',
  dot: 'Dots',
  square: 'Lines',
  blueprint: 'Blueprint',
  isometric: 'Isometric',
  ruled: 'Ruled',
};

describe('CanvasModeCard', () => {
  describe('rendering', () => {
    it('renders all 6 grid types', () => {
      const onSelect = vi.fn();
      
      ALL_GRID_TYPES.forEach((type) => {
        render(
          <CanvasModeCard
            type={type}
            isSelected={false}
            onSelect={onSelect}
          />
        );
        expect(screen.getByTestId(`canvas-mode-${type}`)).toBeInTheDocument();
      });
    });

    it('renders the correct label for each type', () => {
      const onSelect = vi.fn();

      ALL_GRID_TYPES.forEach((type) => {
        const { unmount } = render(
          <CanvasModeCard
            type={type}
            isSelected={false}
            onSelect={onSelect}
          />
        );
        
        expect(screen.getByText(EXPECTED_LABELS[type])).toBeInTheDocument();
        unmount();
      });
    });

    it('renders preview element for each type', () => {
      const onSelect = vi.fn();

      ALL_GRID_TYPES.forEach((type) => {
        const { unmount } = render(
          <CanvasModeCard
            type={type}
            isSelected={false}
            onSelect={onSelect}
          />
        );
        
        const card = screen.getByTestId(`canvas-mode-${type}`);
        expect(card).toBeInTheDocument();
        const previewContainer = screen.getByTestId('canvas-mode-preview');
        expect(previewContainer).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('selection state', () => {
    it('reflects selected state via aria-checked', () => {
      const onSelect = vi.fn();
      
      render(
        <CanvasModeCard
          type="dot"
          isSelected={true}
          onSelect={onSelect}
        />
      );
      
      const button = screen.getByRole('radio');
      expect(button).toHaveAttribute('aria-checked', 'true');
    });

    it('reflects unselected state via aria-checked', () => {
      const onSelect = vi.fn();
      
      render(
        <CanvasModeCard
          type="dot"
          isSelected={false}
          onSelect={onSelect}
        />
      );
      
      const button = screen.getByRole('radio');
      expect(button).toHaveAttribute('aria-checked', 'false');
    });

    it('shows checkmark when selected', () => {
      const onSelect = vi.fn();
      
      render(
        <CanvasModeCard
          type="blueprint"
          isSelected={true}
          onSelect={onSelect}
        />
      );
      
      const checkmark = screen.getByTestId('canvas-mode-checkmark');
      expect(checkmark).toBeInTheDocument();
    });

    it('hides checkmark when not selected', () => {
      const onSelect = vi.fn();
      
      render(
        <CanvasModeCard
          type="blueprint"
          isSelected={false}
          onSelect={onSelect}
        />
      );
      
      const checkmark = screen.queryByTestId('canvas-mode-checkmark');
      expect(checkmark).not.toBeInTheDocument();
    });

    it('applies selected styling when selected', () => {
      const onSelect = vi.fn();
      
      render(
        <CanvasModeCard
          type="isometric"
          isSelected={true}
          onSelect={onSelect}
        />
      );
      
      const button = screen.getByRole('radio');
      expect(button.className).toContain('bg-accent');
    });
  });

  describe('click interaction', () => {
    it('triggers onChange callback when clicked', () => {
      const onSelect = vi.fn();
      
      render(
        <CanvasModeCard
          type="ruled"
          isSelected={false}
          onSelect={onSelect}
        />
      );
      
      fireEvent.click(screen.getByRole('radio'));
      
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('ruled');
    });

    it('does not trigger callback when disabled', () => {
      const onSelect = vi.fn();
      
      render(
        <CanvasModeCard
          type="ruled"
          isSelected={false}
          onSelect={onSelect}
          disabled={true}
        />
      );
      
      fireEvent.click(screen.getByRole('radio'));
      
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('keyboard interaction', () => {
    it('triggers onChange callback on Enter key', () => {
      const onSelect = vi.fn();
      
      render(
        <CanvasModeCard
          type="square"
          isSelected={false}
          onSelect={onSelect}
        />
      );
      
      fireEvent.keyDown(screen.getByRole('radio'), { key: 'Enter' });
      
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('square');
    });

    it('triggers onChange callback on Space key', () => {
      const onSelect = vi.fn();
      
      render(
        <CanvasModeCard
          type="square"
          isSelected={false}
          onSelect={onSelect}
        />
      );
      
      fireEvent.keyDown(screen.getByRole('radio'), { key: ' ' });
      
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('square');
    });

    it('does not trigger callback on keyboard when disabled', () => {
      const onSelect = vi.fn();
      
      render(
        <CanvasModeCard
          type="square"
          isSelected={false}
          onSelect={onSelect}
          disabled={true}
        />
      );
      
      fireEvent.keyDown(screen.getByRole('radio'), { key: 'Enter' });
      fireEvent.keyDown(screen.getByRole('radio'), { key: ' ' });
      
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('calls onChange callback on Space key and prevents default', () => {
      const onSelect = vi.fn();
      
      render(
        <CanvasModeCard
          type="dot"
          isSelected={false}
          onSelect={onSelect}
        />
      );
      
      const radio = screen.getByRole('radio');
      const keyDownEvent = createEvent.keyDown(radio, { key: ' ' });
      keyDownEvent.preventDefault = vi.fn();
      fireEvent(radio, keyDownEvent);
      
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('dot');
      expect(keyDownEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has role="radio"', () => {
      const onSelect = vi.fn();
      
      render(
        <CanvasModeCard
          type="blank"
          isSelected={false}
          onSelect={onSelect}
        />
      );
      
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });

    it('has correct aria-label', () => {
      const onSelect = vi.fn();
      
      render(
        <CanvasModeCard
          type="blueprint"
          isSelected={false}
          onSelect={onSelect}
        />
      );
      
      expect(screen.getByLabelText('Blueprint')).toBeInTheDocument();
    });

    it('is disabled when disabled prop is true', () => {
      const onSelect = vi.fn();
      
      render(
        <CanvasModeCard
          type="dot"
          isSelected={false}
          onSelect={onSelect}
          disabled={true}
        />
      );
      
      expect(screen.getByRole('radio')).toBeDisabled();
    });
  });
});
