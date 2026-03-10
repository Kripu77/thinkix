
export interface Point {
  x: number;
  y: number;
}

export interface ParsedPath {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  reflectionPoints: Point[];
}
type PathCommand = 'M' | 'm' | 'L' | 'l' | 'H' | 'h' | 'V' | 'v' | 'C' | 'c' | 'S' | 's' | 'Q' | 'q' | 'T' | 't' | 'A' | 'a' | 'Z' | 'z';
interface PathInstruction {
  command: PathCommand;
  relative: boolean;
  args: number[];
}
function parsePathD(d: string): PathInstruction[] {
  const instructions: PathInstruction[] = [];

  const parts = d.split(/([MmLlHhVvCcSsQqTtAaZz])/).filter(Boolean);

  let i = 0;
  while (i < parts.length) {
    const command = parts[i] as PathCommand;
    i++;

    let argsStr = '';
    while (i < parts.length && !/[MmLlHhVvCcSsQqTtAaZz]/.test(parts[i])) {
      argsStr += parts[i];
      i++;
    }

    const relative = command === command.toLowerCase();

    const args: number[] = [];
    const numbers = argsStr.match(/-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g);
    if (numbers) {
      args.push(...numbers.map(parseFloat));
    }

    instructions.push({ command, relative, args });
  }

  return instructions;
}

function instructionToPoints(
  instruction: PathInstruction,
  currentX: number,
  currentY: number
): { points: Point[]; newX: number; newY: number } {
  const { command, relative, args } = instruction;
  const points: Point[] = [];
  let x = currentX;
  let y = currentY;

  const absX = relative ? (val: number) => x + val : (val: number) => val;
  const absY = relative ? (val: number) => y + val : (val: number) => val;

  const upperCommand = command.toUpperCase() as 'M' | 'L' | 'H' | 'V' | 'C' | 'S' | 'Q' | 'T' | 'A' | 'Z';

  switch (upperCommand) {
    case 'M': {
      for (let i = 0; i < args.length; i += 2) {
        x = absX(args[i]);
        y = absY(args[i + 1]);
        if (i > 0) {
          points.push({ x, y });
        }
      }
      break;
    }

    case 'L': {
      for (let i = 0; i < args.length; i += 2) {
        x = absX(args[i]);
        y = absY(args[i + 1]);
        points.push({ x, y });
      }
      break;
    }

    case 'H': {
      for (let i = 0; i < args.length; i++) {
        x = absX(args[i]);
        points.push({ x, y });
      }
      break;
    }

    case 'V': {
      for (let i = 0; i < args.length; i++) {
        y = absY(args[i]);
        points.push({ x, y });
      }
      break;
    }

    case 'C': {
      for (let i = 0; i < args.length; i += 6) {
        const cp1x = absX(args[i]);
        const cp1y = absY(args[i + 1]);
        const endX = absX(args[i + 4]);
        const endY = absY(args[i + 5]);

        points.push({ x: (cp1x + endX) / 2, y: (cp1y + endY) / 2 });
        points.push({ x: endX, y: endY });

        x = endX;
        y = endY;
      }
      break;
    }

    case 'Q': {
      for (let i = 0; i < args.length; i += 4) {
        const cpx = absX(args[i]);
        const cpy = absY(args[i + 1]);
        const endX = absX(args[i + 2]);
        const endY = absY(args[i + 3]);

        points.push({ x: (cpx + endX) / 2, y: (cpy + endY) / 2 });
        points.push({ x: endX, y: endY });

        x = endX;
        y = endY;
      }
      break;
    }

    case 'S':
    case 'T': {
      for (let i = 0; i < args.length; i += 4) {
        const cpx = absX(args[i]);
        const cpy = absY(args[i + 1]);
        const endX = absX(args[i + 2]);
        const endY = absY(args[i + 3]);

        points.push({ x: cpx, y: cpy });
        points.push({ x: endX, y: endY });

        x = endX;
        y = endY;
      }
      break;
    }

    case 'A': {
      for (let i = 0; i < args.length; i += 7) {
        x = absX(args[i + 5]);
        y = absY(args[i + 6]);
        points.push({ x, y });
      }
      break;
    }

    case 'Z': {
      break;
    }
  }

  return { points, newX: x, newY: y };
}

