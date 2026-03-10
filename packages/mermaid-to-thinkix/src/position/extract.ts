import type { MermaidGeometry } from '../types';
import { getTransformAttr, generateId } from '../utils';

export interface GeometryResult extends MermaidGeometry {
  transformX: number;
  transformY: number;
}

export function extractGeometry(element: Element, container: Element): GeometryResult {
  if (!element) {
    throw new Error('extractGeometry: element is null');
  }

  const bbox = (element as SVGGraphicsElement).getBBox();

  if (!isFinite(bbox.x) || !isFinite(bbox.y) ||
      !isFinite(bbox.width) || !isFinite(bbox.height)) {
    console.warn('[extractGeometry] Invalid bbox for element:', {
      tagName: element.tagName,
      id: element.id,
      bbox
    });
  }

  const { transformX, transformY } = getTransformElementPosition(element, container);

  if (!isFinite(transformX) || !isFinite(transformY)) {
    console.warn('[extractGeometry] Invalid computed position for element:', {
      tagName: element.tagName,
      id: element.id,
      transformX,
      transformY
    });
  }

  return {
    x: transformX,
    y: transformY,
    width: bbox.width,
    height: bbox.height,
    transformX,
    transformY,
  };
}

export function getTransformElementPosition(
  element: Element,
  container: Element
): { transformX: number; transformY: number } {
  let root = element.parentElement?.parentElement;

  const childElement = element.childNodes[0] as SVGElement | null;
  let childPosition = { x: 0, y: 0 };

  if (childElement) {
    const { transformX, transformY } = getTransformAttr(childElement);
    const boundingBox = (childElement as SVGGraphicsElement).getBBox();

    childPosition = {
      x: Number(childElement.getAttribute('x')) || transformX + boundingBox.x || 0,
      y: Number(childElement.getAttribute('y')) || transformY + boundingBox.y || 0,
    };
  }

  const { transformX, transformY } = getTransformAttr(element as SVGElement);
  const position = {
    x: transformX + childPosition.x,
    y: transformY + childPosition.y,
  };

  while (root && root.id !== container.id) {
    if (root.classList.value === 'root' && root.hasAttribute('transform')) {
      const { transformX: rootX, transformY: rootY } = getTransformAttr(root as unknown as SVGElement);
      position.x += rootX;
      position.y += rootY;
    }
    root = root.parentElement;
  }

  return { transformX: position.x, transformY: position.y };
}

export function createHiddenContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.id = generateId('mermaid-container');
  container.setAttribute(
    'style',
    'position: absolute; visibility: hidden; pointer-events: none; z-index: -1;'
  );
  return container;
}

export function injectSvg(svg: string): { container: HTMLDivElement; cleanup: () => void } {
  const container = createHiddenContainer();
  container.innerHTML = svg;
  document.body.appendChild(container);

  const cleanup = () => {
    container.remove();
  };

  return { container, cleanup };
}

export function findElementById(
  container: Element,
  id: string,
  prefix: string = 'flowchart-'
): Element | null {
  const selector = `[id*="${prefix}${id}-"]`;
  return container.querySelector(selector);
}

export function findEdgeElements(
  container: Element,
  startId: string,
  endId: string,
  maxEdges: number = 10
): SVGPathElement[] {
  const edges: SVGPathElement[] = [];

  for (let i = 0; i < maxEdges; i++) {
    const selector = `[id*="L-${startId}-${endId}-${i}"]`;
    const element = container.querySelector(selector);
    if (element && element.tagName === 'path') {
      edges.push(element as SVGPathElement);
    } else {
      break;
    }
  }

  return edges;
}

export function extractTextContent(element: Element): string {
  if (element.tagName === 'text' || element.tagName === 'tspan') {
    return element.textContent || '';
  }

  const textSpans = element.querySelectorAll('.label, .nodeLabel, tspan');
  const texts: string[] = [];

  for (const span of Array.from(textSpans)) {
    const text = span.textContent?.trim();
    if (text) {
      texts.push(text);
    }
  }

  return texts.join(' ');
}

export function extractInlineStyles(
  element: Element
): Record<string, string> {
  const styles: Record<string, string> = {};

  if (!(element instanceof HTMLElement || element instanceof SVGElement)) {
    return styles;
  }

  const styleAttr = element.getAttribute('style');
  if (!styleAttr) return styles;

  styleAttr.split(';').forEach((declaration) => {
    const trimmed = declaration.trim();
    if (!trimmed) return;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) return;

    const property = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();
    styles[property] = value;
  });

  return styles;
}

export function getRelativeBounds(
  element: Element,
  container: Element
): { x: number; y: number; width: number; height: number } {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  return {
    x: elementRect.left - containerRect.left,
    y: elementRect.top - containerRect.top,
    width: elementRect.width,
    height: elementRect.height,
  };
}

export function isElementVisible(element: Element): boolean {
  const bbox = (element as SVGGraphicsElement).getBBox();
  return bbox.width > 0 && bbox.height > 0;
}

export function getAllTextElements(container: Element): Element[] {
  return Array.from(container.querySelectorAll('text, .label, .nodeLabel'));
}
  
export interface ClassDefinition {
  id: string;
  styles: string[];
  textStyles: string[];
}

export function parseClassDefinitions(
  diagram: { parser?: { yy?: { getClasses?: () => Record<string, {
    styles?: string[];
    textStyles?: string[];
  }> } } }
): Record<string, ClassDefinition> {
  const classes: Record<string, ClassDefinition> = {};

  const classData = diagram.parser?.yy?.getClasses?.();
  if (!classData) return classes;

  for (const [id, def] of Object.entries(classData)) {
    classes[id] = {
      id,
      styles: def.styles || [],
      textStyles: def.textStyles || [],
    };
  }

  return classes;
}
