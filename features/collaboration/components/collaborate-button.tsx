'use client';

import { Button } from '@thinkix/ui';
import { Users } from 'lucide-react';

interface CollaborateButtonProps {
  onClick: () => void;
}

export function CollaborateButton({ onClick }: CollaborateButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="hidden lg:flex items-center gap-1.5"
    >
      <Users className="h-4 w-4" />
      <span>Collaborate</span>
    </Button>
  );
}
