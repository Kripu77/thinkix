import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingLogo } from '@thinkix/ui';

describe('LoadingLogo Component', () => {
  it('should render the logo text', () => {
    render(<LoadingLogo />);

    expect(screen.getByText('thinkix')).toBeInTheDocument();
  });

  it('should have correct font styling', () => {
    render(<LoadingLogo />);

    const textElement = screen.getByText('thinkix');
    expect(textElement).toHaveClass('text-4xl');
    expect(textElement).toHaveClass('font-bold');
    expect(textElement).toHaveClass('tracking-tight');
  });

  it('should have gradient background for shimmer effect', () => {
    render(<LoadingLogo />);

    const textElement = screen.getByText('thinkix');
    expect(textElement).toHaveClass('bg-gradient-to-r');
  });

  it('should have shimmer animation class', () => {
    render(<LoadingLogo />);

    const textElement = screen.getByText('thinkix');
    expect(textElement).toHaveClass('loading-shimmer');
  });

  it('should render the star icon', () => {
    const { container } = render(<LoadingLogo />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('animate-spin');
  });

  it('should use Geist Sans font family', () => {
    render(<LoadingLogo />);

    const textElement = screen.getByText('thinkix');
    expect(textElement.style.fontFamily).toContain('var(--font-geist-sans)');
  });
});
