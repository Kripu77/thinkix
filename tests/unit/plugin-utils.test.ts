import { describe, it, expect } from 'vitest';
import { asPlaitPlugin } from '@thinkix/plait-utils';
import type { PlaitPlugin } from '@plait/core';

describe('plugin-utils', () => {
  describe('asPlaitPlugin', () => {
    it('should convert a function to PlaitPlugin type', () => {
      const mockPlugin = () => ({});
      const result = asPlaitPlugin(mockPlugin);
      expect(result).toBeDefined();
    });

    it('should return a PlaitPlugin compatible value', () => {
      const mockPlugin = (board: unknown) => ({ board });
      const result = asPlaitPlugin(mockPlugin) as PlaitPlugin;
      expect(typeof result).toBe('function');
    });

    it('should handle plugin with no arguments', () => {
      const mockPlugin = () => undefined;
      expect(() => asPlaitPlugin(mockPlugin)).not.toThrow();
    });

    it('should handle plugin that returns an object', () => {
      const mockPlugin = () => ({ name: 'test', priority: 100 });
      const result = asPlaitPlugin(mockPlugin);
      expect(result).toBeDefined();
    });

    it('should handle plugin with multiple arguments', () => {
      const mockPlugin = (a: number, b: string) => ({ a, b });
      expect(() => asPlaitPlugin(mockPlugin)).not.toThrow();
    });

    it('should handle async plugin function', () => {
      const mockPlugin = async () => Promise.resolve({});
      expect(() => asPlaitPlugin(mockPlugin)).not.toThrow();
    });

    it('should handle plugin that returns null', () => {
      const mockPlugin = () => null;
      expect(() => asPlaitPlugin(mockPlugin)).not.toThrow();
    });

    it('should preserve the original function behavior', () => {
      let called = false;
      const mockPlugin = () => { called = true; return {}; };
      asPlaitPlugin(mockPlugin);
      expect(called).toBe(false);
    });
  });
});
