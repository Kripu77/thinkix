'use client';

import type { ReactNode } from 'react';

interface BoardLayoutSlotsProps {
  topLeft?: ReactNode;
  bottomLeft?: ReactNode;
  topRight?: ReactNode;
}

export function BoardLayoutSlots({ 
  topLeft, 
  bottomLeft, 
  topRight 
}: BoardLayoutSlotsProps) {
  return (
    <>
      {(topLeft || bottomLeft || topRight) && (
        <>
          {topLeft && (
            <div 
              className="absolute z-[60] flex items-center gap-1.5 top-4 left-4 max-[1024px]:top-auto max-[1024px]:bottom-4 max-[1024px]:left-4" 
              data-no-autosave
            >
              {topLeft}
            </div>
          )}
          {bottomLeft && (
            <div className="absolute bottom-4 left-4 z-50 flex items-center gap-3 max-[1024px]:bottom-4 max-[1024px]:right-4 max-[1024px]:left-auto">
              {bottomLeft}
            </div>
          )}
          {topRight && (
            <div className="absolute top-4 right-4 z-[60]">
              {topRight}
            </div>
          )}
        </>
      )}
    </>
  );
}
