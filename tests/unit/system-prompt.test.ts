import { describe, expect, it } from 'vitest';
import { buildSystemPrompt } from '../../packages/ai/prompts/system';

describe('system-prompt', () => {
  it('assembles the policy-driven prompt sections', () => {
    const prompt = buildSystemPrompt();

    expect(prompt).toContain('<identity>');
    expect(prompt).toContain('<operating-model>');
    expect(prompt).toContain('<tool-policy>');
    expect(prompt).toContain('<visual-strategy>');
    expect(prompt).toContain('<workflow>');
    expect(prompt).toContain('<search-policy>');
    expect(prompt).toContain('<response-style>');
    expect(prompt).toContain('<command-reference>');
  });

  it('includes tool-trust and recovery rules', () => {
    const prompt = buildSystemPrompt();

    expect(prompt).toContain('Never claim a board was created');
    expect(prompt).toContain('Retry once only when the fix is obvious');
    expect(prompt).toContain('not a general shell');
  });

  it('includes command patterns for canvas work', () => {
    const prompt = buildSystemPrompt();

    expect(prompt).toContain('run(command="write mermaid');
    expect(prompt).toContain('run(command="write mindmap');
    expect(prompt).toContain('run(command="ls")');
    expect(prompt).toContain('run(command="mkdir hello")');
  });

  it('renders current workspace context when provided', () => {
    const prompt = buildSystemPrompt({
      today: '2026-04-04',
      workspace: { boardCount: 2 },
      activeBoard: {
        id: 'board-1',
        name: 'hello',
        path: '/hello/',
        elementCount: 3,
        isEmpty: false,
      },
    });

    expect(prompt).toContain('<context>');
    expect(prompt).toContain('Current date: 2026-04-04');
    expect(prompt).toContain('Workspace boards: 2');
    expect(prompt).toContain('Active board path: /hello/');
    expect(prompt).toContain('Active board elements: 3');
  });

  it('returns a substantive prompt string', () => {
    const prompt = buildSystemPrompt();

    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(800);
  });
});
