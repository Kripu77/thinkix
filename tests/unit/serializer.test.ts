import { describe, it, expect } from 'vitest';
import {
  createSerializationContext,
  serializeElements,
  serializeElementsGrouped,
  groupElementsByDiagram,
  serializeElementWithContext,
} from '@/features/agent/tools/serializer';
import { BasicShapes } from '@plait/draw';
import type { PlaitElement } from '@plait/core';

interface MockGeometryElement extends PlaitElement {
  type: 'geometry';
  shape?: string;
  points?: [[number, number], [number, number]];
  text?: { children?: Array<{ text: string }> };
  fill?: string;
  strokeColor?: string;
  fillStyle?: string;
}

interface MockMindElement extends PlaitElement {
  type: 'mindmap';
  data?: {
    topic?: {
      children?: Array<{ text: string; children?: Array<{ text: string }> }>;
    };
  };
  children?: MockMindElement[];
}

interface MockLineElement extends PlaitElement {
  type: 'arrow-line';
  source?: { boundId?: string };
  target?: { boundId?: string };
}

describe('serializer', () => {
  it('serializes geometry as shape DSL', () => {
    const elements: MockGeometryElement[] = [
      {
        id: 'shape-1',
        type: 'geometry',
        shape: BasicShapes.rectangle,
        points: [[100, 200], [200, 300]],
        text: { children: [{ text: 'My Shape' }] },
      },
    ];
    
    const result = serializeElements(elements, 'summary');
    expect(result).toContain('shape:shape-1');
    expect(result).toContain('rect');
    expect(result).toContain('My Shape');
  });

  it('detects sticky note by fill color', () => {
    const elements: MockGeometryElement[] = [
      {
        id: 'sticky-1',
        type: 'geometry',
        shape: BasicShapes.rectangle,
        fill: '#FFEAA7',
        text: { children: [{ text: 'Sticky Note' }] },
      },
    ];
    
    const result = serializeElements(elements, 'summary');
    expect(result).toContain('sticky:sticky-1');
    expect(result).toContain('color:yellow');
  });

  it('serializes text element', () => {
    const elements: MockGeometryElement[] = [
      {
        id: 'text-1',
        type: 'geometry',
        shape: BasicShapes.text,
        text: { children: [{ text: 'Free Text' }] },
      },
    ];
    
    const result = serializeElements(elements, 'summary');
    expect(result).toContain('text:text-1');
    expect(result).toContain('Free Text');
  });

  it('includes class annotations for Mermaid class diagram elements', () => {
    const elements: MockGeometryElement[] = [
      {
        id: 'text-1',
        type: 'geometry',
        shape: BasicShapes.text,
        text: { children: [{ text: 'Trip' }] },
        metadata: { classId: 'Trip' } as { classId: string },
        groupId: 'class-group-1' as string,
      } as MockGeometryElement & {
        metadata: { classId: string };
        groupId: string;
      },
    ];

    const summary = serializeElements(elements, 'summary');
    const full = serializeElements(elements, 'full');

    expect(summary).toContain('class:Trip');
    expect(full).toContain('class:Trip');
    expect(full).toContain('group:class-group-1');
  });

  it('serializes mind element with summary', () => {
    const elements: MockMindElement[] = [
      {
        id: 'mind-1',
        type: 'mindmap',
        data: { topic: { children: [{ text: 'Root Topic' }] } },
        children: [
          { id: 'child-1', type: 'mindmap', data: { topic: { children: [{ text: 'Child' }] } } },
        ],
      },
    ];
    
    const result = serializeElements(elements, 'summary');
    expect(result).toContain('mind:mind-1');
    expect(result).toContain('Root Topic');
    expect(result).toContain('children:1');
  });

  it('serializes mind element with full child references', () => {
    const elements: MockMindElement[] = [
      {
        id: 'mind-1',
        type: 'mindmap',
        data: { topic: { children: [{ text: 'Root Topic' }] } },
        children: [
          {
            id: 'child-1',
            type: 'mindmap',
            data: { topic: { children: [{ text: 'Child Topic' }] } },
            children: [
              {
                id: 'grandchild-1',
                type: 'mindmap',
                data: { topic: { children: [{ text: 'Leaf Topic' }] } },
              },
            ],
          },
        ],
      },
    ];

    const result = serializeElements(elements, 'full');

    expect(result).toContain('mind:mind-1');
    expect(result).toContain('root: "Root Topic"');
    expect(result).toContain('- mind:child-1 "Child Topic"');
    expect(result).toContain('- mind:grandchild-1 "Leaf Topic"');
  });

  it('serializes arrow line with connections', () => {
    const elements: MockLineElement[] = [
      {
        id: 'line-1',
        type: 'arrow-line',
        source: { boundId: 'source-1' },
        target: { boundId: 'target-1' },
      },
    ];
    
    const result = serializeElements(elements, 'summary');
    expect(result).toContain('line:line-1');
    expect(result).toContain('id:source-1 -> id:target-1');
  });

  it('serializes unconnected line', () => {
    const elements: MockLineElement[] = [
      {
        id: 'line-1',
        type: 'arrow-line',
      },
    ];
    
    const result = serializeElements(elements, 'summary');
    expect(result).toContain('line:line-1');
    expect(result).toContain('unconnected');
  });

  it('caps output at 100 elements', () => {
    const elements: MockGeometryElement[] = Array.from({ length: 150 }, (_, i) => ({
      id: `shape-${i}`,
      type: 'geometry' as const,
      shape: BasicShapes.rectangle,
      text: { children: [{ text: `Shape ${i}` }] },
    }));
    
    const result = serializeElements(elements, 'summary');
    const lines = result.split('\n');
    
    expect(lines).toHaveLength(101);
    expect(lines[100]).toContain('50 more elements');
  });

  it('filters by shapes', () => {
    const elements: PlaitElement[] = [
      { id: 'shape-1', type: 'geometry', shape: BasicShapes.rectangle, text: { children: [{ text: 'A' }] } } as MockGeometryElement,
      { id: 'sticky-1', type: 'geometry', shape: BasicShapes.rectangle, fill: '#FFEAA7', text: { children: [{ text: 'B' }] } } as MockGeometryElement,
      { id: 'mind-1', type: 'mindmap' } as MockMindElement,
    ];
    
    const result = serializeElements(elements, 'summary', 'shapes');
    expect(result).toContain('shape-1');
    expect(result).not.toContain('sticky-1');
    expect(result).not.toContain('mind-1');
  });

  it('filters by stickies', () => {
    const elements: PlaitElement[] = [
      { id: 'shape-1', type: 'geometry', shape: BasicShapes.rectangle, text: { children: [{ text: 'A' }] } } as MockGeometryElement,
      { id: 'sticky-1', type: 'geometry', shape: BasicShapes.rectangle, fill: '#FFEAA7', text: { children: [{ text: 'B' }] } } as MockGeometryElement,
    ];
    
    const result = serializeElements(elements, 'summary', 'stickies');
    expect(result).not.toContain('shape-1');
    expect(result).toContain('sticky-1');
  });

  it('filters by minds', () => {
    const elements: PlaitElement[] = [
      { id: 'shape-1', type: 'geometry', shape: BasicShapes.rectangle, text: { children: [{ text: 'A' }] } } as MockGeometryElement,
      { id: 'mind-1', type: 'mindmap' } as MockMindElement,
    ];
    
    const result = serializeElements(elements, 'summary', 'minds');
    expect(result).not.toContain('shape-1');
    expect(result).toContain('mind-1');
  });

  it('includes position and size in full detail', () => {
    const elements: MockGeometryElement[] = [
      {
        id: 'shape-1',
        type: 'geometry',
        shape: BasicShapes.rectangle,
        points: [[100, 200], [300, 400]],
        text: { children: [{ text: 'Box' }] },
      },
    ];
    
    const result = serializeElements(elements, 'full');
    expect(result).toContain('at 100,200');
    expect(result).toContain('size 200x200');
  });

  it('maps shape types correctly', () => {
    const elements: MockGeometryElement[] = [
      { id: '1', type: 'geometry', shape: BasicShapes.ellipse, text: { children: [{ text: '' }] } },
      { id: '2', type: 'geometry', shape: BasicShapes.diamond, text: { children: [{ text: '' }] } },
      { id: '3', type: 'geometry', shape: BasicShapes.roundRectangle, text: { children: [{ text: '' }] } },
    ];
    
    const result = serializeElements(elements, 'summary');
    expect(result).toContain('ellipse');
    expect(result).toContain('diamond');
    expect(result).toContain('roundRect');
  });
});

