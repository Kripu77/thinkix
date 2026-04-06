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

function inferProviderFromBaseURL(baseURL?: string): AIProvider | undefined {
  const normalizedBaseURL = readEnvValue(baseURL)?.toLowerCase();

  if (!normalizedBaseURL) {
    return undefined;
  }

  if (normalizedBaseURL.includes('anthropic')) {
    return 'anthropic';
  }

  if (normalizedBaseURL.includes('api.openai.com') || normalizedBaseURL.includes('/openai')) {
    return 'openai';
  }

  return undefined;
}

function inferProviderFromModel(model?: string): AIProvider | undefined {
  const normalizedModel = readEnvValue(model)?.toLowerCase();

  if (!normalizedModel) {
    return undefined;
  }

  if (
    normalizedModel.startsWith('claude') ||
    normalizedModel.startsWith('opus') ||
    normalizedModel.startsWith('sonnet') ||
    normalizedModel.startsWith('haiku')
  ) {
    return 'anthropic';
  }

  if (
    normalizedModel.startsWith('gpt') ||
    normalizedModel.startsWith('o1') ||
    normalizedModel.startsWith('o3') ||
    normalizedModel.startsWith('o4')
  ) {
    return 'openai';
  }

  return undefined;
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

  const providerSpecificBaseURLs = [
    readEnvValue(env.OPENAI_BASE_URL) ? 'openai' : undefined,
    readEnvValue(env.ANTHROPIC_BASE_URL) ? 'anthropic' : undefined,
  ].filter((provider): provider is AIProvider => provider !== undefined);

  if (providerSpecificBaseURLs.length === 1) {
    return providerSpecificBaseURLs[0];
  }

  const inferredBaseURLProvider = inferProviderFromBaseURL(env.AI_BASE_URL);
  if (inferredBaseURLProvider) {
    return inferredBaseURLProvider;
  }

  const inferredModelProvider = inferProviderFromModel(env.AI_MODEL);
  if (inferredModelProvider) {
    return inferredModelProvider;
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
  const resolvedProvider = resolveAIProvider(undefined, env);
  const hasGenericApiKey = Boolean(readEnvValue(env.AI_API_KEY));
  const hasOpenAIKey = Boolean(readEnvValue(env.OPENAI_API_KEY));
  const hasAnthropicKey = Boolean(readEnvValue(env.ANTHROPIC_API_KEY));
  const providerApiKeys: Record<AIProvider, boolean> = {
    openai: hasOpenAIKey || (hasGenericApiKey && resolvedProvider === 'openai'),
    anthropic: hasAnthropicKey || (hasGenericApiKey && resolvedProvider === 'anthropic'),
  };

  return {
    provider: resolvedProvider,
    hasDefaultApiKey: Boolean(resolveAIKey(resolvedProvider, undefined, env)),
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
