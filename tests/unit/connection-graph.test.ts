import { describe, it, expect } from 'vitest';
import { detectDiagrams } from '@/features/agent/tools/connection-graph';
import type { PlaitElement } from '@plait/core';

interface MockArrowLine extends PlaitElement {
  type: 'arrow-line';
  points?: [[number, number], [number, number]];
  source?: { boundId?: string; marker?: string };
  target?: { boundId?: string; marker?: string };
}

describe('connection-graph', () => {
  it('returns empty when no elements', () => {
    const result = detectDiagrams([]);
    expect(result).toHaveLength(0);
  });

  it('returns empty when no arrow-lines', () => {
    const elements: PlaitElement[] = [
      { id: 's1', type: 'geometry', points: [[100, 100], [200, 200]] } as PlaitElement,
      { id: 's2', type: 'geometry', points: [[300, 300], [400, 400]] } as PlaitElement,
    ];
    const result = detectDiagrams(elements);
    expect(result).toHaveLength(0);
  });

  it('returns empty for single unconnected arrow-line', () => {
    const elements: PlaitElement[] = [
      { id: 'l1', type: 'arrow-line' } as MockArrowLine,
    ];
    const result = detectDiagrams(elements);
    expect(result).toHaveLength(0);
  });

  it('ignores self-referencing arrow-lines via boundId', () => {
    const elements: PlaitElement[] = [
      { id: 'l1', type: 'arrow-line', source: { boundId: 's1' }, target: { boundId: 's1' } } as MockArrowLine,
    ];
    const result = detectDiagrams(elements);
    expect(result).toHaveLength(0);
  });

  it('detects a diagram from two connected shapes via boundId', () => {
    const elements: PlaitElement[] = [
      { id: 's1', type: 'geometry' } as PlaitElement,
      { id: 's2', type: 'geometry' } as PlaitElement,
      { id: 'l1', type: 'arrow-line', source: { boundId: 's1' }, target: { boundId: 's2' } } as MockArrowLine,
    ];

    const result = detectDiagrams(elements);
    expect(result).toHaveLength(1);
    expect(result[0].elementIds.has('s1')).toBe(true);
    expect(result[0].elementIds.has('s2')).toBe(true);
    expect(result[0].elementIds.has('l1')).toBe(true);
  });

  it('detects transitive connections via boundId (A->B->C)', () => {
    const elements: PlaitElement[] = [
      { id: 'a', type: 'geometry' } as PlaitElement,
      { id: 'b', type: 'geometry' } as PlaitElement,
      { id: 'c', type: 'geometry' } as PlaitElement,
      { id: 'l1', type: 'arrow-line', source: { boundId: 'a' }, target: { boundId: 'b' } } as MockArrowLine,
      { id: 'l2', type: 'arrow-line', source: { boundId: 'b' }, target: { boundId: 'c' } } as MockArrowLine,
    ];

    const result = detectDiagrams(elements);
    expect(result).toHaveLength(1);
    expect(result[0].elementIds.size).toBe(5);
  });

  it('detects multiple separate connected components via boundId', () => {
    const elements: PlaitElement[] = [
      { id: 'a1', type: 'geometry' } as PlaitElement,
      { id: 'a2', type: 'geometry' } as PlaitElement,
      { id: 'l1', type: 'arrow-line', source: { boundId: 'a1' }, target: { boundId: 'a2' } } as MockArrowLine,
      { id: 'b1', type: 'geometry' } as PlaitElement,
      { id: 'b2', type: 'geometry' } as PlaitElement,
      { id: 'l2', type: 'arrow-line', source: { boundId: 'b1' }, target: { boundId: 'b2' } } as MockArrowLine,
    ];

    const result = detectDiagrams(elements);
    expect(result).toHaveLength(2);
  });

  it('ignores vector-line elements', () => {
    const elements: PlaitElement[] = [
      { id: 's1', type: 'geometry' } as PlaitElement,
      { id: 's2', type: 'geometry' } as PlaitElement,
      { id: 'l1', type: 'vector-line' } as PlaitElement,
    ];

    const result = detectDiagrams(elements);
    expect(result).toHaveLength(0);
  });

  it('handles partial connections (line with only source boundId)', () => {
    const elements: PlaitElement[] = [
      { id: 's1', type: 'geometry' } as PlaitElement,
      { id: 'l1', type: 'arrow-line', source: { boundId: 's1' } } as MockArrowLine,
    ];

    const result = detectDiagrams(elements);
    expect(result).toHaveLength(0);
  });

  it('assigns unique IDs to diagrams', () => {
    const elements: PlaitElement[] = [
      { id: 'a1', type: 'geometry' } as PlaitElement,
      { id: 'a2', type: 'geometry' } as PlaitElement,
      { id: 'l1', type: 'arrow-line', source: { boundId: 'a1' }, target: { boundId: 'a2' } } as MockArrowLine,
      { id: 'b1', type: 'geometry' } as PlaitElement,
      { id: 'b2', type: 'geometry' } as PlaitElement,
      { id: 'l2', type: 'arrow-line', source: { boundId: 'b1' }, target: { boundId: 'b2' } } as MockArrowLine,
    ];

    const result = detectDiagrams(elements);
    expect(result).toHaveLength(2);
    expect(result[0].id).not.toBe(result[1].id);
  });
});

