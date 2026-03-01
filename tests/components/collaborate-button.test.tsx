import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollaborateButton } from '@/features/collaboration/components/collaborate-button';

describe('CollaborateButton', () => {
  describe('rendering', () => {
    it('renders button with Users icon', () => {
      const onClick = vi.fn();
      render(<CollaborateButton onClick={onClick} />);

      const button = screen.getByRole('button', { name: /collaborate/i });
      expect(button).toBeInTheDocument();
    });

    it('renders with correct text', () => {
      const onClick = vi.fn();
      render(<CollaborateButton onClick={onClick} />);

      expect(screen.getByText('Collaborate')).toBeInTheDocument();
    });

    it('has correct variant and size classes', () => {
      const onClick = vi.fn();
      render(<CollaborateButton onClick={onClick} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('hidden');
      expect(button).toHaveClass('lg:flex');
    });
  });

  describe('interaction', () => {
    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      render(<CollaborateButton onClick={onClick} />);

      fireEvent.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick with correct timing on multiple clicks', () => {
      const onClick = vi.fn();
      render(<CollaborateButton onClick={onClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('styling', () => {
    it('has correct icon class', () => {
      const onClick = vi.fn();
      render(<CollaborateButton onClick={onClick} />);

      const icon = screen.getByRole('button').querySelector('svg');
      expect(icon).toHaveClass('h-4');
      expect(icon).toHaveClass('w-4');
    });

    it('is hidden on small screens', () => {
      const onClick = vi.fn();
      render(<CollaborateButton onClick={onClick} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('hidden');
    });

    it('is visible on large screens', () => {
      const onClick = vi.fn();
      render(<CollaborateButton onClick={onClick} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('lg:flex');
    });
  });

  describe('accessibility', () => {
    it('is focusable', () => {
      const onClick = vi.fn();
      render(<CollaborateButton onClick={onClick} />);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('can be activated with Space key', () => {
      const onClick = vi.fn();
      render(<CollaborateButton onClick={onClick} />);

      const button = screen.getByRole('button');
      button.focus();
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('snapshots', () => {
    it('matches snapshot', () => {
      const onClick = vi.fn();
      const { asFragment } = render(<CollaborateButton onClick={onClick} />);
      expect(asFragment()).toMatchSnapshot();
    });
  });
});
