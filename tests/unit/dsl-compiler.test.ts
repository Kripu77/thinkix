import { describe, it, expect } from 'vitest';
import { compileDSL, SHAPE_MAP, STICKY_COLORS } from '@/features/agent/tools/dsl/compiler';
import type { DslNode } from '@/features/agent/tools/dsl/types';

describe('dsl-compiler', () => {
  it('compiles shape to geometry element', () => {
    const statements: DslNode[] = [
      { type: 'shape', shape: 'rect', text: 'My Box' },
    ];
    const result = compileDSL(statements);
    
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0]).toMatchObject({
      type: 'geometry',
      shape: SHAPE_MAP.rect,
    });
  });

  it('maps shape aliases correctly', () => {
    const aliases = ['rect', 'ellipse', 'diamond', 'roundRect', 'cloud'] as const;
    for (const alias of aliases) {
      const statements: DslNode[] = [
        { type: 'shape', shape: alias, text: 'Test' },
      ];
      const result = compileDSL(statements);
      expect(result.elements[0]).toMatchObject({
        shape: SHAPE_MAP[alias],
      });
    }
  });

  it('compiles sticky note with color', () => {
    const statements: DslNode[] = [
      { type: 'sticky', text: 'Note', color: 'blue' },
    ];
    const result = compileDSL(statements);
    
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0]).toMatchObject({
      type: 'geometry',
      fill: STICKY_COLORS.blue.fill,
      strokeColor: STICKY_COLORS.blue.stroke,
      fillStyle: 'solid',
    });
  });

  it('defaults sticky color to yellow', () => {
    const statements: DslNode[] = [
      { type: 'sticky', text: 'Note' },
    ];
    const result = compileDSL(statements);
    
    expect(result.elements[0]).toMatchObject({
      fill: STICKY_COLORS.yellow.fill,
    });
  });

  it('compiles text element', () => {
    const statements: DslNode[] = [
      { type: 'text', text: 'Free text' },
    ];
    const result = compileDSL(statements);
    
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0]).toMatchObject({
      type: 'geometry',
      shape: 'text',
    });
  });

  it('collects connect nodes separately', () => {
    const statements: DslNode[] = [
      { type: 'connect', sourceId: 'a', targetId: 'b' },
    ];
    const result = compileDSL(statements);
    
    expect(result.elements).toHaveLength(0);
    expect(result.connects).toHaveLength(1);
    expect(result.connects[0]).toEqual({
      type: 'connect',
      sourceId: 'a',
      targetId: 'b',
    });
  });

  it('collects mindmap nodes separately', () => {
    const statements: DslNode[] = [
      { type: 'mindmap', root: { text: 'Root' } },
    ];
    const result = compileDSL(statements);
    
    expect(result.mindmaps).toHaveLength(1);
    expect(result.mindmaps[0].root.text).toBe('Root');
  });

  it('collects mermaid nodes separately', () => {
    const statements: DslNode[] = [
      { type: 'mermaid', code: 'flowchart TD\n  A --> B' },
    ];
    const result = compileDSL(statements);
    
    expect(result.mermaids).toHaveLength(1);
    expect(result.mermaids[0].code).toContain('flowchart');
  });

  it('collects patch nodes separately', () => {
    const statements: DslNode[] = [
      { type: 'patch', id: 'abc123', props: { text: 'New text' } },
    ];
    const result = compileDSL(statements);
    
    expect(result.patches).toHaveLength(1);
    expect(result.patches[0]).toEqual({
      id: 'abc123',
      props: { text: 'New text' },
    });
  });

  it('extracts layout hint for grid', () => {
    const statements: DslNode[] = [
      { type: 'layout', mode: 'grid' },
    ];
    const result = compileDSL(statements);
    
    expect(result.layout).toBe('grid');
  });

  it('extracts layout hint for row', () => {
    const statements: DslNode[] = [
      { type: 'layout', mode: 'row' },
    ];
    const result = compileDSL(statements);
    
    expect(result.layout).toBe('row');
  });

  it('extracts layout hint for near', () => {
    const statements: DslNode[] = [
      { type: 'layout', mode: 'near', nearId: 'abc123' },
    ];
    const result = compileDSL(statements);
    
    expect(result.layout).toEqual({ near: 'abc123' });
  });

  it('generates unique IDs for elements without ids', () => {
    const statements: DslNode[] = [
      { type: 'shape', shape: 'rect', text: 'A' },
      { type: 'shape', shape: 'rect', text: 'B' },
    ];
    const result = compileDSL(statements);
    
    const id1 = (result.elements[0] as { id: string }).id;
    const id2 = (result.elements[1] as { id: string }).id;
    expect(id1).not.toBe(id2);
    expect(id1).toBeTruthy();
  });

  it('uses provided id for element', () => {
    const statements: DslNode[] = [
      { type: 'shape', shape: 'rect', text: 'Box', id: 'myCustomId' },
    ];
    const result = compileDSL(statements);
    
    expect((result.elements[0] as { id: string }).id).toBe('myCustomId');
  });

  it('sets text with Slate format', () => {
    const statements: DslNode[] = [
      { type: 'shape', shape: 'rect', text: 'Hello World' },
    ];
    const result = compileDSL(statements);
    
    const text = (result.elements[0] as { text: { children: { text: string }[]; autoSize: boolean } }).text;
    expect(text.children[0].text).toBe('Hello World');
    expect(text.autoSize).toBe(true);
  });
});
