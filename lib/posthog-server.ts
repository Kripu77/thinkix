import { PostHog } from "posthog-node";
import { randomUUID } from "crypto";

let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  
  if (!key) {
    console.warn('PostHog: Missing NEXT_PUBLIC_POSTHOG_KEY - analytics disabled');
    return null;
  }
  
  if (!posthogClient) {
    posthogClient = new PostHog(key, {
      host: host,
      flushAt: 10,
      flushInterval: 5000,
    });
  }
  return posthogClient;
}

export function getSessionId(): string {
  return `session_${randomUUID()}`;
}

export async function shutdownPostHog(): Promise<void> {
  if (posthogClient) {
    await posthogClient.shutdown();
    posthogClient = null;
  }
}
