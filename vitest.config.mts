import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/__mocks__/setup.mts'],
    include: [
      'tests/**/*.test.{ts,tsx}',
      'packages/**/*.test.{ts,tsx}',
    ],
    exclude: [
      'node_modules',
      'scratch/**',
      '.next',
      'tests/e2e/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'scratch/**',
        '.next/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
        'app/**',
        'features/**',
        'packages/ui/src/components/**',
        'packages/ui/src/hooks/**',
        'packages/storage/lib/**',
        'packages/collaboration/src/adapter/**',
        'packages/collaboration/src/hooks/**',
        'packages/collaboration/src/providers/**',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    maxWorkers: 4,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@thinkix/ui': path.resolve(__dirname, './packages/ui/src'),
      '@thinkix/ai': path.resolve(__dirname, './packages/ai/lib'),
      '@thinkix/plait-utils': path.resolve(__dirname, './packages/plait-utils/lib'),
      '@thinkix/storage': path.resolve(__dirname, './packages/storage/lib'),
      '@thinkix/shared': path.resolve(__dirname, './packages/shared/src'),
      '@thinkix/file-utils': path.resolve(__dirname, './packages/file-utils/src'),
      '@thinkix/mermaid-to-thinkix': path.resolve(__dirname, './packages/mermaid-to-thinkix/src'),
      '@thinkix/collaboration': path.resolve(__dirname, './packages/collaboration/src'),
      '@thinkix/collaboration/hooks': path.resolve(__dirname, './packages/collaboration/src/hooks'),
      '@thinkix/collaboration/utils': path.resolve(__dirname, './packages/collaboration/src/utils'),
      '@thinkix/collaboration/providers/liveblocks/hooks': path.resolve(__dirname, './packages/collaboration/src/providers/liveblocks/hooks'),
      '@/features': path.resolve(__dirname, './features'),
      '@/shared': path.resolve(__dirname, './shared'),
      '@/packages': path.resolve(__dirname, './packages'),
    },
  },
  define: {
    'process.env.NODE_ENV': '"test"',
  },
});