describe('groupElementsByDiagram', () => {
  it('groups connected shapes into a diagram', () => {
    const elements: PlaitElement[] = [
      { id: 's1', type: 'geometry', shape: BasicShapes.rectangle, text: { children: [{ text: 'A' }] } } as MockGeometryElement,
      { id: 's2', type: 'geometry', shape: BasicShapes.rectangle, text: { children: [{ text: 'B' }] } } as MockGeometryElement,
      { id: 'l1', type: 'arrow-line', source: { boundId: 's1' }, target: { boundId: 's2' } } as MockLineElement,
    ];

    const grouped = groupElementsByDiagram(elements);
    expect(grouped.diagrams).toHaveLength(1);
    expect(grouped.diagrams[0].shapes).toHaveLength(2);
    expect(grouped.diagrams[0].lines).toHaveLength(1);
    expect(grouped.standalone).toHaveLength(0);
  });

  it('keeps unconnected shapes as standalone', () => {
    const elements: PlaitElement[] = [
      { id: 's1', type: 'geometry', shape: BasicShapes.rectangle, text: { children: [{ text: 'A' }] } } as MockGeometryElement,
      { id: 's2', type: 'geometry', shape: BasicShapes.rectangle, text: { children: [{ text: 'B' }] } } as MockGeometryElement,
    ];

    const grouped = groupElementsByDiagram(elements);
    expect(grouped.diagrams).toHaveLength(0);
    expect(grouped.standalone).toHaveLength(2);
  });

  it('keeps mind maps separate from diagrams', () => {
    const elements: PlaitElement[] = [
      { id: 's1', type: 'geometry', shape: BasicShapes.rectangle, text: { children: [{ text: 'A' }] } } as MockGeometryElement,
      { id: 's2', type: 'geometry', shape: BasicShapes.rectangle, text: { children: [{ text: 'B' }] } } as MockGeometryElement,
      { id: 'l1', type: 'arrow-line', source: { boundId: 's1' }, target: { boundId: 's2' } } as MockLineElement,
      { id: 'm1', type: 'mindmap', data: { topic: { children: [{ text: 'Root' }] } } } as MockMindElement,
    ];

    const grouped = groupElementsByDiagram(elements);
    expect(grouped.diagrams).toHaveLength(1);
    expect(grouped.minds).toHaveLength(1);
    expect(grouped.standalone).toHaveLength(0);
  });

  it('detects multiple separate diagrams', () => {
    const elements: PlaitElement[] = [
      { id: 'a1', type: 'geometry', shape: BasicShapes.rectangle, text: { children: [{ text: 'A1' }] } } as MockGeometryElement,
      { id: 'a2', type: 'geometry', shape: BasicShapes.rectangle, text: { children: [{ text: 'A2' }] } } as MockGeometryElement,
      { id: 'l1', type: 'arrow-line', source: { boundId: 'a1' }, target: { boundId: 'a2' } } as MockLineElement,
      { id: 'b1', type: 'geometry', shape: BasicShapes.ellipse, text: { children: [{ text: 'B1' }] } } as MockGeometryElement,
      { id: 'b2', type: 'geometry', shape: BasicShapes.ellipse, text: { children: [{ text: 'B2' }] } } as MockGeometryElement,
      { id: 'l2', type: 'arrow-line', source: { boundId: 'b1' }, target: { boundId: 'b2' } } as MockLineElement,
    ];

    const grouped = groupElementsByDiagram(elements);
    expect(grouped.diagrams).toHaveLength(2);
  });

  it('reuses a shared serialization context for stable diagram metadata', () => {
    const elements: PlaitElement[] = [
      {
        id: 's1',
        type: 'geometry',
        shape: BasicShapes.rectangle,
        text: { children: [{ text: 'A' }] },
      } as MockGeometryElement,
      {
        id: 's2',
        type: 'geometry',
        shape: BasicShapes.rectangle,
        text: { children: [{ text: 'B' }] },
      } as MockGeometryElement,
      {
        id: 'l1',
        type: 'arrow-line',
        source: { boundId: 's1' },
        target: { boundId: 's2' },
      } as MockLineElement,
    ];

    const context = createSerializationContext(elements);
    const first = serializeElementWithContext(elements[0], elements, 'summary', context);
    const second = serializeElementWithContext(elements[1], elements, 'summary', context);
    const firstDiagramId = first.match(/in diagram:(\S+)/)?.[1];
    const secondDiagramId = second.match(/in diagram:(\S+)/)?.[1];

    expect(firstDiagramId).toBeTruthy();
    expect(firstDiagramId).toBe(secondDiagramId);
    expect(first).toContain('(2 shapes, 1 line)');
    expect(second).toContain('(2 shapes, 1 line)');
  });

  it('detects larger connected component via transitive connections', () => {
    const elements: PlaitElement[] = [
      { id: 'a', type: 'geometry', shape: BasicShapes.rectangle, text: { children: [{ text: 'A' }] } } as MockGeometryElement,
      { id: 'b', type: 'geometry', shape: BasicShapes.rectangle, text: { children: [{ text: 'B' }] } } as MockGeometryElement,
      { id: 'c', type: 'geometry', shape: BasicShapes.rectangle, text: { children: [{ text: 'C' }] } } as MockGeometryElement,
      { id: 'l1', type: 'arrow-line', source: { boundId: 'a' }, target: { boundId: 'b' } } as MockLineElement,
      { id: 'l2', type: 'arrow-line', source: { boundId: 'b' }, target: { boundId: 'c' } } as MockLineElement,
    ];

    const grouped = groupElementsByDiagram(elements);
    expect(grouped.diagrams).toHaveLength(1);
    expect(grouped.diagrams[0].shapes).toHaveLength(3);
    expect(grouped.diagrams[0].lines).toHaveLength(2);
  });
});

