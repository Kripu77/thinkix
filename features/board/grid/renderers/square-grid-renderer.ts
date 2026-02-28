import { BaseGridRenderer, type GridRenderContext } from './base-renderer';
import { getMinorGridOpacity, getMajorGridOpacity } from '../utils/visibility';
import { rgba } from '../utils/theme-colors';
import { getGridLines } from '../utils/world-to-screen';
import {
  GRID_LINE_WIDTH_BASE,
  GRID_MAJOR_LINE_WIDTH_BASE,
  getMinorGridSpacing,
  getMajorGridSpacing,
} from '../constants';

export class SquareGridRenderer extends BaseGridRenderer {
  readonly type = 'square';
  
  private isMajorLine(pos: number, majorSpacing: number): boolean {
    const ratio = pos / majorSpacing;
    return Math.abs(ratio - Math.round(ratio)) < 1e-6;
  }
  
  render(context: GridRenderContext): void {
    const { container, bounds, zoom, colors, config } = context;
    const gridGroup = this.ensureGridGroup(container);
    this.clear();
    
    const minorOpacity = getMinorGridOpacity(zoom);
    const majorOpacity = config.showMajor ? getMajorGridOpacity(zoom) : 0;
    
    if (minorOpacity <= 0 && majorOpacity <= 0) {
      return;
    }
    
    const minorSpacing = getMinorGridSpacing(config.density);
    const majorSpacing = getMajorGridSpacing(config.density);
    
    const minorLineWidth = Math.max(0.25, GRID_LINE_WIDTH_BASE / zoom);
    const majorLineWidth = Math.max(0.5, GRID_MAJOR_LINE_WIDTH_BASE / zoom);
    
    const fragment = document.createDocumentFragment();
    
    if (minorOpacity > 0) {
      const minorColor = rgba(colors.primary, minorOpacity);
      const xLines = getGridLines(bounds.minX, bounds.maxX, minorSpacing);
      const yLines = getGridLines(bounds.minY, bounds.maxY, minorSpacing);
      
      for (const x of xLines) {
        if (config.showMajor && this.isMajorLine(x, majorSpacing)) continue;
        const line = this.createLine(x, bounds.minY, x, bounds.maxY, minorColor, minorLineWidth);
        fragment.appendChild(line);
      }
      
      for (const y of yLines) {
        if (config.showMajor && this.isMajorLine(y, majorSpacing)) continue;
        const line = this.createLine(bounds.minX, y, bounds.maxX, y, minorColor, minorLineWidth);
        fragment.appendChild(line);
      }
    }
    
    if (majorOpacity > 0) {
      const majorColor = rgba(colors.major, majorOpacity);
      const xMajorLines = getGridLines(bounds.minX, bounds.maxX, majorSpacing);
      const yMajorLines = getGridLines(bounds.minY, bounds.maxY, majorSpacing);
      
      for (const x of xMajorLines) {
        const line = this.createLine(x, bounds.minY, x, bounds.maxY, majorColor, majorLineWidth);
        fragment.appendChild(line);
      }
      
      for (const y of yMajorLines) {
        const line = this.createLine(bounds.minX, y, bounds.maxX, y, majorColor, majorLineWidth);
        fragment.appendChild(line);
      }
    }
    
    gridGroup.appendChild(fragment);
  }
}
