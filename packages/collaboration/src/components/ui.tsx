'use client';

import { useState, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';
import { Users, Link2, Check } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Tooltip, TooltipTrigger, TooltipContent } from '@thinkix/ui';

interface NicknameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onSave: (name: string) => void;
}

export function NicknameDialog({ open, onOpenChange, currentName, onSave }: NicknameDialogProps) {
  const [name, setName] = useState(currentName);

  const handleSave = useCallback(() => {
    const trimmedName = name.trim();
    if (trimmedName) {
      onSave(trimmedName);
      onOpenChange(false);
    }
  }, [name, onSave, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background/95 backdrop-blur">
        <DialogHeader>
          <DialogTitle>Set your nickname</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          Enter a name that others will see when collaborating.
        </p>
        <Input
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          placeholder="Enter your nickname"
          className="mb-4"
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
            handleSave();
          }
        }}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ShareButtonProps {
  roomId: string;
}

export function ShareButton({ roomId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const url = `${window.location.origin}?room=${roomId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomId]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-5 w-5 sm:h-auto sm:w-auto p-0 sm:px-2 sm:py-1"
        >
          {copied ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : <Link2 className="h-3 w-3 sm:h-4 sm:w-4" />}
          <span className="hidden sm:inline text-xs">Share</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? 'Copied!' : 'Copy share link'}</TooltipContent>
    </Tooltip>
  );
}

interface CollaborationPanelProps {
  roomId: string;
  onEnableCollaboration?: () => void;
  onDisableCollaboration?: () => void;
  isEnabled?: boolean;
}

export function CollaborationPanel({
  onEnableCollaboration,
  onDisableCollaboration,
  isEnabled = false,
}: CollaborationPanelProps) {
  if (!isEnabled) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onEnableCollaboration}
        className="flex items-center gap-1.5"
      >
        <Users className="h-4 w-4" />
        <span>Collaborate</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-background/95 backdrop-blur px-2 py-1 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
        Collaborating
      </div>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDisableCollaboration}
            className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
          >
            ×
          </Button>
        </TooltipTrigger>
        <TooltipContent>Leave collaboration</TooltipContent>
      </Tooltip>
    </div>
  );
}
