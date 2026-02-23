import { describe, it, expect } from 'vitest';
import { parseMarkdownToMindElement } from '@thinkix/plait-utils';
import type { MindElement } from '@plait/mind';

function getNodeText(node: MindElement | null | undefined): string {
  const data = node?.data as { topic?: { children?: { text?: string }[] } } | undefined;
  return data?.topic?.children?.[0]?.text ?? '';
}

describe('markdown-parser', () => {
  describe('parseMarkdownToMindElement', () => {
    describe('edge cases', () => {
      it('should return null for empty string', () => {
        expect(parseMarkdownToMindElement('')).toBeNull();
      });

      it('should return null for whitespace only', () => {
        expect(parseMarkdownToMindElement('   \n\n   ')).toBeNull();
      });

      it('should return null for only blank lines', () => {
        expect(parseMarkdownToMindElement('\n\n\n')).toBeNull();
      });

      it('should use default "Mind Map" for list-only input', () => {
        const result = parseMarkdownToMindElement('- Item 1\n- Item 2');
        expect(result).not.toBeNull();
        expect(getNodeText(result)).toBe('Mind Map');
      });
    });

    describe('headings', () => {
      it('should parse single heading as root', () => {
        const result = parseMarkdownToMindElement('# Root Topic');
        
        expect(result).not.toBeNull();
        expect(getNodeText(result)).toBe('Root Topic');
        expect(result!.children).toEqual([]);
      });

      it('should handle h1 through h6', () => {
        for (let i = 1; i <= 6; i++) {
          const result = parseMarkdownToMindElement(`${'#'.repeat(i)} Topic`);
          expect(result).not.toBeNull();
          expect(getNodeText(result)).toBe('Topic');
        }
      });

      it('should handle heading with extra whitespace', () => {
        const result = parseMarkdownToMindElement('#   Spaced Topic   ');
        expect(getNodeText(result)).toBe('Spaced Topic');
      });

      it('should nest headings by depth', () => {
        const markdown = `# Main
## Subtopic
### Deep`;
        
        const result = parseMarkdownToMindElement(markdown);
        
        expect(result).not.toBeNull();
        expect(getNodeText(result)).toBe('Main');
        expect(result!.children).toHaveLength(1);
        
        const subtopic = result!.children![0];
        expect(getNodeText(subtopic)).toBe('Subtopic');
        expect(subtopic.children).toHaveLength(1);
        expect(getNodeText(subtopic.children![0])).toBe('Deep');
      });

      it('should handle sibling headings at same depth', () => {
        const markdown = `# Root
## A
## B
## C`;
        
        const result = parseMarkdownToMindElement(markdown);
        
        expect(result).not.toBeNull();
        expect(result!.children).toHaveLength(3);
        expect(getNodeText(result!.children![0])).toBe('A');
        expect(getNodeText(result!.children![1])).toBe('B');
        expect(getNodeText(result!.children![2])).toBe('C');
      });

      it('should use first unique-depth heading as root', () => {
        const markdown = `# Root Topic
## Sub 1
## Sub 2`;
        
        const result = parseMarkdownToMindElement(markdown);
        
        expect(result).not.toBeNull();
        expect(getNodeText(result)).toBe('Root Topic');
        expect(result!.children).toHaveLength(2);
      });

      it('should not use heading as root if multiple at same depth', () => {
        const markdown = `## A
## B`;
        
        const result = parseMarkdownToMindElement(markdown);
        
        expect(result).not.toBeNull();
        expect(getNodeText(result)).toBe('Mind Map');
        expect(result!.children).toHaveLength(2);
      });
    });

    describe('lists', () => {
      it('should parse list items as children', () => {
        const markdown = `# Root
- Item 1
- Item 2
- Item 3`;
        
        const result = parseMarkdownToMindElement(markdown);
        
        expect(result).not.toBeNull();
        expect(result!.children).toHaveLength(3);
        expect(getNodeText(result!.children![0])).toBe('Item 1');
        expect(getNodeText(result!.children![1])).toBe('Item 2');
        expect(getNodeText(result!.children![2])).toBe('Item 3');
      });

      it('should handle asterisk bullets', () => {
        const markdown = `# Root
* Item A
* Item B`;
        
        const result = parseMarkdownToMindElement(markdown);
        
        expect(result!.children).toHaveLength(2);
        expect(getNodeText(result!.children![0])).toBe('Item A');
      });

      it('should handle plus bullets', () => {
        const markdown = `# Root
+ Item X
+ Item Y`;
        
        const result = parseMarkdownToMindElement(markdown);
        
        expect(result!.children).toHaveLength(2);
        expect(getNodeText(result!.children![0])).toBe('Item X');
      });

      it('should skip empty lines between items', () => {
        const markdown = `# Root

- Item 1

- Item 2`;
        
        const result = parseMarkdownToMindElement(markdown);
        
        expect(result!.children).toHaveLength(2);
      });
    });

    describe('nested lists', () => {
      it('should handle single level nesting', () => {
        const markdown = `# Root
- Parent
  - Child`;
        
        const result = parseMarkdownToMindElement(markdown);
        
        expect(result).not.toBeNull();
        expect(result!.children).toHaveLength(1);
        
        const parent = result!.children![0];
        expect(getNodeText(parent)).toBe('Parent');
        expect(parent.children).toHaveLength(1);
        expect(getNodeText(parent.children![0])).toBe('Child');
      });

      it('should NOT concatenate child text into parent', () => {
        const markdown = `# Root
- Mobile App
  - iOS version
  - Android version`;
        
        const result = parseMarkdownToMindElement(markdown);
        
        const parent = result!.children![0];
        expect(getNodeText(parent)).toBe('Mobile App');
        expect(getNodeText(parent)).not.toContain('iOS');
        expect(getNodeText(parent)).not.toContain('Android');
      });

      it('should handle multiple nested items under same parent', () => {
        const markdown = `# Root
- Frontend
  - React
  - Vue
  - Angular`;
        
        const result = parseMarkdownToMindElement(markdown);
        
        const frontend = result!.children![0];
        expect(getNodeText(frontend)).toBe('Frontend');
        expect(frontend.children).toHaveLength(3);
        expect(getNodeText(frontend.children![0])).toBe('React');
        expect(getNodeText(frontend.children![1])).toBe('Vue');
        expect(getNodeText(frontend.children![2])).toBe('Angular');
      });

      it('should handle deep nesting (3 levels)', () => {
        const markdown = `# Root
- L1
  - L2
    - L3`;
        
        const result = parseMarkdownToMindElement(markdown);
        
        const l1 = result!.children![0];
        expect(getNodeText(l1)).toBe('L1');
        
        const l2 = l1.children![0];
        expect(getNodeText(l2)).toBe('L2');
        
        const l3 = l2.children![0];
        expect(getNodeText(l3)).toBe('L3');
      });

      it('should handle mixed depth nesting', () => {
        const markdown = `# Root
- A
  - A1
- B
  - B1
    - B1a
  - B2`;
        
        const result = parseMarkdownToMindElement(markdown);
        
        expect(result!.children).toHaveLength(2);
        
        const a = result!.children![0];
        expect(getNodeText(a)).toBe('A');
        expect(a.children).toHaveLength(1);
        
        const b = result!.children![1];
        expect(getNodeText(b)).toBe('B');
        expect(b.children).toHaveLength(2);
        
        const b1 = b.children![0];
        expect(b1.children).toHaveLength(1);
        expect(getNodeText(b1.children![0])).toBe('B1a');
      });

      it('should handle siblings at different depths', () => {
        const markdown = `# Root
- Top 1
  - Nested 1
- Top 2
  - Nested 2
    - Deep 2`;
        
        const result = parseMarkdownToMindElement(markdown);
        
        expect(result!.children).toHaveLength(2);
        
        const top1 = result!.children![0];
        expect(top1.children).toHaveLength(1);
        
        const top2 = result!.children![1];
        expect(top2.children).toHaveLength(1);
        expect(top2.children![0].children).toHaveLength(1);
      });
    });

    describe('complex examples', () => {
      it('should parse the example markdown correctly', () => {
        const markdown = `# Project Ideas

- Mobile App
  - iOS version
  - Android version
- Web Platform
  - Frontend
    - React
    - Vue
  - Backend
    - Node.js
    - Python
- Documentation
  - API docs
  - User guides`;
        
        const result = parseMarkdownToMindElement(markdown);
        
        expect(result).not.toBeNull();
        expect(getNodeText(result)).toBe('Project Ideas');
        expect(result!.children).toHaveLength(3);
        
        // Mobile App
        const mobile = result!.children![0];
        expect(getNodeText(mobile)).toBe('Mobile App');
        expect(mobile.children).toHaveLength(2);
        expect(getNodeText(mobile.children![0])).toBe('iOS version');
        expect(getNodeText(mobile.children![1])).toBe('Android version');
        
        // Web Platform
        const web = result!.children![1];
        expect(getNodeText(web)).toBe('Web Platform');
        expect(web.children).toHaveLength(2);
        
        const frontend = web.children![0];
        expect(getNodeText(frontend)).toBe('Frontend');
        expect(frontend.children).toHaveLength(2);
        
        const backend = web.children![1];
        expect(getNodeText(backend)).toBe('Backend');
        expect(backend.children).toHaveLength(2);
        
        // Documentation
        const docs = result!.children![2];
        expect(getNodeText(docs)).toBe('Documentation');
        expect(docs.children).toHaveLength(2);
      });

      it('should handle heading followed by list then heading', () => {
        const markdown = `# Topic A
- Item A1
## Topic B
- Item B1`;
        
        const result = parseMarkdownToMindElement(markdown);
        
        expect(getNodeText(result)).toBe('Topic A');
        expect(result!.children).toHaveLength(2);
        
        // First child is the list item
        expect(getNodeText(result!.children![0])).toBe('Item A1');
        
        // Second child is Topic B heading
        const topicB = result!.children![1];
        expect(getNodeText(topicB)).toBe('Topic B');
        expect(topicB.children).toHaveLength(1);
        expect(getNodeText(topicB.children![0])).toBe('Item B1');
      });
    });

    describe('mind element properties', () => {
      it('should set isRoot to true', () => {
        const result = parseMarkdownToMindElement('# Root');
        expect(result!.isRoot).toBe(true);
      });

      it('should set type to mindmap', () => {
        const result = parseMarkdownToMindElement('# Root');
        expect((result as Record<string, unknown>).type).toBe('mindmap');
      });

      it('should set layout to right', () => {
        const result = parseMarkdownToMindElement('# Root');
        expect((result as Record<string, unknown>).layout).toBe('right');
      });
    });
  });
});
