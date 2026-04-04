import type { PlaitElement, PlaitBoard, Point } from '@plait/core';
import { BasicShapes } from '@plait/draw';
import { detectDiagrams } from './connection-graph';
import type { DiagramGroup } from './connection-graph';

type ElementFilter =
  | 'all'
  | 'shapes'
  | 'minds'
  | 'stickies'
  | 'lines'
  | 'text'
  | 'images';

interface TextLeaf {
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underlined?: boolean;
  strike?: boolean;
  color?: string;
  'font-size'?: string | number;
}

interface PlaitDrawElement extends PlaitElement {
  type: 'geometry';
  shape?: string;
  points?: Point[];
  text?: {
    children?: TextLeaf[];
    autoSize?: boolean;
  };
  fill?: string;
  strokeColor?: string;
}

const REVERSE_SHAPE_MAP: Record<string, string> = {
  [BasicShapes.rectangle]: 'rect',
  [BasicShapes.ellipse]: 'ellipse',
  [BasicShapes.diamond]: 'diamond',
  [BasicShapes.roundRectangle]: 'roundRect',
  [BasicShapes.cloud]: 'cloud',
  [BasicShapes.star]: 'star',
  [BasicShapes.triangle]: 'triangle',
  [BasicShapes.parallelogram]: 'parallelogram',
  [BasicShapes.hexagon]: 'hexagon',
  [BasicShapes.text]: 'text',
};

const STICKY_FILL_TO_COLOR: Record<string, string> = {
  '#ffeaa7': 'yellow',
  '#aed6f1': 'blue',
  '#abebc6': 'green',
  '#f5b7b1': 'pink',
  '#d7bde2': 'purple',
  '#fad7a0': 'orange',
};

function isStickyNote(element: PlaitDrawElement): string | null {
  if (element.shape !== BasicShapes.rectangle || !element.fill) return null;
  const fillLower = element.fill.toLowerCase();
  return STICKY_FILL_TO_COLOR[fillLower] || null;
}

interface PlaitMindElement extends PlaitElement {
  type: 'mindmap';
  data?: {
    topic?: {
      children?: Array<{ text: string; children?: Array<{ text: string }> }>;
    };
  };
  children?: PlaitMindElement[];
}

interface PlaitLineElement extends PlaitElement {
  type: string;
  points?: Point[];
  source?: { boundId?: string };
  target?: { boundId?: string };
}

interface ElementMetadata {
  classId?: string;
  sourceType?: string;
  originalId?: string;
}

interface AnnotatedPlaitElement extends PlaitElement {
  groupId?: string;
  metadata?: ElementMetadata;
}

const ELEMENT_REFERENCE_PREFIXES = new Set([
  'shape',
  'sticky',
  'text',
  'mind',
  'mindmap',
  'line',
  'image',
]);

const PROXIMITY_BUFFER = 20;

function resolveLineTargets(
  line: PlaitLineElement,
  allElements: PlaitElement[],
): { sourceId: string | null; targetId: string | null } {
  const sourceId = line.source?.boundId || null;
  const targetId = line.target?.boundId || null;
  if (sourceId && targetId) return { sourceId, targetId };

  const pts = line.points;
  if (!pts || pts.length < 2) return { sourceId, targetId };

  const geometries = allElements.filter(
    (el): el is PlaitDrawElement => el.type === 'geometry' && !!(el as PlaitDrawElement).points,
  );

  const findNearby = (point: Point, excludeId: string | null): string | null => {
    for (const g of geometries) {
      if (excludeId && g.id === excludeId) continue;
      const gp = g.points!;
      const minX = Math.min(gp[0][0], gp[1][0]) - PROXIMITY_BUFFER;
      const minY = Math.min(gp[0][1], gp[1][1]) - PROXIMITY_BUFFER;
      const maxX = Math.max(gp[0][0], gp[1][0]) + PROXIMITY_BUFFER;
      const maxY = Math.max(gp[0][1], gp[1][1]) + PROXIMITY_BUFFER;
      if (point[0] >= minX && point[0] <= maxX && point[1] >= minY && point[1] <= maxY) {
        return g.id;
      }
    }
    return null;
  };

  const resolvedSource = sourceId || findNearby(pts[0], targetId);
  const resolvedTarget = targetId || findNearby(pts[pts.length - 1], resolvedSource);
  return { sourceId: resolvedSource, targetId: resolvedTarget };
}

function isGeometryElement(el: PlaitElement): el is PlaitDrawElement {
  return el.type === 'geometry';
}

function isMindElement(el: PlaitElement): el is PlaitMindElement {
  return el.type === 'mindmap';
}

function isLineElement(el: PlaitElement): el is PlaitLineElement {
  return el.type === 'arrow-line' || el.type === 'vector-line';
}

