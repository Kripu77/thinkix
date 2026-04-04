'use client';

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  cn,
} from '@thinkix/ui';
import type { ChatStatus, FileUIPart } from 'ai';
import { CornerDownLeftIcon, SquareIcon } from 'lucide-react';
import type {
  FormEvent,
  HTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

interface PromptInputMessage {
  text: string;
  files: FileUIPart[];
}

interface PromptInputContextValue {
  text: string;
  setText: (value: string) => void;
  clear: () => void;
}

const PromptInputContext = createContext<PromptInputContextValue | null>(null);

function usePromptInputContext() {
  const context = useContext(PromptInputContext);
  if (!context) {
    throw new Error('PromptInput components must be used within PromptInput.');
  }
  return context;
}

export type PromptInputProps = Omit<HTMLAttributes<HTMLFormElement>, 'onSubmit'> & {
  onSubmit: (
    message: PromptInputMessage,
    event: FormEvent<HTMLFormElement>,
  ) => boolean | void | Promise<boolean | void>;
};

export const PromptInput = ({
  className,
  onSubmit,
  children,
  ...props
}: PromptInputProps) => {
  const [text, setText] = useState('');

  const contextValue = useMemo(
    () => ({
      text,
      setText,
      clear: () => setText(''),
    }),
    [text],
  );

  return (
    <PromptInputContext.Provider value={contextValue}>
      <form
        className={cn('space-y-3', className)}
        onSubmit={async (event) => {
          event.preventDefault();
          const submittedText = text;
          const trimmedText = text.trim();
          if (!trimmedText) {
            return;
          }

          setText('');

          try {
            const shouldClear = await onSubmit(
              { text: submittedText, files: [] },
              event,
            );

            if (shouldClear === false) {
              setText((currentText) =>
                currentText.length === 0 ? submittedText : currentText,
              );
            }
          } catch (error) {
            setText((currentText) =>
              currentText.length === 0 ? submittedText : currentText,
            );
            throw error;
          }
        }}
        {...props}
      >
        {children}
      </form>
    </PromptInputContext.Provider>
  );
};

export type PromptInputBodyProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputBody = ({
  className,
  ...props
}: PromptInputBodyProps) => (
  <div className={cn('space-y-2', className)} {...props} />
);

export type PromptInputTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const PromptInputTextarea = ({
  className,
  onChange,
  onKeyDown,
  ...props
}: PromptInputTextareaProps) => {
  const { text, setText } = usePromptInputContext();

  return (
    <textarea
      className={cn(
        'min-h-[60px] w-full resize-none border-0 bg-transparent px-3 py-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground',
        className,
      )}
      onChange={(event) => {
        setText(event.target.value);
        onChange?.(event);
      }}
      onKeyDown={(event) => {
        if (
          event.key === 'Enter' &&
          !event.shiftKey &&
          !event.nativeEvent.isComposing
        ) {
          event.preventDefault();
          const form = event.currentTarget.form;
          form?.requestSubmit();
        }

        onKeyDown?.(event);
      }}
      value={text}
      {...props}
    />
  );
};

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTools = ({
  className,
  ...props
}: PromptInputToolsProps) => (
  <div className={cn('flex items-center gap-2', className)} {...props} />
);

export type PromptInputSubmitProps = {
  status?: ChatStatus;
  onStop?: () => void;
  className?: string;
  sendTestId?: string;
  stopTestId?: string;
};

export const PromptInputSubmit = ({
  status,
  onStop,
  className,
  sendTestId,
  stopTestId,
}: PromptInputSubmitProps) => {
  const { text } = usePromptInputContext();
  const isGenerating = status === 'submitted' || status === 'streaming';

  if (isGenerating) {
    return (
      <Button
        className={className}
        data-testid={stopTestId}
        onClick={onStop}
        size="sm"
        type="button"
        variant="outline"
      >
        <SquareIcon className="size-3.5" />
        Stop
      </Button>
    );
  }

  return (
    <Button
      className={className}
      data-testid={sendTestId}
      disabled={!text.trim()}
      size="sm"
      type="submit"
    >
      <CornerDownLeftIcon className="size-3.5" />
      Send
    </Button>
  );
};

export const PromptInputSelect = Select;
export const PromptInputSelectTrigger = SelectTrigger;
export const PromptInputSelectContent = SelectContent;
export const PromptInputSelectItem = SelectItem;