describe('connection-graph spatial proximity', () => {
  it('detects diagram from spatial proximity when no boundId', () => {
    const elements: PlaitElement[] = [
      { id: 's1', type: 'geometry', points: [[100, 100], [200, 200]] } as PlaitElement,
      { id: 's2', type: 'geometry', points: [[100, 400], [200, 500]] } as PlaitElement,
      { id: 'l1', type: 'arrow-line', points: [[150, 200], [150, 400]], source: { marker: 'none' }, target: { marker: 'arrow' } } as MockArrowLine,
    ];

    const result = detectDiagrams(elements);
    expect(result).toHaveLength(1);
    expect(result[0].elementIds.has('s1')).toBe(true);
    expect(result[0].elementIds.has('s2')).toBe(true);
    expect(result[0].elementIds.has('l1')).toBe(true);
  });

  it('detects chain via spatial proximity (A->B->C)', () => {
    const elements: PlaitElement[] = [
      { id: 'a', type: 'geometry', points: [[100, 100], [200, 200]] } as PlaitElement,
      { id: 'b', type: 'geometry', points: [[100, 300], [200, 400]] } as PlaitElement,
      { id: 'c', type: 'geometry', points: [[100, 500], [200, 600]] } as PlaitElement,
      { id: 'l1', type: 'arrow-line', points: [[150, 200], [150, 300]], source: { marker: 'none' }, target: { marker: 'arrow' } } as MockArrowLine,
      { id: 'l2', type: 'arrow-line', points: [[150, 400], [150, 500]], source: { marker: 'none' }, target: { marker: 'arrow' } } as MockArrowLine,
    ];

    const result = detectDiagrams(elements);
    expect(result).toHaveLength(1);
    expect(result[0].elementIds.has('a')).toBe(true);
    expect(result[0].elementIds.has('b')).toBe(true);
    expect(result[0].elementIds.has('c')).toBe(true);
    expect(result[0].elementIds.has('l1')).toBe(true);
    expect(result[0].elementIds.has('l2')).toBe(true);
  });

  it('detects multiple diagrams via spatial proximity', () => {
    const elements: PlaitElement[] = [
      { id: 'a1', type: 'geometry', points: [[100, 100], [200, 200]] } as PlaitElement,
      { id: 'a2', type: 'geometry', points: [[100, 300], [200, 400]] } as PlaitElement,
      { id: 'l1', type: 'arrow-line', points: [[150, 200], [150, 300]], source: { marker: 'none' }, target: { marker: 'arrow' } } as MockArrowLine,
      { id: 'b1', type: 'geometry', points: [[500, 100], [600, 200]] } as PlaitElement,
      { id: 'b2', type: 'geometry', points: [[500, 300], [600, 400]] } as PlaitElement,
      { id: 'l2', type: 'arrow-line', points: [[550, 200], [550, 300]], source: { marker: 'none' }, target: { marker: 'arrow' } } as MockArrowLine,
    ];

    const result = detectDiagrams(elements);
    expect(result).toHaveLength(2);
  });

  it('does not match when arrow is far from all geometries', () => {
    const elements: PlaitElement[] = [
      { id: 's1', type: 'geometry', points: [[100, 100], [200, 200]] } as PlaitElement,
      { id: 's2', type: 'geometry', points: [[100, 400], [200, 500]] } as PlaitElement,
      { id: 'l1', type: 'arrow-line', points: [[900, 900], [950, 950]], source: { marker: 'none' }, target: { marker: 'arrow' } } as MockArrowLine,
    ];

    const result = detectDiagrams(elements);
    expect(result).toHaveLength(0);
  });

  it('handles mixed boundId and spatial proximity', () => {
    const elements: PlaitElement[] = [
      { id: 'a', type: 'geometry', points: [[100, 100], [200, 200]] } as PlaitElement,
      { id: 'b', type: 'geometry', points: [[100, 300], [200, 400]] } as PlaitElement,
      { id: 'c', type: 'geometry', points: [[100, 500], [200, 600]] } as PlaitElement,
      { id: 'l1', type: 'arrow-line', source: { boundId: 'a' }, target: { boundId: 'b' } } as MockArrowLine,
      { id: 'l2', type: 'arrow-line', points: [[150, 400], [150, 500]], source: { marker: 'none' }, target: { marker: 'arrow' } } as MockArrowLine,
    ];

    const result = detectDiagrams(elements);
    expect(result).toHaveLength(1);
    expect(result[0].elementIds.size).toBe(5);
  });
});
