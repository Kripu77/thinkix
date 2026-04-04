import { describe, expect, it } from 'vitest';
import {
  formatOutput,
  getOverflowFile,
} from '@/features/agent/tools/presentation-layer';

function extractOverflowFilename(output: string): string | null {
  const match = output.match(/Full output: \/tmp\/cmd-output\/(cmd-\d+\.txt)/);
  return match?.[1] ?? null;
}

describe('presentation-layer overflow retention', () => {
  it('evicts the oldest retained overflow output once the file cap is exceeded', () => {
    const filenames: string[] = [];

    for (let i = 0; i < 21; i++) {
      const rawOutput = `${String(i).repeat(60000)}\n`;
      const formatted = formatOutput(rawOutput, 0, 10);
      const filename = extractOverflowFilename(formatted);

      expect(filename).toBeTruthy();
      filenames.push(filename!);
    }

    expect(getOverflowFile(filenames[0])).toBeUndefined();
    expect(getOverflowFile(filenames[filenames.length - 1])).toBeDefined();
  });

  it('does not retain a single oversized overflow output beyond the memory cap', () => {
    const rawOutput = `${'x'.repeat(2 * 1024 * 1024 + 1)}\n`;
    const formatted = formatOutput(rawOutput, 0, 10);

    expect(formatted).toContain(
      'Full output was not retained to avoid excessive memory usage.',
    );
    expect(extractOverflowFilename(formatted)).toBeNull();
  });
});
