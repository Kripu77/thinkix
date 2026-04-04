import { describe, expect, it } from 'vitest';
import {
  normalizeSystemPromptContext,
  resolveAgentRequestConfig,
  toToolResultOutput,
  uiToModelMessages,
} from '../../app/api/agent/route';

describe('agent route helpers', () => {
  it('preserves structured tool outputs as json for the model', () => {
    expect(
      toToolResultOutput({
        type: 'run-result',
        summary: 'Created /hello/',
        exitCode: 0,
      }),
    ).toEqual({
      type: 'json',
      value: {
        type: 'run-result',
        summary: 'Created /hello/',
        exitCode: 0,
      },
    });
  });

  it('converts assistant tool results into model tool messages with json output', () => {
    const messages = uiToModelMessages([
      {
        role: 'assistant',
        parts: [
          {
            type: 'tool-run',
            toolCallId: 'tool-1',
            input: { command: 'mkdir hello' },
            output: {
              type: 'run-result',
              kind: 'board-create',
              summary: 'Created /hello/',
              exitCode: 0,
              durationMs: 12,
              text: 'Created /hello/',
            },
            state: 'output-available',
          },
        ],
      },
    ]);

    expect(messages).toHaveLength(2);
    expect(messages[1]).toEqual({
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: 'tool-1',
          toolName: 'run',
          output: {
            type: 'json',
            value: {
              type: 'run-result',
              kind: 'board-create',
              summary: 'Created /hello/',
              exitCode: 0,
              durationMs: 12,
              text: 'Created /hello/',
            },
          },
        },
      ],
    });
  });

  it('sanitizes prompt context and always adds the current date', () => {
    expect(
      normalizeSystemPromptContext(
        {
          workspace: { boardCount: 3 },
          activeBoard: {
            id: 'board-1',
            name: 'hello',
            path: '/hello/',
            elementCount: 4,
            isEmpty: false,
          },
        },
        '2026-04-04',
      ),
    ).toEqual({
      today: '2026-04-04',
      workspace: { boardCount: 3 },
      activeBoard: {
        id: 'board-1',
        name: 'hello',
        path: '/hello/',
        elementCount: 4,
        isEmpty: false,
      },
    });
  });

  it('ignores client baseURL overrides when resolving agent requests', () => {
    expect(
      resolveAgentRequestConfig(
        {
          provider: 'anthropic',
          model: 'claude-opus-4-6',
          apiKey: 'local-key',
          // @ts-expect-error validating runtime sanitization
          baseURL: 'https://attacker.invalid',
        },
        {
          ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
        },
      ),
    ).toEqual({
      provider: 'anthropic',
      model: 'claude-opus-4-6',
      apiKey: 'local-key',
    });
  });
});
