'use client';

import { forwardRef, useEffect, type HTMLAttributes, type ReactNode } from 'react';
import { useFloating, flip, offset, type FloatingContext } from '@floating-ui/react';
import { cn } from '@thinkix/ui';

export interface FloatingToolbarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  open: boolean;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
  offset?: number;
  virtualElementRef?: React.MutableRefObject<HTMLElement | null>;
}

export const FloatingToolbar = forwardRef<HTMLDivElement, FloatingToolbarProps>(
  ({ open, children, placement = 'top', offset: offsetValue = 12, virtualElementRef, className, style, ...props }, ref) => {
    const { refs, floatingStyles } = useFloating({
      placement,
      middleware: [offset(offsetValue), flip()],
    });

    useEffect(() => {
      if (virtualElementRef?.current) {
        refs.setPositionReference(virtualElementRef.current);
      }
    }, [virtualElementRef, refs]);

    if (!open) return null;

    return (
      <div
        ref={(node) => {
          refs.setFloating(node);
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(
          'inline-flex items-center rounded-lg border bg-background/95 backdrop-blur shadow-lg',
          className
        )}
        style={{ ...floatingStyles, ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FloatingToolbar.displayName = 'FloatingToolbar';

export { useFloating, flip, offset };
export type { FloatingContext };
