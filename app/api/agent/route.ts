import {
  streamText,
  tool,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
} from 'ai';
import type {
  AssistantModelMessage,
  JSONValue,
  ModelMessage,
  ToolModelMessage,
} from 'ai';
import { toolSchemas } from '@thinkix/ai/tool-schemas';
import { buildSystemPrompt } from '@thinkix/ai/prompts';
import {
  createAIProvider,
  getClientAIConfig,
  resolveAIBaseURL,
  resolveAIKey,
  resolveAIModel,
  resolveAIProvider,
} from '@thinkix/ai';
import type { AIProvider } from '@thinkix/ai';
import type { SystemPromptContext } from '@thinkix/ai';
import { webSearch } from '@thinkix/ai/tools';
 
type UIMessagePart = {
  type: string;
  text?: string;
  toolCallId?: string;
  toolName?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  state?: string;
};

type UIMsg = { role: string; parts?: UIMessagePart[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function toOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function normalizeJsonValue(value: unknown): JSONValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : String(value);
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeJsonValue(item));
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        normalizeJsonValue(entryValue),
      ]),
    );
  }

  return String(value);
}

export function toToolResultOutput(output: unknown) {
  const normalized = normalizeJsonValue(output);

  if (typeof normalized === 'string') {
    return { type: 'text' as const, value: normalized };
  }

  return { type: 'json' as const, value: normalized };
}

export function normalizeSystemPromptContext(
  raw: unknown,
  today: string,
): SystemPromptContext {
  const context: SystemPromptContext = { today };

  if (!isRecord(raw)) {
    return context;
  }

  const workspace = isRecord(raw.workspace) ? raw.workspace : null;
  const activeBoard = isRecord(raw.activeBoard) ? raw.activeBoard : null;

  if (workspace) {
    context.workspace = {
      boardCount: toOptionalNumber(workspace.boardCount),
    };
  }

  if (activeBoard) {
    context.activeBoard = {
      id: toOptionalString(activeBoard.id) ?? null,
      name: toOptionalString(activeBoard.name) ?? null,
      path: toOptionalString(activeBoard.path) ?? null,
      elementCount: toOptionalNumber(activeBoard.elementCount) ?? null,
      isEmpty: toOptionalBoolean(activeBoard.isEmpty) ?? null,
    };
  }

  return context;
}

function getProviderOptions(provider: string, modelName: string) {
  if (provider !== 'anthropic' || !/opus/i.test(modelName)) {
    return undefined;
  }

  return {
    anthropic: {
      thinking: { type: 'enabled' as const, budgetTokens: 4096 },
    },
  };
}
 
export function uiToModelMessages(uiMessages: UIMsg[]): ModelMessage[] {
  const result: ModelMessage[] = [];
 
  for (const msg of uiMessages) {
    if (msg.role === 'user') {
      const textParts = (msg.parts ?? []).filter(p => p.type === 'text');
      result.push({
        role: 'user',
        content: textParts.map(p => ({ type: 'text' as const, text: p.text as string })),
      });
      continue;
    }
 
    if (msg.role === 'system') {
      const text = (msg.parts ?? []).filter(p => p.type === 'text').map(p => p.text).join('');
      result.push({ role: 'system', content: text });
      continue;
    }
 
    if (msg.role === 'assistant') {
      const steps: UIMsg['parts'][] = [];
      let currentStep: NonNullable<UIMsg['parts']> = [];
 
      for (const part of msg.parts ?? []) {
        if (part.type === 'step-start') {
          if (currentStep.length > 0) {
            steps.push(currentStep);
          }
          currentStep = [];
          continue;
        }
        currentStep.push(part);
      }
      if (currentStep.length > 0) {
        steps.push(currentStep);
      }
 
      for (const stepParts of steps) {
        if (!stepParts) continue;
        const assistantContent: AssistantModelMessage['content'] = [];
        const toolResultContent: ToolModelMessage['content'] = [];
 
        for (const part of stepParts) {
          if (part.type === 'text' && part.text) {
            assistantContent.push({ type: 'text', text: part.text });
          }
 
          const isDynamic = part.type === 'dynamic-tool';
          const isStatic = typeof part.type === 'string' && part.type.startsWith('tool-') && part.type !== 'tool-result';
          if ((isDynamic || isStatic) && part.toolCallId) {
            const toolName = isDynamic ? part.toolName : part.type.replace(/^tool-/, '');
            if (!toolName) {
              continue;
            }
 
            assistantContent.push({
              type: 'tool-call',
              toolCallId: part.toolCallId,
              toolName,
              input: part.input ?? {},
            });
 
            if (part.state === 'output-available' && part.output !== undefined) {
              toolResultContent.push({
                type: 'tool-result',
                toolCallId: part.toolCallId,
                toolName,
                output: toToolResultOutput(part.output),
              });
            } else if (part.state === 'output-error') {
              toolResultContent.push({
                type: 'tool-result',
                toolCallId: part.toolCallId,
                toolName,
                output: { type: 'text', value: part.errorText ?? 'Tool execution failed' },
              });
            }
          }
        }
 
        if (assistantContent.length > 0) {
          result.push({ role: 'assistant', content: assistantContent });
        }
        if (toolResultContent.length > 0) {
          result.push({ role: 'tool', content: toolResultContent });
        }
      }
    }
  }
 
  return result;
}