function getElementText(element: PlaitDrawElement): string {
  const text = element.text?.children?.[0]?.text || '';
  return text;
}

function getMindText(element: PlaitMindElement): string {
  return element.data?.topic?.children?.[0]?.text || 'Untitled';
}

function getElementMetadata(element: PlaitElement): ElementMetadata | undefined {
  const metadata = (element as AnnotatedPlaitElement).metadata;
  return metadata && typeof metadata === 'object' ? metadata : undefined;
}

function getElementAnnotations(
  element: PlaitElement,
  detail: 'summary' | 'full',
): string {
  const metadata = getElementMetadata(element);
  const annotations: string[] = [];

  if (metadata?.classId) {
    annotations.push(`class:${metadata.classId}`);
  }

  if (detail === 'full') {
    const groupId = (element as AnnotatedPlaitElement).groupId;
    if (groupId) {
      annotations.push(`group:${groupId}`);
    }
  }

  return annotations.length > 0 ? ` ${annotations.join(' ')}` : '';
}

export function normalizeElementReference(reference: string): string {
  const colonIndex = reference.indexOf(':');
  if (colonIndex === -1) {
    return reference;
  }

  const prefix = reference.slice(0, colonIndex);
  if (!ELEMENT_REFERENCE_PREFIXES.has(prefix)) {
    return reference;
  }

  return reference.slice(colonIndex + 1);
}

function getTextFormatting(element: PlaitDrawElement): string[] {
  const leaf = element.text?.children?.[0];
  if (!leaf || typeof leaf !== 'object') return [];
  const marks: string[] = [];
  if ((leaf as Record<string, unknown>).bold) marks.push('bold');
  if ((leaf as Record<string, unknown>).italic) marks.push('italic');
  if ((leaf as Record<string, unknown>).underlined) marks.push('underline');
  if ((leaf as Record<string, unknown>).strike) marks.push('strike');
  const color = (leaf as Record<string, unknown>).color as string | undefined;
  if (color) marks.push(`textColor:${color}`);
  const fontSize = (leaf as Record<string, unknown>)['font-size'] as string | number | undefined;
  if (fontSize) marks.push(`fontSize:${fontSize}`);
  return marks;
}

export function getElementCategory(element: PlaitElement): string {
  if (isGeometryElement(element)) {
    if (isStickyNote(element)) return 'sticky';
    if (element.shape === BasicShapes.text) return 'text';
    return 'shape';
  }
  if (isMindElement(element)) return 'mind';
  if (isLineElement(element)) return 'line';
  if (element.type === 'image') return 'image';
  return element.type || 'unknown';
}

export function serializeElement(
  element: PlaitElement,
  detail: 'summary' | 'full' = 'summary',
  context?: { allElements: PlaitElement[] },
): string {
  if (isGeometryElement(element)) {
    const text = getElementText(element);
    const stickyColor = isStickyNote(element);
    
    if (stickyColor) {
      if (detail === 'full') {
        const points = element.points || [[0, 0], [160, 160]];
        const x = Math.min(points[0][0], points[1][0]);
        const y = Math.min(points[0][1], points[1][1]);
        const fmt = getTextFormatting(element);
        const fmtSuffix = fmt.length > 0 ? ` ${fmt.join(' ')}` : '';
        return `sticky:${element.id} "${text}" at ${Math.round(x)},${Math.round(y)} color:${stickyColor}${fmtSuffix}${getElementAnnotations(element, detail)}`;
      }
      return `sticky:${element.id} "${text}" color:${stickyColor}${getElementAnnotations(element, detail)}`;
    }
    
    const shapeAlias = element.shape ? REVERSE_SHAPE_MAP[element.shape] || 'rect' : 'rect';
    
    if (element.shape === BasicShapes.text) {
      if (detail === 'full') {
        const points = element.points || [[0, 0], [200, 50]];
        const x = points[0][0];
        const y = points[0][1];
        const fmt = getTextFormatting(element);
        const fmtSuffix = fmt.length > 0 ? ` ${fmt.join(' ')}` : '';
        return `text:${element.id} "${text}" at ${Math.round(x)},${Math.round(y)}${fmtSuffix}${getElementAnnotations(element, detail)}`;
      }
      return `text:${element.id} "${text}"${getElementAnnotations(element, detail)}`;
    }
    
    if (detail === 'full') {
      const points = element.points || [[0, 0], [100, 100]];
      const x = Math.min(points[0][0], points[1][0]);
      const y = Math.min(points[0][1], points[1][1]);
      const width = Math.abs(points[1][0] - points[0][0]);
      const height = Math.abs(points[1][1] - points[0][1]);
      const fmt = getTextFormatting(element);
      const fmtSuffix = fmt.length > 0 ? ` ${fmt.join(' ')}` : '';
      return `shape:${element.id} ${shapeAlias} "${text}" at ${Math.round(x)},${Math.round(y)} size ${Math.round(width)}x${Math.round(height)}${fmtSuffix}${getElementAnnotations(element, detail)}`;
    }
    return `shape:${element.id} ${shapeAlias} "${text}"${getElementAnnotations(element, detail)}`;
  }
  
  if (isMindElement(element)) {
    const rootText = getMindText(element);
    const childCount = element.children?.length || 0;
    
    if (detail === 'full') {
      const lines = [`mind:${element.id}${getElementAnnotations(element, detail)}`];
      lines.push(`  root: "${rootText}"`);
      if (childCount > 0) {
        lines.push(`  children: ${childCount}`);
        const serializeMindChildren = (children: PlaitMindElement[] | undefined, indent: number): void => {
          if (!children) return;
          for (const child of children) {
            const childText = getMindText(child);
            lines.push('  '.repeat(indent) + `- mind:${child.id} "${childText}"`);
            serializeMindChildren(child.children, indent + 1);
          }
        };
        serializeMindChildren(element.children, 2);
      }
      return lines.join('\n');
    }
    return `mind:${element.id} "${rootText}" children:${childCount}${getElementAnnotations(element, detail)}`;
  }
  
  if (isLineElement(element)) {
    const line = element as PlaitLineElement;
    let sourceId: string | undefined = line.source?.boundId;
    let targetId: string | undefined = line.target?.boundId;

    if ((!sourceId || !targetId) && context?.allElements) {
      const resolved = resolveLineTargets(line, context.allElements);
      sourceId = resolved.sourceId ?? undefined;
      targetId = resolved.targetId ?? undefined;
    }

    if (sourceId && targetId) {
      return `line:${element.id} id:${sourceId} -> id:${targetId}${getElementAnnotations(element, detail)}`;
    }
    return `line:${element.id} (unconnected)${getElementAnnotations(element, detail)}`;
  }
  
  return `${element.type}:${element.id}${getElementAnnotations(element, detail)}`;
}

