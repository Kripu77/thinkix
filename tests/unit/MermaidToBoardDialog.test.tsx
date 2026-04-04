import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MermaidToBoardDialog } from '@/features/dialogs/components/MermaidToBoardDialog';
import { createMockBoard } from '@/tests/__utils__/test-utils';
import { parseMermaidToBoard } from '@thinkix/mermaid-to-thinkix';
import posthog from 'posthog-js';

vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
  },
}));

vi.mock('@plait-board/react-board', () => ({
  useBoard: vi.fn(() => createMockBoard()),
}));

vi.mock('@plait/core', async () => {
  const actual = await vi.importActual<typeof import('@plait/core')>('@plait/core');
  return {
    ...actual,
    PlaitBoard: {
      ...actual.PlatBoard,
      getBoardContainer: vi.fn(() => ({
        getBoundingClientRect: vi.fn(() => ({
          width: 800,
          height: 600,
        })),
      })),
    },
  };
});

vi.mock('@/features/board/utils', () => ({
  focusAndRevealElements: vi.fn(),
  insertElementsSafely: vi.fn(),
}));

vi.mock('@thinkix/mermaid-to-thinkix', () => ({
  parseMermaidToBoard: vi.fn(),
}));

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

let currentSelectValue = 'simple';
let onValueChangeCallback: ((val: string) => void) | null = null;

vi.mock('@thinkix/ui', () => ({
  Dialog: ({ open, onOpenChange, children }: DialogProps) =>
    open ? (
      <div data-testid="dialog">
        {children}
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Button: ({ children, onClick, disabled }: ButtonProps) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (val: string) => void; children: ReactNode }) => {
    currentSelectValue = value;
    onValueChangeCallback = onValueChange;
    return <div data-value={value} data-testid="select">{children}</div>;
  },
  SelectTrigger: ({ children, className }: { children: ReactNode; className?: string }) => (
    <button
      aria-controls="select-content"
      aria-expanded="true"
      className={className}
      data-testid="select-trigger"
      role="combobox"
    >
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span data-testid="select-value">{placeholder || 'Select example'}</span>
  ),
  SelectContent: ({ children }: { children: ReactNode }) => (
    <div data-testid="select-content" id="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => (
    <div
      aria-selected={currentSelectValue === value}
      role="option"
      data-value={value}
      data-testid="select-item"
      onClick={() => onValueChangeCallback?.(value)}
    >
      {children}
    </div>
  ),
}));

vi.mock('@/shared/constants', async () => {
  const actual = await vi.importActual('@/shared/constants');
  return {
    ...actual,
    THEME: {
      toolbar: {
        container: '',
        button: '',
        buttonSelected: '',
        separator: '',
        mobileButton: '',
      },
      control: {
        container: '',
        button: '',
      },
      dropdown: {
        content: '',
        item: '',
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
  };
});

describe('MermaidToBoardDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(parseMermaidToBoard).mockReset();
    vi.mocked(posthog.capture).mockReset();
  });

  describe('rendering', () => {
    it('should render when open', () => {
      render(<MermaidToBoardDialog open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByText('Mermaid to Board')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<MermaidToBoardDialog open={false} onOpenChange={vi.fn()} />);
      expect(screen.queryByText('Mermaid to Board')).not.toBeInTheDocument();
    });

    it('should render textarea for input', () => {
      render(<MermaidToBoardDialog open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render example selector', () => {
      render(<MermaidToBoardDialog open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render Insert button', () => {
      render(<MermaidToBoardDialog open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByText('Insert to Board')).toBeInTheDocument();
    });

    it('should render Cancel button', () => {
      render(<MermaidToBoardDialog open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('input handling', () => {
    it('should handle text input changes', async () => {
      vi.mocked(parseMermaidToBoard).mockResolvedValue({ elements: [], warnings: [] });
      
      render(<MermaidToBoardDialog open={true} onOpenChange={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'flowchart TD\n A-->B' } });

      await waitFor(() => {
        expect(textarea).toHaveValue('flowchart TD\n A-->B');
      });
    });

    it('should handle empty string input', async () => {
      vi.mocked(parseMermaidToBoard).mockResolvedValue({ elements: [], warnings: [] });
      
      render(<MermaidToBoardDialog open={true} onOpenChange={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '' } });

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });

    it('should handle whitespace-only input', async () => {
      vi.mocked(parseMermaidToBoard).mockResolvedValue({ elements: [], warnings: [] });
      
      render(<MermaidToBoardDialog open={true} onOpenChange={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '   \n\n   ' } });

      await waitFor(() => {
        expect(textarea).toHaveValue('   \n\n   ');
      });
    });
  });

  describe('insert functionality', () => {
    it('should be disabled when no elements', async () => {
      vi.mocked(parseMermaidToBoard).mockResolvedValue({ elements: [], warnings: [] });

      render(<MermaidToBoardDialog open={true} onOpenChange={vi.fn()} />);

      const insertButton = screen.getByText('Insert to Board');
      expect(insertButton).toBeDisabled();
    });
  });

  describe('error handling', () => {
    it('should handle parse errors gracefully', async () => {
      vi.mocked(parseMermaidToBoard).mockRejectedValue(new Error('Parse error'));

      render(<MermaidToBoardDialog open={true} onOpenChange={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'invalid syntax' } });

      await waitFor(() => {
        expect(parseMermaidToBoard).toHaveBeenCalled();
      });
    });
  });

  describe('example selection', () => {
    it('should update textarea when selecting example', async () => {
      vi.mocked(parseMermaidToBoard).mockResolvedValue({ elements: [], warnings: [] });

      render(<MermaidToBoardDialog open={true} onOpenChange={vi.fn()} />);

      const linkItem = document.querySelector('[data-value="link"]');
      expect(linkItem).toBeInTheDocument();
      if (linkItem) {
        fireEvent.click(linkItem);
      }

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      await waitFor(() => {
        expect(textarea.value).toContain('Go shopping');
      });
    });

    it('should support all example types', () => {
      render(<MermaidToBoardDialog open={true} onOpenChange={vi.fn()} />);

      expect(document.querySelector('[data-value="simple"]')).toBeInTheDocument();
      expect(document.querySelector('[data-value="link"]')).toBeInTheDocument();
      expect(document.querySelector('[data-value="complex"]')).toBeInTheDocument();
      expect(document.querySelector('[data-value="sequence"]')).toBeInTheDocument();
      expect(document.querySelector('[data-value="class"]')).toBeInTheDocument();
    });
  });

  describe('cancel', () => {
    it('should call onOpenChange with false when Cancel is clicked', () => {
      const onOpenChange = vi.fn();
      render(<MermaidToBoardDialog open={true} onOpenChange={onOpenChange} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
