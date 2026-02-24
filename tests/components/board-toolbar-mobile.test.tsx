import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BoardToolbar } from '@/features/toolbar/components/BoardToolbar';
import * as boardStateModule from '@/features/board/hooks/use-board-state';

vi.mock('@plait-board/react-board', () => ({
  useBoard: vi.fn(() => ({
    viewport: { zoom: 1 },
    history: { undos: [], redos: [] },
    pointer: 'selection',
  })),
}));

vi.mock('@plait/core', () => ({
  getSelectedElements: vi.fn(() => []),
  deleteFragment: vi.fn(),
  duplicateElements: vi.fn(),
}));

vi.mock('@/features/board/hooks/use-board-state', () => ({
  useBoardState: vi.fn(),
}));

vi.mock('@/shared/constants', () => ({
  SHAPE_TOOLS: ['rectangle', 'ellipse'],
  BASIC_TOOLS: [
    { id: 'hand', label: 'Hand', icon: '<svg></svg>' },
    { id: 'select', label: 'Select', icon: '<svg></svg>' },
  ],
  DRAWING_SECTION_TOOLS: [
    { id: 'draw', label: 'Freehand', icon: '<svg></svg>' },
  ],
  SHAPE_TOOL_CONFIGS: [
    { id: 'rectangle', label: 'Rectangle', icon: '<svg></svg>' },
  ],
  OTHER_TOOL_CONFIGS: [
    { id: 'pen', label: 'Pen', icon: '<svg></svg>' },
  ],
  TOOLBAR_ITEM_CLASS: 'toolbar-item',
  BUTTON_CLASS: 'button-class',
  SHAPE_DROPDOWN_ICON: '<svg></svg>',
  ARROW_TOOL: { id: 'arrow', label: 'Arrow', icon: '<svg></svg>' },
  HANDRAWN_ICON: '<svg></svg>',
}));

describe('BoardToolbar', () => {
  const mockSetActiveTool = vi.fn();
  const mockToggleHanddrawn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render toolbar on desktop', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { 
        isMobile: false, 
        activeTool: 'select', 
        handdrawn: false 
      },
      setActiveTool: mockSetActiveTool,
      toggleHanddrawn: mockToggleHanddrawn,
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    render(<BoardToolbar />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should render toolbar on mobile', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { 
        isMobile: true, 
        activeTool: 'select', 
        handdrawn: false 
      },
      setActiveTool: mockSetActiveTool,
      toggleHanddrawn: mockToggleHanddrawn,
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    render(<BoardToolbar />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should use smaller buttons on mobile', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { 
        isMobile: true, 
        activeTool: 'select', 
        handdrawn: false 
      },
      setActiveTool: mockSetActiveTool,
      toggleHanddrawn: mockToggleHanddrawn,
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    render(<BoardToolbar />);
    
    const buttons = screen.getAllByRole('button');
    const smallButtons = buttons.filter(btn => 
      btn.className.includes('h-8') && btn.className.includes('w-8')
    );
    expect(smallButtons.length).toBeGreaterThan(0);
  });

  it('should use larger buttons on desktop', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { 
        isMobile: false, 
        activeTool: 'select', 
        handdrawn: false 
      },
      setActiveTool: mockSetActiveTool,
      toggleHanddrawn: mockToggleHanddrawn,
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    render(<BoardToolbar />);
    
    const buttons = screen.getAllByRole('button');
    const largeButtons = buttons.filter(btn => 
      btn.className.includes('h-9') && btn.className.includes('w-9')
    );
    expect(largeButtons.length).toBeGreaterThan(0);
  });

  it('should hide tooltips on mobile', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { 
        isMobile: true, 
        activeTool: 'select', 
        handdrawn: false 
      },
      setActiveTool: mockSetActiveTool,
      toggleHanddrawn: mockToggleHanddrawn,
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    render(<BoardToolbar />);
    
    const tooltips = document.querySelectorAll('[role="tooltip"]');
    expect(tooltips.length).toBe(0);
  });

  it('should have correct mobile positioning class', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { 
        isMobile: true, 
        activeTool: 'select', 
        handdrawn: false 
      },
      setActiveTool: mockSetActiveTool,
      toggleHanddrawn: mockToggleHanddrawn,
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    render(<BoardToolbar />);
    
    const container = document.querySelector('.absolute');
    expect(container?.className).toContain('left-1/2');
    expect(container?.className).toContain('-translate-x-1/2');
    expect(container?.className).toContain('w-[calc(100vw-2rem)]');
  });

  it('should have correct desktop positioning class', () => {
    vi.mocked(boardStateModule.useBoardState).mockReturnValue({
      state: { 
        isMobile: false, 
        activeTool: 'select', 
        handdrawn: false 
      },
      setActiveTool: mockSetActiveTool,
      toggleHanddrawn: mockToggleHanddrawn,
    } as unknown as ReturnType<typeof boardStateModule.useBoardState>);

    render(<BoardToolbar />);
    
    const container = document.querySelector('.absolute');
    expect(container?.className).toContain('top-4');
    expect(container?.className).not.toContain('max-w-[95vw]');
  });
});
