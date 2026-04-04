import type { Route } from '@playwright/test';
import type { UIMessageChunk } from 'ai';

const UI_STREAM_HEADERS = {
  'cache-control': 'no-cache',
  connection: 'keep-alive',
  'content-type': 'text/event-stream',
  'x-accel-buffering': 'no',
  'x-vercel-ai-ui-message-stream': 'v1',
};

export function buildUIMessageStreamBody(chunks: UIMessageChunk[]): string {
  return `${chunks
    .map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`)
    .join('')}data: [DONE]\n\n`;
}

export async function fulfillUIMessageStream(
  route: Route,
  chunks: UIMessageChunk[],
): Promise<void> {
  await route.fulfill({
    body: buildUIMessageStreamBody(chunks),
    headers: UI_STREAM_HEADERS,
    status: 200,
  });
}
