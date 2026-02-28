import { BaseGridRenderer, type GridRenderContext } from './base-renderer';
import { getMinorGridOpacity, getMajorGridOpacity } from '../utils/visibility';
import { rgba, getBlueprintColors } from '../utils/theme-colors';
import { getGridLines } from '../utils/world-to-screen';
import {
  GRID_LINE_WIDTH_BASE,
  GRID_MAJOR_LINE_WIDTH_BASE,
  getMinorGridSpacing,
  getMajorGridSpacing,
} from '../constants';
import { ThemeColorMode } from '@plait/core';

export class BlueprintGridRenderer extends BaseGridRenderer {
  readonly type = 'blueprint';
  
  render(context: GridRenderContext): void {
    const { container, bounds, zoom, config } = context;
    const gridGroup = this.ensureGridGroup(container);
    this.clear();
    
    const themeMode = context.board.theme?.themeColorMode ?? ThemeColorMode.default;
    const blueprintColors = getBlueprintColors(themeMode);
    
    const minorOpacity = getMinorGridOpacity(zoom);
    const majorOpacity = config.showMajor ? getMajorGridOpacity(zoom) : 0;
    
    const minorSpacing = getMinorGridSpacing(config.density);
    const majorSpacing = getMajorGridSpacing(config.density);
    
    const minorLineWidth = Math.max(0.25, GRID_LINE_WIDTH_BASE / zoom);
    const majorLineWidth = Math.max(0.5, GRID_MAJOR_LINE_WIDTH_BASE / zoom);
    
    const fragment = document.createDocumentFragment();
    
    if (minorOpacity > 0) {
      const minorColor = rgba(blueprintColors.primary, Math.min(minorOpacity + 0.1, 0.5));
      const xLines = getGridLines(bounds.minX, bounds.maxX, minorSpacing);
      const yLines = getGridLines(bounds.minY, bounds.maxY, minorSpacing);
      
      for (const x of xLines) {
        if (config.showMajor && x % majorSpacing === 0) continue;
        const line = this.createLine(x, bounds.minY, x, bounds.maxY, minorColor, minorLineWidth);
        fragment.appendChild(line);
      }
      
      for (const y of yLines) {
        if (config.showMajor && y % majorSpacing === 0) continue;
        const line = this.createLine(bounds.minX, y, bounds.maxX, y, minorColor, minorLineWidth);
        fragment.appendChild(line);
      }
    }
    
    if (majorOpacity > 0) {
      const majorColor = rgba(blueprintColors.major, Math.min(majorOpacity + 0.15, 0.65));
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
