import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';

vi.mock('yjs', () => ({
  default: vi.fn(() => ({
    transact: vi.fn((fn) => fn()),
    getMap: vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      values: vi.fn(() => [].values()),
      size: 0,
    })),
    destroy: vi.fn(),
  })),
}));

vi.mock('@liveblocks/react/suspense', () => ({
  LiveblocksProvider: ({ children }: { children: ReactNode }) => createElement('div', null, children),
  RoomProvider: ({ children }: { children: ReactNode }) => createElement('div', null, children),
  useRoom: () => ({ id: 'test-room' }),
  useStatus: () => 'connected',
  useMyPresence: () => [{}, vi.fn()],
  useOthers: () => [],
  useSelf: () => ({ connectionId: 'test-conn' }),
}));

vi.mock('@liveblocks/yjs', () => ({
  LiveblocksYjsProvider: vi.fn(() => ({
    destroy: vi.fn(),
  })),
}));

describe('YjsProvider', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    color: '#FF0000',
    avatar: 'data:image/svg+xml,test',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('without auth endpoint or public key', () => {
    it('renders children without wrapping provider', async () => {
      delete process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;
      const { YjsProvider } = await import('@thinkix/collaboration/adapter');
      
      const { container } = render(
        createElement(YjsProvider, { user: mockUser }, createElement('div', null, 'Child'))
      );
      
      expect(container.textContent).toBe('Child');
    });

    it('logs warning on client side when no config provided', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      delete process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;
      
      const { YjsProvider } = await import('@thinkix/collaboration/adapter');
      render(createElement(YjsProvider, { user: mockUser }, createElement('div')));
      
      expect(warnSpy).toHaveBeenCalledWith('YjsProvider: No auth endpoint or public key provided');
      warnSpy.mockRestore();
    });
  });

  describe('with auth endpoint', () => {
    it('renders provider with auth endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ token: 'mock-token' }),
      });
      vi.stubGlobal('fetch', mockFetch);
      
      const { YjsProvider } = await import('@thinkix/collaboration/adapter');
      const { container } = render(
        createElement(YjsProvider, { 
          user: mockUser, 
          authEndpoint: '/api/auth' 
        }, createElement('div', null, 'Test'))
      );
      
      expect(container.textContent).toBe('Test');
    });

    it('uses custom config options', async () => {
      const { YjsProvider } = await import('@thinkix/collaboration/adapter');
      const { container } = render(
        createElement(YjsProvider, { 
          user: mockUser, 
          authEndpoint: '/api/auth',
          config: { presence: { throttleMs: 100, idleTimeoutMs: 60000 }, pageSize: 100 }
        }, createElement('div'))
      );
      
      expect(container).toBeDefined();
    });
  });

  describe('with public key', () => {
    it('uses public key from prop', async () => {
      const { YjsProvider } = await import('@thinkix/collaboration/adapter');
      const { container } = render(
        createElement(YjsProvider, { 
          user: mockUser, 
          publicKey: 'pk_test_key'
        }, createElement('div'))
      );
      
      expect(container).toBeDefined();
    });
  });
});

describe('useYjsCollaboration', () => {
  it('throws when used outside provider', async () => {
    const { useYjsCollaboration } = await import('@thinkix/collaboration/adapter');
    
    expect(() => {
      renderHook(() => useYjsCollaboration());
    }).toThrow('useYjsCollaboration must be used within YjsCollaborationProvider');
  });
});

describe('useOptionalYjsCollaboration', () => {
  it('returns null when used outside provider', async () => {
    const { useOptionalYjsCollaboration } = await import('@thinkix/collaboration/adapter');
    
    const { result } = renderHook(() => useOptionalYjsCollaboration());
    expect(result.current).toBeNull();
  });
});
