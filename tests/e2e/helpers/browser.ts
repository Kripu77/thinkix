import type { BrowserContext } from '@playwright/test';

export async function safeClose(context1: BrowserContext, context2: BrowserContext): Promise<void> {
  try {
    await context1.close().catch(() => {});
    await context2.close().catch(() => {});
  } catch {
    // Ignore cleanup errors
  }
}
