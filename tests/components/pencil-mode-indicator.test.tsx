import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PencilModeIndicator } from '@/features/board/components/PencilModeIndicator';
import * as boardStateModule from '@/features/board/hooks/use-board-state';

vi.mock('@/features/board/hooks/use-board-state', () => ({
  useBoardState: vi.fn(),
}));

describe('PencilModeIndicator', () => {
  const mockSetPencilMode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isPencilMode is false', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { isPencilMode: false, isMobile: false },
      setPencilMode: mockSetPencilMode,
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    const { container } = render(<PencilModeIndicator />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should render when isPencilMode is true', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { isPencilMode: true, isMobile: false },
      setPencilMode: mockSetPencilMode,
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    render(<PencilModeIndicator />);
    
    expect(screen.getByText('Pencil Mode')).toBeInTheDocument();
  });

  it('should have correct desktop positioning', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { isPencilMode: true, isMobile: false },
      setPencilMode: mockSetPencilMode,
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    const { container } = render(<PencilModeIndicator />);
    const indicator = container.firstChild as HTMLElement;
    
    expect(indicator.className).toContain('top-16');
    expect(indicator.className).toContain('left-4');
  });

  it('should have correct mobile positioning', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { isPencilMode: true, isMobile: true },
      setPencilMode: mockSetPencilMode,
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    const { container } = render(<PencilModeIndicator />);
    const indicator = container.firstChild as HTMLElement;
    
    expect(indicator.className).toContain('top-20');
    expect(indicator.className).toContain('right-4');
  });

  it('should call setPencilMode(false) when X button is clicked', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { isPencilMode: true, isMobile: false },
      setPencilMode: mockSetPencilMode,
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    render(<PencilModeIndicator />);
    
    const exitButton = screen.getByRole('button', { name: 'Exit pencil mode' });
    fireEvent.click(exitButton);
    
    expect(mockSetPencilMode).toHaveBeenCalledWith(false);
  });

  it('should have accessible role and label', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { isPencilMode: true, isMobile: false },
      setPencilMode: mockSetPencilMode,
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    render(<PencilModeIndicator />);
    
    const indicator = screen.getByRole('status');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute('aria-live', 'polite');
    expect(indicator).toHaveAttribute('aria-label', 'Pencil mode is active. Touch input is disabled for palm rejection.');
  });

  it('should display Pencil icon', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { isPencilMode: true, isMobile: false },
      setPencilMode: mockSetPencilMode,
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    const { container } = render(<PencilModeIndicator />);
    
    const svg = container.querySelector('svg.lucide-pencil');
    expect(svg).toBeInTheDocument();
  });

  it('should display X icon for exit button', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { isPencilMode: true, isMobile: false },
      setPencilMode: mockSetPencilMode,
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    render(<PencilModeIndicator />);
    
    const exitButton = screen.getByRole('button', { name: 'Exit pencil mode' });
    const xIcon = exitButton.querySelector('svg.lucide-x');
    expect(xIcon).toBeInTheDocument();
  });
});
