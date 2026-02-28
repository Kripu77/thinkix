import { describe, it, expect } from 'vitest';
import {
  getMinorGridOpacity,
  getMajorGridOpacity,
  getDotGridOpacity,
  shouldRenderMinorGrid,
  shouldRenderMajorGrid,
} from '@/features/board/grid/utils/visibility';
import { GRID_ZOOM_THRESHOLDS, GRID_OPACITY } from '@/features/board/grid/constants';

describe('visibility', () => {
  describe('getMinorGridOpacity', () => {
    it('should return 0 below minimum zoom threshold', () => {
      const belowThreshold = GRID_ZOOM_THRESHOLDS.minorGridMinZoom - 0.1;
      expect(getMinorGridOpacity(belowThreshold)).toBe(0);
    });

    it('should return 0 at exactly 0 zoom', () => {
      expect(getMinorGridOpacity(0)).toBe(0);
    });

    it('should interpolate opacity between min threshold and zoom 1', () => {
      const minZoom = GRID_ZOOM_THRESHOLDS.minorGridMinZoom;
      const midZoom = (minZoom + 1) / 2;
      
      const opacityAtMin = getMinorGridOpacity(minZoom);
      const opacityAtMid = getMinorGridOpacity(midZoom);
      const opacityAtOne = getMinorGridOpacity(1);
      
      expect(opacityAtMin).toBeLessThan(opacityAtMid);
      expect(opacityAtMid).toBeLessThan(opacityAtOne);
      expect(opacityAtOne).toBe(GRID_OPACITY.minor);
    });

    it('should return full opacity at zoom 1 and above', () => {
      expect(getMinorGridOpacity(1)).toBe(GRID_OPACITY.minor);
      expect(getMinorGridOpacity(2)).toBe(GRID_OPACITY.minor);
      expect(getMinorGridOpacity(5)).toBe(GRID_OPACITY.minor);
    });
  });

  describe('getMajorGridOpacity', () => {
    it('should return 0 below minimum zoom threshold', () => {
      const belowThreshold = GRID_ZOOM_THRESHOLDS.majorGridMinZoom - 0.1;
      expect(getMajorGridOpacity(belowThreshold)).toBe(0);
    });

    it('should interpolate opacity between min threshold and zoom 1', () => {
      const minZoom = GRID_ZOOM_THRESHOLDS.majorGridMinZoom;
      const midZoom = (minZoom + 1) / 2;
      
      const opacityAtMin = getMajorGridOpacity(minZoom);
      const opacityAtMid = getMajorGridOpacity(midZoom);
      const opacityAtOne = getMajorGridOpacity(1);
      
      expect(opacityAtMin).toBeLessThan(opacityAtMid);
      expect(opacityAtMid).toBeLessThan(opacityAtOne);
    });

    it('should return full opacity at zoom 1 and above', () => {
      expect(getMajorGridOpacity(1)).toBe(GRID_OPACITY.major);
      expect(getMajorGridOpacity(3)).toBe(GRID_OPACITY.major);
    });

    it('should have higher opacity than minor grid', () => {
      expect(GRID_OPACITY.major).toBeGreaterThan(GRID_OPACITY.minor);
    });
  });

  describe('getDotGridOpacity', () => {
    it('should return 0 below minimum zoom threshold', () => {
      const belowThreshold = GRID_ZOOM_THRESHOLDS.minorGridMinZoom - 0.1;
      expect(getDotGridOpacity(belowThreshold)).toBe(0);
    });

    it('should return full opacity at zoom 1 and above', () => {
      expect(getDotGridOpacity(1)).toBe(GRID_OPACITY.dot);
      expect(getDotGridOpacity(2)).toBe(GRID_OPACITY.dot);
    });
  });

  describe('shouldRenderMinorGrid', () => {
    it('should return false below threshold', () => {
      expect(shouldRenderMinorGrid(0)).toBe(false);
      expect(shouldRenderMinorGrid(GRID_ZOOM_THRESHOLDS.minorGridMinZoom - 0.01)).toBe(false);
    });

    it('should return true at or above threshold', () => {
      expect(shouldRenderMinorGrid(GRID_ZOOM_THRESHOLDS.minorGridMinZoom)).toBe(true);
      expect(shouldRenderMinorGrid(1)).toBe(true);
      expect(shouldRenderMinorGrid(5)).toBe(true);
    });
  });

  describe('shouldRenderMajorGrid', () => {
    it('should return false below threshold', () => {
      expect(shouldRenderMajorGrid(0)).toBe(false);
      expect(shouldRenderMajorGrid(GRID_ZOOM_THRESHOLDS.majorGridMinZoom - 0.01)).toBe(false);
    });

    it('should return true at or above threshold', () => {
      expect(shouldRenderMajorGrid(GRID_ZOOM_THRESHOLDS.majorGridMinZoom)).toBe(true);
      expect(shouldRenderMajorGrid(1)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle extremely small zoom', () => {
      expect(getMinorGridOpacity(0.01)).toBe(0);
      expect(getMajorGridOpacity(0.01)).toBe(0);
      expect(getDotGridOpacity(0.01)).toBe(0);
    });

    it('should handle extremely large zoom', () => {
      expect(getMinorGridOpacity(100)).toBe(GRID_OPACITY.minor);
      expect(getMajorGridOpacity(100)).toBe(GRID_OPACITY.major);
      expect(getDotGridOpacity(100)).toBe(GRID_OPACITY.dot);
    });
  });
});
