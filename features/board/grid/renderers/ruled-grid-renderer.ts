import { BaseGridRenderer, type GridRenderContext } from './base-renderer';
import { getMinorGridOpacity, getMajorGridOpacity } from '../utils/visibility';
import { rgba } from '../utils/theme-colors';
import { getGridLines } from '../utils/world-to-screen';
import { GRID_LINE_WIDTH_BASE, GRID_MAJOR_LINE_WIDTH_BASE, GRID_RULED_MARGIN_OFFSET, getMinorGridSpacing, getMajorGridSpacing } from '../constants';

export class RuledGridRenderer extends BaseGridRenderer {
  readonly type = 'ruled';
  
  render(context: GridRenderContext): void {
    const { container, bounds, zoom, colors, config } = context;
    const gridGroup = this.ensureGridGroup(container);
    this.clear();
    
    const minorOpacity = getMinorGridOpacity(zoom);
    const majorOpacity = config.showMajor ? getMajorGridOpacity(zoom) : 0;
    
    if (minorOpacity <= 0) {
      return;
    }
    
    const spacing = config.density;
    const minorSpacing = getMinorGridSpacing(spacing);
    const majorSpacing = getMajorGridSpacing(spacing);
    const minorLineWidth = Math.max(0.25, GRID_LINE_WIDTH_BASE / zoom);
    const marginLineWidth = Math.max(1, 1.5 / zoom);
    
    const fragment = document.createDocumentFragment();
    
    const minorColor = rgba(colors.primary, minorOpacity);
    const yLines = getGridLines(bounds.minY, bounds.maxY, minorSpacing);
    
    for (const y of yLines) {
      const line = this.createLine(bounds.minX, y, bounds.maxX, y, minorColor, minorLineWidth);
      fragment.appendChild(line);
    }
    
    if (majorOpacity > 0 && config.showMajor) {
      const majorColor = rgba(colors.major, majorOpacity);
      const majorLineWidth = Math.max(0.5, GRID_MAJOR_LINE_WIDTH_BASE / zoom);
      const majorYLines = getGridLines(bounds.minY, bounds.maxY, majorSpacing);
      
      for (const y of majorYLines) {
        const line = this.createLine(bounds.minX, y, bounds.maxX, y, majorColor, majorLineWidth);
        fragment.appendChild(line);
      }
    }
    
    const marginX = bounds.minX + GRID_RULED_MARGIN_OFFSET / zoom;
    const marginColor = rgba(colors.secondary, 0.6);
    const marginLine = this.createLine(marginX, bounds.minY, marginX, bounds.maxY, marginColor, marginLineWidth);
    fragment.appendChild(marginLine);
    
    gridGroup.appendChild(fragment);
  }
}
