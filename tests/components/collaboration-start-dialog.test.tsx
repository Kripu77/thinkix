import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CollaborationStartDialog } from '@/features/collaboration/components/collaboration-start-dialog';
import { logger } from '@thinkix/collaboration';

const mockWriteText = vi.fn().mockResolvedValue(undefined);

describe('CollaborationStartDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    roomUrl: 'http://localhost:3000/?room=test-room-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('navigator', {
      clipboard: { writeText: mockWriteText },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe('rendering', () => {
    it('renders when open is true', () => {
      render(<CollaborationStartDialog {...defaultProps} />);
      
      expect(screen.getByText('Start collaborating')).toBeInTheDocument();
    });

    it('does not render content when open is false', () => {
      render(<CollaborationStartDialog {...defaultProps} open={false} />);
      
      expect(screen.queryByText('Start collaborating')).not.toBeInTheDocument();
    });

    it('displays the room URL', () => {
      render(<CollaborationStartDialog {...defaultProps} />);
      
      const input = screen.getByLabelText('Collaboration link');
      expect(input).toHaveValue(defaultProps.roomUrl);
    });

    it('displays description text', () => {
      render(<CollaborationStartDialog {...defaultProps} />);
      
      expect(screen.getByText(/Share this link with others to collaborate in real-time/)).toBeInTheDocument();
    });

    it('displays tip section', () => {
      render(<CollaborationStartDialog {...defaultProps} />);
      
      expect(screen.getByText(/Tip:/)).toBeInTheDocument();
      expect(screen.getByText(/Anyone with this link can view and edit/)).toBeInTheDocument();
    });

    it('displays copy button', () => {
      render(<CollaborationStartDialog {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('displays got it button', () => {
      render(<CollaborationStartDialog {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /got it/i })).toBeInTheDocument();
    });
  });

  describe('copy functionality', () => {
    it('copies URL to clipboard when copy button is clicked', async () => {
      render(<CollaborationStartDialog {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(defaultProps.roomUrl);
      });
    });

    it('shows "Copied" text after successful copy', async () => {
      render(<CollaborationStartDialog {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Copied')).toBeInTheDocument();
      });
    });

    it.skip('reverts to "Copy" text after timeout', async () => {
      vi.useFakeTimers();
      
      render(<CollaborationStartDialog {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      
      await act(async () => {
        fireEvent.click(copyButton);
        await vi.runAllTimersAsync();
      });
      
      expect(screen.getByText('Copied')).toBeInTheDocument();
      
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });
      
      expect(screen.getByText('Copy')).toBeInTheDocument();
      
      vi.useRealTimers();
    });

    it('handles clipboard error gracefully', async () => {
      vi.useFakeTimers();
      const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
      mockWriteText.mockRejectedValueOnce(new Error('Clipboard error'));
      
      render(<CollaborationStartDialog {...defaultProps} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      await vi.runAllTimersAsync();
      
      expect(loggerSpy).toHaveBeenCalledWith(
        'Failed to copy to clipboard',
        expect.any(Error)
      );
      
      loggerSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe('dialog close behavior', () => {
    it('calls onOpenChange with false when "Got it" is clicked', () => {
      const onOpenChange = vi.fn();
      render(<CollaborationStartDialog {...defaultProps} onOpenChange={onOpenChange} />);
      
      const gotItButton = screen.getByRole('button', { name: /got it/i });
      fireEvent.click(gotItButton);
      
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('accessibility', () => {
    it('has proper dialog role', () => {
      render(<CollaborationStartDialog {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has accessible title', () => {
      render(<CollaborationStartDialog {...defaultProps} />);
      
      expect(screen.getByRole('heading', { name: /start collaborating/i })).toBeInTheDocument();
    });

    it('has accessible description', () => {
      render(<CollaborationStartDialog {...defaultProps} />);
      
      const description = screen.getByText(/Share this link with others/);
      expect(description).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles empty room URL', () => {
      render(<CollaborationStartDialog {...defaultProps} roomUrl="" />);
      
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('handles very long room URL', () => {
      const longUrl = 'http://localhost:3000/?room=' + 'a'.repeat(500);
      render(<CollaborationStartDialog {...defaultProps} roomUrl={longUrl} />);
      
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('handles special characters in room URL', () => {
      const specialUrl = 'http://localhost:3000/?room=test-room-123&special=hello%20world';
      render(<CollaborationStartDialog {...defaultProps} roomUrl={specialUrl} />);
      
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });
  });
});
