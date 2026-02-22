import type { ImageProps } from '@plait/common';
import { useEffect, useRef, useCallback } from 'react';

interface ImagePropsWithCallbacks extends ImageProps {
  onLoad?: () => void;
  onError?: () => void;
}

export function Image(props: ImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const { url } = props.imageItem;
  const rectangle = props.getRectangle();
  const callbacks = props as ImagePropsWithCallbacks;

  const handleLoad = useCallback(() => {
    callbacks.onLoad?.();
  }, [callbacks]);

  const handleError = useCallback(() => {
    callbacks.onError?.();
  }, [callbacks]);

  useEffect(() => {
    const image = ref.current;
    if (!image) return;

    if (image.complete) {
      handleLoad();
    } else {
      image.addEventListener('load', handleLoad);
      image.addEventListener('error', handleError);
    }

    return () => {
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', handleError);
    };
  }, [handleLoad, handleError]);

  return (
    <img
      ref={ref}
      src={url}
      alt=""
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: `${rectangle.width}px`,
        height: `${rectangle.height}px`,
        pointerEvents: 'none',
      }}
      draggable={false}
    />
  );
}
