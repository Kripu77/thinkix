import type { PlaitBoard } from '@plait/core';
import type { BoardBackground, GridThemeColors, ViewportBounds } from '../types';

export interface GridRenderer {
  readonly type: string;
  render(context: GridRenderContext): void;
  clear(): void;
  destroy(): void;
}

export interface GridRenderContext {
  board: PlaitBoard;
  container: SVGGElement;
  bounds: ViewportBounds;
  zoom: number;
  colors: GridThemeColors;
  config: BoardBackground;
}

export abstract class BaseGridRenderer implements GridRenderer {
  abstract readonly type: string;
  
  protected container: SVGGElement | null = null;
  protected gridGroup: SVGGElement | null = null;
  
  abstract render(context: GridRenderContext): void;
  
  clear(): void {
    if (this.gridGroup) {
      while (this.gridGroup.firstChild) {
        this.gridGroup.removeChild(this.gridGroup.firstChild);
      }
    }
  }
  
  destroy(): void {
    this.clear();
    if (this.gridGroup && this.gridGroup.parentNode) {
      this.gridGroup.parentNode.removeChild(this.gridGroup);
    }
    this.gridGroup = null;
    this.container = null;
  }
  
  protected ensureGridGroup(container: SVGGElement): SVGGElement {
    if (!this.gridGroup || this.container !== container) {
      this.container = container;
      this.gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.gridGroup.classList.add('grid-content');
      container.insertBefore(this.gridGroup, container.firstChild);
    }
    return this.gridGroup;
  }
  
  protected createLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    stroke: string,
    strokeWidth: number
  ): SVGLineElement {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', String(strokeWidth));
    return line;
  }
  
  protected createCircle(
    cx: number,
    cy: number,
    r: number,
    fill: string
  ): SVGCircleElement {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(cx));
    circle.setAttribute('cy', String(cy));
    circle.setAttribute('r', String(r));
    circle.setAttribute('fill', fill);
    return circle;
  }
  
  protected createPath(
    d: string,
    stroke: string,
    strokeWidth: number
  ): SVGPathElement {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', stroke);
    path.setAttribute('stroke-width', String(strokeWidth));
    path.setAttribute('fill', 'none');
    return path;
  }
}
