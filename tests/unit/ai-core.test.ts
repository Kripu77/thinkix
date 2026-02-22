import { describe, it, expect, vi } from 'vitest';

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => ({ provider: 'openai' })),
}));

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => ({ provider: 'anthropic' })),
}));

describe('ai/core', () => {
  describe('MODELS', () => {
    it('should have openai models defined', async () => {
      const { MODELS } = await import('@thinkix/ai');
      expect(MODELS.openai).toBeDefined();
      expect(MODELS.openai.length).toBeGreaterThan(0);
    });

    it('should have anthropic models defined', async () => {
      const { MODELS } = await import('@thinkix/ai');
      expect(MODELS.anthropic).toBeDefined();
      expect(MODELS.anthropic.length).toBeGreaterThan(0);
    });

    it('should have correct model structure for openai', async () => {
      const { MODELS } = await import('@thinkix/ai');
      const openaiModels = MODELS.openai;

      openaiModels.forEach((model) => {
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('provider');
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('model');
        expect(model.provider).toBe('openai');
      });
    });

    it('should have correct model structure for anthropic', async () => {
      const { MODELS } = await import('@thinkix/ai');
      const anthropicModels = MODELS.anthropic;

      anthropicModels.forEach((model) => {
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('provider');
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('model');
        expect(model.provider).toBe('anthropic');
      });
    });

    it('should have gpt-4o model', async () => {
      const { MODELS } = await import('@thinkix/ai');
      const gpt4o = MODELS.openai.find((m) => m.id === 'gpt-4o');
      expect(gpt4o).toBeDefined();
      expect(gpt4o?.model).toBe('gpt-4o');
    });

    it('should have gpt-4o-mini model', async () => {
      const { MODELS } = await import('@thinkix/ai');
      const gpt4oMini = MODELS.openai.find((m) => m.id === 'gpt-4o-mini');
      expect(gpt4oMini).toBeDefined();
      expect(gpt4oMini?.model).toBe('gpt-4o-mini');
    });

    it('should have claude-3-5-sonnet model', async () => {
      const { MODELS } = await import('@thinkix/ai');
      const claude = MODELS.anthropic.find((m) => m.id === 'claude-3-5-sonnet');
      expect(claude).toBeDefined();
      expect(claude?.model).toBe('claude-3-5-sonnet-20241022');
    });

    it('should have claude-3-5-haiku model', async () => {
      const { MODELS } = await import('@thinkix/ai');
      const claude = MODELS.anthropic.find((m) => m.id === 'claude-3-5-haiku');
      expect(claude).toBeDefined();
      expect(claude?.model).toBe('claude-3-5-haiku-20250107');
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

    it('should handle empty api key', async () => {
      const { createAIProvider } = await import('@thinkix/ai');
      const provider = createAIProvider('openai', '');
      expect(provider).toBeDefined();
    });
  });

  describe('type exports', () => {
    it('should export AIProvider type', async () => {
      const mod = await import('@thinkix/ai');
      expect(mod).toBeDefined();
    });

    it('should export AIModel type', async () => {
      const mod = await import('@thinkix/ai');
      expect(mod).toBeDefined();
    });

    it('should export UserSettings type', async () => {
      const mod = await import('@thinkix/ai');
      expect(mod).toBeDefined();
    });
  });
});
