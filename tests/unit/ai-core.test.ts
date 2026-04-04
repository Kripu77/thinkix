import { describe, it, expect, vi } from 'vitest';

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => ({ provider: 'openai' })),
}));

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => ({ provider: 'anthropic' })),
}));

describe('ai/core', () => {
  describe('PROVIDERS', () => {
    it('should have providers defined', async () => {
      const { PROVIDERS } = await import('@thinkix/ai');
      expect(PROVIDERS).toBeDefined();
      expect(PROVIDERS.length).toBe(2);
    });

    it('should have correct provider structure', async () => {
      const { PROVIDERS } = await import('@thinkix/ai');

      PROVIDERS.forEach((provider) => {
        expect(provider).toHaveProperty('id');
        expect(provider).toHaveProperty('name');
        expect(provider).toHaveProperty('defaultModel');
      });
    });

    it('should have openai provider with correct default model', async () => {
      const { PROVIDERS } = await import('@thinkix/ai');
      const openai = PROVIDERS.find((p) => p.id === 'openai');
      expect(openai).toBeDefined();
      expect(openai?.name).toBe('OpenAI');
      expect(openai?.defaultModel).toBe('gpt-4o');
    });

    it('should have anthropic provider with correct default model', async () => {
      const { PROVIDERS } = await import('@thinkix/ai');
      const anthropic = PROVIDERS.find((p) => p.id === 'anthropic');
      expect(anthropic).toBeDefined();
      expect(anthropic?.name).toBe('Anthropic');
      expect(anthropic?.defaultModel).toBe('claude-opus-4-6');
    });
  });

  describe('getDefaultModel', () => {
    it('should return gpt-4o for openai', async () => {
      const { getDefaultModel } = await import('@thinkix/ai');
      expect(getDefaultModel('openai')).toBe('gpt-4o');
    });

    it('should return claude-opus-4-6 for anthropic', async () => {
      const { getDefaultModel } = await import('@thinkix/ai');
      expect(getDefaultModel('anthropic')).toBe('claude-opus-4-6');
    });

    it('should return gpt-4o as fallback for unknown provider', async () => {
      const { getDefaultModel } = await import('@thinkix/ai');
      expect(getDefaultModel('unknown' as 'openai')).toBe('gpt-4o');
    });
  });

  describe('createAIProvider', () => {
    it('should create openai provider', async () => {
      const { createAIProvider } = await import('@thinkix/ai');
      const provider = createAIProvider('openai', 'test-api-key');
      expect(provider).toBeDefined();
    });

    it('should create anthropic provider', async () => {
      const { createAIProvider } = await import('@thinkix/ai');
      const provider = createAIProvider('anthropic', 'test-api-key');
      expect(provider).toBeDefined();
    });

    it('should throw error for unknown provider', async () => {
      const { createAIProvider } = await import('@thinkix/ai');
      expect(() => createAIProvider('unknown' as 'openai', 'test-api-key')).toThrow('Unknown provider: unknown');
    });

    it('should pass api key to openai provider', async () => {
      const { createAIProvider } = await import('@thinkix/ai');
      const { createOpenAI } = await import('@ai-sdk/openai');
      
      createAIProvider('openai', 'my-api-key');
      expect(vi.mocked(createOpenAI)).toHaveBeenCalledWith({ apiKey: 'my-api-key' });
    });

    it('should pass api key to anthropic provider', async () => {
      const { createAIProvider } = await import('@thinkix/ai');
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      
      createAIProvider('anthropic', 'my-api-key');
      expect(vi.mocked(createAnthropic)).toHaveBeenCalledWith({ apiKey: 'my-api-key' });
    });

    it('should normalize z.ai anthropic base urls', async () => {
      const { createAIProvider } = await import('@thinkix/ai');
      const { createAnthropic } = await import('@ai-sdk/anthropic');

      createAIProvider('anthropic', 'my-api-key', 'https://api.z.ai/api/anthropic');
      expect(vi.mocked(createAnthropic)).toHaveBeenCalledWith({
        apiKey: 'my-api-key',
        baseURL: 'https://api.z.ai/api/anthropic/v1/',
      });
    });

    it('should handle empty api key', async () => {
      const { createAIProvider } = await import('@thinkix/ai');
      const provider = createAIProvider('openai', '');
      expect(provider).toBeDefined();
    });
  });

  describe('env resolution', () => {
    it('prefers explicit provider over env provider', async () => {
      const { resolveAIProvider } = await import('@thinkix/ai');
      expect(
        resolveAIProvider('anthropic', {
          AI_PROVIDER: 'openai',
          OPENAI_API_KEY: 'openai-key',
        }),
      ).toBe('anthropic');
    });

    it('uses AI_PROVIDER when no explicit provider is passed', async () => {
      const { resolveAIProvider } = await import('@thinkix/ai');
      expect(
        resolveAIProvider(undefined, {
          AI_PROVIDER: 'anthropic',
          ANTHROPIC_API_KEY: 'anthropic-key',
        }),
      ).toBe('anthropic');
    });

    it('falls back to the only configured provider key when AI_PROVIDER is not set', async () => {
      const { resolveAIProvider } = await import('@thinkix/ai');
      expect(
        resolveAIProvider(undefined, {
          ANTHROPIC_API_KEY: 'anthropic-key',
        }),
      ).toBe('anthropic');
    });

    it('prefers explicit model over AI_MODEL', async () => {
      const { resolveAIModel } = await import('@thinkix/ai');
      expect(
        resolveAIModel('openai', 'gpt-5', {
          AI_MODEL: 'gpt-4o',
        }),
      ).toBe('gpt-5');
    });

    it('uses AI_MODEL when no explicit model is passed', async () => {
      const { resolveAIModel } = await import('@thinkix/ai');
      expect(
        resolveAIModel('anthropic', undefined, {
          AI_MODEL: 'claude-sonnet-4-20250514',
        }),
      ).toBe('claude-sonnet-4-20250514');
    });

    it('prefers provider-specific keys over AI_API_KEY', async () => {
      const { resolveAIKey } = await import('@thinkix/ai');
      expect(
        resolveAIKey('openai', undefined, {
          AI_API_KEY: 'shared-key',
          OPENAI_API_KEY: 'openai-key',
        }),
      ).toBe('openai-key');
    });

    it('uses AI_API_KEY as a generic fallback', async () => {
      const { resolveAIKey } = await import('@thinkix/ai');
      expect(
        resolveAIKey('anthropic', undefined, {
          AI_API_KEY: 'shared-key',
        }),
      ).toBe('shared-key');
    });

    it('builds a safe client config without exposing keys', async () => {
      const { getClientAIConfig } = await import('@thinkix/ai');
      expect(
        getClientAIConfig({
          AI_PROVIDER: 'anthropic',
          AI_MODEL: 'claude-sonnet-4-20250514',
          ANTHROPIC_API_KEY: 'secret-key',
        }),
      ).toEqual({
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        baseURL: undefined,
        hasDefaultApiKey: true,
        availableProviders: ['anthropic'],
        providerApiKeys: {
          openai: false,
          anthropic: true,
        },
      });
    });
  });

  describe('type exports', () => {
    it('should export AIProvider type', async () => {
      const mod = await import('@thinkix/ai');
      expect(mod).toBeDefined();
    });

    it('should export ProviderConfig type', async () => {
      const mod = await import('@thinkix/ai');
      expect(mod).toBeDefined();
    });
  });
});