describe('serializeElementsGrouped', () => {
  it('produces diagram output with shapes and lines subfolders', () => {
    const elements: PlaitElement[] = [
      { id: 's1', type: 'geometry', shape: BasicShapes.rectangle, text: { children: [{ text: 'Start' }] } } as MockGeometryElement,
      { id: 's2', type: 'geometry', shape: BasicShapes.diamond, text: { children: [{ text: 'Decide' }] } } as MockGeometryElement,
      { id: 's3', type: 'geometry', shape: BasicShapes.rectangle, text: { children: [{ text: 'End' }] } } as MockGeometryElement,
      { id: 'l1', type: 'arrow-line', source: { boundId: 's1' }, target: { boundId: 's2' } } as MockLineElement,
      { id: 'l2', type: 'arrow-line', source: { boundId: 's2' }, target: { boundId: 's3' } } as MockLineElement,
    ];

    const result = serializeElementsGrouped(elements, 'summary');

    expect(result).toContain('diagram:');
    expect(result).toContain('shapes:');
    expect(result).toContain('lines:');
    expect(result).toContain('shape:s1 rect "Start"');
    expect(result).toContain('shape:s2 diamond "Decide"');
    expect(result).toContain('line:l1 id:s1 -> id:s2');
    expect(result).toContain('line:l2 id:s2 -> id:s3');
  });

  it('places standalone elements after diagrams', () => {
    const elements: PlaitElement[] = [
      { id: 's1', type: 'geometry', shape: BasicShapes.rectangle, text: { children: [{ text: 'A' }] } } as MockGeometryElement,
      { id: 's2', type: 'geometry', shape: BasicShapes.rectangle, text: { children: [{ text: 'B' }] } } as MockGeometryElement,
      { id: 'l1', type: 'arrow-line', source: { boundId: 's1' }, target: { boundId: 's2' } } as MockLineElement,
      { id: 'st1', type: 'geometry', shape: BasicShapes.rectangle, fill: '#FFEAA7', text: { children: [{ text: 'Note' }] } } as MockGeometryElement,
    ];

    const result = serializeElementsGrouped(elements, 'summary');

    const diagramIdx = result.indexOf('diagram:');
    const stickyIdx = result.indexOf('sticky:');

    expect(diagramIdx).toBeLessThan(stickyIdx);
    expect(result).toContain('sticky:st1 "Note" color:yellow');
  });

  it('places mind maps after standalone elements', () => {
    const elements: PlaitElement[] = [
      { id: 'st1', type: 'geometry', shape: BasicShapes.rectangle, fill: '#FFEAA7', text: { children: [{ text: 'Note' }] } } as MockGeometryElement,
      { id: 'm1', type: 'mindmap', data: { topic: { children: [{ text: 'Root' }] } }, children: [] } as MockMindElement,
    ];

    const result = serializeElementsGrouped(elements, 'summary');

    const stickyIdx = result.indexOf('sticky:');
    const mindIdx = result.indexOf('mind:');

    expect(stickyIdx).toBeLessThan(mindIdx);
    expect(result).toContain('mind:m1 "Root" children:0');
  });

  it('returns flat output when no diagrams exist', () => {
    const elements: PlaitElement[] = [
      { id: 's1', type: 'geometry', shape: BasicShapes.rectangle, text: { children: [{ text: 'A' }] } } as MockGeometryElement,
      { id: 'm1', type: 'mindmap', data: { topic: { children: [{ text: 'Root' }] } } } as MockMindElement,
    ];

    const result = serializeElementsGrouped(elements, 'summary');

    expect(result).not.toContain('diagram:');
    expect(result).toContain('shape:s1');
    expect(result).toContain('mind:m1');
  });
});
