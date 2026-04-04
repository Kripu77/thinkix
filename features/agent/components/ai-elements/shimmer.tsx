'use client';

import { cn } from '@thinkix/ui';
import type { CSSProperties, ElementType, JSX } from 'react';
import { memo, useMemo } from 'react';

export interface TextShimmerProps {
  children: string;
  as?: ElementType;
  className?: string;
  duration?: number;
  spread?: number;
}

const ShimmerComponent = ({
  children,
  as: Component = 'p',
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) => {
  void duration;
  const Tag = Component as keyof JSX.IntrinsicElements;

  const dynamicSpread = useMemo(
    () => (children?.length ?? 0) * spread,
    [children, spread],
  );

  return (
    <Tag
      className={cn(
        'relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent',
        '[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),oklch(1_0_0),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]',
        'animate-pulse',
        className,
      )}
      style={
        {
          '--spread': `${dynamicSpread}px`,
          backgroundImage:
            'var(--bg), linear-gradient(oklch(0.554 0.046 257.417), oklch(0.554 0.046 257.417))',
        } as CSSProperties
      }
    >
      {children}
    </Tag>
  );
};

export const Shimmer = memo(ShimmerComponent);
