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

vi.mock('@thinkix/ui', () => ({
  Button: ({ children, className, onClick, disabled }: { children: React.ReactNode; className?: string; onClick?: () => void; disabled?: boolean }) => (
    <button className={className || ''} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
    <div className={className || ''} onClick={onClick}>
      {children}
    </div>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  cn: (...inputs: (string | undefined | boolean | null)[]) => inputs.filter(Boolean).join(' '),
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
    { id: 'image', label: 'Image', icon: '<svg></svg>' },
  ],
  TOOLBAR_ITEM_CLASS: 'toolbar-item',
  BUTTON_CLASS: 'button-class',
  SELECTED_BUTTON_CLASS: 'selected-button-class',
  SHAPE_DROPDOWN_ICON: '<svg></svg>',
  ARROW_TOOL: { id: 'arrow', label: 'Arrow', icon: '<svg></svg>' },
  HANDRAWN_ICON: '<svg></svg>',
  CUSTOM_EVENTS: {
    TOOL_CHANGE: 'thinkix:toolchange',
  },
  THEME: {
    toolbar: {
      container: 'inline-flex items-center gap-1.5 rounded-lg border bg-background/95 backdrop-blur px-2 py-2 shadow-sm',
      button: 'h-[var(--tx-toolbar-btn)] w-[var(--tx-toolbar-btn)] flex items-center justify-center rounded-md p-0 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30',
      buttonSelected: 'bg-accent text-accent-foreground',
      separator: 'mx-1.5 h-6 w-px bg-border',
      mobileSeparator: 'mx-1 h-5 w-px bg-border',
      mobileButton: 'h-[var(--tx-toolbar-btn-mobile)] w-[var(--tx-toolbar-btn-mobile)]',
    },
    control: {
      container: '',
      button: '',
    },
    dropdown: {
      content: '',
      item: '',
      itemSelected: '',
      icon: '',
      label: '',
      shortcut: '',
    },
    dialog: {
      container: '',
      header: '',
      title: '',
      description: '',
      content: '',
      footer: '',
    },
    input: '',
    button: {
      primary: '',
      secondary: '',
      ghost: '',
    },
    collab: {
      container: '',
      statusDot: '',
      statusConnected: '',
      statusDisconnected: '',
    },
    tip: '',
  },
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

  it('should use stylus-friendly 44px buttons on mobile', () => {
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
    const stylusButtons = buttons.filter(btn =>
      btn.className.includes('var(--tx-toolbar-btn-mobile)')
    );
    expect(stylusButtons.length).toBeGreaterThan(0);
  });

  it('should use stylus-friendly 44px buttons on desktop', () => {
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
    const toolbarButtons = buttons.filter(btn =>
      btn.className.includes('var(--tx-toolbar-btn)')
    );
    expect(toolbarButtons.length).toBeGreaterThan(0);
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

    const outerContainer = document.querySelector('.absolute');
    expect(outerContainer?.className).toContain('left-1/2');
    expect(outerContainer?.className).toContain('-translate-x-1/2');
    expect(outerContainer?.className).toContain('top-4');
    expect(outerContainer?.className).toContain('z-50');

    const toolbarContainer = outerContainer?.querySelector('.inline-flex');
    expect(toolbarContainer).toBeTruthy();
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

    const outerContainer = document.querySelector('.absolute');
    expect(outerContainer?.className).toContain('top-4');
    expect(outerContainer?.className).toContain('left-1/2');
    expect(outerContainer?.className).toContain('-translate-x-1/2');
  });
});