export function serializeElements(
  elements: PlaitElement[],
  detail: 'summary' | 'full' = 'summary',
  filter?: ElementFilter
): string {
  let filtered = elements;
  
  if (filter && filter !== 'all') {
    filtered = elements.filter(el => {
      if (!isGeometryElement(el) && !isMindElement(el) && !isLineElement(el)) return false;
      
      switch (filter) {
        case 'shapes':
          return isGeometryElement(el) && !isStickyNote(el) && el.shape !== BasicShapes.text;
        case 'minds':
          return isMindElement(el);
        case 'stickies':
          return isGeometryElement(el) && !!isStickyNote(el);
        case 'lines':
          return isLineElement(el);
        case 'text':
          return isGeometryElement(el) && el.shape === BasicShapes.text;
        case 'images':
          return el.type === 'image';
        default:
          return true;
      }
    });
  }
  
  const MAX_ELEMENTS = 100;
  const truncated = filtered.length > MAX_ELEMENTS;
  const toSerialize = truncated ? filtered.slice(0, MAX_ELEMENTS) : filtered;
  
  const lines = toSerialize.map(el => serializeElement(el, detail));
  
  if (truncated) {
    lines.push(`... (${filtered.length - MAX_ELEMENTS} more elements)`);
  }
  
  return lines.join('\n');
}

export interface GroupedSerialization {
  diagrams: Array<{
    id: string;
    shapes: PlaitElement[];
    lines: PlaitElement[];
    other: PlaitElement[];
  }>;
  standalone: PlaitElement[];
  minds: PlaitElement[];
}

export interface SerializationContext {
  allElements: PlaitElement[];
  diagrams: DiagramGroup[];
  diagramByElementId: Map<string, DiagramGroup>;
  diagramStatsById: Map<string, { shapeCount: number; lineCount: number }>;
}

export function createSerializationContext(
  allElements: PlaitElement[],
): SerializationContext {
  const diagrams = detectDiagrams(allElements);
  const diagramByElementId = new Map<string, DiagramGroup>();
  const diagramStatsById = new Map<
    string,
    { shapeCount: number; lineCount: number }
  >();
  const elementById = new Map(allElements.map((element) => [element.id, element]));

  for (const diagram of diagrams) {
    let shapeCount = 0;
    let lineCount = 0;

    for (const elementId of diagram.elementIds) {
      diagramByElementId.set(elementId, diagram);

      const element = elementById.get(elementId);
      if (element && isGeometryElement(element)) {
        shapeCount++;
      } else if (element && isLineElement(element)) {
        lineCount++;
      }
    }

    diagramStatsById.set(diagram.id, { shapeCount, lineCount });
  }

  return {
    allElements,
    diagrams,
    diagramByElementId,
    diagramStatsById,
  };
}

