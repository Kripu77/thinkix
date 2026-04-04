import { describe, expect, it } from 'vitest';
import { toolSchemas } from '@thinkix/ai/tool-schemas';

describe('tool-schemas', () => {
  it('exports the shipped agent tools', () => {
    expect(Object.keys(toolSchemas)).toEqual(['run', 'web_search']);
  });

  it('validates run(command=...) input', () => {
    expect(toolSchemas.run.parameters.safeParse({ command: 'ls' }).success).toBe(true);
    expect(
      toolSchemas.run.parameters.safeParse({
        command: 'write mermaid "flowchart TD\\nA-->B"',
      }).success,
    ).toBe(true);
    expect(toolSchemas.run.parameters.safeParse({}).success).toBe(false);
  });

  it('validates web_search input', () => {
    expect(
      toolSchemas.web_search.parameters.safeParse({ query: 'distributed systems' }).success,
    ).toBe(true);
    expect(
      toolSchemas.web_search.parameters.safeParse({
        query: 'distributed systems',
        numResults: 5,
      }).success,
    ).toBe(true);
    expect(
      toolSchemas.web_search.parameters.safeParse({
        query: 'distributed systems',
        numResults: 11,
      }).success,
    ).toBe(false);
  });

  it('describes the stricter command contract', () => {
    expect(toolSchemas.run.description).toContain('not a general Unix shell');
    expect(toolSchemas.run.description).toContain('trust returned ids');
    expect(toolSchemas.run.description).toContain('do not use pipes');
    expect(toolSchemas.web_search.description).toContain('fresh or external information');
  });
});
