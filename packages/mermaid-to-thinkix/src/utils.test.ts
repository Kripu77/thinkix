import { describe, it, expect } from 'vitest';
import {
  encodeEntities,
  decodeEntities,
  entityCodesToText,
  removeMarkdown,
  removeFontAwesomeIcons,
  normalizeText,
  cleanText,
  parseStyleString,
  convertContainerStyle,
  convertLabelStyle,
  isValidMermaidDefinition,
  generateId,
  safeNumber,
  isDefined,
} from './utils';

describe('Utils', () => {
  describe('encodeEntities', () => {
    it('should encode decimal entity codes', () => {
      expect(encodeEntities('Hello #9829;')).toBe('Hello °°9829¶ß');
    });

    it('should not encode named entities (already encoded)', () => {
      expect(encodeEntities('Hello &hearts;')).toBe('Hello &hearts;');
    });

    it('should encode entity codes in various formats', () => {
      expect(encodeEntities('Text #1; and #2;')).toBe('Text °°1¶ß and °°2¶ß');
      expect(encodeEntities('Icon #9829;')).toBe('Icon °°9829¶ß');
    });

    it('should return empty string for empty input', () => {
      expect(encodeEntities('')).toBe('');
    });
  });

  describe('decodeEntities', () => {
    it('should decode decimal entity codes', () => {
      expect(decodeEntities('Hello °°9829¶ß')).toBe('Hello #9829;');
    });

    it('should decode named entity codes', () => {
      // The decode function only handles our custom encoding
      // Named entities like &hearts; are not encoded by us, so they pass through
      expect(decodeEntities('Hello &hearts;')).toBe('Hello &hearts;');
    });

    it('should handle mixed encoding', () => {
      expect(decodeEntities('Text °°1¶ß and °°2¶ß')).toBe('Text #1; and #2;');
    });
  });

  describe('entityCodesToText', () => {
    it('should convert decimal entities to characters', () => {
      expect(entityCodesToText('#9829;')).toBe('♥');
      expect(entityCodesToText('#9824;')).toBe('♠');
      expect(entityCodesToText('#9827;')).toBe('♣');
      expect(entityCodesToText('#9830;')).toBe('♦');
    });

    it('should convert named entities to characters', () => {
      expect(entityCodesToText('&amp;')).toBe('&');
      expect(entityCodesToText('&lt;')).toBe('<');
      expect(entityCodesToText('&gt;')).toBe('>');
      expect(entityCodesToText('&quot;')).toBe('"');
    });

    it('should handle mixed text and entities', () => {
      expect(entityCodesToText('I love #9829;')).toBe('I love ♥');
    });

    it('should handle our encoded format', () => {
      expect(entityCodesToText('°°9829¶ß')).toBe('♥');
    });

    it('should handle empty string', () => {
      expect(entityCodesToText('')).toBe('');
    });

    describe('edge cases: malformed entity codes', () => {
      it('should handle incomplete entity codes (missing semicolon)', () => {
        // The browser may still decode known named entities even without semicolon
        expect(entityCodesToText('#9829')).toContain('9829');
        expect(entityCodesToText('&amp')).toBe('&');
      });

      it('should handle non-numeric entity codes', () => {
        // Our decode function converts # to &, so #abc; becomes &abc;
        expect(entityCodesToText('#abc;')).toContain('&abc;');
      });

      it('should handle out of range unicode entities', () => {
        // Very large numbers are handled by browser (may produce replacement char)
        const result = entityCodesToText('#9999999;');
        expect(typeof result).toBe('string');
      });

      it('should handle negative entity codes', () => {
        expect(entityCodesToText('#-1;')).toContain('#-1;');
      });

      it('should handle multiple consecutive entities', () => {
        // Note: The function processes entities but browser may handle them differently
        // Our custom encoding format works correctly
        expect(entityCodesToText('#65;#66;#67;')).toBe('ABC');
      });

      it('should handle malformed named entities', () => {
        // Unknown named entities are preserved
        expect(entityCodesToText('&unknown;')).toContain('&unknown;');
      });

      it('should handle mixed valid and invalid entities', () => {
        const result = entityCodesToText('Valid: &amp; Invalid: &xyz;');
        expect(result).toContain('&');
        expect(result).toContain('&xyz;');
      });

      it('should handle entities with whitespace', () => {
        // Whitespace in entity names causes partial decoding
        expect(entityCodesToText('&amp ;')).toContain('& ;');
        expect(entityCodesToText('# 65;')).toContain('# 65;');
      });

      it('should handle zero-width and special characters', () => {
        expect(entityCodesToText('#8203;')).toBe('\u200B'); // Zero-width space
        expect(entityCodesToText('#160;')).toBe('\u00A0'); // Non-breaking space
      });
    });
  });

  describe('removeMarkdown', () => {
    it('should remove inline code', () => {
      expect(removeMarkdown('This is `code` text')).toBe('This is code text');
    });

    it('should remove bold markdown', () => {
      expect(removeMarkdown('This is **bold** text')).toBe('This is bold text');
      expect(removeMarkdown('This is __bold__ text')).toBe('This is bold text');
    });

    it('should remove italic markdown', () => {
      expect(removeMarkdown('This is *italic* text')).toBe('This is italic text');
      expect(removeMarkdown('This is _italic_ text')).toBe('This is italic text');
    });

    it('should remove strikethrough', () => {
      expect(removeMarkdown('This is ~~strikethrough~~ text')).toBe('This is strikethrough text');
    });

    it('should remove links but keep text', () => {
      expect(removeMarkdown('[Google](https://google.com)')).toBe('Google');
    });

    it('should remove HTML tags', () => {
      expect(removeMarkdown('<b>bold</b>')).toBe('bold');
    });

    it('should handle multiple markdown types', () => {
      expect(removeMarkdown('**Bold** and `code` and [link](url)'))
        .toBe('Bold and code and link');
    });

    describe('edge cases: nested and complex markdown', () => {
      it('should handle nested bold within italic', () => {
        // Simple regex processes left-to-right, outer match removed first
        const result = removeMarkdown('*italic **bold** more*');
        expect(result).toContain('italic');
        expect(result).toContain('bold');
      });

      it('should handle adjacent formatting', () => {
        expect(removeMarkdown('**bold***italic*')).toBe('bolditalic');
      });

      it('should handle escaped backticks', () => {
        // The simple regex doesn't handle escapes - this documents current behavior
        expect(removeMarkdown('Use \\`not code\\` here')).toContain('not code');
      });

      it('should handle empty markdown spans', () => {
        expect(removeMarkdown('****')).toBe('****');
        expect(removeMarkdown('``')).toBe('``');
      });

      it('should handle multiple consecutive formatting characters', () => {
        expect(removeMarkdown('***bolditalic***')).toContain('bolditalic');
      });

      it('should handle unclosed formatting', () => {
        // Unclosed formatting is left as-is by simple regex
        expect(removeMarkdown('**bold without closing')).toContain('**bold without closing');
        expect(removeMarkdown('`unclosed code')).toContain('`unclosed code');
      });

      it('should handle links with special characters in URL', () => {
        expect(removeMarkdown('[Link](https://example.com?foo=bar&baz=qux)')).toBe('Link');
        expect(removeMarkdown('[Link](https://example.com/path#anchor)')).toBe('Link');
      });

      it('should handle nested HTML tags', () => {
        expect(removeMarkdown('<b><i>text</i></b>')).toBe('text');
      });

      it('should handle markdown in links', () => {
        // Simple regex processes links first, then other markdown
        const result = removeMarkdown('[**Bold** Link](url)');
        expect(result).toContain('Bold');
        expect(result).toContain('Link');
      });

      it('should handle overlapping markdown patterns', () => {
        // The pattern `**_bold and italic_**` - underscores processed first
        const result = removeMarkdown('**_mixed_**');
        expect(result).not.toContain('**');
        expect(result).not.toContain('_');
      });

      it('should handle code blocks with formatting inside', () => {
        // Code content is preserved as-is by simple regex
        const result = removeMarkdown('`code with **bold** inside`');
        expect(result).toContain('code with');
        expect(result).toContain('bold');
      });

      it('should handle self-closing HTML tags', () => {
        expect(removeMarkdown('text<br/>more')).toBe('textmore');
        expect(removeMarkdown('text<br />more')).toBe('textmore');
      });
    });
  });

  describe('removeFontAwesomeIcons', () => {
    it('should remove fa: icons', () => {
      expect(removeFontAwesomeIcons('Text fa:fa-user here'))
        .toBe('Text here');
    });

    it('should remove fab: brand icons', () => {
      expect(removeFontAwesomeIcons('Text fab:fa-twitter here'))
        .toBe('Text here');
    });

    it('should handle multiple icons', () => {
      expect(removeFontAwesomeIcons('fa:fa-user and fab:fa-github'))
        .toBe('and');
    });

    it('should preserve regular text', () => {
      expect(removeFontAwesomeIcons('Regular text here'))
        .toBe('Regular text here');
    });
  });

  describe('normalizeText', () => {
    it('should convert br tags to newlines', () => {
      expect(normalizeText('Line1<br>Line2')).toBe('Line1\nLine2');
      expect(normalizeText('Line1<br/>Line2')).toBe('Line1\nLine2');
      expect(normalizeText('Line1<br />Line2')).toBe('Line1\nLine2');
    });

    it('should convert \\n to actual newlines', () => {
      expect(normalizeText('Line1\\nLine2')).toBe('Line1\nLine2');
    });

    it('should remove Mermaid formatting tags', () => {
      expect(normalizeText('Normal<sub>sub</sub>text'))
        .toBe('Normalsubtext');
      expect(normalizeText('Normal<small>small</small>text'))
        .toBe('Normalsmalltext');
      expect(normalizeText('Normal<i>italic</i>text'))
        .toBe('Normalitalictext');
    });

    it('should trim whitespace', () => {
      expect(normalizeText('  text  ')).toBe('text');
    });

    it('should handle empty string', () => {
      expect(normalizeText('')).toBe('');
    });
  });

  describe('cleanText', () => {
    it('should apply all cleaning steps', () => {
      const input = '**Bold** with `code` and <br> newline\\n and fa:fa-icon';
      const result = cleanText(input, 'markdown');
      expect(result).toContain('Bold');
      expect(result).toContain('code');
      expect(result).not.toContain('**');
      expect(result).not.toContain('fa:fa-icon');
    });

    it('should handle markdown label type', () => {
      expect(cleanText('**Bold** text', 'markdown')).toBe('Bold text');
    });

    it('should handle text label type', () => {
      expect(cleanText('**Bold** text', 'text')).toContain('Bold');
    });

    it('should handle empty string', () => {
      expect(cleanText('')).toBe('');
    });
  });

  describe('parseStyleString', () => {
    it('should parse simple style', () => {
      expect(parseStyleString('fill:#fff')).toEqual({ fill: '#fff' });
    });

    it('should parse multiple styles', () => {
      expect(parseStyleString('fill:#fff;stroke:#000;stroke-width:2'))
        .toEqual({
          fill: '#fff',
          stroke: '#000',
          'stroke-width': '2',
        });
    });

    it('should handle spaces', () => {
      expect(parseStyleString('fill: #fff ; stroke: #000'))
        .toEqual({
          fill: '#fff',
          stroke: '#000',
        });
    });

    it('should handle empty/null input', () => {
      expect(parseStyleString('')).toEqual({});
      expect(parseStyleString(null)).toEqual({});
      expect(parseStyleString(undefined)).toEqual({});
    });

    it('should handle malformed entries', () => {
      expect(parseStyleString('fill:#fff;malformed;stroke:#000'))
        .toEqual({
          fill: '#fff',
          stroke: '#000',
        });
    });
  });

  describe('convertContainerStyle', () => {
    it('should convert fill color', () => {
      expect(convertContainerStyle({ fill: '#fff' }))
        .toEqual({ fill: '#fff' });
    });

    it('should convert stroke', () => {
      expect(convertContainerStyle({ stroke: '#000' }))
        .toEqual({ strokeColor: '#000' });
    });

    it('should convert stroke width', () => {
      expect(convertContainerStyle({ strokeWidth: '2px' }))
        .toEqual({ strokeWidth: 2 });
      expect(convertContainerStyle({ strokeWidth: '2' }))
        .toEqual({ strokeWidth: 2 });
    });

    it('should convert stroke dasharray to dashed style', () => {
      expect(convertContainerStyle({ strokeDasharray: '5,5' }))
        .toEqual({ strokeStyle: 'dashed' });
    });

    it('should combine multiple properties', () => {
      expect(convertContainerStyle({
        fill: '#fff',
        stroke: '#000',
        strokeWidth: '2',
      })).toEqual({
        fill: '#fff',
        strokeColor: '#000',
        strokeWidth: 2,
      });
    });
  });

  describe('convertLabelStyle', () => {
    it('should convert color', () => {
      expect(convertLabelStyle({ color: '#fff' }))
        .toEqual({ color: '#fff' });
    });

    it('should handle empty style', () => {
      expect(convertLabelStyle({})).toEqual({});
    });
  });

  describe('isValidMermaidDefinition', () => {
    it('should accept flowchart definitions', () => {
      expect(isValidMermaidDefinition('flowchart TD\n A-->B')).toBe(true);
      expect(isValidMermaidDefinition('flowchart LR\n A-->B')).toBe(true);
    });

    it('should accept graph definitions', () => {
      expect(isValidMermaidDefinition('graph TD\n A-->B')).toBe(true);
      expect(isValidMermaidDefinition('graph LR\n A-->B')).toBe(true);
    });

    it('should accept sequence diagrams', () => {
      expect(isValidMermaidDefinition('sequenceDiagram\n A->>B: Hello')).toBe(true);
    });

    it('should accept class diagrams', () => {
      expect(isValidMermaidDefinition('classDiagram\n A --> B')).toBe(true);
    });

    it('should accept state diagrams', () => {
      expect(isValidMermaidDefinition('stateDiagram-v2\n A --> B')).toBe(true);
    });

    it('should reject empty string', () => {
      expect(isValidMermaidDefinition('')).toBe(false);
      expect(isValidMermaidDefinition('   ')).toBe(false);
    });

    it('should reject non-mermaid text', () => {
      expect(isValidMermaidDefinition('This is just text')).toBe(false);
    });

    it('should be case insensitive for first word', () => {
      expect(isValidMermaidDefinition('FLOWCHART TD\n A-->B')).toBe(true);
      expect(isValidMermaidDefinition('FlowChart TD\n A-->B')).toBe(true);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should use custom prefix', () => {
      const id = generateId('test');
      expect(id.substring(0, 5)).toBe('test-');
    });

    it('should use default prefix', () => {
      const id = generateId();
      expect(id.substring(0, 4)).toBe('mtt-');
    });
  });

  describe('safeNumber', () => {
    it('should return number input', () => {
      expect(safeNumber(42, 0)).toBe(42);
      expect(safeNumber(3.14, 0)).toBe(3.14);
    });

    it('should parse string numbers', () => {
      expect(safeNumber('42', 0)).toBe(42);
      expect(safeNumber('3.14', 0)).toBe(3.14);
    });

    it('should return default for NaN', () => {
      expect(safeNumber(NaN, 10)).toBe(10);
      expect(safeNumber('not a number', 10)).toBe(10);
    });

    it('should return default for invalid types', () => {
      expect(safeNumber(null, 10)).toBe(10);
      expect(safeNumber(undefined, 10)).toBe(10);
      expect(safeNumber({}, 10)).toBe(10);
    });
  });

  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined('')).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
    });
  });
});
