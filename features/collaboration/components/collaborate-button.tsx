'use client';

import { Users } from 'lucide-react';
import { Button } from '@thinkix/ui';
import { cn } from '@thinkix/ui';
import { THEME } from '@/shared/constants';

interface CollaborateButtonProps {
  onClick: () => void;
}

export function CollaborateButton({ onClick }: CollaborateButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        THEME.button.secondary,
        THEME.surface.floating,
        'hidden lg:flex hover:bg-accent/85'
      )}
      data-testid="collaborate-button"
    >
      <Users className="h-4 w-4" />
      <span>Collaborate</span>
    </Button>
  );
}
