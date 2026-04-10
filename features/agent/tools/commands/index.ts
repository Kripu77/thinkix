import type { PlaitBoard, PlaitElement } from '@plait/core';
import {
  Transforms,
  idCreator,
  duplicateElements,
  setSelectedElementsWithGroup,
  WritableClipboardOperationType,
  BoardTransforms,
  PlaitBoard as PlaitBoardStatic,
} from '@plait/core';
import { createGeometryElement, BasicShapes } from '@plait/draw';
import {
  createStickyNoteElement,
  estimateStickySize,
  focusAndRevealElements,
  isStickyColorName,
  insertElementDirect,
  syncElementsForBoardTheme,
} from '@/features/board/utils';
import { getBoardInkColors, getBoardThemeMode } from '@thinkix/shared';
import {
  DEFAULT_STICKY_COLOR,
  STICKY_COLORS,
  type StickyColorName,
} from '@/shared/constants';
import { relayoutHeaderDrivenDiagram } from '../diagram-layout';
import { getOverflowFile } from '../presentation-layer';
import {
  createSerializationContext,
  getElementCategory,
  normalizeElementReference,
  groupElementsByDiagram,
  serializeElementsGrouped,
  serializeElementWithContext,
  serializeElement,
} from '../serializer';
import type {
  BoardCreateData,
  BoardDeleteData,
  BoardListData,
  BoardListEntryData,
  BoardLocationData,
  BoardReferenceData,
  BoardSwitchData,
  CommandResultData,
  CommandResultKind,
  DiagramEntryData,
  ElementEntryData,
  ElementListData,
} from '../result-types';

export interface BoardDirectory {
  id: string;
  name: string;
  elementCount: number;
}

export interface BoardHandle {
  board: PlaitBoard;
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface BoardDeleteResult {
  deletedBoardId: string;
  deletedBoardName: string;
  nextBoard?: BoardHandle;
}

export interface CommandContext {
  board: PlaitBoard;
  currentBoardId: string | null;
  currentBoardName: string;
  boards: BoardDirectory[];
  stdin: string;
  onBoardSwitch?: (boardId: string) => Promise<BoardHandle | null> | BoardHandle | null;
  onBoardCreate?: (name: string) => Promise<BoardHandle> | BoardHandle;
  onBoardDelete?: (boardId: string) => Promise<BoardDeleteResult | null> | BoardDeleteResult | null;
}

export interface CommandResult {
  output: string;
  exitCode: number;
  kind?: CommandResultKind;
  summary?: string;
  data?: CommandResultData;
  nextBoard?: BoardHandle;
  deletedBoardId?: string;
  persistBoard?: boolean;
}

type Command = (
  args: string[],
  ctx: CommandContext,
) => Promise<CommandResult> | CommandResult;

function parseStickyTouchArgs(args: string[]): {
  text: string;
  color: StickyColorName;
} {
  let color = DEFAULT_STICKY_COLOR;
  const textParts: string[] = [];

  for (const arg of args) {
    if (arg.startsWith('color:')) {
      const requestedColor = arg.slice('color:'.length).toLowerCase();
      if (isStickyColorName(requestedColor)) {
        color = requestedColor;
        continue;
      }
    }

    textParts.push(arg);
  }

  return {
    text: textParts.join(' '),
    color,
  };
}

function findElementWithPath(
  elements: PlaitElement[],
  id: string,
): { element: PlaitElement; path: number[] } | null {
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].id === id) {
      return { element: elements[i], path: [i] };
    }
    if (elements[i].children && Array.isArray(elements[i].children)) {
      const childResult = findElementWithPath(
        elements[i].children as PlaitElement[],
        id,
      );
      if (childResult) {
        return {
          element: childResult.element,
          path: [i, ...childResult.path],
        };
      }
    }
  }
  return null;
}

function removeElement(board: PlaitBoard, path: number[]): void {
  Transforms.removeNode(board, path);
}

function resolveElementReference(reference: string): string {
  return normalizeElementReference(reference);
}

function findElementByReference(
  elements: PlaitElement[],
  reference: string,
): { element: PlaitElement; path: number[] } | null {
  return findElementWithPath(elements, resolveElementReference(reference));
}

function readOverflowOutput(reference: string): string | null {
  const overflowPrefix = '/tmp/cmd-output/';
  if (!reference.startsWith(overflowPrefix)) {
    return null;
  }

  const filename = reference.slice(overflowPrefix.length);
  return getOverflowFile(filename) ?? null;
}

function formatBoardPath(name: string): string {
  return `/${name}/`;
}

function normalizeBoardReferenceInput(reference: string): string {
  return reference.trim().replace(/^\/+|\/+$/g, '');
}

type BoardReferenceResolution =
  | { status: 'match'; board: BoardDirectory }
  | { status: 'ambiguous'; matches: BoardDirectory[] }
  | { status: 'missing' };

function createBoardReferenceData(board: Pick<BoardDirectory, 'id' | 'name'>): BoardReferenceData {
  return {
    id: board.id,
    name: board.name,
    path: formatBoardPath(board.name),
  };
}

function buildBoardListData(ctx: CommandContext, boards: BoardDirectory[]): BoardListData {
  return {
    boards: boards.map((board): BoardListEntryData => ({
      ...createBoardReferenceData(board),
      elementCount: board.elementCount,
      isCurrent: board.id === ctx.currentBoardId,
    })),
    currentBoardId: ctx.currentBoardId,
  };
}

