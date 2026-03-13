'use client';

import { MixedCanvasIcon } from '@/shared/constants/icons';

export function LoadingLogo() {
  return (
    <div className="relative flex items-center gap-2">
      <span
        className="text-4xl font-bold tracking-tight bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground loading-shimmer"
        style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
      >
        thinkix
      </span>
      <MixedCanvasIcon size={20} className="text-foreground loading-icon-pulse" />
    </div>
  );
}
