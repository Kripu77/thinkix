'use client';

export function LoadingLogo() {
  return (
    <div className="relative flex items-center gap-1">
      <span
        className="text-4xl font-bold tracking-tight bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground loading-shimmer"
        style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
      >
        thinkix
      </span>
      <svg
        width="20"
        height="20"
        viewBox="-10 -10 20 20"
        className="text-foreground animate-spin animation-duration-[4.5s]"
      >
        <polygon
          points="0,-10 3,-3 10,0 3,3 0,10 -3,3 -10,0 -3,-3"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
