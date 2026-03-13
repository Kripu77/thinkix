import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ZoomToolbar } from '@/features/toolbar/components/ZoomToolbar';
import * as boardStateModule from '@/features/board/hooks/use-board-state';

vi.mock('@plait-board/react-board', () => ({
  useBoard: vi.fn(() => ({
    viewport: { zoom: 1 },
    history: { undos: [], redos: [] },
  })),
}));

vi.mock('@plait/core', () => ({
  BoardTransforms: {
    updateZoom: vi.fn(),
    fitViewport: vi.fn(),
  },
  ATTACHED_ELEMENT_CLASS_NAME: 'attached-element',
  PlaitPointerType: {
    hand: 'hand',
    selection: 'selection',
    crosshair: 'crosshair',
    text: 'text',
    draw: 'draw',
  },
}));

vi.mock('@/features/board/hooks/use-board-state', () => ({
  useBoardState: vi.fn(),
}));

describe('ZoomToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render zoom controls on desktop', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { isMobile: false },
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    render(<ZoomToolbar />);
    
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
  });

  it('should not render on mobile', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { isMobile: true },
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    const { container } = render(<ZoomToolbar />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should display current zoom percentage', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { isMobile: false },
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    render(<ZoomToolbar />);
    
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should have zoom out button', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { isMobile: false },
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    render(<ZoomToolbar />);
    
    const zoomOutButton = screen.getByRole('button', { name: 'Zoom out' });
    expect(zoomOutButton).toBeInTheDocument();
  });

  it('should have zoom in button', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { isMobile: false },
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    render(<ZoomToolbar />);
    
    const zoomInButton = screen.getByRole('button', { name: 'Zoom in' });
    expect(zoomInButton).toBeInTheDocument();
  });
});