export function extractPathPoints(d: string): Point[] {
  const instructions = parsePathD(d);
  const points: Point[] = [];

  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  let hasPoints = false;

  for (const instruction of instructions) {
    const result = instructionToPoints(instruction, currentX, currentY);
    const upperCommand = instruction.command.toUpperCase();

    if (upperCommand === 'M') {
      startX = result.newX;
      startY = result.newY;
      if (!hasPoints) {
        points.push({ x: startX, y: startY });
        hasPoints = true;
      } else {
        points.push({ x: startX, y: startY });
      }
    }

    for (const point of result.points) {
      points.push(point);
    }

    currentX = result.newX;
    currentY = result.newY;

    if (upperCommand === 'Z') {
      currentX = startX;
      currentY = startY;
    }
  }

  return points;
}
 
export function computeEdgePositions(
  pathElement: SVGPathElement,
  offset: Point = { x: 0, y: 0 }
): ParsedPath {
  if (pathElement.tagName !== 'path') {
    throw new Error(`Expected path element, got ${pathElement.tagName}`);
  }

  const d = pathElement.getAttribute('d');
  if (!d || !d.trim()) {
    throw new Error('Path element does not have a valid d attribute');
  }

  const commands = d.split(/(?=[LM])/);

  const startPosition = commands[0]
    .substring(1)
    .split(',')
    .map((coord) => parseFloat(coord));

  const endPosition = commands[commands.length - 1]
    .substring(1)
    .split(',')
    .map((coord) => parseFloat(coord));

  const reflectionPoints = commands
    .map((command) => {
      const coords = command
        .substring(1)
        .split(',')
        .map((coord) => parseFloat(coord));
      return { x: coords[0], y: coords[1] };
    })
    .filter((point, index, array) => {
      if (index === 0 || index === array.length - 1) {
        return true;
      }

      if (point.x === array[index - 1].x && point.y === array[index - 1].y) {
        return false;
      }

      if (
        index === array.length - 2 &&
        (array[index - 1].x === point.x || array[index - 1].y === point.y)
      ) {
        const lastPoint = array[array.length - 1];

        const distance = Math.hypot(
          lastPoint.x - point.x,
          lastPoint.y - point.y
        );
        return distance > 20;
      }

      return point.x !== array[index - 1].x || point.y !== array[index - 1].y;
    })
    .map((p) => {
      return {
        x: p.x + offset.x,
        y: p.y + offset.y,
      };
    });

  return {
    startX: startPosition[0] + offset.x,
    startY: startPosition[1] + offset.y,
    endX: endPosition[0] + offset.x,
    endY: endPosition[1] + offset.y,
    reflectionPoints,
  };
}
export function filterRedundantPoints(
  points: Point[],
  offset: Point = { x: 0, y: 0 },
  minDistance: number = 20
): Point[] {
  const filtered: Point[] = [];

  for (let i = 0; i < points.length; i++) {
    const point = points[i];

    if (i === 0 || i === points.length - 1) {
      filtered.push({
        x: point.x + offset.x,
        y: point.y + offset.y,
      });
      continue;
    }

    const prevPoint = points[i - 1];
    const isSamePosition = point.x === prevPoint.x && point.y === prevPoint.y;

    if (isSamePosition) {
      continue;
    }

    if (i === points.length - 2) {
      const lastPoint = points[points.length - 1];
      const distance = Math.hypot(lastPoint.x - point.x, lastPoint.y - point.y);

      if (distance > minDistance) {
        filtered.push({
          x: point.x + offset.x,
          y: point.y + offset.y,
        });
      }
      continue;
    }

    filtered.push({
      x: point.x + offset.x,
      y: point.y + offset.y,
    });
  }

  return filtered;
}

export function pointDistance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

export function areCollinear(
  p1: Point,
  p2: Point,
  p3: Point,
  tolerance: number = 1
): boolean {
  const area = Math.abs(
    (p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y)
  );
  return area < tolerance;
}

export function simplifyCollinearPoints(
  points: Point[],
  tolerance: number = 1
): Point[] {
  if (points.length <= 2) return points;

  const simplified: Point[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = simplified[simplified.length - 1];
    const curr = points[i];
    const next = points[i + 1];

    if (!areCollinear(prev, curr, next, tolerance)) {
      simplified.push(curr);
    }
  }

  simplified.push(points[points.length - 1]);
  return simplified;
}
