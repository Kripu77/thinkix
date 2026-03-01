import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoardLayoutSlots } from '@/features/board/components/BoardLayoutSlots';

describe('BoardLayoutSlots', () => {
  describe('rendering', () => {
    it('renders nothing when no slots are provided', () => {
      const { container } = render(<BoardLayoutSlots />);
      expect(container.firstChild).toBeNull();
    });

    it('renders topLeft slot', () => {
      render(
        <BoardLayoutSlots topLeft={<div data-testid="top-left">Top Left</div>} />
      );

      expect(screen.getByTestId('top-left')).toBeInTheDocument();
      expect(screen.getByText('Top Left')).toBeInTheDocument();
    });

    it('renders bottomLeft slot', () => {
      render(
        <BoardLayoutSlots bottomLeft={<div data-testid="bottom-left">Bottom Left</div>} />
      );

      expect(screen.getByTestId('bottom-left')).toBeInTheDocument();
      expect(screen.getByText('Bottom Left')).toBeInTheDocument();
    });

    it('renders topRight slot', () => {
      render(
        <BoardLayoutSlots topRight={<div data-testid="top-right">Top Right</div>} />
      );

      expect(screen.getByTestId('top-right')).toBeInTheDocument();
      expect(screen.getByText('Top Right')).toBeInTheDocument();
    });

    it('renders all slots together', () => {
      render(
        <BoardLayoutSlots
          topLeft={<div data-testid="top-left">Top Left</div>}
          bottomLeft={<div data-testid="bottom-left">Bottom Left</div>}
          topRight={<div data-testid="top-right">Top Right</div>}
        />
      );

      expect(screen.getByTestId('top-left')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-left')).toBeInTheDocument();
      expect(screen.getByTestId('top-right')).toBeInTheDocument();
    });
  });

  describe('positioning', () => {
    it('applies correct classes to topLeft container', () => {
      render(
        <BoardLayoutSlots topLeft={<div>Content</div>} />
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveClass('absolute');
      expect(container).toHaveClass('top-4');
      expect(container).toHaveClass('left-4');
    });

    it('applies correct classes to bottomLeft container', () => {
      render(
        <BoardLayoutSlots bottomLeft={<div>Content</div>} />
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveClass('absolute');
      expect(container).toHaveClass('bottom-4');
      expect(container).toHaveClass('left-4');
    });

    it('applies correct classes to topRight container', () => {
      render(
        <BoardLayoutSlots topRight={<div>Content</div>} />
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveClass('absolute');
      expect(container).toHaveClass('top-4');
      expect(container).toHaveClass('right-4');
    });

    it('topLeft container has data-no-autosave attribute', () => {
      render(
        <BoardLayoutSlots topLeft={<div>Content</div>} />
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveAttribute('data-no-autosave');
    });
  });

  describe('complex slot content', () => {
    it('renders multiple elements in a slot', () => {
      render(
        <BoardLayoutSlots
          topLeft={
            <>
              <button>Button 1</button>
              <button>Button 2</button>
            </>
          }
        />
      );

      expect(screen.getByRole('button', { name: 'Button 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Button 2' })).toBeInTheDocument();
    });

    it('renders nested components', () => {
      const NestedComponent = () => (
        <div>
          <span>Nested</span>
          <button>Action</button>
        </div>
      );

      render(
        <BoardLayoutSlots topLeft={<NestedComponent />} />
      );

      expect(screen.getByText('Nested')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('handles interactive elements in slots', () => {
      const handleClick = vi.fn();

      render(
        <BoardLayoutSlots
          topLeft={<button onClick={handleClick}>Click Me</button>}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('conditional rendering', () => {
    it('does not render slot container when slot is undefined', () => {
      const { container } = render(
        <BoardLayoutSlots
          topLeft={undefined}
          bottomLeft={undefined}
          topRight={undefined}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('does not render slot container when slot is null', () => {
      const { container } = render(
        <BoardLayoutSlots
          topLeft={null}
          bottomLeft={null}
          topRight={null}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('conditionally renders slots based on state', () => {
      const TestComponent = ({ showRight }: { showRight: boolean }) => (
        <BoardLayoutSlots
          topLeft={<div>Left</div>}
          topRight={showRight ? <div>Right</div> : undefined}
        />
      );

      const { rerender } = render(<TestComponent showRight={true} />);
      expect(screen.getByText('Right')).toBeInTheDocument();

      rerender(<TestComponent showRight={false} />);
      expect(screen.queryByText('Right')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('preserves accessibility attributes from slot content', () => {
      render(
        <BoardLayoutSlots
          topLeft={
            <button aria-label="Menu" aria-expanded="false">
              Menu
            </button>
          }
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Menu');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
