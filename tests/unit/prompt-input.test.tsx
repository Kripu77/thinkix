import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/features/agent/components/ai-elements/prompt-input';

vi.mock('@thinkix/ui', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  cn: (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(' '),
}));

describe('PromptInput', () => {
  it('clears the textarea immediately after a successful submit starts', async () => {
    const user = userEvent.setup();
    let resolveSubmit: ((value: boolean) => void) | null = null;
    const handleSubmit = vi.fn().mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    render(
      <PromptInput onSubmit={handleSubmit}>
        <PromptInputTextarea aria-label="Prompt" />
        <PromptInputSubmit />
      </PromptInput>,
    );

    const textarea = screen.getByLabelText('Prompt');
    await user.type(textarea, 'add more stickies');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(handleSubmit).toHaveBeenCalledWith(
      { text: 'add more stickies', files: [] },
      expect.any(Object),
    );
    expect(textarea).toHaveValue('');

    resolveSubmit?.(true);
  });

  it('restores the textarea value when submit returns false', async () => {
    const user = userEvent.setup();
    let resolveSubmit: ((value: boolean) => void) | null = null;
    const handleSubmit = vi.fn().mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    render(
      <PromptInput onSubmit={handleSubmit}>
        <PromptInputTextarea aria-label="Prompt" />
        <PromptInputSubmit />
      </PromptInput>,
    );

    const textarea = screen.getByLabelText('Prompt');
    await user.type(textarea, 'needs api key');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(handleSubmit).toHaveBeenCalledWith(
      { text: 'needs api key', files: [] },
      expect.any(Object),
    );
    expect(textarea).toHaveValue('');

    resolveSubmit?.(false);

    await waitFor(() => {
      expect(textarea).toHaveValue('needs api key');
    });
  });
});
