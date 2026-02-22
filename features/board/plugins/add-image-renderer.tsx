import type {
  ImageProps,
  PlaitImageBoard,
  RenderComponentRef,
} from '@plait/common';
import { PlaitBoard } from '@plait/core';
import { createRoot } from 'react-dom/client';
import { Image } from './image-component';

export function addImageRenderer(board: PlaitBoard): PlaitBoard {
  const imageBoard = board as PlaitBoard & PlaitImageBoard;

  imageBoard.renderImage = (
    container: Element | DocumentFragment,
    props: ImageProps
  ) => {
    const root = createRoot(container);
    root.render(
      <Image {...props} />
    );

    let activeProps = { ...props };

    const ref: RenderComponentRef<ImageProps> = {
      destroy: () => {
        requestIdleCallback(() => {
          root.unmount();
        });
      },
      update: (updatedProps: Partial<ImageProps>) => {
        activeProps = { ...activeProps, ...updatedProps };
        root.render(
          <Image {...activeProps} />
        );
      },
    };

    return ref;
  };

  return imageBoard;
}
