import { BaseGridRenderer, type GridRenderContext } from './base-renderer';
import { GRID_DOT_RADIUS_BASE } from '../constants';
import { getDotGridOpacity } from '../utils/visibility';
import { rgba } from '../utils/theme-colors';
import { getGridLines } from '../utils/world-to-screen';

const MIN_RADIUS = 0.5;
const BASE_DENSITY = 16;
const MAX_DENSITY_SCALE = 3;

export class DotGridRenderer extends BaseGridRenderer {
  readonly type = 'dot';
  
  private getDensityScale(spacing: number, zoom: number): number {
    const screenSpacing = spacing * zoom;
    const densityScale = Math.min(
      Math.max(1, screenSpacing / BASE_DENSITY),
      Math.min(MAX_DENSITY_SCALE, screenSpacing / 8)
    );
    return densityScale;
  }

  render(context: GridRenderContext): void {
    const { container, bounds, zoom, colors, config } = context;
    const gridGroup = this.ensureGridGroup(container);
    this.clear();
    
    const opacity = getDotGridOpacity(zoom);
    
    if (opacity <= 0) {
      return;
    }
    
    const spacing = config.density;
    const xLines = getGridLines(bounds.minX, bounds.maxX, spacing);
    const yLines = getGridLines(bounds.minY, bounds.maxY, spacing);
    
    const densityScale = this.getDensityScale(spacing, zoom);
    const radius = Math.max(MIN_RADIUS, GRID_DOT_RADIUS_BASE * densityScale / zoom);
    const fillColor = rgba(colors.primary, opacity);
    
    const fragment = document.createDocumentFragment();
    
    for (const x of xLines) {
      for (const y of yLines) {
        const circle = this.createCircle(x, y, radius, fillColor);
        fragment.appendChild(circle);
      }
    }
    
    gridGroup.appendChild(fragment);
  }
}