function resolveBoardReference(
  reference: string,
  boards: BoardDirectory[],
): BoardReferenceResolution {
  const normalizedReference = normalizeBoardReferenceInput(reference);
  if (!normalizedReference) {
    return { status: 'missing' };
  }

  const idMatch = boards.find((board) => board.id === normalizedReference);
  if (idMatch) {
    return { status: 'match', board: idMatch };
  }

  const nameMatches = boards.filter((board) => board.name === normalizedReference);
  if (nameMatches.length === 1) {
    return { status: 'match', board: nameMatches[0] };
  }

  if (nameMatches.length > 1) {
    return { status: 'ambiguous', matches: nameMatches };
  }

  return { status: 'missing' };
}

function formatAmbiguousBoardError(
  commandName: 'cd' | 'rmdir',
  reference: string,
  matches: BoardDirectory[],
): string {
  return `[error] ${commandName}: ${reference}: multiple boards match this name
Use a board ID instead:
${matches.map((board) => `  ${board.id} -> ${formatBoardPath(board.name)}`).join('\n')}`;
}

function getElementLabel(element: PlaitElement): string {
  if (element.type === 'mindmap') {
    const topic = (element as {
      data?: { topic?: { children?: Array<{ text?: string }> } };
    }).data?.topic?.children?.[0]?.text;
    return topic?.trim() || `Mind ${element.id.slice(0, 8)}`;
  }

  if (element.type === 'geometry') {
    const text = (element as {
      text?: { children?: Array<{ text?: string }> };
    }).text?.children?.[0]?.text?.trim();
    const category = getElementCategory(element);

    if (text) {
      return text;
    }

    if (category === 'sticky') {
      return `Sticky ${element.id.slice(0, 8)}`;
    }
    if (category === 'text') {
      return `Text ${element.id.slice(0, 8)}`;
    }
    return `Shape ${element.id.slice(0, 8)}`;
  }

  if (getElementCategory(element) === 'line') {
    return `Line ${element.id.slice(0, 8)}`;
  }

  if (element.type === 'image') {
    return `Image ${element.id.slice(0, 8)}`;
  }

  return `${element.type} ${element.id.slice(0, 8)}`;
}

function createElementEntryData(
  element: PlaitElement,
  allElements: PlaitElement[],
): ElementEntryData {
  const category = getElementCategory(element);

  return {
    id: element.id,
    type: category,
    category,
    label: getElementLabel(element),
    raw: serializeElement(element, 'summary', { allElements }),
  };
}

function buildElementListData(elements: PlaitElement[]): ElementListData {
  const grouped = groupElementsByDiagram(elements);
  const data: ElementListData = {
    diagrams: grouped.diagrams.map((diagram): DiagramEntryData => ({
      id: diagram.id,
      label: `${diagram.shapes.length} shape${diagram.shapes.length === 1 ? '' : 's'}, ${diagram.lines.length} line${diagram.lines.length === 1 ? '' : 's'}`,
      shapeCount: diagram.shapes.length,
      lineCount: diagram.lines.length,
      shapes: diagram.shapes.map((element) => createElementEntryData(element, elements)),
      lines: diagram.lines.map((element) => createElementEntryData(element, elements)),
      other: diagram.other.map((element) => createElementEntryData(element, elements)),
    })),
    standalone: [...grouped.standalone, ...grouped.minds].map((element) =>
      createElementEntryData(element, elements),
    ),
  };

  return data;
}

const ls: Command = (args, ctx) => {
  if (args.includes('--help') || args.includes('-h')) {
    return {
      output: `ls — list board contents
Usage: ls [options]
  ls          list elements in current board
  ls /        list all boards
  ls -a       list all boards`,
      exitCode: 0,
      kind: 'info',
      summary: 'ls help',
    };
  }

  if (args.includes('/') || args.includes('-a') || args[0] === '/') {
    const boards = ctx.boards.length > 0
      ? ctx.boards
      : ctx.currentBoardId
        ? [{
            id: ctx.currentBoardId,
            name: ctx.currentBoardName,
            elementCount: ctx.board.children.length,
          }]
        : [];

    if (boards.length === 0) {
      return {
        output: '/ (no boards)',
        exitCode: 0,
        kind: 'board-list',
        summary: 'No boards',
        data: buildBoardListData(ctx, boards),
      };
    }

    return {
      output: boards
        .map((board) =>
          `${formatBoardPath(board.name)} (${board.elementCount} elements, id: ${board.id})${board.id === ctx.currentBoardId ? ' [current]' : ''}`,
        )
        .join('\n'),
      exitCode: 0,
      kind: 'board-list',
      summary: `Found ${boards.length} board${boards.length === 1 ? '' : 's'}`,
      data: buildBoardListData(ctx, boards),
    };
  }

  if (!ctx.currentBoardId) {
    return {
      output: '[error] ls: not in a board. Use cd <board> first.',
      exitCode: 1,
      kind: 'error',
      summary: 'ls: not in a board',
    };
  }

  const elements = ctx.board.children;
  if (elements.length === 0) {
    return {
      output: 'Board is empty.',
      exitCode: 0,
      kind: 'element-list',
      summary: 'Board is empty',
      data: buildElementListData(elements),
    };
  }

  const output = serializeElementsGrouped(elements, 'summary');
  return {
    output,
    exitCode: 0,
    kind: 'element-list',
    summary: `Found ${elements.length} element${elements.length === 1 ? '' : 's'}`,
    data: buildElementListData(elements),
  };
};

