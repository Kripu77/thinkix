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
  const { content, provider = 'openai', model = 'gpt-4o', apiKey } = await req.json();

  const aiProvider = provider === 'openai'
    ? createOpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY })
    : createAnthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });

  const modelName = resolveModelName(provider, model);

  const prompt = `Structure the following content into a mindmap format. Return ONLY valid JSON in this format:
{
  "root": {
    "text": "Main Topic",
    "children": [
      {
        "text": "Subtopic 1",
        "children": []
      }
    ]
  }
}

Content to structure:
${content}`;

  const posthog = getPostHogClient();
  if (posthog) {
    posthog.capture({
      distinctId: getSessionId(),
      event: 'ai_structure_requested',
      properties: {
        provider,
        model: modelName,
        content_length: content?.length ?? 0,
        using_custom_key: !!apiKey,
      },
    });
  }

  const result = streamText({
    model: aiProvider(modelName),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  return result.toDataStreamResponse();
}
