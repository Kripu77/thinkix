'use client';

import { useState } from 'react';
import { Copy, Check, Users, Link2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@thinkix/ui';
import { Button } from '@thinkix/ui';
import { logger } from '@thinkix/collaboration';
import { THEME } from '@/shared/constants';

interface CollaborationStartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomUrl: string;
}

export function CollaborationStartDialog({
  open,
  onOpenChange,
  roomUrl,
}: CollaborationStartDialogProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleCopyLink = async () => {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Failed to copy to clipboard', error instanceof Error ? error : undefined);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Start collaborating
          </DialogTitle>
          <DialogDescription>
            Share this link with others to collaborate in real-time. Everyone with the link can edit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Collaboration link
            </label>
            <div className="flex items-center gap-2">
               <div className="flex-1 flex items-center gap-2 rounded-md border border-input bg-muted px-3 py-2 overflow-hidden">
                 <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                 <input
                   type="text"
                   readOnly
                   value={roomUrl}
                   aria-label="Collaboration link"
                   className="flex-1 text-sm text-foreground bg-transparent border-none outline-none cursor-text"
                   onClick={(e) => e.currentTarget.select()}
                 />
               </div>
              <Button
                type="button"
                size="sm"
                onClick={handleCopyLink}
                className="flex-shrink-0"
                variant={copyError ? 'destructive' : 'default'}
              >
                {copyError ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Failed
                  </>
                ) : copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            {copyError && (
              <p className="text-sm text-destructive">
                Could not copy to clipboard. Please select and copy the link manually.
              </p>
            )}
          </div>

          <div className={THEME.tip}>
            <p>
              <strong>Tip:</strong> Anyone with this link can view and edit the board in real-time. Share it via chat, email, or any messaging app.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => onOpenChange(false)}>
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
