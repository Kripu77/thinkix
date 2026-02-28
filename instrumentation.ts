export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    import('@/lib/posthog-server').then(({ shutdownPostHog }) => {
      process.on('SIGTERM', async () => {
        await shutdownPostHog();
        process.exit(0);
      });

      process.on('SIGINT', async () => {
        await shutdownPostHog();
        process.exit(0);
      });
    });
  }
}
