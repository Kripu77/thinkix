import { PlaitBoard, PlaitElement, PlaitOperation } from '@plait/core';
import { MindElement } from '@plait/mind';
import { DEFAULT_MIND_FONT_SIZE } from '@thinkix/shared';

function isMindElement(element: PlaitElement): boolean {
  return (
    element.type === 'mind' ||
    element.type === 'mindmap' ||
    element.type === 'mind_child'
  );
}

function setFontSizeOnTopic(element: PlaitElement): void {
  const mindEl = element as MindElement;
  if (mindEl.data?.topic && typeof mindEl.data.topic === 'object') {
    const topic = mindEl.data.topic as {
      children: Array<{ text: string; fontSize?: number; 'font-size'?: number }>;
      type: string;
    };
    if (topic.children && Array.isArray(topic.children)) {
      topic.children = topic.children.map((child) => ({
        ...child,
        // Set both properties: 'fontSize' for Slate/Plait internal use,
        // 'font-size' for the text renderer (add-text-renderer.tsx)
        fontSize: DEFAULT_MIND_FONT_SIZE,
        'font-size': DEFAULT_MIND_FONT_SIZE,
      }));
    }
  }
}

function setFontSizeRecursive(element: PlaitElement): void {
  if (isMindElement(element)) {
    setFontSizeOnTopic(element);
    if (element.children && Array.isArray(element.children)) {
      element.children.forEach(setFontSizeRecursive);
    }
  }
}

export function withMindFontSize(board: PlaitBoard): PlaitBoard {
  const { apply } = board;

  board.apply = (operation: PlaitOperation) => {
    if (operation.type === 'insert_node') {
      const node = operation.node;
      setFontSizeRecursive(node);
    }
    apply(operation);
  };

  return board;
}