const cd: Command = async (args, ctx) => {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    return {
      output: `cd — switch to a board
Usage: cd <board-name-or-id>`,
      exitCode: 0,
      kind: 'info',
      summary: 'cd help',
    };
  }

  const rawTarget = args[0]?.trim() ?? '';
  const target = normalizeBoardReferenceInput(rawTarget);

  if (rawTarget === '/' || rawTarget === '~') {
    const data: BoardLocationData = {
      path: ctx.currentBoardId ? formatBoardPath(ctx.currentBoardName) : '/',
      board: ctx.currentBoardId
        ? createBoardReferenceData({
            id: ctx.currentBoardId,
            name: ctx.currentBoardName,
          })
        : null,
    };

    return {
      output: ctx.currentBoardId
        ? `Switched to ${formatBoardPath(ctx.currentBoardName)}`
        : '/ (no active board)',
      exitCode: 0,
      kind: 'board-location',
      summary: ctx.currentBoardId
        ? `Switched to ${formatBoardPath(ctx.currentBoardName)}`
        : '/ (no active board)',
      data,
    };
  }

  const resolution = resolveBoardReference(target, ctx.boards);
  if (resolution.status === 'ambiguous') {
    return {
      output: formatAmbiguousBoardError('cd', target, resolution.matches),
      exitCode: 1,
      kind: 'error',
      summary: `cd: ${target}: ambiguous board name`,
    };
  }

  if (resolution.status === 'missing') {
    return {
      output: `[error] cd: ${target}: No such board`,
      exitCode: 1,
      kind: 'error',
      summary: `cd: ${target}: No such board`,
    };
  }

  if (ctx.onBoardSwitch) {
    const nextBoard = await ctx.onBoardSwitch(resolution.board.id);
    if (!nextBoard) {
      return {
        output: `[error] cd: ${target}: No such board`,
        exitCode: 1,
        kind: 'error',
        summary: `cd: ${target}: No such board`,
      };
    }

    const data: BoardSwitchData = {
      board: createBoardReferenceData(nextBoard),
    };

    return {
      output: `Switched to ${formatBoardPath(nextBoard.name)}`,
      exitCode: 0,
      kind: 'board-switch',
      summary: `Switched to ${formatBoardPath(nextBoard.name)}`,
      data,
      nextBoard,
    };
  }

  return {
    output: `[error] cd: board switching not available`,
    exitCode: 1,
    kind: 'error',
    summary: 'cd: board switching not available',
  };
};

const pwd: Command = (_args, ctx) => {
  const data: BoardLocationData = {
    path: ctx.currentBoardId ? formatBoardPath(ctx.currentBoardName) : '/',
    board: ctx.currentBoardId
      ? createBoardReferenceData({
          id: ctx.currentBoardId,
          name: ctx.currentBoardName,
        })
      : null,
  };

  if (ctx.currentBoardId) {
    return {
      output: formatBoardPath(ctx.currentBoardName),
      exitCode: 0,
      kind: 'board-location',
      summary: formatBoardPath(ctx.currentBoardName),
      data,
    };
  }
  return {
    output: '/ (no active board)',
    exitCode: 0,
    kind: 'board-location',
    summary: '/ (no active board)',
    data,
  };
};

const cat: Command = (args, ctx) => {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    return {
      output: `cat — read element details
Usage: cat <element-id>`,
      exitCode: 0,
      kind: 'info',
      summary: 'cat help',
    };
  }

  if (!ctx.currentBoardId) {
    return {
      output: '[error] cat: not in a board. Use cd <board> first.',
      exitCode: 1,
      kind: 'error',
      summary: 'cat: not in a board',
    };
  }

  const reference = args[0];
  const overflowOutput = readOverflowOutput(reference);
  if (overflowOutput != null) {
    return {
      output: overflowOutput,
      exitCode: 0,
      kind: 'element-read',
      summary: `Read ${reference}`,
    };
  }

  const found = findElementByReference(ctx.board.children, reference);
  if (!found) {
    return {
      output: `[error] cat: ${reference}: No such element`,
      exitCode: 1,
      kind: 'error',
      summary: `cat: ${reference}: No such element`,
    };
  }

  const detail = serializeElementWithContext(
    found.element,
    ctx.board.children,
    'full',
  );
  return {
    output: detail,
    exitCode: 0,
    kind: 'element-read',
    summary: `Read ${reference}`,
  };
};

function getElementsBounds(elements: PlaitElement[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const collectPoints = (el: PlaitElement) => {
    const pts = (el as Record<string, unknown>).points as number[][] | undefined;
    if (pts) {
      for (const p of pts) {
        minX = Math.min(minX, p[0]);
        minY = Math.min(minY, p[1]);
        maxX = Math.max(maxX, p[0]);
        maxY = Math.max(maxY, p[1]);
      }
    }
    const children = (el as Record<string, unknown>).children as PlaitElement[] | undefined;
    if (children) children.forEach(collectPoints);
  };
  elements.forEach(collectPoints);
  if (minX === Infinity) return null;
  return { minX, minY, maxX, maxY };
}

function offsetElement(el: PlaitElement, dx: number, dy: number): PlaitElement {
  const cloned = JSON.parse(JSON.stringify(el));
  const offsetPoints = (e: Record<string, unknown>) => {
    const pts = e.points as number[][] | undefined;
    if (pts) {
      for (const p of pts) {
        p[0] += dx;
        p[1] += dy;
      }
    }
    const children = e.children as PlaitElement[] | undefined;
    if (children) children.forEach(offsetPoints);
  };
  offsetPoints(cloned);
  return cloned;
}

function findNonOverlappingPosition(
  board: PlaitBoard,
  width: number,
  height: number,
): [number, number] {
  const gap = 30;
  const stepX = width + gap;
  const stepY = height + gap;
  const candidates: [number, number][] = [];

  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 20; col++) {
      candidates.push([col * stepX, row * stepY]);
    }
  }

  const rects = board.children.map((el) => {
    const pts = (el as Record<string, unknown>).points as number[][] | undefined;
    if (!pts || pts.length === 0) return null;
    if (pts.length === 1) {
      const isMind = (el as Record<string, unknown>).type === 'mindmap';
      const size = isMind ? 300 : 100;
      return { x: pts[0][0] - size / 2, y: pts[0][1] - size / 2, w: size, h: size };
    }
    return {
      x: Math.min(pts[0][0], pts[1][0]),
      y: Math.min(pts[0][1], pts[1][1]),
      w: Math.abs(pts[1][0] - pts[0][0]),
      h: Math.abs(pts[1][1] - pts[0][1]),
    };
  });

  for (const [x, y] of candidates) {
    const overlaps = rects.some((r) => {
      if (!r) return false;
      return (
        x < r.x + r.w + gap &&
        x + width + gap > r.x &&
        y < r.y + r.h + gap &&
        y + height + gap > r.y
      );
    });
    if (!overlaps) return [x, y];
  }

  return [0, 0];
}

