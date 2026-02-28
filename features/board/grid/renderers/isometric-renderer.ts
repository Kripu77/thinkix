import { BaseGridRenderer, type GridRenderContext } from './base-renderer';
import { getMinorGridOpacity, getMajorGridOpacity } from '../utils/visibility';
import { rgba } from '../utils/theme-colors';
import { getIsometricPoints } from '../utils/isometric';
import { GRID_LINE_WIDTH_BASE, GRID_MAJOR_LINE_WIDTH_BASE } from '../constants';
import type { GridDensity } from '../types';

export class IsometricGridRenderer extends BaseGridRenderer {
  readonly type = 'isometric';
  
  render(context: GridRenderContext): void {
    const { container, bounds, zoom, colors, config } = context;
    const gridGroup = this.ensureGridGroup(container);
    this.clear();
    
    const minorOpacity = getMinorGridOpacity(zoom);
    const majorOpacity = config.showMajor ? getMajorGridOpacity(zoom) : 0;
    
    if (minorOpacity <= 0 && majorOpacity <= 0) {
      return;
    }
    
    const spacing = this.getEffectiveSpacing(config.density);
    const { leftDiagonals, rightDiagonals } = getIsometricPoints(
      bounds.minX,
      bounds.maxX,
      bounds.minY,
      bounds.maxY,
      spacing
    );
    
    const minorLineWidth = Math.max(0.25, GRID_LINE_WIDTH_BASE / zoom);
    const majorLineWidth = Math.max(0.5, GRID_MAJOR_LINE_WIDTH_BASE / zoom);
    
    const fragment = document.createDocumentFragment();
    
    const minorColor = rgba(colors.primary, minorOpacity);
    const majorColor = rgba(colors.major, majorOpacity);
    
    const majorSpacing = spacing * 5;
    
    for (const line of leftDiagonals) {
      const isMajor = config.showMajor && this.isMajorLine(line.start.x, line.end.x, majorSpacing);
      const color = isMajor ? majorColor : minorColor;
      const width = isMajor ? majorLineWidth : minorLineWidth;
      
      if (!isMajor && minorOpacity <= 0) continue;
      if (isMajor && majorOpacity <= 0) continue;
      
      const path = this.createLine(
        line.start.x,
        line.start.y,
        line.end.x,
        line.end.y,
        color,
        width
      );
      fragment.appendChild(path);
    }
    
    for (const line of rightDiagonals) {
      const isMajor = config.showMajor && this.isMajorLine(line.start.x, line.end.x, majorSpacing);
      const color = isMajor ? majorColor : minorColor;
      const width = isMajor ? majorLineWidth : minorLineWidth;
      
      if (!isMajor && minorOpacity <= 0) continue;
      if (isMajor && majorOpacity <= 0) continue;
      
      const path = this.createLine(
        line.start.x,
        line.start.y,
        line.end.x,
        line.end.y,
        color,
        width
      );
      fragment.appendChild(path);
    }
    
    gridGroup.appendChild(fragment);
  }
  
  private getEffectiveSpacing(density: GridDensity): number {
    return density * 1.5;
  }
  
  private isMajorLine(startX: number, endX: number, majorSpacing: number): boolean {
    const avgX = (startX + endX) / 2;
    const rem = ((avgX % majorSpacing) + majorSpacing) % majorSpacing;
    return rem < majorSpacing * 0.1 || rem > majorSpacing * 0.9;
  }
}
