import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { getPostHogClient, getSessionId } from '@/lib/posthog-server';

function resolveModelName(provider: string, model: string): string {
  if (provider === 'openai') {
    if (model === 'gpt-4o') return 'gpt-4o';
    if (model === 'gpt-4o-mini') return 'gpt-4o-mini';
  }
  if (provider === 'anthropic') {
    if (model === 'claude-3-5-sonnet') return 'claude-3-5-sonnet-20241022';
    if (model === 'claude-3-5-haiku') return 'claude-3-5-haiku-20250107';
  }
  return model;
}

export async function POST(req: Request) {
  const { messages, provider = 'openai', model = 'gpt-4o', apiKey } = await req.json();

  const aiProvider = provider === 'openai'
    ? createOpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY })
    : createAnthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });

  const modelName = resolveModelName(provider, model);

  const posthog = getPostHogClient();
  if (posthog) {
    posthog.capture({
      distinctId: getSessionId(),
      event: 'ai_chat_requested',
      properties: {
        provider,
        model: modelName,
        message_count: messages.length,
        using_custom_key: !!apiKey,
      },
    });
  }

  const result = streamText({
    model: aiProvider(modelName),
    messages,
    temperature: 0.7,
  });

  return result.toDataStreamResponse();
}
