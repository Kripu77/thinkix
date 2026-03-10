/**
 * Type guard utilities for SVG DOM elements
 * Replaces unsafe `as` assertions with proper type checking
 */

export function isSVGElement(value: unknown): value is SVGElement {
  return value instanceof SVGElement;
}

export function isSVGRectElement(value: unknown): value is SVGRectElement {
  return value instanceof SVGRectElement;
}

export function isSVGPathElement(value: unknown): value is SVGPathElement {
  return value instanceof SVGPathElement;
}

export function isSVGLineElement(value: unknown): value is SVGLineElement {
  return value instanceof SVGLineElement;
}

export function isSVGTextElement(value: unknown): value is SVGTextElement {
  return value instanceof SVGTextElement;
}

export function isSVGSVGElement(value: unknown): value is SVGSVGElement {
  return value instanceof SVGSVGElement;
}

export function isSVGGraphicsElement(value: unknown): value is SVGGraphicsElement {
  return value instanceof SVGGraphicsElement;
}

export function isSVGForeignObjectElement(value: unknown): value is SVGForeignObjectElement {
  return value instanceof SVGForeignObjectElement;
}

export function isSVGGroupElement(value: unknown): value is SVGGElement {
  return value instanceof SVGGElement;
}

export function assertSVGElement(value: unknown, message = 'Expected SVGElement'): asserts value is SVGElement {
  if (!isSVGElement(value)) {
    throw new TypeError(message);
  }
}

export function assertSVGRectElement(value: unknown, message = 'Expected SVGRectElement'): asserts value is SVGRectElement {
  if (!isSVGRectElement(value)) {
    throw new TypeError(message);
  }
}

export function assertSVGPathElement(value: unknown, message = 'Expected SVGPathElement'): asserts value is SVGPathElement {
  if (!isSVGPathElement(value)) {
    throw new TypeError(message);
  }
}

export function assertSVGLineElement(value: unknown, message = 'Expected SVGLineElement'): asserts value is SVGLineElement {
  if (!isSVGLineElement(value)) {
    throw new TypeError(message);
  }
}

export function assertSVGTextElement(value: unknown, message = 'Expected SVGTextElement'): asserts value is SVGTextElement {
  if (!isSVGTextElement(value)) {
    throw new TypeError(message);
  }
}

export function assertSVGSVGElement(value: unknown, message = 'Expected SVGSVGElement'): asserts value is SVGSVGElement {
  if (!isSVGSVGElement(value)) {
    throw new TypeError(message);
  }
}

export function assertSVGGraphicsElement(value: unknown, message = 'Expected SVGGraphicsElement'): asserts value is SVGGraphicsElement {
  if (!isSVGGraphicsElement(value)) {
    throw new TypeError(message);
  }
}

export function assertSVGForeignObjectElement(value: unknown, message = 'Expected SVGForeignObjectElement'): asserts value is SVGForeignObjectElement {
  if (!isSVGForeignObjectElement(value)) {
    throw new TypeError(message);
  }
}

export function assertNode(value: unknown, message = 'Expected Node'): asserts value is Node {
  if (!(value instanceof Node)) {
    throw new TypeError(message);
  }
}

export function assertElement(value: unknown, message = 'Expected Element'): asserts value is Element {
  if (!(value instanceof Element)) {
    throw new TypeError(message);
  }
}
