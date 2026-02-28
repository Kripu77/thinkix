import { shutdownPostHog } from '@/lib/posthog-server';

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    process.on('SIGTERM', async () => {
      await shutdownPostHog();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      await shutdownPostHog();
      process.exit(0);
    });
  }
}
