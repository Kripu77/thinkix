import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MajorGridSelect } from '@/features/board/grid/components/MajorGridSelect';

describe('MajorGridSelect', () => {
  describe('rendering', () => {
    it('renders with correct label', () => {
      const onChange = vi.fn();
      
      render(
        <MajorGridSelect
          checked={true}
          onChange={onChange}
        />
      );
      
      expect(screen.getByText('Major Grid')).toBeInTheDocument();
    });

    it('has correct test id', () => {
      const onChange = vi.fn();
      
      render(
        <MajorGridSelect
          checked={true}
          onChange={onChange}
        />
      );
      
      expect(screen.getByTestId('major-grid-select')).toBeInTheDocument();
    });
  });

  describe('checked state', () => {
    it('reflects checked state', () => {
      const onChange = vi.fn();
      
      render(
        <MajorGridSelect
          checked={true}
          onChange={onChange}
        />
      );
      
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('reflects unchecked state', () => {
      const onChange = vi.fn();
      
      render(
        <MajorGridSelect
          checked={false}
          onChange={onChange}
        />
      );
      
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('interaction', () => {
    it('triggers onChange callback when clicked', () => {
      const onChange = vi.fn();
      
      render(
        <MajorGridSelect
          checked={false}
          onChange={onChange}
        />
      );
      
      fireEvent.click(screen.getByRole('switch'));
      
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('triggers callback with false when currently checked', () => {
      const onChange = vi.fn();
      
      render(
        <MajorGridSelect
          checked={true}
          onChange={onChange}
        />
      );
      
      fireEvent.click(screen.getByRole('switch'));
      
      expect(onChange).toHaveBeenCalledWith(false);
    });

    it('does not trigger callback when disabled', () => {
      const onChange = vi.fn();
      
      render(
        <MajorGridSelect
          checked={false}
          onChange={onChange}
          disabled={true}
        />
      );
      
      fireEvent.click(screen.getByRole('switch'));
      
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('visibility with focus mode', () => {
    it('is visible when not in blank mode', () => {
      const onChange = vi.fn();
      
      render(
        <MajorGridSelect
          checked={true}
          onChange={onChange}
        />
      );
      
      expect(screen.getByTestId('major-grid-select')).toBeVisible();
    });
  });

  describe('accessibility', () => {
    it('has role="switch"', () => {
      const onChange = vi.fn();
      
      render(
        <MajorGridSelect
          checked={true}
          onChange={onChange}
        />
      );
      
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('is disabled when disabled prop is true', () => {
      const onChange = vi.fn();
      
      render(
        <MajorGridSelect
          checked={true}
          onChange={onChange}
          disabled={true}
        />
      );
      
      expect(screen.getByRole('switch')).toBeDisabled();
    });
  });
});
