'use client';

import { cn } from '@thinkix/ui';
import { cjk } from '@streamdown/cjk';
import { code } from '@streamdown/code';
import { math } from '@streamdown/math';
import { mermaid } from '@streamdown/mermaid';
import type { UIMessage } from 'ai';
import type { ComponentProps, HTMLAttributes } from 'react';
import { createContext, memo, useContext } from 'react';
import { Streamdown } from 'streamdown';

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role'];
};

interface MessageContextValue {
  role: UIMessage['role'];
}

const MessageContext = createContext<MessageContextValue | null>(null);

export const Message = ({ className, from, children, ...props }: MessageProps) => (
  <div
    className={cn(
      'mb-4 flex w-full max-w-[95%] flex-col gap-2 last:mb-0',
      from === 'user' ? 'ml-auto items-end' : 'items-start',
      className,
    )}
    {...props}
  >
    <MessageContext.Provider value={{ role: from }}>
      {children}
    </MessageContext.Provider>
  </div>
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => {
  const messageContext = useContext(MessageContext);
  const isUser = messageContext?.role === 'user';

  return (
    <div
      className={cn(
        'flex w-fit min-w-0 max-w-full flex-col gap-2 overflow-hidden text-sm',
        isUser && 'ml-auto rounded-lg bg-secondary px-4 py-3 text-foreground',
        !isUser && 'text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export type MessageResponseProps = Omit<ComponentProps<typeof Streamdown>, 'plugins'> & {
  isAnimating?: boolean;
};

const streamdownPlugins = { cjk, code, math, mermaid } as unknown as ComponentProps<
  typeof Streamdown
>['plugins'];

export const MessageResponse = memo(
  ({ className, isAnimating, ...props }: MessageResponseProps) => {
    void isAnimating;
    return (
      <Streamdown
        className={cn(
          'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
          className,
        )}
        plugins={streamdownPlugins}
        {...props}
      />
    );
  },
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.isAnimating === nextProps.isAnimating,
);

MessageResponse.displayName = 'MessageResponse';
