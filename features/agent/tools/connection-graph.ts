import type { PlaitElement, Point } from '@plait/core';
import { nanoid } from 'nanoid';

interface ArrowLineLike {
  id: string;
  type: 'arrow-line';
  points?: Point[];
  source?: { boundId?: string };
  target?: { boundId?: string };
}

interface GeometryLike {
  id: string;
  type: 'geometry';
  points?: [Point, Point];
}

export interface DiagramGroup {
  id: string;
  elementIds: Set<string>;
}

function toArrowLine(el: PlaitElement): ArrowLineLike | null {
  if (el.type !== 'arrow-line') return null;
  return el as unknown as ArrowLineLike;
}

function toGeometry(el: PlaitElement): GeometryLike | null {
  if (el.type !== 'geometry') return null;
  return el as unknown as GeometryLike;
}

function getRect(el: GeometryLike) {
  const pts = el.points;
  if (!pts || pts.length < 2) return null;
  return {
    minX: Math.min(pts[0][0], pts[1][0]),
    minY: Math.min(pts[0][1], pts[1][1]),
    maxX: Math.max(pts[0][0], pts[1][0]),
    maxY: Math.max(pts[0][1], pts[1][1]),
  };
}

const PROXIMITY_BUFFER = 20;

function findNearbyGeometry(
  point: Point,
  geometries: GeometryLike[],
  excludeIds: Set<string>,
): string | null {
  for (const g of geometries) {
    if (excludeIds.has(g.id)) continue;
    const rect = getRect(g);
    if (!rect) continue;
    if (
      point[0] >= rect.minX - PROXIMITY_BUFFER &&
      point[0] <= rect.maxX + PROXIMITY_BUFFER &&
      point[1] >= rect.minY - PROXIMITY_BUFFER &&
      point[1] <= rect.maxY + PROXIMITY_BUFFER
    ) {
      return g.id;
    }
  }
  return null;
}

function resolveConnections(
  elements: PlaitElement[],
): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();
  const geometries: GeometryLike[] = [];
  for (const el of elements) {
    const g = toGeometry(el);
    if (g) geometries.push(g);
  }

  const addEdge = (a: string, b: string) => {
    if (a === b) return;
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    if (!adjacency.has(b)) adjacency.set(b, new Set());
    adjacency.get(a)!.add(b);
    adjacency.get(b)!.add(a);
  };

  for (const el of elements) {
    const line = toArrowLine(el);
    if (!line) continue;

    let sourceId = line.source?.boundId || null;
    let targetId = line.target?.boundId || null;

    if (!sourceId || !targetId) {
      const pts = line.points;
      if (!pts || pts.length < 2) continue;

      if (!sourceId) {
        sourceId = findNearbyGeometry(pts[0], geometries, new Set(targetId ? [targetId] : []));
      }
      if (!targetId) {
        targetId = findNearbyGeometry(pts[pts.length - 1], geometries, new Set(sourceId ? [sourceId] : []));
      }
    }

    if (sourceId && targetId) {
      addEdge(sourceId, targetId);
    }
  }

  return adjacency;
}

function findConnectedComponents(adjacency: Map<string, Set<string>>): Set<string>[] {
  const visited = new Set<string>();
  const components: Set<string>[] = [];

  for (const nodeId of adjacency.keys()) {
    if (visited.has(nodeId)) continue;

    const component = new Set<string>();
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      component.add(current);

      const neighbors = adjacency.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }
    }

    components.push(component);
  }

  return components;
}

function collectLineIds(
  elements: PlaitElement[],
  nodeIds: Set<string>,
): string[] {
  const geometries: GeometryLike[] = [];
  for (const el of elements) {
    const g = toGeometry(el);
    if (g) geometries.push(g);
  }

  const lineIds: string[] = [];

  for (const el of elements) {
    const line = toArrowLine(el);
    if (!line) continue;

    const sourceId = line.source?.boundId;
    const targetId = line.target?.boundId;

    if (sourceId && targetId) {
      if (nodeIds.has(sourceId) && nodeIds.has(targetId)) {
        lineIds.push(line.id);
      }
      continue;
    }

    const pts = line.points;
    if (!pts || pts.length < 2) continue;

    const resolvedSource = sourceId || findNearbyGeometry(pts[0], geometries, new Set());
    const resolvedTarget = targetId || findNearbyGeometry(pts[pts.length - 1], geometries, new Set(resolvedSource ? [resolvedSource] : []));

    if (resolvedSource && resolvedTarget && nodeIds.has(resolvedSource) && nodeIds.has(resolvedTarget)) {
      lineIds.push(line.id);
    }
  }

  return lineIds;
}

const MIN_DIAGRAM_SIZE = 2;

export function detectDiagrams(elements: PlaitElement[]): DiagramGroup[] {
  const adjacency = resolveConnections(elements);
  const components = findConnectedComponents(adjacency);

  const diagrams: DiagramGroup[] = [];

  for (const component of components) {
    if (component.size < MIN_DIAGRAM_SIZE) continue;

    const allIds = new Set(component);
    const lineIds = collectLineIds(elements, component);
    for (const lineId of lineIds) {
      allIds.add(lineId);
    }

    diagrams.push({
      id: nanoid(8),
      elementIds: allIds,
    });
  }

  return diagrams;
}