function findNonOverlappingOffset(
  board: PlaitBoard,
  elements: PlaitElement[],
): [number, number] {
  const bounds = getElementsBounds(elements);
  if (!bounds) return [0, 0];
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const [x, y] = findNonOverlappingPosition(board, width, height);
  return [x - bounds.minX, y - bounds.minY];
}

function panToElements(board: PlaitBoard, elements: PlaitElement[]): void {
  const bounds = getElementsBounds(elements);
  if (!bounds) return;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  try {
    const containerRect = PlaitBoardStatic.getBoardContainer(board).getBoundingClientRect();
    const zoom = board.viewport.zoom;
    const origination: [number, number] = [
      centerX - containerRect.width / 2 / zoom,
      centerY - containerRect.height / 2 / zoom,
    ];
    BoardTransforms.updateViewport(board, origination);
  } catch {
  }
}

const touch: Command = (args, ctx) => {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    return {
      output: `touch — create an element
Usage: touch <type> [text]
Types: shape, sticky, text
Examples:
  touch shape "My Box"
  touch sticky "Reminder"
  touch sticky "Reminder" color:blue
  touch text "Label"`,
      exitCode: 0,
    };
  }

  if (!ctx.currentBoardId) {
    return {
      output: '[error] touch: not in a board. Use cd <board> first.',
      exitCode: 1,
    };
  }

  const type = args[0];
  const text = args.slice(1).join(' ') || '';

  let element: PlaitElement;
  const ink = getBoardInkColors(getBoardThemeMode(ctx.board.theme));

  switch (type) {
    case 'shape': {
      const w = 100, h = 100;
      const [ox, oy] = findNonOverlappingPosition(ctx.board, w, h);
      const points: [[number, number], [number, number]] = [
        [ox, oy],
        [ox + w, oy + h],
      ];
      const textContent = {
        children: [{ text, color: ink.text }],
        autoSize: true,
      };
      element = createGeometryElement(
        BasicShapes.rectangle,
        points,
        textContent,
        {
          strokeColor: ink.stroke,
        },
      ) as unknown as PlaitElement;
      element.id = idCreator();
      break;
    }
    case 'sticky': {
      const { text: stickyText, color } = parseStickyTouchArgs(args.slice(1));
      const estimated = estimateStickySize(stickyText);
      const [ox, oy] = findNonOverlappingPosition(ctx.board, estimated.width, estimated.height);
      const points: [[number, number], [number, number]] = [
        [ox, oy],
        [ox + estimated.width, oy + estimated.height],
      ];
      element = createStickyNoteElement({
        points,
        text: stickyText,
        color,
      });
      break;
    }
    case 'text': {
      const w = 200, h = 50;
      const [ox, oy] = findNonOverlappingPosition(ctx.board, w, h);
      const points: [[number, number], [number, number]] = [
        [ox, oy],
        [ox + w, oy + h],
      ];
      const textContent = {
        children: [{ text, color: ink.text }],
        autoSize: true,
      };
      element = createGeometryElement(
        BasicShapes.text,
        points,
        textContent,
      ) as unknown as PlaitElement;
      element.id = idCreator();
      break;
    }
    default:
      return {
        output: `[error] touch: unknown type '${type}'. Use: shape, sticky, text`,
        exitCode: 1,
      };
  }

  const path = [ctx.board.children.length];
  Transforms.insertNode(ctx.board, element, path);

  panToElements(ctx.board, [element]);

  const detail = serializeElementWithContext(
    element,
    ctx.board.children,
    'summary',
  );
  return { output: `Created ${detail}`, exitCode: 0, persistBoard: true };
};

const mkdir: Command = async (args, ctx) => {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    return {
      output: `mkdir — create a new board
Usage: mkdir <name>`,
      exitCode: 0,
      kind: 'info',
      summary: 'mkdir help',
    };
  }

  const name = args.join(' ').trim();
  if (!name) {
    return {
      output: `[error] mkdir: board name is required`,
      exitCode: 1,
      kind: 'error',
      summary: 'mkdir: board name is required',
    };
  }

  if (!ctx.onBoardCreate) {
    return {
      output: `[error] mkdir: board creation not available`,
      exitCode: 1,
      kind: 'error',
      summary: 'mkdir: board creation not available',
    };
  }

  const nextBoard = await ctx.onBoardCreate(name);

  const data: BoardCreateData = {
    board: createBoardReferenceData(nextBoard),
  };

  return {
    output: `Created board ${formatBoardPath(nextBoard.name)}
Switched to ${formatBoardPath(nextBoard.name)}
Board ID: ${nextBoard.id}`,
    exitCode: 0,
    kind: 'board-create',
    summary: `Created ${formatBoardPath(nextBoard.name)}`,
    data,
    nextBoard,
  };
};

