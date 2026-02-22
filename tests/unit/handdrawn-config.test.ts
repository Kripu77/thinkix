import { describe, it, expect } from 'vitest';
import {
  HANDDRAWN_PRESETS,
  DEFAULT_HANDDRAWN_CONFIG,
  toRoughOptions,
  type HanddrawnConfig,
} from '@/features/board/plugins/handdrawn-mode/config';

describe('handdrawn-mode config', () => {
  describe('HANDDRAWN_PRESETS', () => {
    it('should have subtle preset', () => {
      expect(HANDDRAWN_PRESETS.subtle).toBeDefined();
      expect(HANDDRAWN_PRESETS.subtle.roughness).toBe(0.5);
      expect(HANDDRAWN_PRESETS.subtle.bowing).toBe(0.5);
    });

    it('should have default preset', () => {
      expect(HANDDRAWN_PRESETS.default).toBeDefined();
      expect(HANDDRAWN_PRESETS.default.roughness).toBe(1.4);
      expect(HANDDRAWN_PRESETS.default.bowing).toBe(1);
    });

    it('should have strong preset', () => {
      expect(HANDDRAWN_PRESETS.strong).toBeDefined();
      expect(HANDDRAWN_PRESETS.strong.roughness).toBe(2.5);
      expect(HANDDRAWN_PRESETS.strong.bowing).toBe(2);
    });

    it('should have excalidraw preset', () => {
      expect(HANDDRAWN_PRESETS.excalidraw).toBeDefined();
      expect(HANDDRAWN_PRESETS.excalidraw.roughness).toBe(1.4);
    });

    it('should have sketchbook preset', () => {
      expect(HANDDRAWN_PRESETS.sketchbook).toBeDefined();
      expect(HANDDRAWN_PRESETS.sketchbook.fillStyle).toBe('hachure');
    });

    it('should have blueprint preset', () => {
      expect(HANDDRAWN_PRESETS.blueprint).toBeDefined();
      expect(HANDDRAWN_PRESETS.blueprint.hachureAngle).toBe(45);
    });

    it('should have all required properties in each preset', () => {
      const requiredKeys: (keyof HanddrawnConfig)[] = [
        'roughness',
        'bowing',
        'strokeWidth',
        'fillStyle',
        'fillWeight',
        'hachureAngle',
        'hachureGap',
      ];

      for (const preset of Object.values(HANDDRAWN_PRESETS)) {
        for (const key of requiredKeys) {
          expect(preset[key]).toBeDefined();
        }
      }
    });

    it('should have valid fillStyle values', () => {
      const validFillStyles = ['solid', 'hachure', 'zigzag', 'cross-hatch', 'dots', 'dashed', 'zigzag-line'];
      
      for (const preset of Object.values(HANDDRAWN_PRESETS)) {
        expect(validFillStyles).toContain(preset.fillStyle);
      }
    });

    it('should have positive roughness values', () => {
      for (const preset of Object.values(HANDDRAWN_PRESETS)) {
        expect(preset.roughness).toBeGreaterThan(0);
      }
    });

    it('should have positive bowing values', () => {
      for (const preset of Object.values(HANDDRAWN_PRESETS)) {
        expect(preset.bowing).toBeGreaterThanOrEqual(0);
      }
    });

    it('should have positive strokeWidth values', () => {
      for (const preset of Object.values(HANDDRAWN_PRESETS)) {
        expect(preset.strokeWidth).toBeGreaterThan(0);
      }
    });
  });

  describe('DEFAULT_HANDDRAWN_CONFIG', () => {
    it('should be defined', () => {
      expect(DEFAULT_HANDDRAWN_CONFIG).toBeDefined();
    });

    it('should equal excalidraw preset', () => {
      expect(DEFAULT_HANDDRAWN_CONFIG).toEqual(HANDDRAWN_PRESETS.excalidraw);
    });

    it('should have all required properties', () => {
      expect(DEFAULT_HANDDRAWN_CONFIG).toHaveProperty('roughness');
      expect(DEFAULT_HANDDRAWN_CONFIG).toHaveProperty('bowing');
      expect(DEFAULT_HANDDRAWN_CONFIG).toHaveProperty('strokeWidth');
      expect(DEFAULT_HANDDRAWN_CONFIG).toHaveProperty('fillStyle');
      expect(DEFAULT_HANDDRAWN_CONFIG).toHaveProperty('fillWeight');
      expect(DEFAULT_HANDDRAWN_CONFIG).toHaveProperty('hachureAngle');
      expect(DEFAULT_HANDDRAWN_CONFIG).toHaveProperty('hachureGap');
    });
  });

  describe('toRoughOptions', () => {
    it('should convert config to rough options', () => {
      const config: HanddrawnConfig = {
        roughness: 1,
        bowing: 1,
        strokeWidth: 2,
        fillStyle: 'solid',
        fillWeight: 0.5,
        hachureAngle: -41,
        hachureGap: 4,
      };

      const options = toRoughOptions(config);

      expect(options.roughness).toBe(1);
      expect(options.bowing).toBe(1);
      expect(options.strokeWidth).toBe(2);
      expect(options.fillStyle).toBe('solid');
      expect(options.fillWeight).toBe(0.5);
      expect(options.hachureAngle).toBe(-41);
      expect(options.hachureGap).toBe(4);
    });

    it('should have default stroke color', () => {
      const options = toRoughOptions(DEFAULT_HANDDRAWN_CONFIG);
      expect(options.stroke).toBe('#000');
    });

    it('should have default fill of none', () => {
      const options = toRoughOptions(DEFAULT_HANDDRAWN_CONFIG);
      expect(options.fill).toBe('none');
    });

    it('should apply overrides', () => {
      const options = toRoughOptions(DEFAULT_HANDDRAWN_CONFIG, {
        stroke: '#ff0000',
        fill: '#00ff00',
      });

      expect(options.stroke).toBe('#ff0000');
      expect(options.fill).toBe('#00ff00');
    });

    it('should override config properties with overrides', () => {
      const options = toRoughOptions(DEFAULT_HANDDRAWN_CONFIG, {
        roughness: 5,
        bowing: 3,
      });

      expect(options.roughness).toBe(5);
      expect(options.bowing).toBe(3);
    });

    it('should work with each preset', () => {
      for (const preset of Object.values(HANDDRAWN_PRESETS)) {
        const options = toRoughOptions(preset);
        expect(options.roughness).toBe(preset.roughness);
        expect(options.bowing).toBe(preset.bowing);
      }
    });

    it('should handle empty overrides', () => {
      const config: HanddrawnConfig = {
        roughness: 1.5,
        bowing: 0.8,
        strokeWidth: 1,
        fillStyle: 'solid',
        fillWeight: 0.5,
        hachureAngle: -41,
        hachureGap: 4,
      };

      const options = toRoughOptions(config, {});
      expect(options.roughness).toBe(1.5);
    });

    it('should handle multiple overrides', () => {
      const options = toRoughOptions(DEFAULT_HANDDRAWN_CONFIG, {
        stroke: '#blue',
        fill: '#red',
        strokeWidth: 3,
        roughness: 2,
      });

      expect(options.stroke).toBe('#blue');
      expect(options.fill).toBe('#red');
      expect(options.strokeWidth).toBe(3);
      expect(options.roughness).toBe(2);
    });
  });
});