export function resolveAgentRequestConfig(
  raw: {
    provider?: unknown;
    model?: unknown;
    apiKey?: unknown;
  },
  env: NodeJS.ProcessEnv = process.env,
) {
  const requestedApiKey = toOptionalString(raw.apiKey);
  const requestedProvider = toOptionalString(raw.provider);
  const serverConfig = getClientAIConfig(env);
  const requestedTypedProvider = requestedProvider as AIProvider | undefined;
  const canUseRequestedProvider =
    requestedTypedProvider != null &&
    (requestedApiKey != null ||
      serverConfig.availableProviders.includes(requestedTypedProvider));
  const typedProvider = resolveAIProvider(
    canUseRequestedProvider ? requestedTypedProvider : undefined,
    env,
  );
  const modelName = resolveAIModel(typedProvider, toOptionalString(raw.model), env);
  const effectiveKey = resolveAIKey(typedProvider, requestedApiKey, env);
  const baseURL = resolveAIBaseURL(typedProvider, undefined, env);

  return {
    provider: typedProvider,
    model: modelName,
    apiKey: effectiveKey,
    baseURL,
  };
}
 
export async function POST(req: Request) {
  const { messages, provider, model, apiKey, context } = await req.json();
  const resolvedRequest = resolveAgentRequestConfig(
    { provider, model, apiKey },
    process.env,
  );

  if (!resolvedRequest.apiKey) {
    console.error('[agent] No API key provided');
    return new Response(
      JSON.stringify({
        error:
          'No AI key is configured. Add a key in Agent Settings or enable the default AI setup.',
      }),
      { status: 401 },
    );
  }

  const aiProvider = createAIProvider(
    resolvedRequest.provider,
    resolvedRequest.apiKey,
    resolvedRequest.baseURL,
  );

  const modelMessages = uiToModelMessages(messages);
  const systemPromptContext = normalizeSystemPromptContext(
    context,
    new Date().toISOString().slice(0, 10),
  );

  const result = streamText({
    model: aiProvider(resolvedRequest.model),
    system: buildSystemPrompt(systemPromptContext),
    messages: modelMessages,
    stopWhen: stepCountIs(100),
    providerOptions: getProviderOptions(resolvedRequest.provider, resolvedRequest.model),
    experimental_transform: smoothStream({
      delayInMs: 20,
      chunking: 'line',
    }),
    tools: {
      run: tool({ description: toolSchemas.run.description, inputSchema: toolSchemas.run.parameters }),
      web_search: tool({
        description: toolSchemas.web_search.description,
        inputSchema: toolSchemas.web_search.parameters,
        execute: async ({ query, numResults = 5 }) => webSearch(query, numResults),
      }),
    },
    onError: (error) => {
      console.error('[agent] streamText error:', error);
    },
  });

  const uiStream = result.toUIMessageStream();
  const activeTextIds = new Set<string>();
 
  const fixedStream = uiStream.pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        if (chunk.type === 'text-start') {
          activeTextIds.add(chunk.id);
        }
        if (chunk.type === 'text-end' && !activeTextIds.has(chunk.id)) {
          return;
        }
        if (chunk.type === 'text-end') {
          activeTextIds.delete(chunk.id);
        }
        controller.enqueue(chunk);
      },
    })
  );
 
  return createUIMessageStreamResponse({ stream: fixedStream });
}