const rm: Command = (args, ctx) => {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    return {
      output: `rm — delete elements
Usage: rm <element-id> [element-id ...]
Examples:
  rm abc123
  rm abc123 def456`,
      exitCode: 0,
    };
  }

  if (!ctx.currentBoardId) {
    return {
      output: '[error] rm: not in a board. Use cd <board> first.',
      exitCode: 1,
    };
  }

  const errors: string[] = [];
  const found: { reference: string; resolvedId: string; path: number[] }[] = [];

  for (const reference of args) {
    const result = findElementByReference(ctx.board.children, reference);
    if (!result) {
      errors.push(`rm: ${reference}: No such element`);
    } else {
      found.push({
        reference,
        resolvedId: result.element.id,
        path: result.path,
      });
    }
  }

  const elementsToRemove: PlaitElement[] = [];
  for (const item of found) {
    const el = findElementWithPath(ctx.board.children, item.resolvedId);
    if (el) elementsToRemove.push(el.element);
  }

  found.sort((a, b) => {
    for (let i = 0; i < Math.min(a.path.length, b.path.length); i++) {
      if (a.path[i] !== b.path[i]) return b.path[i] - a.path[i];
    }
    return b.path.length - a.path.length;
  });

  let removeCount = 0;
  for (const item of found) {
    try {
      removeElement(ctx.board, item.path);
      removeCount++;
    } catch (err) {
      errors.push(
        `rm: ${item.reference}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const details = elementsToRemove
    .slice(0, 5)
    .map((el) => serializeElementWithContext(el, ctx.board.children, 'summary'));
  const summary = `Removed ${removeCount} element${removeCount !== 1 ? 's' : ''}`;
  const output =
    details.length > 0
      ? `${summary}\n${details.join('\n')}`
      : summary;

  if (errors.length) {
    return {
      output: `${output}\n${errors.map((e) => `[error] ${e}`).join('\n')}`,
      exitCode: 1,
      persistBoard: removeCount > 0,
    };
  }
  return { output, exitCode: 0, persistBoard: removeCount > 0 };
};

const rmdir: Command = async (args, ctx) => {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    return {
      output: `rmdir — delete a board
Usage: rmdir <board-name>`,
      exitCode: 0,
      kind: 'info',
      summary: 'rmdir help',
    };
  }

  const target = normalizeBoardReferenceInput(args.join(' '));
  if (!target) {
    return {
      output: `[error] rmdir: board name is required`,
      exitCode: 1,
      kind: 'error',
      summary: 'rmdir: board name is required',
    };
  }

  const resolution = resolveBoardReference(target, ctx.boards);
  if (resolution.status === 'ambiguous') {
    return {
      output: formatAmbiguousBoardError('rmdir', target, resolution.matches),
      exitCode: 1,
      kind: 'error',
      summary: `rmdir: ${target}: ambiguous board name`,
    };
  }

  if (resolution.status === 'missing') {
    return {
      output: `[error] rmdir: ${target}: No such board`,
      exitCode: 1,
      kind: 'error',
      summary: `rmdir: ${target}: No such board`,
    };
  }

  const boardToDelete = resolution.board;

  if (ctx.boards.length <= 1) {
    return {
      output: `[error] rmdir: cannot delete the last board`,
      exitCode: 1,
      kind: 'error',
      summary: 'rmdir: cannot delete the last board',
    };
  }

  if (!ctx.onBoardDelete) {
    return {
      output: `[error] rmdir: board deletion not available`,
      exitCode: 1,
      kind: 'error',
      summary: 'rmdir: board deletion not available',
    };
  }

  const deletion = await ctx.onBoardDelete(boardToDelete.id);
  if (!deletion) {
    return {
      output: `[error] rmdir: ${target}: No such board`,
      exitCode: 1,
      kind: 'error',
      summary: `rmdir: ${target}: No such board`,
    };
  }

  const data: BoardDeleteData = {
    deletedBoard: createBoardReferenceData({
      id: deletion.deletedBoardId,
      name: deletion.deletedBoardName,
    }),
    activeBoard: deletion.nextBoard
      ? createBoardReferenceData(deletion.nextBoard)
      : ctx.currentBoardId === deletion.deletedBoardId
        ? null
        : ctx.currentBoardId
          ? createBoardReferenceData({
              id: ctx.currentBoardId,
              name: ctx.currentBoardName,
            })
          : null,
  };

  return {
    output: deletion.nextBoard
      ? `Removed ${formatBoardPath(deletion.deletedBoardName)} and switched to ${formatBoardPath(deletion.nextBoard.name)}`
      : `Removed ${formatBoardPath(deletion.deletedBoardName)}`,
    exitCode: 0,
    kind: 'board-delete',
    summary: deletion.nextBoard
      ? `Removed ${formatBoardPath(deletion.deletedBoardName)}`
      : `Removed ${formatBoardPath(deletion.deletedBoardName)}`,
    data,
    nextBoard: deletion.nextBoard,
    deletedBoardId: deletion.deletedBoardId,
  };
};

const cp: Command = (args, ctx) => {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    return {
      output: `cp — duplicate an element
Usage: cp <element-id>`,
      exitCode: 0,
    };
  }

  if (!ctx.currentBoardId) {
    return {
      output: '[error] cp: not in a board. Use cd <board> first.',
      exitCode: 1,
    };
  }

  const reference = args[0];
  const found = findElementByReference(ctx.board.children, reference);
  if (!found) {
    return { output: `[error] cp: ${reference}: No such element`, exitCode: 1 };
  }

  try {
    duplicateElements(ctx.board, [found.element]);
    const detail = serializeElementWithContext(
      found.element,
      ctx.board.children,
      'summary',
    );
    return { output: `Duplicated ${detail}`, exitCode: 0, persistBoard: true };
  } catch (err) {
    return {
      output: `[error] cp: ${err instanceof Error ? err.message : String(err)}`,
      exitCode: 1,
    };
  }
};

const STICKY_FILL_HEXES = new Set(
  Object.values(STICKY_COLORS).map((c) => c.fill.toLowerCase()),
);

type TextLeaf = { text: string; bold?: boolean; italic?: boolean; underlined?: boolean; strike?: boolean; color?: string; 'font-size'?: string | number };
type TextObj = { children: TextLeaf[]; autoSize?: boolean };
type MermaidMetadata = { classId?: string; sourceType?: string; originalId?: string };
type ElementMatch = { element: PlaitElement; path: number[] };
type PatchableElement = Record<string, unknown> & {
  type?: string;
  shape?: string;
  groupId?: string;
  metadata?: MermaidMetadata;
  fill?: string;
  strokeColor?: string;
  text?: TextObj;
  points?: [[number, number], [number, number]];
};
type ClassStyleChanges = {
  fill?: string;
  stroke?: string;
  textColor?: string;
};

function cloneElementForPatch(original: PlaitElement): Record<string, unknown> {
  return JSON.parse(JSON.stringify(original));
}

function getMermaidMetadata(
  element: Record<string, unknown>,
): MermaidMetadata | undefined {
  const metadata = element.metadata;
  return metadata && typeof metadata === 'object'
    ? (metadata as MermaidMetadata)
    : undefined;
}

function findElementsByGroupId(
  elements: PlaitElement[],
  groupId: string,
  pathPrefix: number[] = [],
): ElementMatch[] {
  const matches: ElementMatch[] = [];

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const path = [...pathPrefix, i];

    if ((element as { groupId?: string }).groupId === groupId) {
      matches.push({ element, path });
    }

    if (element.children && Array.isArray(element.children)) {
      matches.push(
        ...findElementsByGroupId(
          element.children as PlaitElement[],
          groupId,
          path,
        ),
      );
    }
  }

  return matches;
}

function getClassGroupMembers(
  board: PlaitBoard,
  element: PlaitElement,
): { classId: string; members: ElementMatch[] } | null {
  const groupId = (element as { groupId?: string }).groupId;
  if (!groupId) {
    return null;
  }

  const members = findElementsByGroupId(board.children, groupId);
  const classCarrier = members.find((member) => {
    const classId = getMermaidMetadata(
      member.element as Record<string, unknown>,
    )?.classId;
    return typeof classId === 'string' && classId.length > 0;
  });

  const classId = classCarrier
    ? getMermaidMetadata(
        classCarrier.element as Record<string, unknown>,
      )?.classId
    : undefined;

  if (!classId) {
    return null;
  }

  return { classId, members };
}

function applyNodeUpdate(
  board: PlaitBoard,
  match: ElementMatch,
  newProperties: Record<string, unknown>,
): void {
  try {
    board.apply({
      type: 'set_node',
      path: match.path,
      properties: {},
      newProperties,
    });
  } catch {
  }
}

function applyClassGroupStyleChanges(
  board: PlaitBoard,
  members: ElementMatch[],
  styleChanges: ClassStyleChanges,
): number {
  let updatedCount = 0;

  for (const member of members) {
    const cloned = cloneElementForPatch(member.element) as PatchableElement;
    const isTextElement =
      cloned.type === 'geometry' && cloned.shape === BasicShapes.text;
    const isGeometryShape =
      cloned.type === 'geometry' && cloned.shape !== BasicShapes.text;
    const isLineElement =
      cloned.type === 'arrow-line' || cloned.type === 'vector-line';

    let changed = false;

    if (styleChanges.fill && isGeometryShape) {
      cloned.fill = styleChanges.fill;
      changed = true;
    }

    if (styleChanges.stroke && (isGeometryShape || isLineElement)) {
      cloned.strokeColor = styleChanges.stroke;
      changed = true;
    }

    if (styleChanges.textColor && isTextElement) {
      const leaves = ensureTextLeaves(cloned);
      for (const leaf of leaves) {
        leaf.color = styleChanges.textColor;
      }
      changed = true;
    }

    if (!changed) {
      continue;
    }

    applyNodeUpdate(board, member, cloned);
    updatedCount++;
  }

  return updatedCount;
}

function getTextLeaves(element: Record<string, unknown>): TextLeaf[] | null {
  const textObj = element.text as TextObj | undefined;
  return textObj?.children ?? null;
}

function ensureTextLeaves(element: Record<string, unknown>): TextLeaf[] {
  const existing = getTextLeaves(element);
  if (existing && existing.length > 0) return existing;
  const leaves: TextLeaf[] = [{ text: '' }];
  element.text = { children: leaves, autoSize: true };
  return leaves;
}

const patch: Command = (args, ctx) => {
  if (args.length < 2 || args.includes('--help') || args.includes('-h')) {
    return {
      output: `patch — update element properties
Usage: patch <element-id> key=value [key=value ...]
Properties:
  text=<string>         — update text content
  fill=<hex>            — update fill color (hex)
  stroke=<hex>          — update stroke/border color (hex)
  color=<name>          — set sticky note color (yellow, blue, green, pink, purple, orange)
  textColor=<hex>       — update text color (hex)
  fontSize=<value>      — update font size (e.g. 16, 24, 32)
  bold=true|false       — toggle bold text
  italic=true|false     — toggle italic text
  underline=true|false  — toggle underline text
  strike=true|false     — toggle strikethrough text
Examples:
  patch abc123 text="New Label"
  patch abc123 fill=#ff0000
  patch abc123 color=yellow
  patch abc123 textColor=#333333 bold=true fontSize=24
  patch abc123 stroke=blue text="Updated" italic=true`,
      exitCode: 0,
    };
  }

  if (!ctx.currentBoardId) {
    return {
      output: '[error] patch: not in a board. Use cd <board> first.',
      exitCode: 1,
    };
  }

  const reference = args[0];
  const found = findElementByReference(ctx.board.children, reference);
  if (!found) {
    return {
      output: `[error] patch: ${reference}: No such element`,
      exitCode: 1,
    };
  }

  const element = cloneElementForPatch(found.element);
  const props = args.slice(1);
  const changes: string[] = [];
  const classStyleChanges: ClassStyleChanges = {};

  for (const prop of props) {
    const eqIdx = prop.indexOf('=');
    if (eqIdx === -1) {
      changes.push(`[warning] invalid format: ${prop} (expected key=value)`);
      continue;
    }

    const key = prop.slice(0, eqIdx);
    const value = prop.slice(eqIdx + 1);

    switch (key) {
      case 'text': {
        const leaves = ensureTextLeaves(element);
        leaves[0].text = value;
        changes.push(`text="${value}"`);
        const isSticky = STICKY_FILL_HEXES.has((element.fill as string || '').toLowerCase());
        if (isSticky) {
          const estimated = estimateStickySize(value);
          const currentPoints = element.points as [[number, number], [number, number]] | undefined;
          const origin = currentPoints?.[0] ?? [0, 0];
          element.points = [origin, [origin[0] + estimated.width, origin[1] + estimated.height]];
        }
        break;
      }
      case 'fill':
        element.fill = value;
        classStyleChanges.fill = value;
        changes.push(`fill=${value}`);
        break;
      case 'stroke':
        element.strokeColor = value;
        classStyleChanges.stroke = value;
        changes.push(`stroke=${value}`);
        break;
      case 'color': {
        const normalizedColor = value.toLowerCase();
        if (!isStickyColorName(normalizedColor)) {
          changes.push(`[warning] unknown sticky color: ${value}. Available: yellow, blue, green, pink, purple, orange`);
          break;
        }
        const colorPair = STICKY_COLORS[normalizedColor];
        element.fill = colorPair.fill;
        element.strokeColor = colorPair.stroke;
        changes.push(`color=${normalizedColor}`);
        break;
      }
      case 'textColor': {
        const leaves = ensureTextLeaves(element);
        for (const leaf of leaves) {
          leaf.color = value;
        }
        classStyleChanges.textColor = value;
        changes.push(`textColor=${value}`);
        break;
      }
      case 'fontSize': {
        const leaves = ensureTextLeaves(element);
        for (const leaf of leaves) {
          leaf['font-size'] = value;
        }
        changes.push(`fontSize=${value}`);
        break;
      }
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strike': {
        const boolVal = value === 'true';
        const markKey = key === 'underline' ? 'underlined' : key;
        const leaves = ensureTextLeaves(element);
        for (const leaf of leaves) {
          (leaf as Record<string, unknown>)[markKey] = boolVal;
        }
        changes.push(`${key}=${boolVal}`);
        break;
      }
      default:
        changes.push(`[warning] unknown property: ${key}`);
    }
  }

  applyNodeUpdate(ctx.board, found, element);

  const classGroup = getClassGroupMembers(ctx.board, found.element);
  const shouldApplyClassStyles =
    classGroup &&
    (classStyleChanges.fill ||
      classStyleChanges.stroke ||
      classStyleChanges.textColor);

  const classGroupUpdateCount = shouldApplyClassStyles
    ? applyClassGroupStyleChanges(
        ctx.board,
        classGroup.members,
        classStyleChanges,
      )
    : 0;

  const updatedFound =
    findElementWithPath(ctx.board.children, found.element.id) ?? found;
  const detail = serializeElementWithContext(
    updatedFound.element,
    ctx.board.children,
    'summary',
  );
  const output = changes.length > 0
    ? `${shouldApplyClassStyles ? `Updated class:${classGroup!.classId} via ${detail}` : `Updated ${detail}`}${
        classGroupUpdateCount > 0
          ? `\n  linked elements: ${classGroupUpdateCount}`
          : ''
      }\n  changes: ${changes.join(', ')}`
    : `No changes applied to ${reference}`;

  return { output, exitCode: 0, persistBoard: changes.length > 0 || classGroupUpdateCount > 0 };
};

const write: Command = async (args, ctx) => {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    return {
      output: `write — create diagrams and mind maps
Usage: write <type> "content"
Types:
  mermaid "flowchart TD\\n  A --> B"   — create flowchart/diagram
  mindmap "# Topic\\n- Branch"          — create mind map`,
      exitCode: 0,
    };
  }

  if (!ctx.currentBoardId) {
    return {
      output: '[error] write: not in a board. Use cd <board> first.',
      exitCode: 1,
    };
  }

  const type = args[0];
  const content = args.slice(1).join(' ');

  if (!content) {
    return {
      output: `[error] write: no content provided`,
      exitCode: 1,
    };
  }

  try {
    if (type === 'mermaid') {
      const { parseMermaidToBoard } = await import(
        '@thinkix/mermaid-to-thinkix'
      );
      const result = await parseMermaidToBoard(content);

      if (!result.elements.length) {
        return {
          output: `[error] write mermaid: no elements generated${
            result.warnings.length
              ? `\nWarnings: ${result.warnings.join('; ')}`
              : ''
          }`,
          exitCode: 1,
        };
      }

      const elements = syncElementsForBoardTheme(
        relayoutHeaderDrivenDiagram(result.elements as PlaitElement[]),
        getBoardThemeMode(ctx.board.theme),
      );
      const [dx, dy] = findNonOverlappingOffset(ctx.board, elements);
      const offsetElements = elements.map((el) => offsetElement(el, dx, dy));
      const previousCount = ctx.board.children.length;
      ctx.board.insertFragment(
        { elements: offsetElements },
        [0, 0],
        WritableClipboardOperationType.paste,
      );

      const insertedElements = ctx.board.children.slice(previousCount);
      focusAndRevealElements(
        ctx.board,
        insertedElements.length > 0 ? insertedElements : offsetElements,
      );

      const serializationContext = createSerializationContext(ctx.board.children);

      const details = offsetElements
        .slice(0, 10)
        .map((el) =>
          serializeElementWithContext(
            el,
            ctx.board.children,
            'summary',
            serializationContext,
          ),
        );
      const summary = `Created ${offsetElements.length} element${offsetElements.length !== 1 ? 's' : ''} from mermaid diagram`;
      const output =
        details.length > 0
          ? `${summary}\n${details.join('\n')}`
          : summary;

      return { output, exitCode: 0, persistBoard: true };
    }

    if (type === 'mindmap') {
      const { parseMarkdownToMindElement } = await import(
        '@thinkix/plait-utils'
      );
      const mindElement = parseMarkdownToMindElement(content);

      if (!mindElement) {
        return {
          output: `[error] write mindmap: failed to parse markdown`,
          exitCode: 1,
        };
      }

      const element = mindElement as unknown as PlaitElement;
      const previousCount = ctx.board.children.length;
      insertElementDirect(ctx.board, element);

      const insertedElement =
        ctx.board.children[previousCount] ?? element;

      focusAndRevealElements(ctx.board, [insertedElement]);

      const detail = serializeElementWithContext(
        insertedElement,
        ctx.board.children,
        'summary',
      );
      return { output: `Created ${detail}`, exitCode: 0, persistBoard: true };
    }

    return {
      output: `[error] write: unknown type '${type}'. Use: mermaid, mindmap`,
      exitCode: 1,
    };
  } catch (err) {
    return {
      output: `[error] write: ${err instanceof Error ? err.message : String(err)}`,
      exitCode: 1,
    };
  }
};

const select: Command = (args, ctx) => {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    return {
      output: `select — highlight elements on the canvas
Usage: select <element-id> [element-id ...]
  select --clear    clear selection`,
      exitCode: 0,
    };
  }

  if (!ctx.currentBoardId) {
    return {
      output: '[error] select: not in a board. Use cd <board> first.',
      exitCode: 1,
    };
  }

  if (args[0] === '--clear') {
    setSelectedElementsWithGroup(ctx.board, [], false);
    return { output: 'Selection cleared', exitCode: 0 };
  }

  const found: PlaitElement[] = [];
  const errors: string[] = [];

  for (const reference of args) {
    const result = findElementByReference(ctx.board.children, reference);
    if (result) {
      found.push(result.element);
    } else {
      errors.push(`select: ${reference}: No such element`);
    }
  }

  if (found.length > 0) {
    setSelectedElementsWithGroup(ctx.board, found, false);
  }

  const details = found
    .slice(0, 10)
    .map((el) => serializeElement(el, 'summary', { allElements: ctx.board.children }));
  const summary = `Selected ${found.length} element${found.length !== 1 ? 's' : ''}`;

  let output = details.length > 0 ? `${summary}\n${details.join('\n')}` : summary;
  if (errors.length) {
    output += `\n${errors.map((e) => `[error] ${e}`).join('\n')}`;
  }

  return { output, exitCode: errors.length > 0 ? 1 : 0 };
};

const grep: Command = (args, ctx) => {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    return {
      output: `grep — search elements by text
Usage: grep <pattern>
Examples:
  grep "meeting"
  grep "TODO"`,
      exitCode: 0,
    };
  }

  if (!ctx.currentBoardId) {
    return {
      output: '[error] grep: not in a board. Use cd <board> first.',
      exitCode: 1,
    };
  }

  const pattern = args.join(' ').toLowerCase();
  const elements = ctx.board.children;
  const matches: PlaitElement[] = [];

  const visit = (element: PlaitElement): void => {
    const textObj = (element as Record<string, unknown>).text as
      | { children: Array<{ text?: string }> }
      | undefined;
    const topicObj = (element as Record<string, unknown>).data as
      | { topic?: { children?: Array<{ text?: string }> } }
      | undefined;
    const text = textObj?.children?.[0]?.text?.toLowerCase() || '';
    const topicText = topicObj?.topic?.children?.[0]?.text?.toLowerCase() || '';

    if (text.includes(pattern) || topicText.includes(pattern)) {
      matches.push(element);
    }

    if (element.children && Array.isArray(element.children)) {
      for (const child of element.children as PlaitElement[]) {
        visit(child);
      }
    }
  };

  for (const el of elements) {
    visit(el);
  }

  if (matches.length === 0) {
    return { output: `No elements matching "${args.join(' ')}"`, exitCode: 0 };
  }

  const details = matches.map((el) =>
    serializeElementWithContext(el, elements, 'summary'),
  );
  return {
    output: `Found ${matches.length} match${matches.length !== 1 ? 'es' : ''}\n${details.join('\n')}`,
    exitCode: 0,
  };
};

export const commands: Record<string, Command> = {
  ls,
  cd,
  pwd,
  cat,
  touch,
  mkdir,
  rm,
  rmdir,
  cp,
  patch,
  write,
  select,
  grep,
};

export const COMMAND_LIST = `Available commands: ls, cd, pwd, cat, touch, mkdir, rm, rmdir, cp, patch, write, select, grep
Use <command> --help for usage.`;
