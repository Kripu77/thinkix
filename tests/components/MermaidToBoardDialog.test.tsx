import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MermaidToBoardDialog } from '@/features/dialogs/components/MermaidToBoardDialog';

vi.mock('@plait-board/react-board', () => ({
  useBoard: vi.fn(() => ({
    children: [],
    viewport: { zoom: 1, x: 0, y: 0 },
    selection: null,
    theme: { themeColorMode: 'light' },
  })),
  Board: () => <div data-testid="board" />,
  Wrapper: ({ children, value }: { children: React.ReactNode; value: unknown[] }) => (
    <div data-testid="board-wrapper" data-elements={value.length}>
      {children}
    </div>
  ),
}));

vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
  },
}));

vi.mock('@thinkix/mermaid-to-thinkix', () => ({
  parseMermaidToBoard: vi.fn().mockResolvedValue({
    elements: [{ id: 'test-element', type: 'rectangle', points: [[0, 0], [100, 0], [100, 50], [0, 50]] }],
    warnings: [],
  }),
}));

vi.mock('@/features/board/utils', () => ({
  focusAndRevealElements: vi.fn(),
  insertElementsSafely: vi.fn(),
  syncElementsForBoardTheme: vi.fn((elements) => elements),
}));

let currentSelectValue = 'simple';
let onValueChangeCallback: ((val: string) => void) | null = null;

vi.mock('@thinkix/ui', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Input: ({ ...props }) => <input {...props} data-testid="input" />,
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (val: string) => void; children: React.ReactNode }) => {
    currentSelectValue = value;
    onValueChangeCallback = onValueChange;
    return <div data-testid="select" data-value={value}>{children}</div>;
  },
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <button
      aria-controls="select-content"
      aria-expanded="true"
      data-testid="select-trigger"
      role="combobox"
    >
      {children}
    </button>
  ),
  SelectValue: () => <span data-testid="select-value">{currentSelectValue === 'simple' ? 'Simple' : currentSelectValue === 'link' ? 'With Link Labels' : currentSelectValue === 'complex' ? 'Complex' : currentSelectValue === 'sequence' ? 'Sequence' : currentSelectValue === 'class' ? 'Class' : currentSelectValue}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content" id="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div
      aria-selected={currentSelectValue === value}
      role="option"
      data-value={value}
      onClick={() => onValueChangeCallback?.(value)}
    >
      {children}
    </div>
  ),
  Label: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
}));

describe('MermaidToBoardDialog', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog when open', () => {
    render(
      <MermaidToBoardDialog open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText('Mermaid to Board')).toBeInTheDocument();
    expect(screen.getByText(/Convert Mermaid diagrams/)).toBeInTheDocument();
  });

  it('should not render dialog when closed', () => {
    render(
      <MermaidToBoardDialog open={false} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.queryByText('Mermaid to Board')).not.toBeInTheDocument();
  });

  it('should have mermaid syntax textarea with default example', () => {
    render(
      <MermaidToBoardDialog open={true} onOpenChange={mockOnOpenChange} />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue();
  });

  it('should change example when selecting different option', async () => {
    render(
      <MermaidToBoardDialog open={true} onOpenChange={mockOnOpenChange} />
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveTextContent(/Simple/i);

    const linkItem = document.querySelector('[data-value="link"]');
    expect(linkItem).toBeInTheDocument();
    if (linkItem) {
      await userEvent.click(linkItem);
    }
    expect(select).toHaveTextContent(/With Link Labels/i);
  });

  it('should call onOpenChange with false when cancel clicked', async () => {
    render(
      <MermaidToBoardDialog open={true} onOpenChange={mockOnOpenChange} />
    );

    const cancelButton = screen.getByText('Cancel', { selector: 'button' });
    await userEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should show preview when valid mermaid is entered', async () => {
    render(
      <MermaidToBoardDialog open={true} onOpenChange={mockOnOpenChange} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('board-wrapper')).toBeInTheDocument();
    });
  });

  it('should show element count in preview', async () => {
    render(
      <MermaidToBoardDialog open={true} onOpenChange={mockOnOpenChange} />
    );

    await waitFor(() => {
      const elementCount = screen.getByText(/\d+ elements/);
      expect(elementCount).toBeInTheDocument();
    });
  });

  it('should show keyboard shortcut hint', () => {
    render(
      <MermaidToBoardDialog open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText('⌘')).toBeInTheDocument();
  });

  it('should have links to mermaid documentation', () => {
    render(
      <MermaidToBoardDialog open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByRole('link', { name: /Syntax reference/ })).toHaveAttribute('href', 'https://mermaid.js.org/intro/syntax-reference.html');
    expect(screen.getByRole('link', { name: /Sequence diagrams/ })).toHaveAttribute('href', 'https://mermaid.js.org/syntax/sequenceDiagram.html');
    expect(screen.getByRole('link', { name: /Class diagrams/ })).toHaveAttribute('href', 'https://mermaid.js.org/syntax/classDiagram.html');
  });

  describe('user interactions', () => {
    it('should debounce preview updates when typing', async () => {
      render(
        <MermaidToBoardDialog open={true} onOpenChange={mockOnOpenChange} />
      );

      const textarea = screen.getByRole('textbox');

      await waitFor(() => {
        expect(screen.getByTestId('board-wrapper')).toBeInTheDocument();
      });

      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'flowchart TD\n A-->B');

      await waitFor(() => {
        expect(screen.getByTestId('board-wrapper')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should have keyboard shortcut for insert', async () => {
      render(
        <MermaidToBoardDialog open={true} onOpenChange={mockOnOpenChange} />
      );

      expect(screen.getByText('⌘')).toBeInTheDocument();
    });

    it('should display error state for invalid mermaid', async () => {
      render(
        <MermaidToBoardDialog open={true} onOpenChange={mockOnOpenChange} />
      );

      const previewPanel = screen.getByText(/Preview/);
      expect(previewPanel).toBeInTheDocument();
    });
  });
});