function categorizeForGroup(element: PlaitElement): 'shape' | 'line' | 'other' {
  const cat = getElementCategory(element);
  if (cat === 'shape' || cat === 'text') return 'shape';
  if (cat === 'line') return 'line';
  return 'other';
}

export function groupElementsByDiagram(elements: PlaitElement[]): GroupedSerialization {
  const diagrams = detectDiagrams(elements);
  const elementToDiagram = new Map<string, string>();
  for (const dg of diagrams) {
    for (const eid of dg.elementIds) {
      elementToDiagram.set(eid, dg.id);
    }
  }

  const result: GroupedSerialization = {
    diagrams: diagrams.map(dg => ({
      id: dg.id,
      shapes: [],
      lines: [],
      other: [],
    })),
    standalone: [],
    minds: [],
  };

  const diagramById = new Map(result.diagrams.map(d => [d.id, d]));

  for (const el of elements) {
    if (isMindElement(el)) {
      result.minds.push(el);
      continue;
    }

    const diagramId = elementToDiagram.get(el.id);
    if (diagramId) {
      const group = diagramById.get(diagramId)!;
      const bucket = categorizeForGroup(el);
      if (bucket === 'shape') group.shapes.push(el);
      else if (bucket === 'line') group.lines.push(el);
      else group.other.push(el);
    } else {
      result.standalone.push(el);
    }
  }

  result.diagrams = result.diagrams.filter(
    d => d.shapes.length > 0 || d.lines.length > 0 || d.other.length > 0
  );

  return result;
}

export function serializeElementsGrouped(
  elements: PlaitElement[],
  detail: 'summary' | 'full' = 'summary',
): string {
  const grouped = groupElementsByDiagram(elements);
  const output: string[] = [];
  const MAX_ELEMENTS = 100;
  const ctx = { allElements: elements };
  let count = 0;

  for (const diagram of grouped.diagrams) {
    const sc = diagram.shapes.length;
    const lc = diagram.lines.length;
    output.push(`diagram:${diagram.id} (${sc} shape${sc !== 1 ? 's' : ''}, ${lc} line${lc !== 1 ? 's' : ''})`);

    if (sc > 0) {
      output.push('  shapes:');
      for (const el of diagram.shapes) {
        if (count >= MAX_ELEMENTS) break;
        output.push('    ' + serializeElement(el, detail, ctx));
        count++;
      }
    }

    if (lc > 0) {
      output.push('  lines:');
      for (const el of diagram.lines) {
        if (count >= MAX_ELEMENTS) break;
        output.push('    ' + serializeElement(el, detail, ctx));
        count++;
      }
    }

    if (diagram.other.length > 0) {
      output.push('  other:');
      for (const el of diagram.other) {
        if (count >= MAX_ELEMENTS) break;
        output.push('    ' + serializeElement(el, detail, ctx));
        count++;
      }
    }
  }

  if (count >= MAX_ELEMENTS) {
    output.push(`... (${elements.length - count} more elements)`);
    return output.join('\n');
  }

  for (const el of grouped.standalone) {
    if (count >= MAX_ELEMENTS) {
      output.push(`... (${elements.length - count} more elements)`);
      return output.join('\n');
    }
    output.push(serializeElement(el, detail, ctx));
    count++;
  }

  for (const el of grouped.minds) {
    if (count >= MAX_ELEMENTS) {
      output.push(`... (${elements.length - count} more elements)`);
      return output.join('\n');
    }
    output.push(serializeElement(el, detail, ctx));
    count++;
  }

  return output.join('\n');
}

export function serializeElementById(board: PlaitBoard, id: string): string | null {
  function findElement(elements: PlaitElement[], targetId: string): PlaitElement | null {
    for (const el of elements) {
      if (el.id === targetId) return el;
      if (el.children) {
        const found = findElement(el.children, targetId);
        if (found) return found;
      }
    }
    return null;
  }
  
  const normalizedId = normalizeElementReference(id);
  const element = findElement(board.children, normalizedId);
  if (!element) return null;
  
  return serializeElement(element, 'full');
}

export function serializeElementWithContext(
  element: PlaitElement,
  allElements: PlaitElement[],
  detail: 'summary' | 'full' = 'full',
  context?: SerializationContext,
): string {
  const serializationContext = context ?? createSerializationContext(allElements);
  const ctx = { allElements: serializationContext.allElements };
  const base = serializeElement(element, detail, ctx);
  const diagram = serializationContext.diagramByElementId.get(element.id);
  if (!diagram) return base;

  const stats = serializationContext.diagramStatsById.get(diagram.id);
  const shapeCount = stats?.shapeCount ?? 0;
  const lineCount = stats?.lineCount ?? 0;

  return `${base}\n  in diagram:${diagram.id} (${shapeCount} shape${shapeCount !== 1 ? 's' : ''}, ${lineCount} line${lineCount !== 1 ? 's' : ''})`;
}
