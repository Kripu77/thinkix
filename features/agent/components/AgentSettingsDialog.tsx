'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
} from '@thinkix/ui';
import { PROVIDERS, type AIProvider, type ClientAIConfig } from '@thinkix/ai';

const STORAGE_KEY = 'thinkix-agent-settings';

export interface AgentSettings {
  provider?: AIProvider;
  apiKey: string;
  customModel?: string;
}

const DEFAULT_SETTINGS: AgentSettings = {
  apiKey: '',
  customModel: '',
};

export function loadAgentSettings(): AgentSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
  }
  return DEFAULT_SETTINGS;
}

export function saveAgentSettings(settings: AgentSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
  }
}

interface AgentSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSettings: AgentSettings;
  onSettingsChange: (settings: AgentSettings) => void;
  serverConfig?: ClientAIConfig | null;
}

function AgentSettingsForm({
  initialSettings,
  serverConfig,
  onCancel,
  onSave,
}: {
  initialSettings: AgentSettings;
  serverConfig?: ClientAIConfig | null;
  onCancel: () => void;
  onSave: (settings: AgentSettings) => void;
}) {
  const [settings, setSettings] = useState<AgentSettings>(initialSettings);
  const hasLocalApiKey = settings.apiKey.trim().length > 0;
  const availableServerProviders = serverConfig?.availableProviders ?? [];
  const selectedProvider =
    !hasLocalApiKey &&
    settings.provider &&
    !availableServerProviders.includes(settings.provider)
      ? undefined
      : settings.provider;
  const selectableProviders = hasLocalApiKey
    ? PROVIDERS
    : PROVIDERS.filter((provider) => availableServerProviders.includes(provider.id));
  const providerConfig = PROVIDERS.find((provider) => provider.id === selectedProvider);

  const handleSave = () => {
    onSave({
      ...settings,
      provider: hasLocalApiKey
        ? selectedProvider
        : selectedProvider && availableServerProviders.includes(selectedProvider)
          ? selectedProvider
          : undefined,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>AI Settings</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Provider</label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={selectedProvider ?? 'auto'}
            onChange={(event) => {
              const nextValue = event.target.value;
              setSettings({
                ...settings,
                provider: nextValue === 'auto' ? undefined : (nextValue as AIProvider),
              });
            }}
          >
            <option value="auto">Auto (Thinkix default)</option>
            {selectableProviders.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            {selectedProvider
              ? 'Uses this provider with your key unless you switch back to Auto.'
              : 'Uses the default AI setup when available.'}
          </p>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">API Key</label>
          <Input
            type="password"
            placeholder="sk-..."
            value={settings.apiKey}
            onChange={(event) => {
              setSettings({ ...settings, apiKey: event.target.value });
            }}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to use the default AI setup when available.
          </p>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">
            Custom Model <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Input
            type="text"
            placeholder={selectedProvider ? providerConfig?.defaultModel : 'Default model'}
            value={settings.customModel ?? ''}
            onChange={(event) => {
              setSettings({ ...settings, customModel: event.target.value });
            }}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to use the default model.
          </p>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </DialogFooter>
    </>
  );
}

export function AgentSettingsDialog({
  open,
  onOpenChange,
  initialSettings,
  onSettingsChange,
  serverConfig,
}: AgentSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        {open ? (
          <AgentSettingsForm
            initialSettings={initialSettings}
            serverConfig={serverConfig}
            onCancel={() => onOpenChange(false)}
            onSave={(settings) => {
              saveAgentSettings(settings);
              onSettingsChange(settings);
              onOpenChange(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
