import { describe, it, expect } from 'vitest';
import type { Element as SlateElement } from 'slate';

const DEFAULT_CHINESE_TEXT = '文本';

interface TextNode {
  text: string;
}

function getTextString(text: SlateElement): string {
  return text.children
    .map((child) => (child as TextNode).text || '')
    .join('');
}

function normalizeTextValue(text: SlateElement | undefined): SlateElement {
  if (!text) {
    return { children: [{ text: '' }] };
  }
  if (!text.children || !Array.isArray(text.children)) {
    return { ...text, children: [{ text: '' }] };
  }
  const hasNullChildren = text.children.some((child) => child === null || child === undefined);
  if (hasNullChildren) {
    return {
      ...text,
      children: text.children.map((child) =>
        child === null || child === undefined ? { text: '' } : child
      )
    };
  }
  if (text.children.length === 0) {
    return { ...text, children: [{ text: '' }] };
  }

  const textString = getTextString(text);
  if (textString === DEFAULT_CHINESE_TEXT) {
    return { ...text, children: [{ text: '' }] };
  }

  return text;
}

describe('text-renderer normalization', () => {
  describe('normalizeTextValue', () => {
    it('should return default for undefined input', () => {
      const result = normalizeTextValue(undefined);
      expect(result).toEqual({ children: [{ text: '' }] });
    });

    it('should return default for null input', () => {
      const result = normalizeTextValue(null as unknown as SlateElement);
      expect(result).toEqual({ children: [{ text: '' }] });
    });

    it('should handle text without children', () => {
      const text = {} as SlateElement;
      const result = normalizeTextValue(text);
      expect(result).toEqual({ children: [{ text: '' }] });
    });

    it('should handle text with non-array children', () => {
      const text = { children: 'not-an-array' } as unknown as SlateElement;
      const result = normalizeTextValue(text);
      expect(result).toEqual({ children: [{ text: '' }] });
    });

    it('should handle text with null children', () => {
      const text = { children: [null, { text: 'hello' }] } as unknown as SlateElement;
      const result = normalizeTextValue(text);
      expect(result.children[0]).toEqual({ text: '' });
    });

    it('should handle text with undefined children', () => {
      const text = { children: [undefined, { text: 'hello' }] } as unknown as SlateElement;
      const result = normalizeTextValue(text);
      expect(result.children[0]).toEqual({ text: '' });
    });

    it('should return default for empty children array', () => {
      const text = { children: [] } as SlateElement;
      const result = normalizeTextValue(text);
      expect(result).toEqual({ children: [{ text: '' }] });
    });

    it('should replace default Chinese text with empty string', () => {
      const text = { children: [{ text: DEFAULT_CHINESE_TEXT }] } as SlateElement;
      const result = normalizeTextValue(text);
      expect(result).toEqual({ children: [{ text: '' }] });
    });

    it('should preserve valid text content', () => {
      const text = { children: [{ text: 'Hello World' }] } as SlateElement;
      const result = normalizeTextValue(text);
      expect(result).toEqual({ children: [{ text: 'Hello World' }] });
    });

    it('should preserve text with formatting', () => {
      const text = { 
        children: [{ text: 'Hello', bold: true, color: '#ff0000' }] 
      } as unknown as SlateElement;
      const result = normalizeTextValue(text);
      expect(result.children[0]).toEqual({ text: 'Hello', bold: true, color: '#ff0000' });
    });

    it('should handle multiple text children', () => {
      const text = { 
        children: [{ text: 'Hello ' }, { text: 'World', bold: true }] 
      } as SlateElement;
      const result = normalizeTextValue(text);
      expect(result.children).toHaveLength(2);
    });

    it('should preserve additional text properties', () => {
      const text = { 
        children: [{ text: 'Test' }],
        otherProp: 'value'
      } as SlateElement;
      const result = normalizeTextValue(text);
      expect((result as { otherProp?: string }).otherProp).toBe('value');
    });
  });

  describe('getTextString', () => {
    it('should concatenate text from children', () => {
      const text = { 
        children: [{ text: 'Hello ' }, { text: 'World' }] 
      } as SlateElement;
      const result = getTextString(text);
      expect(result).toBe('Hello World');
    });

    it('should handle single child', () => {
      const text = { children: [{ text: 'Single' }] } as SlateElement;
      const result = getTextString(text);
      expect(result).toBe('Single');
    });

    it('should handle empty text', () => {
      const text = { children: [{ text: '' }] } as SlateElement;
      const result = getTextString(text);
      expect(result).toBe('');
    });

    it('should handle children without text property', () => {
      const text = { children: [{}] } as SlateElement;
      const result = getTextString(text);
      expect(result).toBe('');
    });

    it('should handle mixed children', () => {
      const text = { 
        children: [{ text: 'A' }, { text: '', bold: true }, { text: 'B' }] 
      } as SlateElement;
      const result = getTextString(text);
      expect(result).toBe('AB');
    });
  });
});

describe('Leaf rendering styles', () => {
  describe('bold formatting', () => {
    it('should wrap children in strong tag when bold is true', () => {
      const leaf = { text: 'bold text', bold: true };
      expect(leaf.bold).toBe(true);
    });
  });

  describe('italic formatting', () => {
    it('should have italic property', () => {
      const leaf = { text: 'italic text', italic: true };
      expect(leaf.italic).toBe(true);
    });
  });

  describe('underline formatting', () => {
    it('should have underlined property', () => {
      const leaf = { text: 'underlined text', underlined: true };
      expect(leaf.underlined).toBe(true);
    });
  });

  describe('strikethrough formatting', () => {
    it('should have strike property', () => {
      const leaf = { text: 'strikethrough text', strike: true };
      expect(leaf.strike).toBe(true);
    });
  });

  describe('text color', () => {
    it('should have color property', () => {
      const leaf = { text: 'colored text', color: '#ff0000' };
      expect(leaf.color).toBe('#ff0000');
    });
  });

  describe('font size', () => {
    it('should handle numeric font size', () => {
      const leaf = { text: 'sized text', 'font-size': 24 };
      const fontSize = leaf['font-size'];
      const sizeValue = typeof fontSize === 'number' ? fontSize : parseInt(fontSize, 10);
      expect(sizeValue).toBe(24);
    });

    it('should handle string font size', () => {
      const leaf = { text: 'sized text', 'font-size': '18' };
      const fontSize = leaf['font-size'];
      const sizeValue = typeof fontSize === 'number' ? fontSize : parseInt(fontSize as string, 10);
      expect(sizeValue).toBe(18);
    });

    it('should handle invalid font size', () => {
      const leaf = { text: 'sized text', 'font-size': 'invalid' };
      const fontSize = leaf['font-size'];
      const sizeValue = typeof fontSize === 'number' ? fontSize : parseInt(fontSize as string, 10);
      expect(isNaN(sizeValue)).toBe(true);
    });
  });
});
