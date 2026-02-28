import { describe, it, expect } from 'vitest';
import { RuledGridRenderer } from '@/features/board/grid/renderers/ruled-grid-renderer';
import type { GridRenderContext } from '@/features/board/grid/renderers/base-renderer';

describe('RuledGridRenderer', () => {
  describe('type', () => {
    it('should have type "ruled"', () => {
      const renderer = new RuledGridRenderer();
      expect(renderer.type).toBe('ruled');
    });
  });

  describe('render', () => {
    it('should create horizontal lines with margin', () => {
      const container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const bounds = { minX: 0, maxX: 100, minY: 0, maxY: 100 };
      const colors = {
        primary: '#d0d0d0',
        secondary: '#e8e8e8',
        major: '#a0a0a0',
        background: '#ffffff',
      };
      
      const renderer = new RuledGridRenderer();
      renderer.render({
        container,
        bounds,
        zoom: 1,
        colors,
        config: { type: 'ruled', density: 16, showMajor: true },
      } as GridRenderContext);
      
      expect(container.children.length).toBeGreaterThan(0);
    });
  });
});
