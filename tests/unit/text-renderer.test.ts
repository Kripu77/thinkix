import { describe, it, expect } from 'vitest';
import type { Element as SlateElement } from 'slate';
import { getTextString, normalizeTextValue } from '@/features/board/plugins/add-text-renderer';

const DEFAULT_CHINESE_TEXT = '文本';

interface CustomText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underlined?: boolean;
  strike?: boolean;
  code?: boolean;
  color?: string;
  'font-size'?: number | string;
}

function getLeafStyles(leaf: CustomText): { color?: string; fontSize?: string } {
  const style: { color?: string; fontSize?: string } = {};
  
  if (leaf.color) {
    style.color = leaf.color;
  }
  
  const fontSize = leaf['font-size'];
  if (fontSize) {
    const sizeValue = typeof fontSize === 'number' ? fontSize : parseInt(fontSize, 10);
    if (!isNaN(sizeValue)) {
      style.fontSize = `${sizeValue}px`;
    }
  }
  
  return style;
}

function wrapLeafChildren(leaf: CustomText, children: string): string {
  let result = children;
  
  if (leaf.bold) {
    result = `<strong>${result}</strong>`;
  }
  if (leaf.code) {
    result = `<code>${result}</code>`;
  }
  if (leaf.italic) {
    result = `<em>${result}</em>`;
  }
  if (leaf.underlined) {
    result = `<u>${result}</u>`;
  }
  if (leaf.strike) {
    result = `<s>${result}</s>`;
  }
  
  return result;
}

function renderLeaf(leaf: CustomText): { wrappedContent: string; style: ReturnType<typeof getLeafStyles> } {
  const wrappedContent = wrapLeafChildren(leaf, leaf.text);
  const style = getLeafStyles(leaf);
  return { wrappedContent, style };
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
      const leaf: CustomText = { text: 'bold text', bold: true };
      const { wrappedContent } = renderLeaf(leaf);
      expect(wrappedContent).toBe('<strong>bold text</strong>');
    });

    it('should not wrap children when bold is false', () => {
      const leaf: CustomText = { text: 'normal text', bold: false };
      const { wrappedContent } = renderLeaf(leaf);
      expect(wrappedContent).toBe('normal text');
    });
  });

  describe('italic formatting', () => {
    it('should wrap children in em tag when italic is true', () => {
      const leaf: CustomText = { text: 'italic text', italic: true };
      const { wrappedContent } = renderLeaf(leaf);
      expect(wrappedContent).toBe('<em>italic text</em>');
    });
  });

  describe('underline formatting', () => {
    it('should wrap children in u tag when underlined is true', () => {
      const leaf: CustomText = { text: 'underlined text', underlined: true };
      const { wrappedContent } = renderLeaf(leaf);
      expect(wrappedContent).toBe('<u>underlined text</u>');
    });
  });

  describe('strikethrough formatting', () => {
    it('should wrap children in s tag when strike is true', () => {
      const leaf: CustomText = { text: 'strikethrough text', strike: true };
      const { wrappedContent } = renderLeaf(leaf);
      expect(wrappedContent).toBe('<s>strikethrough text</s>');
    });
  });

  describe('code formatting', () => {
    it('should wrap children in code tag when code is true', () => {
      const leaf: CustomText = { text: 'code text', code: true };
      const { wrappedContent } = renderLeaf(leaf);
      expect(wrappedContent).toBe('<code>code text</code>');
    });
  });

  describe('combined formatting', () => {
    it('should wrap with multiple tags when multiple formats are true', () => {
      const leaf: CustomText = { text: 'formatted', bold: true, italic: true };
      const { wrappedContent } = renderLeaf(leaf);
      expect(wrappedContent).toBe('<em><strong>formatted</strong></em>');
    });

    it('should apply all formatting in correct order', () => {
      const leaf: CustomText = { 
        text: 'all formats', 
        bold: true, 
        italic: true, 
        underlined: true, 
        strike: true 
      };
      const { wrappedContent } = renderLeaf(leaf);
      expect(wrappedContent).toBe('<s><u><em><strong>all formats</strong></em></u></s>');
    });
  });

  describe('text color', () => {
    it('should return color in style', () => {
      const leaf: CustomText = { text: 'colored text', color: '#ff0000' };
      const { style } = renderLeaf(leaf);
      expect(style.color).toBe('#ff0000');
    });

    it('should not include color when not set', () => {
      const leaf: CustomText = { text: 'normal text' };
      const { style } = renderLeaf(leaf);
      expect(style.color).toBeUndefined();
    });
  });

  describe('font size', () => {
    it('should handle numeric font size', () => {
      const leaf: CustomText = { text: 'sized text', 'font-size': 24 };
      const { style } = renderLeaf(leaf);
      expect(style.fontSize).toBe('24px');
    });

    it('should handle string font size', () => {
      const leaf: CustomText = { text: 'sized text', 'font-size': '18' };
      const { style } = renderLeaf(leaf);
      expect(style.fontSize).toBe('18px');
    });

    it('should not include fontSize for invalid font size', () => {
      const leaf: CustomText = { text: 'sized text', 'font-size': 'invalid' };
      const { style } = renderLeaf(leaf);
      expect(style.fontSize).toBeUndefined();
    });

    it('should not include fontSize when not set', () => {
      const leaf: CustomText = { text: 'normal text' };
      const { style } = renderLeaf(leaf);
      expect(style.fontSize).toBeUndefined();
    });
  });

  describe('combined styles', () => {
    it('should apply both color and font size', () => {
      const leaf: CustomText = { text: 'styled text', color: '#00ff00', 'font-size': 16 };
      const { style } = renderLeaf(leaf);
      expect(style.color).toBe('#00ff00');
      expect(style.fontSize).toBe('16px');
    });

    it('should combine formatting and styles', () => {
      const leaf: CustomText = { 
        text: 'full styled', 
        bold: true, 
        color: '#ff0000',
        'font-size': 20
      };
      const { wrappedContent, style } = renderLeaf(leaf);
      expect(wrappedContent).toBe('<strong>full styled</strong>');
      expect(style.color).toBe('#ff0000');
      expect(style.fontSize).toBe('20px');
    });
  });
});
