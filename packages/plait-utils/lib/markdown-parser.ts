import { createMindElement } from '@plait/mind';
import { MindLayoutType } from '@plait/layouts';
import type { MindElement, BaseData } from '@plait/mind';

interface MdNode {
  type: 'root' | 'heading' | 'list' | 'listItem' | 'paragraph' | 'text';
  depth?: number;
  value?: string;
  children?: MdNode[];
}

function parseMarkdownToAst(markdown: string): MdNode {
  const lines = markdown.split('\n');
  const rootChildren: MdNode[] = [];
  let rootList: MdNode | null = null;
  const listStack: { list: MdNode; indent: number }[] = [];

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (!trimmed) continue;

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      listStack.length = 0;
      rootList = null;
      rootChildren.push({
        type: 'heading',
        depth: headingMatch[1].length,
        children: [
          { type: 'paragraph', children: [{ type: 'text', value: headingMatch[2].trim() }] },
        ],
      });
      continue;
    }

    const listMatch = trimmed.match(/^(\s*)[-*+]\s+(.+)$/);
    if (listMatch) {
      const indent = listMatch[1].length;
      const text = listMatch[2].trim();

      const listItem: MdNode = {
        type: 'listItem',
        children: [
          { type: 'paragraph', children: [{ type: 'text', value: text }] },
        ],
      };

      // Pop items with >= indent
      while (listStack.length > 0 && listStack[listStack.length - 1].indent >= indent) {
        listStack.pop();
      }

      if (indent === 0 || listStack.length === 0) {
        if (!rootList) {
          rootList = { type: 'list', children: [] };
          rootChildren.push(rootList);
        }
        rootList.children = rootList.children ?? [];
        rootList.children.push(listItem);
        listStack.push({ list: rootList, indent: 0 });
      } else {
        const parentList = listStack[listStack.length - 1].list;
        const lastParentItem = parentList.children?.[parentList.children.length - 1];

        if (!lastParentItem) continue;

        lastParentItem.children = lastParentItem.children ?? [];
        let nestedList = lastParentItem.children.find((c) => c.type === 'list') as MdNode | undefined;
        if (!nestedList) {
          nestedList = { type: 'list', children: [] };
          lastParentItem.children.push(nestedList);
        }
        nestedList.children = nestedList.children ?? [];
        nestedList.children.push(listItem);

        listStack.push({ list: nestedList, indent });
      }
    }
  }

  return { type: 'root', children: rootChildren };
}

function getTextFromNode(node: MdNode): string {
  if (node.type === 'text' && node.value !== undefined) {
    return node.value;
  }
  if (!node.children?.length) return '';
  return node.children.map(getTextFromNode).join('');
}

function getListItemText(listItem: MdNode): string {
  const paragraph = listItem.children?.find((c) => c.type === 'paragraph');
  if (!paragraph) return '';
  return getTextFromNode(paragraph);
}

function getParentMindNode(
  depth: number,
  parentNodeMap: Record<string, MindElement<BaseData>>
): MindElement<BaseData> {
  for (let i = depth - 1; i >= 0; i--) {
    if (parentNodeMap[`${i}`]) {
      return parentNodeMap[`${i}`];
    }
  }
  return parentNodeMap['0'];
}

export function parseMarkdownToMindElement(markdown: string): MindElement | null {
  const root = parseMarkdownToAst(markdown);
  
  if (!root.children?.length) return null;

  const firstHeading = root.children.find((n) => n.type === 'heading');
  const hasTopTopic =
    firstHeading &&
    root.children.filter(
      (n) => n.type === 'heading' && n.depth === firstHeading.depth
    ).length === 1;

  const centerTopic = hasTopTopic && firstHeading ? getTextFromNode(firstHeading) : 'Mind Map';
  const mind = createMindElement(centerTopic, { layout: MindLayoutType.right }) as MindElement;
  mind.isRoot = true;
  (mind as unknown as Record<string, unknown>).type = 'mindmap';

  const parentNodeMap: Record<string, MindElement<BaseData>> = { '0': mind };
  let currentParent: MindElement<BaseData> = mind;

  const transform = (node: MdNode): void => {
    if (hasTopTopic && node === firstHeading) {
      return;
    }

    if (node.type === 'heading') {
      const depth = node.depth!;
      const parentMindNode = getParentMindNode(depth, parentNodeMap);
      const text = getTextFromNode(node);
      if (!text) return;

      const element = createMindElement(text, {}) as MindElement;
      parentMindNode.children = parentMindNode.children ?? [];
      parentMindNode.children.push(element);
      parentNodeMap[`${depth}`] = element;
      currentParent = element;
    } else if (node.type === 'list') {
      node.children?.forEach(transform);
    } else if (node.type === 'listItem') {
      const text = getListItemText(node);
      if (!text) return;

      const element = createMindElement(text, {}) as MindElement;
      currentParent.children = currentParent.children ?? [];
      currentParent.children.push(element);

      const nestedList = node.children?.find((c) => c.type === 'list');
      if (nestedList) {
        const savedParent = currentParent;
        currentParent = element;
        transform(nestedList);
        currentParent = savedParent;
      }
    }
  };

  root.children.forEach(transform);

  return mind;
}
