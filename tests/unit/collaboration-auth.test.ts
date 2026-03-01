import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@liveblocks/node', () => {
  const mockLiveblocks = vi.fn(function(this: { prepareSession: () => { allow: () => void; FULL_ACCESS: string; authorize: () => Promise<{ status: number; body: string }> } }) {
    this.prepareSession = vi.fn().mockReturnValue({
      allow: vi.fn(),
      FULL_ACCESS: 'full-access',
      authorize: vi.fn().mockResolvedValue({
        status: 200,
        body: '{"token":"mock-token"}',
      }),
    });
    return this;
  });
  return { Liveblocks: mockLiveblocks };
});

describe('/api/collaboration/auth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      LIVEBLOCKS_SECRET_KEY: 'test-secret-key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('POST /api/collaboration/auth', () => {
    it('returns 400 when userId is missing', async () => {
      const { POST } = await import('@/app/api/collaboration/auth/route');
      const request = new NextRequest('http://localhost/api/collaboration/auth', {
        method: 'POST',
        body: JSON.stringify({
          userName: 'Test User',
          userColor: '#FF0000',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: userId, userName, userColor');
    });

    it('returns 400 when userName is missing', async () => {
      const { POST } = await import('@/app/api/collaboration/auth/route');
      const request = new NextRequest('http://localhost/api/collaboration/auth', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-123',
          userColor: '#FF0000',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: userId, userName, userColor');
    });

    it('returns 400 when userColor is missing', async () => {
      const { POST } = await import('@/app/api/collaboration/auth/route');
      const request = new NextRequest('http://localhost/api/collaboration/auth', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-123',
          userName: 'Test User',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: userId, userName, userColor');
    });

    it('returns 400 when all required fields are missing', async () => {
      const { POST } = await import('@/app/api/collaboration/auth/route');
      const request = new NextRequest('http://localhost/api/collaboration/auth', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: userId, userName, userColor');
    });

    it('returns 400 for empty string values', async () => {
      const { POST } = await import('@/app/api/collaboration/auth/route');
      const request = new NextRequest('http://localhost/api/collaboration/auth', {
        method: 'POST',
        body: JSON.stringify({
          userId: '',
          userName: '',
          userColor: '',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('returns success when all required fields are provided without room', async () => {
      const { POST } = await import('@/app/api/collaboration/auth/route');
      const request = new NextRequest('http://localhost/api/collaboration/auth', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-123',
          userName: 'Test User',
          userColor: '#FF0000',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('returns success when room is provided', async () => {
      const { POST } = await import('@/app/api/collaboration/auth/route');
      const request = new NextRequest('http://localhost/api/collaboration/auth', {
        method: 'POST',
        body: JSON.stringify({
          room: 'room-123',
          userId: 'user-123',
          userName: 'Test User',
          userColor: '#FF0000',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('handles invalid JSON body', async () => {
      const { POST } = await import('@/app/api/collaboration/auth/route');
      const request = new NextRequest('http://localhost/api/collaboration/auth', {
        method: 'POST',
        body: 'not valid json',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('handles special characters in user fields', async () => {
      const { POST } = await import('@/app/api/collaboration/auth/route');
      const request = new NextRequest('http://localhost/api/collaboration/auth', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-😀-123',
          userName: 'Test "User" <script>alert(1)</script>',
          userColor: '#FF0000',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('handles very long field values', async () => {
      const { POST } = await import('@/app/api/collaboration/auth/route');
      const longString = 'a'.repeat(10000);
      const request = new NextRequest('http://localhost/api/collaboration/auth', {
        method: 'POST',
        body: JSON.stringify({
          userId: longString,
          userName: 'Test User',
          userColor: '#FF0000',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('handles unicode characters in userName', async () => {
      const { POST } = await import('@/app/api/collaboration/auth/route');
      const request = new NextRequest('http://localhost/api/collaboration/auth', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-123',
          userName: '用户名 日本語 한국어 العربية',
          userColor: '#FF0000',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('handles various color formats', async () => {
      const colorFormats = ['#FF0000', '#f00', 'rgb(255, 0, 0)', 'red', 'hsl(0, 100%, 50%)'];

      for (const color of colorFormats) {
        const { POST } = await import('@/app/api/collaboration/auth/route');
        const request = new NextRequest('http://localhost/api/collaboration/auth', {
          method: 'POST',
          body: JSON.stringify({
            userId: 'user-123',
            userName: 'Test User',
            userColor: color,
          }),
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });
  });
});
