import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

export type AIProvider = 'openai' | 'anthropic';

export type AIEnvironment = Record<string, string | undefined> & {
  AI_PROVIDER?: string;
  AI_MODEL?: string;
  AI_API_KEY?: string;
  AI_BASE_URL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_BASE_URL?: string;
};

export interface ProviderConfig {
  id: AIProvider;
  name: string;
  defaultModel: string;
}

export const PROVIDERS: ProviderConfig[] = [
  { id: 'openai', name: 'OpenAI', defaultModel: 'gpt-4o' },
  { id: 'anthropic', name: 'Anthropic', defaultModel: 'claude-opus-4-6' },
];

export interface ClientAIConfig {
  provider: AIProvider;
  model: string;
  baseURL?: string;
  hasDefaultApiKey: boolean;
  availableProviders: AIProvider[];
  providerApiKeys: Record<AIProvider, boolean>;
}

function isAIProvider(value: string): value is AIProvider {
  return PROVIDERS.some((provider) => provider.id === value);
}

function readEnvValue(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function getProviderApiKey(provider: AIProvider, env: AIEnvironment): string | undefined {
  if (provider === 'openai') {
    return readEnvValue(env.OPENAI_API_KEY) ?? readEnvValue(env.AI_API_KEY);
  }

  if (provider === 'anthropic') {
    return readEnvValue(env.ANTHROPIC_API_KEY) ?? readEnvValue(env.AI_API_KEY);
  }

  return readEnvValue(env.AI_API_KEY);
}

function getProviderBaseURL(provider: AIProvider, env: AIEnvironment): string | undefined {
  if (provider === 'openai') {
    return readEnvValue(env.OPENAI_BASE_URL) ?? readEnvValue(env.AI_BASE_URL);
  }

  if (provider === 'anthropic') {
    return readEnvValue(env.ANTHROPIC_BASE_URL) ?? readEnvValue(env.AI_BASE_URL);
  }

  return readEnvValue(env.AI_BASE_URL);
}

export function resolveAIProvider(
  requestedProvider?: string | null,
  env: AIEnvironment = process.env,
): AIProvider {
  const explicitProvider = readEnvValue(requestedProvider);
  if (explicitProvider && isAIProvider(explicitProvider)) {
    return explicitProvider;
  }

  const envProvider = readEnvValue(env.AI_PROVIDER);
  if (envProvider && isAIProvider(envProvider)) {
    return envProvider;
  }

  const configuredProviders = PROVIDERS.filter((provider) =>
    Boolean(getProviderApiKey(provider.id, env)),
  );

  if (configuredProviders.length === 1) {
    return configuredProviders[0].id;
  }

  return 'openai';
}

export function resolveAIModel(
  provider: AIProvider,
  requestedModel?: string | null,
  env: AIEnvironment = process.env,
): string {
  return readEnvValue(requestedModel) ?? readEnvValue(env.AI_MODEL) ?? getDefaultModel(provider);
}

export function resolveAIKey(
  provider: AIProvider,
  requestedApiKey?: string | null,
  env: AIEnvironment = process.env,
): string | undefined {
  return readEnvValue(requestedApiKey) ?? getProviderApiKey(provider, env);
}

export function resolveAIBaseURL(
  provider: AIProvider,
  requestedBaseURL?: string | null,
  env: AIEnvironment = process.env,
): string | undefined {
  return readEnvValue(requestedBaseURL) ?? getProviderBaseURL(provider, env);
}

export function normalizeAIBaseURL(
  provider: AIProvider,
  baseURL?: string,
): string | undefined {
  if (!baseURL) {
    return undefined;
  }

  if (provider !== 'anthropic' || !baseURL.includes('api.z.ai')) {
    return baseURL;
  }

  let finalBaseURL = baseURL;

  if (!finalBaseURL.endsWith('/')) {
    finalBaseURL += '/';
  }
  if (!finalBaseURL.includes('/v1/')) {
    finalBaseURL = finalBaseURL.replace(/\/$/, '') + '/v1/';
  }

  return finalBaseURL;
}

export function getClientAIConfig(
  env: AIEnvironment = process.env,
): ClientAIConfig {
  const providerApiKeys: Record<AIProvider, boolean> = {
    openai: Boolean(getProviderApiKey('openai', env)),
    anthropic: Boolean(getProviderApiKey('anthropic', env)),
  };

  const provider = resolveAIProvider(undefined, env);

  return {
    provider,
    model: resolveAIModel(provider, undefined, env),
    baseURL: resolveAIBaseURL(provider, undefined, env),
    hasDefaultApiKey: Boolean(resolveAIKey(provider, undefined, env)),
    availableProviders: PROVIDERS.filter((item) => providerApiKeys[item.id]).map(
      (item) => item.id,
    ),
    providerApiKeys,
  };
}

export function getDefaultModel(provider: AIProvider): string {
  const config = PROVIDERS.find(p => p.id === provider);
  return config?.defaultModel ?? 'gpt-4o';
}

export function createAIProvider(provider: AIProvider, apiKey: string, baseURL?: string) {
  const normalizedBaseURL = normalizeAIBaseURL(provider, baseURL);

  if (provider === 'openai') {
    return createOpenAI({ apiKey, ...(normalizedBaseURL ? { baseURL: normalizedBaseURL } : {}) });
  }
  if (provider === 'anthropic') {
    return createAnthropic({ apiKey, ...(normalizedBaseURL ? { baseURL: normalizedBaseURL } : {}) });
  }
  throw new Error(`Unknown provider: ${provider}`);
}
