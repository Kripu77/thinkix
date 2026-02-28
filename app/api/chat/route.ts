import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { getPostHogClient, getSessionId } from '@/lib/posthog-server';

export async function POST(req: Request) {
  const { messages, provider = 'openai', model = 'gpt-4o', apiKey } = await req.json();

  const aiProvider = provider === 'openai'
    ? createOpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY })
    : createAnthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });

  const modelName = provider === 'openai' && model === 'gpt-4o' ? 'gpt-4o' :
    provider === 'openai' && model === 'gpt-4o-mini' ? 'gpt-4o-mini' :
    provider === 'anthropic' && model === 'claude-3-5-sonnet' ? 'claude-3-5-sonnet-20241022' :
    provider === 'anthropic' && model === 'claude-3-5-haiku' ? 'claude-3-5-haiku-20250107' :
    model;

  const posthog = getPostHogClient();
  const sessionId = getSessionId();
  
  posthog.capture({
    distinctId: sessionId,
    event: 'ai_chat_requested',
    properties: {
      provider,
      model: modelName,
      message_count: messages.length,
      using_custom_key: !!apiKey,
    },
  });

  const result = streamText({
    model: aiProvider(modelName),
    messages,
    temperature: 0.7,
  });

  return result.toDataStreamResponse();
}
