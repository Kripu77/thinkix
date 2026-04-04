import type { DslNode, CompileResult, ShapeNode, StickyNode, TextNode, ConnectNode, MindmapNode, MermaidNode, PatchNode, LayoutNode, ShapeType } from './types';
import { createGeometryElement, BasicShapes, GeometryShapes } from '@plait/draw';
import { idCreator } from '@plait/core';
import {
  createStickyNoteElement,
  estimateStickySize,
  isStickyColorName,
} from '@/features/board/utils';
import {
  DEFAULT_STICKY_COLOR,
  STICKY_COLORS,
  type StickyColorName,
} from '@/shared/constants';

const SHAPE_MAP: Record<ShapeType, GeometryShapes> = {
  rect: BasicShapes.rectangle,
  ellipse: BasicShapes.ellipse,
  diamond: BasicShapes.diamond,
  roundRect: BasicShapes.roundRectangle,
  cloud: BasicShapes.cloud,
  star: BasicShapes.star,
  triangle: BasicShapes.triangle,
  parallelogram: BasicShapes.parallelogram,
  hexagon: BasicShapes.hexagon,
};

function compileShape(node: ShapeNode): unknown {
  const shape = SHAPE_MAP[node.shape] || BasicShapes.rectangle;
  
  const points: [[number, number], [number, number]] = [
    [0, 0],
    [100, 100],
  ];
  
  const text = { children: [{ text: node.text }], autoSize: true };
  
  const element = createGeometryElement(shape, points, text);
  element.id = node.id || idCreator();
  
  return element;
}

function compileSticky(node: StickyNode): unknown {
  const estimated = estimateStickySize(node.text);
  const points: [[number, number], [number, number]] = [
    [0, 0],
    [estimated.width, estimated.height],
  ];

  const color: StickyColorName =
    node.color && isStickyColorName(node.color)
      ? node.color
      : DEFAULT_STICKY_COLOR;

  const element = createStickyNoteElement({
    points,
    text: node.text,
    color,
    id: node.id || idCreator(),
  });

  return element;
}

function compileText(node: TextNode): unknown {
  const points: [[number, number], [number, number]] = [
    [0, 0],
    [200, 50],
  ];
  
  const text = { children: [{ text: node.text }], autoSize: true };
  
  const element = createGeometryElement(BasicShapes.text, points, text);
  element.id = node.id || idCreator();
  
  return element;
}

export function compileDSL(statements: DslNode[]): CompileResult {
  const result: CompileResult = {
    elements: [],
    connects: [],
    mindmaps: [],
    mermaids: [],
    patches: [],
  };
  
  for (const node of statements) {
    switch (node.type) {
      case 'shape':
        result.elements.push(compileShape(node as ShapeNode));
        break;
      case 'sticky':
        result.elements.push(compileSticky(node as StickyNode));
        break;
      case 'text':
        result.elements.push(compileText(node as TextNode));
        break;
      case 'connect':
        result.connects.push(node as ConnectNode);
        break;
      case 'mindmap':
        result.mindmaps.push(node as MindmapNode);
        break;
      case 'mermaid':
        result.mermaids.push(node as MermaidNode);
        break;
      case 'patch':
        result.patches.push({
          id: (node as PatchNode).id,
          props: (node as PatchNode).props,
        });
        break;
      case 'layout':
        const layoutNode = node as LayoutNode;
        if (layoutNode.mode === 'near') {
          result.layout = { near: layoutNode.nearId || '' };
        } else {
          result.layout = layoutNode.mode;
        }
        break;
    }
  }
  
  return result;
}

export { SHAPE_MAP, STICKY_COLORS };
