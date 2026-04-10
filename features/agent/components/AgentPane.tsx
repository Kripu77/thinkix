'use client';

import { Button } from '@thinkix/ui';
import { cn } from '@/lib/utils';
import type {
  DynamicToolUIPart,
  ReasoningUIPart,
  ToolUIPart,
  UIMessage,
} from 'ai';
import {
  RotateCcwIcon,
  SettingsIcon,
  SparklesIcon,
  XIcon,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import {
  PROVIDERS,
  getDefaultModel,
  type AIProvider,
  type ClientAIConfig,
} from '@thinkix/ai';
import { THEME } from '@/shared/constants';
import {
  AgentSettingsDialog,
  loadAgentSettings,
  saveAgentSettings,
  type AgentSettings,
} from './AgentSettingsDialog';
import { AgentToolRenderer } from './AgentToolRenderer';
import { AnthropicIcon, OpenAIIcon } from './provider-icons';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from './ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from './ai-elements/message';
import {
  PromptInput,
  PromptInputBody,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from './ai-elements/prompt-input';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from './ai-elements/reasoning';
import { Shimmer } from './ai-elements/shimmer';
import { useAgentChat } from '../hooks/use-agent-chat';

interface AgentPaneProps {
  open: boolean;
  onClose: () => void;
  width?: number;
  onWidthChange?: (width: number) => void;
}

function isToolPart(
  part: UIMessage['parts'][number],
): part is ToolUIPart | DynamicToolUIPart {
  return part.type.startsWith('tool-') || part.type === 'dynamic-tool';
}

function isReasoningPart(
  part: UIMessage['parts'][number],
): part is ReasoningUIPart {
  return part.type === 'reasoning';
}

const MIN_WIDTH = 320;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 384;

const DEFAULT_SUGGESTIONS = [
  {
    id: 'research-trends',
    icon: '🌍',
    label: 'Research tech trends',
    description: 'Search web and create a trend map',
    prompt:
      'Search the web for the top 5 technology trends in 2026. Think through which ones are most impactful, then create a visual map showing each trend, why it matters, and how they relate to each other.',
  },
  {
    id: 'system-design',
    icon: '🏗️',
    label: 'Design Uber architecture',
    description: 'Full system design from scratch',
    prompt:
      'Design the complete system architecture for a ride-sharing app like Uber. Think through all the components: user apps, driver apps, matching algorithm, real-time tracking, payments, notifications, and backend services. Create a comprehensive system diagram showing how all pieces connect, data flows, and key technical decisions. Include considerations for scale, reliability, and real-time requirements.',
  },
  {
    id: 'decision-flowchart',
    icon: '⚖️',
    label: 'Rent vs buy decision',
    description: 'Flowchart with decision nodes',
    prompt:
      'Create a decision flowchart to help me choose between renting vs buying a home. Research current market conditions, then build a flow diagram with decision nodes for finances, lifestyle, location, and timeline.',
  },
  {
    id: 'process-flow',
    icon: '🔄',
    label: 'Product launch flow',
    description: 'Step-by-step process diagram',
    prompt:
      'Design a step-by-step flow chart for launching a new product. Include research, development, testing, marketing, and launch phases with decision points and parallel processes.',
  },
  {
    id: 'problem-tree',
    icon: '🧩',
    label: 'Remote work burnout',
    description: 'Cause-and-effect analysis',
    prompt:
      'Analyze why remote work can lead to burnout. Search for recent research, think through root causes, and create a cause-and-effect diagram showing primary and contributing factors.',
  },
];

function ProviderGlyph({
  provider,
  className,
}: {
  provider: AIProvider;
  className?: string;
}) {
  if (provider === 'openai') {
    return <OpenAIIcon className={className} />;
  }

  if (provider === 'anthropic') {
    return <AnthropicIcon className={className} />;
  }

  return null;
}

function AgentStreamingIndicator() {
  return (
    <div className="rounded-full border border-border/70 bg-gradient-to-r from-background via-muted/25 to-background px-3 py-2 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/25" />
          <span className="relative inline-flex size-2.5 rounded-full bg-primary/70" />
        </span>
        <Shimmer className="text-xs font-medium text-muted-foreground" duration={1.6}>
          Thinking through the canvas
        </Shimmer>
      </div>
    </div>
  );
}

export function AgentPane({
  open,
  onClose,
  width = DEFAULT_WIDTH,
  onWidthChange,
}: AgentPaneProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [settings, setSettings] = useState<AgentSettings>(() => loadAgentSettings());
  const [serverConfig, setServerConfig] = useState<ClientAIConfig | null>(null);
  const [isCheckingServerConfig, setIsCheckingServerConfig] = useState(false);

  const hasLocalApiKey = settings.apiKey.trim().length > 0;
  const hasServerApiKey = serverConfig?.hasDefaultApiKey ?? false;
  const serverAvailableProviders = useMemo(
    () => serverConfig?.availableProviders ?? [],
    [serverConfig],
  );
  const normalizedProviderSetting =
    !hasLocalApiKey &&
    settings.provider &&
    !serverAvailableProviders.includes(settings.provider)
      ? undefined
      : settings.provider;
  const providerOptions = hasLocalApiKey
    ? PROVIDERS
    : PROVIDERS.filter((provider) => serverAvailableProviders.includes(provider.id));
  const selectedProvider =
    normalizedProviderSetting ??
    serverConfig?.provider ??
    providerOptions[0]?.id ??
    PROVIDERS[0].id;
  const canUseAgent =
    hasLocalApiKey ||
    (normalizedProviderSetting
      ? serverAvailableProviders.includes(normalizedProviderSetting)
      : hasServerApiKey);
  const isUsingServerDefault = !hasLocalApiKey && normalizedProviderSetting == null;
  const effectiveModel =
    settings.customModel?.trim() ||
    (isUsingServerDefault ? 'Default model' : getDefaultModel(selectedProvider));
  const providerConfig =
    PROVIDERS.find((provider) => provider.id === selectedProvider) ?? PROVIDERS[0];
  const requestedProvider = hasLocalApiKey
    ? normalizedProviderSetting ?? selectedProvider
    : normalizedProviderSetting;

  const loadServerConfig = useCallback(async (): Promise<ClientAIConfig | null> => {
    setIsCheckingServerConfig(true);
    try {
      const response = await fetch('/api/agent/config', { cache: 'no-store' });
      if (!response.ok) {
        setServerConfig(null);
        return null;
      }

      const config = (await response.json()) as ClientAIConfig;
      setServerConfig(config);
      return config;
    } catch {
      setServerConfig(null);
      return null;
    } finally {
      setIsCheckingServerConfig(false);
    }
  }, []);

  useEffect(() => {
    void loadServerConfig();
  }, [loadServerConfig]);

  const persistSettings = useCallback((nextSettings: AgentSettings) => {
    saveAgentSettings(nextSettings);
    setSettings(nextSettings);
  }, []);

  useEffect(() => {
    if (
      !hasLocalApiKey &&
      settings.provider &&
      serverAvailableProviders.length > 0 &&
      !serverAvailableProviders.includes(settings.provider)
    ) {
      persistSettings({ ...settings, provider: undefined });
    }
  }, [
    hasLocalApiKey,
    persistSettings,
    serverAvailableProviders,
    settings,
  ]);

  const handleAgentError = useCallback(
    (error: Error) => {
      if (/No AI key|No API key provided|Agent Settings/i.test(error.message)) {
        void loadServerConfig();
        setSettingsOpen(true);
      }
    },
    [loadServerConfig],
  );

  const { messages, sendMessage, status, stop, resetChat } = useAgentChat({
    provider: requestedProvider,
    model: settings.customModel?.trim() || undefined,
    apiKey: settings.apiKey.trim() || undefined,
    onError: handleAgentError,
  });

  const isGenerating = status === 'submitted' || status === 'streaming';

  const handleMouseDown = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsResizing(true);
  }, []);

  const submitPrompt = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text) return false;

      if (!hasLocalApiKey && !serverConfig && !isCheckingServerConfig) {
        void loadServerConfig();
      }

      await sendMessage({ text, files: [] });
      return true;
    },
    [hasLocalApiKey, isCheckingServerConfig, loadServerConfig, sendMessage, serverConfig],
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (event: MouseEvent) => {
      const newWidth = window.innerWidth - event.clientX;
      const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
      onWidthChange?.(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  return (
    <>
      <div
        className={cn(
          'fixed right-0 top-0 z-40 flex h-full flex-col border-l transition-transform duration-300 ease-in-out',
          THEME.surface.panel,
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        data-testid="agent-pane"
        style={{ width: `${width}px` }}
      >
        <div
          className={cn(
            'absolute bottom-0 left-0 top-0 z-10 flex w-4 cursor-ew-resize items-center justify-center',
          )}
          onMouseDown={handleMouseDown}
        >
          <div
            className={cn(
              'h-12 w-1 rounded-full bg-border transition-colors hover:bg-primary/50',
              isResizing && 'bg-primary',
            )}
          />
        </div>

        <div className="flex shrink-0 items-center justify-between border-b border-border/80 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <SparklesIcon className="size-4 text-primary" />
              <span className="text-sm font-semibold tracking-tight">Thinkix</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{providerConfig.name}</span>
              <span>&middot;</span>
              <span className="truncate">{effectiveModel}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              aria-label="Settings"
              onClick={() => setSettingsOpen(true)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <SettingsIcon className="size-4" />
            </Button>
            <Button
              aria-label="Reset chat"
              onClick={resetChat}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <RotateCcwIcon className="size-4" />
            </Button>
            <Button
              aria-label="Close"
              onClick={onClose}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        <Conversation className="min-h-0 flex-1">
          <ConversationContent data-testid="agent-message-list">
            {messages.length === 0 ? (
              <ConversationEmptyState>
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                    <SparklesIcon className="size-5 text-primary" />
                  </div>
                  <div className="max-w-[280px] space-y-1.5">
                    <h3 className="text-sm font-semibold tracking-tight">Thinkix</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Your visual thinking partner. Describe an idea and we will turn it into a clear diagram together.
                    </p>
                    {!canUseAgent ? (
                      <p className="text-xs text-muted-foreground">
                        {isCheckingServerConfig
                          ? 'Checking AI defaults...'
                          : 'Add an API key or enable AI defaults.'}
                      </p>
                    ) : hasServerApiKey && !hasLocalApiKey ? (
                      <p className="text-xs text-muted-foreground">
                        Using Thinkix AI defaults.
                      </p>
                    ) : null}
                  </div>
                </div>
              </ConversationEmptyState>
            ) : null}

            {messages.map((message, messageIndex) => {
              const isLastAssistant =
                message.role === 'assistant' &&
                messageIndex === messages.length - 1;
              const hasTextPart = message.parts.some((part) => part.type === 'text');
              const hasVisibleNonTextPart = message.parts.some(
                (part) => isReasoningPart(part) || isToolPart(part),
              );

              return (
                <Message from={message.role} key={`${message.id}-${messageIndex}`}>
                  {message.parts.map((part, partIndex) => {
                    if (part.type === 'text') {
                      return (
                        <MessageContent key={`${message.id}-text-${partIndex}`}>
                          <MessageResponse isAnimating={isLastAssistant && isGenerating}>
                            {part.text}
                          </MessageResponse>
                        </MessageContent>
                      );
                    }

                    if (isReasoningPart(part)) {
                      return (
                        <Reasoning
                          className="mb-2 w-full not-prose"
                          isStreaming={part.state === 'streaming'}
                          key={`${message.id}-reasoning-${partIndex}`}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    }

                    if (isToolPart(part)) {
                      return (
                        <div
                          className="mb-1 mt-2 w-full"
                          data-testid="agent-tool-row"
                          key={`${message.id}-tool-${partIndex}`}
                        >
                          <AgentToolRenderer part={part} />
                        </div>
                      );
                    }

                    return null;
                  })}

                  {message.role === 'assistant' &&
                  isLastAssistant &&
                  isGenerating &&
                  !hasTextPart &&
                  !hasVisibleNonTextPart ? (
                    <AgentStreamingIndicator />
                  ) : null}
                </Message>
              );
            })}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="shrink-0 space-y-3 border-t border-border/80 bg-card/80 p-4">
          {messages.length === 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {DEFAULT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.id}
                  className={cn(
                    'group flex shrink-0 flex-col gap-1 rounded-xl px-4 py-3 text-left transition-all duration-200 active:scale-[0.98]',
                    THEME.surface.subtle,
                    'hover:bg-accent/70 hover:shadow-sm',
                  )}
                  onClick={() => submitPrompt(suggestion.prompt)}
                  type="button"
                >
                  <span className="flex items-center gap-2 text-[13px] font-medium text-foreground/90 group-hover:text-foreground">
                    <span className="text-base">{suggestion.icon}</span>
                    {suggestion.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground/80 group-hover:text-muted-foreground">
                    {suggestion.description}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          <PromptInput
            data-testid="agent-prompt-form"
            onSubmit={async ({ text }) => {
              return submitPrompt(text);
            }}
          >
            <div
              className={cn(
                'overflow-hidden rounded-xl shadow-xs',
                THEME.surface.input,
              )}
              data-testid="agent-prompt-shell"
            >
              <PromptInputBody className="block p-0">
                <PromptInputTextarea
                  aria-label="Agent prompt"
                  className="min-h-[92px]"
                  data-testid="agent-prompt-textarea"
                  placeholder="Ask Thinkix to inspect, research, or build on the canvas..."
                  rows={4}
                />
              </PromptInputBody>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/80 px-3 py-2">
                <PromptInputTools>
                  <PromptInputSelect
                    onValueChange={(value) => {
                      persistSettings({
                        ...settings,
                        provider: value === 'auto' ? undefined : (value as AIProvider),
                      });
                    }}
                    value={normalizedProviderSetting ?? 'auto'}
                  >
                    <PromptInputSelectTrigger
                      className={cn(
                        'h-8 w-auto min-w-[132px] gap-2 px-2.5 text-left text-xs shadow-none',
                        THEME.surface.input,
                      )}
                      data-testid="agent-provider-select-trigger"
                    >
                      <div className="flex min-w-0 items-center gap-1.5">
                        <ProviderGlyph
                          className="size-3.5 shrink-0 text-muted-foreground"
                          provider={selectedProvider}
                        />
                        <span className="truncate">{providerConfig.name}</span>
                      </div>
                    </PromptInputSelectTrigger>
                    <PromptInputSelectContent
                      align="start"
                      className={THEME.dropdown.content}
                      side="top"
                    >
                      <PromptInputSelectItem data-testid="agent-provider-option-auto" value="auto">
                        <span className="flex items-center gap-1.5">
                          Auto
                        </span>
                      </PromptInputSelectItem>
                      {providerOptions.map((provider) => (
                        <PromptInputSelectItem
                          data-testid={`agent-provider-option-${provider.id}`}
                          key={provider.id}
                          value={provider.id}
                        >
                          <span className="flex items-center gap-1.5">
                            <ProviderGlyph
                              className="size-3.5 shrink-0 text-muted-foreground"
                              provider={provider.id}
                            />
                            {provider.name}
                          </span>
                        </PromptInputSelectItem>
                      ))}
                    </PromptInputSelectContent>
                  </PromptInputSelect>
                  <span className="truncate text-xs text-muted-foreground">
                    {effectiveModel}
                  </span>
                </PromptInputTools>
                <PromptInputSubmit
                  onStop={stop}
                  sendTestId="agent-send-button"
                  status={status}
                  stopTestId="agent-stop-button"
                />
              </div>
            </div>
          </PromptInput>
        </div>
      </div>

      <AgentSettingsDialog
        initialSettings={settings}
        onOpenChange={setSettingsOpen}
        onSettingsChange={persistSettings}
        open={settingsOpen}
        serverConfig={serverConfig}
      />
    </>
  );
}

export { MIN_WIDTH, MAX_WIDTH, DEFAULT_WIDTH };
