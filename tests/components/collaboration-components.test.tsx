import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';

const mockUseRoomPresence = vi.fn();

vi.mock('@thinkix/collaboration/providers/liveblocks/hooks', () => ({
  useRoomPresence: () => mockUseRoomPresence(),
}));

describe('Collaboration Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRoomPresence.mockReturnValue({
      users: [],
      connectionStatus: 'connected',
      userCount: 1,
    });
  });

  describe('LiveAvatars', () => {
    it('renders null when no users', async () => {
      mockUseRoomPresence.mockReturnValue({
        users: [],
        connectionStatus: 'connected',
        userCount: 1,
      });

      const { LiveAvatars } = await import('@thinkix/collaboration/components');
      const { container } = render(createElement(LiveAvatars));
      expect(container.firstChild).toBeNull();
    });

    it('renders avatars for users', async () => {
      mockUseRoomPresence.mockReturnValue({
        users: [
          { user: { id: '1', name: 'Alice', color: '#FF0000' } },
          { user: { id: '2', name: 'Bob', color: '#00FF00' } },
        ],
        connectionStatus: 'connected',
        userCount: 3,
      });

      const { LiveAvatars } = await import('@thinkix/collaboration/components');
      render(createElement(LiveAvatars));
      expect(screen.getByTitle('Alice')).toBeDefined();
      expect(screen.getByTitle('Bob')).toBeDefined();
    });

    it('respects maxVisible prop', async () => {
      mockUseRoomPresence.mockReturnValue({
        users: [
          { user: { id: '1', name: 'Alice', color: '#FF0000' } },
          { user: { id: '2', name: 'Bob', color: '#00FF00' } },
          { user: { id: '3', name: 'Charlie', color: '#0000FF' } },
        ],
        connectionStatus: 'connected',
        userCount: 3,
      });

      const { LiveAvatars } = await import('@thinkix/collaboration/components');
      render(createElement(LiveAvatars, { maxVisible: 2 }));
      expect(screen.getByTitle('Alice')).toBeDefined();
      expect(screen.getByTitle('Bob')).toBeDefined();
      expect(screen.queryByTitle('Charlie')).toBeNull();
    });

    it('shows hidden count when users exceed maxVisible', async () => {
      mockUseRoomPresence.mockReturnValue({
        users: [
          { user: { id: '1', name: 'Alice', color: '#FF0000' } },
          { user: { id: '2', name: 'Bob', color: '#00FF00' } },
          { user: { id: '3', name: 'Charlie', color: '#0000FF' } },
        ],
        connectionStatus: 'connected',
        userCount: 5,
      });

      const { LiveAvatars } = await import('@thinkix/collaboration/components');
      render(createElement(LiveAvatars, { maxVisible: 2 }));
      expect(screen.getByText('+3')).toBeDefined();
    });

    it('renders avatar image when provided', async () => {
      mockUseRoomPresence.mockReturnValue({
        users: [
          { user: { id: '1', name: 'Alice', color: '#FF0000', avatar: 'data:image/png,test' } },
        ],
        connectionStatus: 'connected',
        userCount: 1,
      });

      const { LiveAvatars } = await import('@thinkix/collaboration/components');
      render(createElement(LiveAvatars));
      const img = document.querySelector('img[alt="Alice"]');
      expect(img).toBeDefined();
      expect(img?.getAttribute('src')).toBe('data:image/png,test');
    });

    it('renders initial when no avatar', async () => {
      mockUseRoomPresence.mockReturnValue({
        users: [
          { user: { id: '1', name: 'Alice', color: '#FF0000' } },
        ],
        connectionStatus: 'connected',
        userCount: 1,
      });

      const { LiveAvatars } = await import('@thinkix/collaboration/components');
      render(createElement(LiveAvatars));
      expect(screen.getByText('A')).toBeDefined();
    });
  });

  describe('PresenceIndicator', () => {
    it('shows connecting state when not connected', async () => {
      mockUseRoomPresence.mockReturnValue({
        users: [],
        connectionStatus: 'connecting',
        userCount: 1,
      });

      const { PresenceIndicator } = await import('@thinkix/collaboration/components');
      render(createElement(PresenceIndicator));
      expect(screen.getByText('Connecting...')).toBeDefined();
    });

    it('shows "Just you" when alone', async () => {
      mockUseRoomPresence.mockReturnValue({
        users: [],
        connectionStatus: 'connected',
        userCount: 1,
      });

      const { PresenceIndicator } = await import('@thinkix/collaboration/components');
      render(createElement(PresenceIndicator, { showAvatars: false }));
      expect(screen.getByText('Just you')).toBeDefined();
    });

    it('shows user count when multiple users', async () => {
      mockUseRoomPresence.mockReturnValue({
        users: [
          { user: { id: '1', name: 'Alice', color: '#FF0000' } },
        ],
        connectionStatus: 'connected',
        userCount: 3,
      });

      const { PresenceIndicator } = await import('@thinkix/collaboration/components');
      render(createElement(PresenceIndicator, { showAvatars: false }));
      expect(screen.getByText('3 online')).toBeDefined();
    });

    it('hides avatars when showAvatars is false', async () => {
      mockUseRoomPresence.mockReturnValue({
        users: [
          { user: { id: '1', name: 'Alice', color: '#FF0000' } },
        ],
        connectionStatus: 'connected',
        userCount: 2,
      });

      const { PresenceIndicator } = await import('@thinkix/collaboration/components');
      render(createElement(PresenceIndicator, { showAvatars: false }));
      expect(screen.queryByTitle('Alice')).toBeNull();
    });
  });

  describe('NicknameDialog', () => {
    it('renders dialog when open', async () => {
      const { NicknameDialog } = await import('@thinkix/collaboration/components');
      render(createElement(NicknameDialog, {
        open: true,
        onOpenChange: vi.fn(),
        currentName: 'Test User',
        onSave: vi.fn(),
      }));
      expect(screen.getByText('Set your nickname')).toBeDefined();
    });

    it('shows current name in input', async () => {
      const { NicknameDialog } = await import('@thinkix/collaboration/components');
      render(createElement(NicknameDialog, {
        open: true,
        onOpenChange: vi.fn(),
        currentName: 'Test User',
        onSave: vi.fn(),
      }));
      const input = screen.getByPlaceholderText('Enter your nickname') as HTMLInputElement;
      expect(input.value).toBe('Test User');
    });

    it('calls onSave with trimmed name', async () => {
      const onSave = vi.fn();
      const { NicknameDialog } = await import('@thinkix/collaboration/components');
      render(createElement(NicknameDialog, {
        open: true,
        onOpenChange: vi.fn(),
        currentName: 'Test User',
        onSave,
      }));

      const input = screen.getByPlaceholderText('Enter your nickname');
      fireEvent.change(input, { target: { value: '  New Name  ' } });
      fireEvent.click(screen.getByText('Save'));

      expect(onSave).toHaveBeenCalledWith('New Name');
    });

    it('disables save button for empty name', async () => {
      const { NicknameDialog } = await import('@thinkix/collaboration/components');
      render(createElement(NicknameDialog, {
        open: true,
        onOpenChange: vi.fn(),
        currentName: '',
        onSave: vi.fn(),
      }));

      const input = screen.getByPlaceholderText('Enter your nickname');
      fireEvent.change(input, { target: { value: '   ' } });

      const saveButton = screen.getByText('Save');
      expect(saveButton.hasAttribute('disabled')).toBe(true);
    });

    it('saves on Enter key', async () => {
      const onSave = vi.fn();
      const { NicknameDialog } = await import('@thinkix/collaboration/components');
      render(createElement(NicknameDialog, {
        open: true,
        onOpenChange: vi.fn(),
        currentName: 'Test',
        onSave,
      }));

      const input = screen.getByPlaceholderText('Enter your nickname');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSave).toHaveBeenCalledWith('New Name');
    });
  });

  describe('ShareButton', () => {
    it('renders share button', async () => {
      const { ShareButton } = await import('@thinkix/collaboration/components');
      render(createElement(ShareButton, { roomId: 'room-123' }));
      expect(screen.getByText('Share')).toBeDefined();
    });

    it('copies link to clipboard', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      const originalClipboard = navigator.clipboard;
      const originalLocation = window.location;

      vi.stubGlobal('navigator', {
        clipboard: { writeText: mockWriteText },
      });
      vi.stubGlobal('location', { origin: 'https://example.com' });

      const { ShareButton } = await import('@thinkix/collaboration/components');
      render(createElement(ShareButton, { roomId: 'room-123' }));

      const shareButton = screen.getByText('Share');
      fireEvent.click(shareButton);

      expect(mockWriteText).toHaveBeenCalled();

      vi.stubGlobal('navigator', { clipboard: originalClipboard });
      vi.stubGlobal('location', originalLocation);
    });
  });

  describe('CollaborationPanel', () => {
    it('shows collaborate button when not enabled', async () => {
      const { CollaborationPanel } = await import('@thinkix/collaboration/components');
      render(createElement(CollaborationPanel, {
        roomId: 'room-123',
        isEnabled: false,
        onEnableCollaboration: vi.fn(),
        onDisableCollaboration: vi.fn(),
      }));
      expect(screen.getByText('Collaborate')).toBeDefined();
    });

    it('shows collaborating status when enabled', async () => {
      const { CollaborationPanel } = await import('@thinkix/collaboration/components');
      render(createElement(CollaborationPanel, {
        roomId: 'room-123',
        isEnabled: true,
        onEnableCollaboration: vi.fn(),
        onDisableCollaboration: vi.fn(),
      }));
      expect(screen.getByText('Collaborating')).toBeDefined();
    });

    it('calls onEnableCollaboration when button clicked', async () => {
      const onEnable = vi.fn();
      const { CollaborationPanel } = await import('@thinkix/collaboration/components');
      render(createElement(CollaborationPanel, {
        roomId: 'room-123',
        isEnabled: false,
        onEnableCollaboration: onEnable,
        onDisableCollaboration: vi.fn(),
      }));

      fireEvent.click(screen.getByText('Collaborate'));
      expect(onEnable).toHaveBeenCalled();
    });

    it('calls onDisableCollaboration when leave clicked', async () => {
      const onDisable = vi.fn();
      const { CollaborationPanel } = await import('@thinkix/collaboration/components');
      const { unmount } = render(createElement(CollaborationPanel, {
        roomId: 'room-123',
        isEnabled: true,
        onEnableCollaboration: vi.fn(),
        onDisableCollaboration: onDisable,
      }));

      const leaveButton = screen.getByText('×');
      fireEvent.click(leaveButton);
      expect(onDisable).toHaveBeenCalled();
      unmount();
    });
  });

  describe('ConnectionIndicator', () => {
    it('returns null when connected', async () => {
      const { ConnectionIndicator } = await import('@thinkix/collaboration/components');
      const { container } = render(createElement(ConnectionIndicator, {
        isConnected: true,
        isReconnecting: false,
      }));
      expect(container.firstChild).toBeNull();
    });

    it('shows reconnecting state', async () => {
      const { ConnectionIndicator } = await import('@thinkix/collaboration/components');
      render(createElement(ConnectionIndicator, {
        isConnected: false,
        isReconnecting: true,
      }));
      expect(screen.getByText('Reconnecting...')).toBeDefined();
    });

    it('shows disconnected state', async () => {
      const { ConnectionIndicator } = await import('@thinkix/collaboration/components');
      render(createElement(ConnectionIndicator, {
        isConnected: false,
        isReconnecting: false,
      }));
      expect(screen.getByText('Disconnected')).toBeDefined();
    });

    it('shows retry button when onRetry provided', async () => {
      const onRetry = vi.fn();
      const { ConnectionIndicator } = await import('@thinkix/collaboration/components');
      render(createElement(ConnectionIndicator, {
        isConnected: false,
        isReconnecting: false,
        onRetry,
      }));

      fireEvent.click(screen.getByText('Retry'));
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('CollaborationErrorBoundary', () => {
    const originalConsoleError = console.error;

    beforeEach(() => {
      console.error = vi.fn();
    });

    afterEach(() => {
      console.error = originalConsoleError;
    });

    it('renders children when no error', async () => {
      const { CollaborationErrorBoundary } = await import('@thinkix/collaboration/components');
      render(createElement(CollaborationErrorBoundary, null,
        createElement('div', null, 'Child content')
      ));
      expect(screen.getByText('Child content')).toBeDefined();
    });

    it('renders fallback UI on error', async () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { CollaborationErrorBoundary } = await import('@thinkix/collaboration/components');
      render(createElement(CollaborationErrorBoundary, null,
        createElement(ThrowError)
      ));
      expect(screen.getByText('Collaboration connection error')).toBeDefined();
    });

    it('calls onError callback', async () => {
      const onError = vi.fn();
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { CollaborationErrorBoundary } = await import('@thinkix/collaboration/components');
      render(createElement(CollaborationErrorBoundary, { onError },
        createElement(ThrowError)
      ));
      expect(onError).toHaveBeenCalled();
    });

    it('renders custom fallback when provided', async () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { CollaborationErrorBoundary } = await import('@thinkix/collaboration/components');
      render(createElement(CollaborationErrorBoundary, {
        fallback: createElement('div', null, 'Custom fallback')
      },
        createElement(ThrowError)
      ));
      expect(screen.getByText('Custom fallback')).toBeDefined();
    });

    it('resets error state on retry', async () => {
      let shouldThrow = true;
      const ConditionalThrow = () => {
        if (shouldThrow) throw new Error('Test error');
        return createElement('div', null, 'Recovered');
      };

      const { CollaborationErrorBoundary } = await import('@thinkix/collaboration/components');
      render(createElement(CollaborationErrorBoundary, null,
        createElement(ConditionalThrow)
      ));

      expect(screen.getByText('Collaboration connection error')).toBeDefined();

      shouldThrow = false;
      fireEvent.click(screen.getByText('Retry'));
    });
  });
});
