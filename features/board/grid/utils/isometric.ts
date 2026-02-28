import { ISOMETRIC_ANGLE_RAD } from '../constants';

export function getIsometricPoints(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  spacing: number
): { leftDiagonals: Array<{ start: { x: number; y: number }; end: { x: number; y: number } }>; rightDiagonals: Array<{ start: { x: number; y: number }; end: { x: number; y: number } }> } {
  if (!Number.isFinite(spacing) || spacing <= 0) {
    return { leftDiagonals: [], rightDiagonals: [] }
  }
  
  const leftDiagonals: Array<{ start: { x: number; y: number }; end: { x: number; y: number } }> = [];
  const rightDiagonals: Array<{ start: { x: number; y: number }; end: { x: number; y: number } }> = [];
  
  const tanAngle = Math.tan(ISOMETRIC_ANGLE_RAD);
  const dx = spacing / Math.cos(ISOMETRIC_ANGLE_RAD);
  
  const expandedMinX = minX - (maxY - minY) / tanAngle - spacing;
  const expandedMaxX = maxX + (maxY - minY) / tanAngle + spacing;
  const expandedMinY = minY - spacing;
  const expandedMaxY = maxY + spacing;
  
  let offset = expandedMinX;
  while (offset <= expandedMaxX) {
    const startY = expandedMinY;
    const endY = expandedMaxY;
    const startX = offset + (endY - startY) / tanAngle;
    const endX = offset;
    
    leftDiagonals.push({
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
    });
    
    offset += dx;
  }
  
  offset = expandedMinX;
  while (offset <= expandedMaxX) {
    const startY = expandedMinY;
    const endY = expandedMaxY;
    const startX = offset;
    const endX = offset + (endY - startY) / tanAngle;
    
    rightDiagonals.push({
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
    });
    
    offset += dx;
  }
  
  return { leftDiagonals, rightDiagonals };
}

export function getIsometricTriangleCenters(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  spacing: number
): Array<{ x: number; y: number }> {
  if (!Number.isFinite(spacing) || spacing <= 0) {
    return []
  }
  
  const centers: Array<{ x: number; y: number }> = [];
  
  const rowHeight = spacing * Math.sin(ISOMETRIC_ANGLE_RAD);
  const colWidth = spacing;
  
  for (let y = minY; y <= maxY; y += rowHeight) {
    const rowOffset = (Math.floor(y / rowHeight) % 2) * (colWidth / 2);
    for (let x = minX + rowOffset; x <= maxX; x += colWidth) {
      centers.push({ x, y });
    }
  }
  
  return centers;
}

export function isometricWorldToScreen(
  worldX: number,
  worldY: number
): { x: number; y: number } {
  const screenX = (worldX - worldY) * Math.cos(ISOMETRIC_ANGLE_RAD);
  const screenY = (worldX + worldY) * Math.sin(ISOMETRIC_ANGLE_RAD);
  return { x: screenX, y: screenY };
}

export function screenToIsometricWorld(
  screenX: number,
  screenY: number
): { x: number; y: number } {
  const cosA = Math.cos(ISOMETRIC_ANGLE_RAD);
  const sinA = Math.sin(ISOMETRIC_ANGLE_RAD);
  const worldX = (screenX / cosA + screenY / sinA) / 2;
  const worldY = (screenY / sinA - screenX / cosA) / 2;
  return { x: worldX, y: worldY };
}
