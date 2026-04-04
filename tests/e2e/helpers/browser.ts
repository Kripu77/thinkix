import type { BrowserContext } from '@playwright/test';

export async function safeClose(...contexts: BrowserContext[]): Promise<void> {
  try {
    await Promise.all(contexts.map((context) => context.close().catch(() => {})));
  } catch {
  }
}
