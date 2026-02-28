import { shutdownPostHog } from '@/lib/posthog-server';

export async function onRequestEnd() {
  await shutdownPostHog();
}
