import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('dompurify', () => ({
  default: {
    addHook: vi.fn(),
    removeHook: vi.fn(),
    sanitize: vi.fn((text) => text),
  },
}));

vi.mock('d3-selection', () => ({
  default: {
    select: vi.fn(() => ({
      append: vi.fn(),
      attr: vi.fn(),
      style: vi.fn(),
      node: vi.fn(),
    })),
  },
}));

describe('mermaid-parser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateMermaidDefinition', () => {
    it('should validate flowchart definitions', async () => {
      const { validateMermaidDefinition } = await import('@thinkix/mermaid-to-thinkix');

      expect(validateMermaidDefinition('flowchart TD\n A-->B')).toBe(true);
    });

    it('should validate graph definitions (legacy)', async () => {
      const { validateMermaidDefinition } = await import('@thinkix/mermaid-to-thinkix');

      expect(validateMermaidDefinition('graph LR\n A-->B')).toBe(true);
    });

    it('should validate sequenceDiagram definitions', async () => {
      const { validateMermaidDefinition } = await import('@thinkix/mermaid-to-thinkix');

      expect(validateMermaidDefinition('sequenceDiagram\n A->>B: Hello')).toBe(true);
    });

    it('should validate classDiagram definitions', async () => {
      const { validateMermaidDefinition } = await import('@thinkix/mermaid-to-thinkix');

      expect(validateMermaidDefinition('classDiagram\n class A')).toBe(true);
    });

    it('should return false for empty string', async () => {
      const { validateMermaidDefinition } = await import('@thinkix/mermaid-to-thinkix');

      expect(validateMermaidDefinition('')).toBe(false);
    });

    it('should return false for whitespace-only string', async () => {
      const { validateMermaidDefinition } = await import('@thinkix/mermaid-to-thinkix');

      expect(validateMermaidDefinition('   \n  ')).toBe(false);
    });

    it('should return false for invalid mermaid syntax', async () => {
      const { validateMermaidDefinition } = await import('@thinkix/mermaid-to-thinkix');

      expect(validateMermaidDefinition('not a mermaid diagram')).toBe(false);
    });

    it('should be case-insensitive for diagram type', async () => {
      const { validateMermaidDefinition } = await import('@thinkix/mermaid-to-thinkix');

      expect(validateMermaidDefinition('FLOWCHART TD\n A-->B')).toBe(true);
      expect(validateMermaidDefinition('FlowChart TD\n A-->B')).toBe(true);
    });
  });

  describe('utils functions', () => {
    describe('encodeEntities', () => {
      it('should encode numeric entity codes', async () => {
        const { encodeEntities } = await import('@thinkix/mermaid-to-thinkix');

        const result = encodeEntities('Text #9829; more');
        expect(result).toContain('°°');
      });

      it('should remove color entity codes from styles', async () => {
        const { encodeEntities } = await import('@thinkix/mermaid-to-thinkix');

        const result = encodeEntities('classDef A fill:#f9f,stroke:#333');    
        expect(result).toContain('fill:');
      });
    });

    describe('decodeEntities', () => {
      it('should decode encoded entities', async () => {
        const { decodeEntities } = await import('@thinkix/mermaid-to-thinkix');

        const result = decodeEntities('°°9829¶ß');
        expect(result).toContain('#');
        expect(result).toContain(';');
      });
    });

    describe('entityCodesToText', () => {
      it('should convert entity codes to characters', async () => {
        const { entityCodesToText } = await import('@thinkix/mermaid-to-thinkix');

        const result = entityCodesToText('#9829;');
        expect(result).toBe('♥');
      });

      it('should handle multiple entity codes', async () => {
        const { entityCodesToText } = await import('@thinkix/mermaid-to-thinkix');

        const result = entityCodesToText('#9829; and #9824;');
        expect(result).toContain('♥');
        expect(result).toContain('♠');
      });
    });

    describe('removeMarkdown', () => {
      it('should remove bold markdown', async () => {
        const { removeMarkdown } = await import('@thinkix/mermaid-to-thinkix');

        expect(removeMarkdown('**bold**')).toBe('bold');
        expect(removeMarkdown('__bold__')).toBe('bold');
      });

      it('should remove italic markdown', async () => {
        const { removeMarkdown } = await import('@thinkix/mermaid-to-thinkix');

        expect(removeMarkdown('*italic*')).toBe('italic');
        expect(removeMarkdown('_italic_')).toBe('italic');
      });

      it('should remove inline code', async () => {
        const { removeMarkdown } = await import('@thinkix/mermaid-to-thinkix');

        expect(removeMarkdown('`code`')).toBe('code');
      });

      it('should remove links but keep text', async () => {
        const { removeMarkdown } = await import('@thinkix/mermaid-to-thinkix');

        expect(removeMarkdown('[text](url)')).toBe('text');
      });

      it('should remove strikethrough', async () => {
        const { removeMarkdown } = await import('@thinkix/mermaid-to-thinkix');

        expect(removeMarkdown('~~deleted~~')).toBe('deleted');
      });
    });

    describe('removeFontAwesomeIcons', () => {
      it('should remove fa: icon references', async () => {
        const { removeFontAwesomeIcons } = await import('@thinkix/mermaid-to-thinkix');

        expect(removeFontAwesomeIcons('Text fa:fa-icon')).toBe('Text');
      });

      it('should remove fab: icon references', async () => {
        const { removeFontAwesomeIcons } = await import('@thinkix/mermaid-to-thinkix');

        expect(removeFontAwesomeIcons('Text fab:fa-twitter')).toBe('Text');
      });

      it('should handle multiple icons', async () => {
        const { removeFontAwesomeIcons } = await import('@thinkix/mermaid-to-thinkix');

        expect(removeFontAwesomeIcons('Text fa:fa-icon fab:fa-brand')).toBe('Text');
      });
    });

    describe('normalizeText', () => {
      it('should convert <br> to newline', async () => {
        const { normalizeText } = await import('@thinkix/mermaid-to-thinkix');

        expect(normalizeText('Line1<br>Line2')).toBe('Line1\nLine2');
      });

      it('should convert <br/> to newline', async () => {
        const { normalizeText } = await import('@thinkix/mermaid-to-thinkix');

        expect(normalizeText('Line1<br/>Line2')).toBe('Line1\nLine2');
      });

      it('should convert \\n to newline', async () => {
        const { normalizeText } = await import('@thinkix/mermaid-to-thinkix');

        expect(normalizeText('Line1\\nLine2')).toBe('Line1\nLine2');
      });

      it('should remove sub tags', async () => {
        const { normalizeText } = await import('@thinkix/mermaid-to-thinkix');

        expect(normalizeText('<sub>subscript</sub>')).toBe('subscript');
      });

      it('should trim whitespace', async () => {
        const { normalizeText } = await import('@thinkix/mermaid-to-thinkix');

        expect(normalizeText('  text  ')).toBe('text');
      });
    });

    describe('cleanText', () => {
      it('should combine all cleaning operations for markdown', async () => {
        const { cleanText } = await import('@thinkix/mermaid-to-thinkix');

        const result = cleanText('**bold** fa:fa-icon', 'markdown');
        expect(result).toBe('bold');
      });

      it('should combine all cleaning operations for text', async () => {
        const { cleanText } = await import('@thinkix/mermaid-to-thinkix');

        const result = cleanText('text fa:fa-icon');
        expect(result).toBe('text');
      });
    });

    describe('parseStyleString', () => {
      it('should parse simple style string', async () => {
        const { parseStyleString } = await import('@thinkix/mermaid-to-thinkix');

        const result = parseStyleString('fill: red; stroke: blue');
        expect(result.fill).toBe('red');
        expect(result.stroke).toBe('blue');
      });

      it('should handle style string with spaces', async () => {
        const { parseStyleString } = await import('@thinkix/mermaid-to-thinkix');

        const result = parseStyleString('fill: red ; stroke: blue');
        expect(result.fill).toBe('red');
        expect(result.stroke).toBe('blue');
      });

      it('should handle empty style string', async () => {
        const { parseStyleString } = await import('@thinkix/mermaid-to-thinkix');

        const result = parseStyleString('');
        expect(result).toEqual({});
      });

      it('should handle null/undefined', async () => {
        const { parseStyleString } = await import('@thinkix/mermaid-to-thinkix');

        expect(parseStyleString(null)).toEqual({});
        expect(parseStyleString(undefined)).toEqual({});
      });
    });

    describe('safeNumber', () => {
      it('should return number for valid input', async () => {
        const { safeNumber } = await import('@thinkix/mermaid-to-thinkix');

        expect(safeNumber(42, 0)).toBe(42);
        expect(safeNumber('42', 0)).toBe(42);
      });

      it('should return default for NaN', async () => {
        const { safeNumber } = await import('@thinkix/mermaid-to-thinkix');

        expect(safeNumber(NaN, 0)).toBe(0);
        expect(safeNumber('invalid', 0)).toBe(0);
      });

      it('should return default for null/undefined', async () => {
        const { safeNumber } = await import('@thinkix/mermaid-to-thinkix');

        expect(safeNumber(null, 0)).toBe(0);
        expect(safeNumber(undefined, 100)).toBe(100);
      });
    });

    describe('isDefined', () => {
      it('should return false for null', async () => {
        const { isDefined } = await import('@thinkix/mermaid-to-thinkix');

        expect(isDefined(null)).toBe(false);
      });

      it('should return false for undefined', async () => {
        const { isDefined } = await import('@thinkix/mermaid-to-thinkix');

        expect(isDefined(undefined)).toBe(false);
      });

      it('should return true for defined values', async () => {
        const { isDefined } = await import('@thinkix/mermaid-to-thinkix');

        expect(isDefined(0)).toBe(true);
        expect(isDefined('')).toBe(true);
        expect(isDefined(false)).toBe(true);
      });
    });

    describe('generateId', () => {
      it('should generate unique IDs', async () => {
        const { generateId } = await import('@thinkix/mermaid-to-thinkix');

        const id1 = generateId();
        const id2 = generateId();

        expect(id1).not.toBe(id2);
      });

      it('should use custom prefix', async () => {
        const { generateId } = await import('@thinkix/mermaid-to-thinkix');

        const id = generateId('test');
        expect(id).toMatch(/^test-/);
      });
    });

    describe('getTransformAttr', () => {
      it('should extract translate values', async () => {
        const { getTransformAttr } = await import('@thinkix/mermaid-to-thinkix');
        if (typeof document !== 'undefined') {
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGRectElement;
          rect.setAttribute('transform', 'translate(100, 50)');

          const result = getTransformAttr(rect);
          expect(result.transformX).toBe(100);
          expect(result.transformY).toBe(50);
        }
      });

      it('should handle no transform', async () => {
        const { getTransformAttr } = await import('@thinkix/mermaid-to-thinkix');
        if (typeof document !== 'undefined') {
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGRectElement;

          const result = getTransformAttr(rect);
          expect(result.transformX).toBe(0);
          expect(result.transformY).toBe(0);
        }
      });

      it('should handle invalid transform', async () => {
        const { getTransformAttr } = await import('@thinkix/mermaid-to-thinkix');
        if (typeof document !== 'undefined') {
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGRectElement;
          rect.setAttribute('transform', 'invalid');

          const result = getTransformAttr(rect);
          expect(result.transformX).toBe(0);
          expect(result.transformY).toBe(0);
        }
      });

      it('should handle decimal values', async () => {
        const { getTransformAttr } = await import('@thinkix/mermaid-to-thinkix');
        if (typeof document !== 'undefined') {
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGRectElement;
          rect.setAttribute('transform', 'translate(10.5, 20.7)');

          const result = getTransformAttr(rect);
          expect(result.transformX).toBe(10.5);
          expect(result.transformY).toBe(20.7);
        }
      });

      it('should handle negative values', async () => {
        const { getTransformAttr } = await import('@thinkix/mermaid-to-thinkix');
        if (typeof document !== 'undefined') {
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGRectElement;
          rect.setAttribute('transform', 'translate(-10, -20)');

          const result = getTransformAttr(rect);
          expect(result.transformX).toBe(-10);
          expect(result.transformY).toBe(-20);
        }
      });
    });
  });

  describe('constants', () => {
    it('should export DEFAULT_FONT_SIZE', async () => {
      const { DEFAULT_FONT_SIZE } = await import('@thinkix/mermaid-to-thinkix');

      expect(DEFAULT_FONT_SIZE).toBe(16);
    });

    it('should export MERMAID_CONFIG', async () => {
      const { MERMAID_CONFIG } = await import('@thinkix/mermaid-to-thinkix');

      expect(MERMAID_CONFIG).toBeDefined();
      expect(MERMAID_CONFIG.startOnLoad).toBe(false);
    });

    it('should export VERTEX_SHAPE_MAP', async () => {
      const { VERTEX_SHAPE_MAP } = await import('@thinkix/mermaid-to-thinkix');

      expect(VERTEX_SHAPE_MAP).toBeDefined();
      expect(VERTEX_SHAPE_MAP.stadium).toBe('stadium');
      expect(VERTEX_SHAPE_MAP.diamond).toBe('diamond');
    });

    it('should export EDGE_MARKER_MAP', async () => {
      const { EDGE_MARKER_MAP } = await import('@thinkix/mermaid-to-thinkix');

      expect(EDGE_MARKER_MAP).toBeDefined();
      expect(EDGE_MARKER_MAP.arrow_point).toEqual({ source: 'none', target: 'arrow' });
    });

    it('should export MIN_POINT_DISTANCE', async () => {
      const { MIN_POINT_DISTANCE } = await import('@thinkix/mermaid-to-thinkix');

      expect(MIN_POINT_DISTANCE).toBe(20);
    });

    it('should export SUBGRAPH_PADDING', async () => {
      const { SUBGRAPH_PADDING } = await import('@thinkix/mermaid-to-thinkix');

      expect(SUBGRAPH_PADDING).toBe(60);
    });
  });

  describe('parseMermaidToBoard - integration', () => {
    it('should parse flowchart and return elements array', async () => {
      const { parseMermaidToBoard } = await import('@thinkix/mermaid-to-thinkix');

      const result = await parseMermaidToBoard('flowchart TD\n A-->B');

      expect(result.elements).toBeInstanceOf(Array);
      expect(result.warnings).toBeInstanceOf(Array);
    });

    it('should return warnings when present', async () => {
      const { parseMermaidToBoard } = await import('@thinkix/mermaid-to-thinkix');

      const result = await parseMermaidToBoard('flowchart TD\n A-->B');

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should handle invalid mermaid syntax gracefully', async () => {
      const { parseMermaidToBoard } = await import('@thinkix/mermaid-to-thinkix');

      await expect(parseMermaidToBoard('not valid mermaid syntax')).rejects.toThrow();
    });

    it('should apply font scaling for Thinkix rendering', async () => {
      const { parseMermaidToBoard } = await import('@thinkix/mermaid-to-thinkix');

      const result = await parseMermaidToBoard('flowchart TD\n A-->B', {
        themeVariables: { fontSize: '16px' },
      });

      expect(result).toBeDefined();
      expect(result.elements).toBeDefined();
    });

    it('should fallback to graphImage for unsupported diagram types', async () => {
      const { parseMermaidToBoard } = await import('@thinkix/mermaid-to-thinkix');

      const result = await parseMermaidToBoard('pie title Demo\n "A": 50\n "B": 50');

      expect(result.elements).toBeDefined();
      expect(result.elements.length).toBeGreaterThan(0);
      expect(result.warnings).toBeInstanceOf(Array);
    });
  });

  describe('DOM guards', () => {
    it('should identify SVG elements correctly', async () => {
      const { isSVGElement } = await import('@thinkix/mermaid-to-thinkix');

      if (typeof document === 'undefined') {
        return;
      }

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const div = document.createElement('div');

      expect(isSVGElement(svg)).toBe(true);
      expect(isSVGElement(rect)).toBe(true);
      expect(isSVGElement(div)).toBe(false);
    });

    it('should identify SVGRectElement correctly', async () => {
      const { isSVGRectElement } = await import('@thinkix/mermaid-to-thinkix');

      if (typeof document === 'undefined') {
        return;
      }

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      expect(isSVGRectElement(rect)).toBe(true);
      expect(isSVGRectElement(svg)).toBe(false);
    });

    it('should identify SVGGraphicsElement correctly', async () => {
      const { isSVGGraphicsElement } = await import('@thinkix/mermaid-to-thinkix');

      if (typeof document === 'undefined') {
        return;
      }

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const div = document.createElement('div');

      expect(isSVGGraphicsElement(rect)).toBe(true);
      expect(isSVGGraphicsElement(svg)).toBe(true);
      expect(isSVGGraphicsElement(div)).toBe(false);
    });

    it('should throw TypeError on invalid assertion for SVGRectElement', async () => {
      const { assertSVGRectElement } = await import('@thinkix/mermaid-to-thinkix');

      if (typeof document === 'undefined') {
        return;
      }

      const div = document.createElement('div');

      expect(() => assertSVGRectElement(div))
        .toThrow('Expected SVGRectElement');
    });

    it('should throw TypeError on invalid assertion for SVGGraphicsElement', async () => {
      const { assertSVGGraphicsElement } = await import('@thinkix/mermaid-to-thinkix');

      if (typeof document === 'undefined') {
        return;
      }

      const div = document.createElement('div');

      expect(() => assertSVGGraphicsElement(div))
        .toThrow('Expected SVGGraphicsElement');
    });
  });
});
