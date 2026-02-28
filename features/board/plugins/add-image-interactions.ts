import {
  getElementOfFocusedImage,
  isResizing,
  type PlaitImageBoard,
} from '@plait/common';
import {
  ClipboardData,
  getHitElementByPoint,
  isDragging,
  isSelectionMoving,
  PlaitBoard,
  Point,
  toHostPoint,
  toViewBoxPoint,
  WritableClipboardOperationType,
} from '@plait/core';
import { isHitImage, MindElement, ImageData } from '@plait/mind';
import { DrawTransforms } from '@plait/draw';
import { MindTransforms } from '@plait/mind';
import { getSelectedElements } from '@plait/core';
import posthog from 'posthog-js';

export const STANDARD_IMAGE_WIDTH = 400;
export const MIND_IMAGE_WIDTH = 240;

export function isValidImageType(mime: string): boolean {
  return mime.startsWith('image/');
}

export async function readFileAsURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function loadBitmap(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function placeImage(
  board: PlaitBoard,
  file: File,
  atPoint?: Point,
  isDropped?: boolean
) {
  const selection = getSelectedElements(board);
  const target = selection[0];

  const maxWidth =
    target && MindElement.isMindElement(board, target)
      ? MIND_IMAGE_WIDTH
      : STANDARD_IMAGE_WIDTH;

  const url = await readFileAsURL(file);
  const bitmap = await loadBitmap(url);

  const width = bitmap.width > maxWidth ? maxWidth : bitmap.width;
  const height = (width / bitmap.width) * bitmap.height;

  const imageData = { url, width, height };

  const hitTarget = atPoint ? getHitElementByPoint(board, atPoint) : null;

  if (isDropped && hitTarget && MindElement.isMindElement(board, hitTarget)) {
    MindTransforms.setImage(board, hitTarget, imageData);
    posthog.capture('image_inserted', { 
      source: 'drop',
      target: 'mind_node',
      file_size: file.size,
      file_type: file.type,
      image_width: width,
      image_height: height,
    });
    return;
  }

  if (target && MindElement.isMindElement(board, target) && !isDropped) {
    MindTransforms.setImage(board, target, imageData);
    posthog.capture('image_inserted', { 
      source: 'paste',
      target: 'mind_node',
      file_size: file.size,
      file_type: file.type,
      image_width: width,
      image_height: height,
    });
  } else {
    DrawTransforms.insertImage(board, imageData, atPoint);
    posthog.capture('image_inserted', { 
      source: isDropped ? 'drop' : 'paste',
      target: 'canvas',
      file_size: file.size,
      file_type: file.type,
      image_width: width,
      image_height: height,
    });
  }
}

export function showFullscreenImage(url: string) {
  posthog.capture('image_viewed_fullscreen');
  
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/80';
  overlay.addEventListener('click', () => overlay.remove());

  const img = document.createElement('img');
  img.src = url;
  img.className = 'max-w-[90vw] max-h-[90vh] object-contain';
  img.addEventListener('click', (e) => e.stopPropagation());

  const close = document.createElement('button');
  close.className =
    'absolute top-4 right-4 text-white text-4xl hover:opacity-70 cursor-pointer';
  close.textContent = '×';
  close.addEventListener('click', () => overlay.remove());

  overlay.appendChild(img);
  overlay.appendChild(close);
  document.body.appendChild(overlay);

  const onEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      overlay.remove();
      window.removeEventListener('keydown', onEscape);
    }
  };
  window.addEventListener('keydown', onEscape);
}

export function addImageInteractions(board: PlaitBoard): PlaitBoard {
  const enhancedBoard = board as PlaitBoard & PlaitImageBoard;
  const { insertFragment, drop, pointerUp } = enhancedBoard;

  enhancedBoard.insertFragment = (
    clipboardData: ClipboardData | null,
    targetPoint: Point,
    operationType?: WritableClipboardOperationType
  ) => {
    if (
      clipboardData?.files?.length &&
      isValidImageType(clipboardData.files[0].type)
    ) {
      placeImage(board, clipboardData.files[0], targetPoint, false);
      return;
    }
    insertFragment(clipboardData, targetPoint, operationType);
  };

  enhancedBoard.drop = (event: DragEvent) => {
    if (event.dataTransfer?.files?.length) {
      const file = event.dataTransfer.files[0];
      if (isValidImageType(file.type)) {
        const point = toViewBoxPoint(
          board,
          toHostPoint(board, event.x, event.y)
        );
        placeImage(board, file, point, true);
        return true;
      }
    }
    return drop(event);
  };

  enhancedBoard.pointerUp = (event: PointerEvent) => {
    const focusedNode = getElementOfFocusedImage(board);
    if (
      focusedNode &&
      !isResizing(board) &&
      !isSelectionMoving(board) &&
      !isDragging(board)
    ) {
      const point = toViewBoxPoint(board, toHostPoint(board, event.x, event.y));
      const hitTarget = getHitElementByPoint(board, point);

      const isImageHit =
        hitTarget &&
        MindElement.isMindElement(board, hitTarget) &&
        MindElement.hasImage(hitTarget) &&
        isHitImage(board, hitTarget as MindElement<ImageData>, point);

      if (isImageHit && focusedNode === hitTarget) {
        showFullscreenImage(hitTarget.data.image.url);
      }
    }
    pointerUp(event);
  };

  return enhancedBoard;
}
