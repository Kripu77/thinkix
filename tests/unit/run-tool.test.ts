import { describe, expect, it, vi } from 'vitest';
import type { PlaitElement } from '@plait/core';
import { parseMermaidToBoard } from '@thinkix/mermaid-to-thinkix';
import { executeRun } from '@/features/agent/tools/run-tool';
import { parseCommand } from '@/features/agent/tools/chain-parser';
import type { RunToolOutput } from '@/features/agent/tools/result-types';
import {
  STICKY_COLORS,
  STICKY_SUBTYPE,
} from '@/shared/constants';
import { createMockBoard } from '@/tests/__utils__/test-utils';

vi.mock('@thinkix/mermaid-to-thinkix', () => ({
  parseMermaidToBoard: vi.fn(),
}));

interface MockMindElement extends PlaitElement {
  type: 'mindmap';
  points?: [number, number][];
  children?: MockMindElement[];
  data?: {
    topic?: {
      children?: Array<{ text?: string }>;
    };
  };
}

function expectSuccess(output: RunToolOutput): void {
  expect(output.exitCode).toBe(0);
}

describe('run-tool mind map flow', () => {
  it('decodes escaped newlines inside quoted command arguments', () => {
    for (const quote of [`"`, `'`]) {
      const { args } = parseCommand(
        `write mindmap ${quote}# Root\\n- Branch${quote}`,
      );

      expect(args[0]).toBe('mindmap');
      expect(args[1]).toBe('# Root\n- Branch');
    }
  });

  it('inserts mind maps with an anchor point when run from the agent command surface', async () => {
    const board = createMockBoard();

    board.apply = vi.fn((operation: unknown) => {
      const insertOperation = operation as {
        type?: string;
        node?: PlaitElement;
        path?: number[];
      };

      if (
        insertOperation.type === 'insert_node' &&
        insertOperation.node &&
        insertOperation.path
      ) {
        board.children.splice(
          insertOperation.path[0],
          0,
          insertOperation.node,
        );
      }
    });

    const output = await executeRun(`write mindmap "# Root\\n- Branch"`, {
      board,
      currentBoardId: 'board-1',
      currentBoardName: 'My Board',
    });

    expectSuccess(output);
    expect(output.text).toContain('Created mind:');
    expect(board.children).toHaveLength(1);

    const insertedMind = board.children[0] as MockMindElement;

    expect(insertedMind.type).toBe('mindmap');
    expect(insertedMind.points).toEqual([[0, 0]]);
    expect(insertedMind.data?.topic?.children?.[0]?.text).toBe('Root');
    expect(insertedMind.children).toHaveLength(1);
    expect(insertedMind.children?.[0].data?.topic?.children?.[0]?.text).toBe(
      'Branch',
    );
  });

  it('reads mind maps through the same prefixed references shown in ls output', async () => {
    const board = createMockBoard({
      elements: [
        {
          id: 'mind-1',
          type: 'mindmap',
          data: { topic: { children: [{ text: 'Tech Trends 2026' }] } },
          children: [
            {
              id: 'mind-branch-1',
              type: 'mindmap',
              data: { topic: { children: [{ text: 'Agentic AI' }] } },
              children: [
                {
                  id: 'mind-leaf-1',
                  type: 'mindmap',
                  data: { topic: { children: [{ text: 'Autonomous workflows' }] } },
                  children: [],
                } as MockMindElement,
              ],
            } as MockMindElement,
          ],
        } as MockMindElement,
      ],
    });

    const output = await executeRun('cat mind:mind-1', {
      board,
      currentBoardId: 'board-1',
      currentBoardName: 'My Board',
    });

    expectSuccess(output);
    expect(output.text).toContain('mind:mind-1');
    expect(output.text).toContain('root: "Tech Trends 2026"');
    expect(output.text).toContain('- mind:mind-branch-1 "Agentic AI"');
    expect(output.text).toContain('- mind:mind-leaf-1 "Autonomous workflows"');
  });

  it('searches inside mind map topics and nested branches', async () => {
    const board = createMockBoard({
      elements: [
        {
          id: 'mind-1',
          type: 'mindmap',
          data: { topic: { children: [{ text: 'Tech Trends 2026' }] } },
          children: [
            {
              id: 'mind-branch-1',
              type: 'mindmap',
              data: { topic: { children: [{ text: 'Quantum Computing' }] } },
              children: [],
            } as MockMindElement,
          ],
        } as MockMindElement,
      ],
    });

    const output = await executeRun('grep "quantum"', {
      board,
      currentBoardId: 'board-1',
      currentBoardName: 'My Board',
    });

    expectSuccess(output);
    expect(output.text).toContain('Found 1 match');
    expect(output.text).toContain('mind:mind-branch-1 "Quantum Computing"');
  });

  it('styles an entire Mermaid class box when patch targets a class text element', async () => {
    const board = createMockBoard({
      elements: [
        {
          id: 'trip-box',
          type: 'geometry',
          shape: 'rectangle',
          groupId: 'class-group-trip',
          metadata: { classId: 'Trip' },
          fill: '#ECECFF',
          strokeColor: '#9370DB',
          text: { children: [{ text: '' }] },
        } as PlaitElement,
        {
          id: 'trip-divider',
          type: 'arrow-line',
          groupId: 'class-group-trip',
          strokeColor: '#9370DB',
        } as PlaitElement,
        {
          id: 'trip-title',
          type: 'geometry',
          shape: 'text',
          groupId: 'class-group-trip',
          text: { children: [{ text: 'Trip' }] },
        } as PlaitElement,
        {
          id: 'trip-field',
          type: 'geometry',
          shape: 'text',
          groupId: 'class-group-trip',
          text: { children: [{ text: '+uuid tripId' }] },
        } as PlaitElement,
      ],
    });

    board.apply = vi.fn((operation: unknown) => {
      const setNodeOperation = operation as {
        type?: string;
        path?: number[];
        newProperties?: PlaitElement;
      };

      if (
        setNodeOperation.type === 'set_node' &&
        setNodeOperation.path &&
        setNodeOperation.newProperties
      ) {
        board.children[setNodeOperation.path[0]] = setNodeOperation.newProperties;
      }
    });

    const output = await executeRun(
      'patch text:trip-title fill=#FDE68A stroke=#F59E0B textColor=#1F2937',
      {
        board,
        currentBoardId: 'board-1',
        currentBoardName: 'My Board',
      },
    );

    expectSuccess(output);
    expect(output.text).toContain('Updated class:Trip via');

    const box = board.children[0] as PlaitElement & {
      fill?: string;
      strokeColor?: string;
    };
    const divider = board.children[1] as PlaitElement & {
      strokeColor?: string;
    };
    const title = board.children[2] as PlaitElement & {
      text?: { children?: Array<{ text?: string; color?: string }> };
    };
    const field = board.children[3] as PlaitElement & {
      text?: { children?: Array<{ text?: string; color?: string }> };
    };

    expect(box.fill).toBe('#FDE68A');
    expect(box.strokeColor).toBe('#F59E0B');
    expect(divider.strokeColor).toBe('#F59E0B');
    expect(title.text?.children?.[0]?.color).toBe('#1F2937');
    expect(field.text?.children?.[0]?.color).toBe('#1F2937');
  });

  it('creates agent stickies with the shared sticky primitive and color parsing', async () => {
    const board = createMockBoard();

    board.apply = vi.fn((operation: unknown) => {
      const insertOperation = operation as {
        type?: string;
        node?: PlaitElement;
        path?: number[];
      };

      if (
        insertOperation.type === 'insert_node' &&
        insertOperation.node &&
        insertOperation.path
      ) {
        board.children.splice(insertOperation.path[0], 0, insertOperation.node);
      }
    });

    const output = await executeRun('touch sticky "Agent note" color:blue', {
      board,
      currentBoardId: 'board-1',
      currentBoardName: 'My Board',
    });

    expectSuccess(output);
    expect(board.children).toHaveLength(1);

    const sticky = board.children[0] as PlaitElement & {
      subtype?: string;
      fill?: string;
      strokeColor?: string;
      text?: { children?: Array<{ text?: string }> };
    };

    expect(sticky.subtype).toBe(STICKY_SUBTYPE);
    expect(sticky.fill).toBe(STICKY_COLORS.blue.fill);
    expect(sticky.strokeColor).toBe(STICKY_COLORS.blue.stroke);
    expect(sticky.text?.children?.[0]?.text).toBe('Agent note');
  });

  it('prefers placing generated diagrams to the right before wrapping below', async () => {
    vi.mocked(parseMermaidToBoard).mockResolvedValue({
      elements: [
        {
          id: 'generated-1',
          type: 'geometry',
          shape: 'rectangle',
          points: [
            [0, 0],
            [100, 100],
          ],
          text: { children: [{ text: 'Generated' }] },
        } as PlaitElement,
      ],
      warnings: [],
    });

    const board = createMockBoard({
      elements: [
        {
          id: 'existing-1',
          type: 'geometry',
          shape: 'rectangle',
          points: [
            [0, 0],
            [100, 100],
          ],
          text: { children: [{ text: 'Existing' }] },
        } as PlaitElement,
      ],
    });

    board.insertFragment = vi.fn((fragment: { elements: PlaitElement[] }) => {
      board.children.push(...fragment.elements);
    });

    const output = await executeRun(`write mermaid "flowchart TD\\nA-->B"`, {
      board,
      currentBoardId: 'board-1',
      currentBoardName: 'My Board',
    });

    expectSuccess(output);
    expect(board.children).toHaveLength(2);

    const insertedDiagram = board.children[1] as PlaitElement & {
      points: [[number, number], [number, number]];
    };

    expect(insertedDiagram.points[0]).toEqual([130, 0]);
    expect(insertedDiagram.points[1]).toEqual([230, 100]);
  });

  it('reflows header-driven mermaid cards into column sections during agent insert', async () => {
    vi.mocked(parseMermaidToBoard).mockResolvedValue({
      elements: [
        {
          id: 'phase-1',
          type: 'geometry',
          shape: 'rectangle',
          points: [
            [0, 0],
            [140, 120],
          ],
          text: { children: [{ text: 'PHASE 1\nFOUNDATION\n(Q1)' }] },
        } as PlaitElement,
        {
          id: 'client',
          type: 'geometry',
          shape: 'rectangle',
          points: [
            [220, 0],
            [440, 140],
          ],
          text: { children: [{ text: 'Client Management\n• Add/edit clients' }] },
        } as PlaitElement,
        {
          id: 'invoicing',
          type: 'geometry',
          shape: 'rectangle',
          points: [
            [470, 0],
            [690, 140],
          ],
          text: { children: [{ text: 'Invoicing\n• Create & send invoices' }] },
        } as PlaitElement,
        {
          id: 'phase-2',
          type: 'geometry',
          shape: 'rectangle',
          points: [
            [900, 0],
            [1040, 120],
          ],
          text: { children: [{ text: 'PHASE 2\nGROWTH\n(Q2)' }] },
        } as PlaitElement,
        {
          id: 'project',
          type: 'geometry',
          shape: 'rectangle',
          points: [
            [1120, 0],
            [1360, 140],
          ],
          text: { children: [{ text: 'Project Management\n• Kanban boards' }] },
        } as PlaitElement,
      ],
      warnings: [],
    });

    const board = createMockBoard();

    board.insertFragment = vi.fn((fragment: { elements: PlaitElement[] }) => {
      board.children.push(...fragment.elements);
    });

    const output = await executeRun(`write mermaid "flowchart TD\\nA-->B"`, {
      board,
      currentBoardId: 'board-1',
      currentBoardName: 'My Board',
    });

    expectSuccess(output);

    const insertedPhaseOne = board.children.find((element) => element.id === 'phase-1')!;
    const insertedClient = board.children.find((element) => element.id === 'client')!;
    const insertedPhaseTwo = board.children.find((element) => element.id === 'phase-2')!;
    const insertedProject = board.children.find((element) => element.id === 'project')!;

    expect((insertedClient.points as [[number, number], [number, number]])[0][1]).toBeGreaterThan(
      (insertedPhaseOne.points as [[number, number], [number, number]])[1][1],
    );
    expect((insertedProject.points as [[number, number], [number, number]])[0][1]).toBeGreaterThan(
      (insertedPhaseTwo.points as [[number, number], [number, number]])[1][1],
    );
    expect((insertedPhaseTwo.points as [[number, number], [number, number]])[0][0]).toBeGreaterThan(
      (insertedClient.points as [[number, number], [number, number]])[1][0],
    );
  });

  it('creates and switches to a new board with mkdir', async () => {
    const currentBoard = createMockBoard();
    const createdBoard = createMockBoard();
    const onBoardCreate = vi.fn(async (name: string) => ({
      board: createdBoard,
      id: 'board-hello',
      name,
      createdAt: 1,
      updatedAt: 1,
    }));

    const output = await executeRun('mkdir hello', {
      board: currentBoard,
      currentBoardId: 'board-1',
      currentBoardName: 'My Board',
      currentBoardCreatedAt: 1,
      currentBoardUpdatedAt: 1,
      onBoardCreate,
    });

    expectSuccess(output);
    expect(onBoardCreate).toHaveBeenCalledWith('hello');
    expect(output.text).toContain('Created board /hello/');
    expect(output.text).toContain('Switched to /hello/');
    expect(output.text).toContain('Board ID: board-hello');
  });

  it('renders board switches as a clean single-line response', async () => {
    const currentBoard = createMockBoard();
    const targetBoard = createMockBoard();
    const onBoardSwitch = vi.fn(async () => ({
      board: targetBoard,
      id: 'board-1',
      name: 'My Board',
      createdAt: 1,
      updatedAt: 1,
    }));

    const output = await executeRun('cd "/My Board"', {
      board: currentBoard,
      currentBoardId: 'board-hello',
      currentBoardName: 'hello',
      currentBoardCreatedAt: 1,
      currentBoardUpdatedAt: 1,
      boards: [
        { id: 'board-hello', name: 'hello', elementCount: 1 },
        { id: 'board-1', name: 'My Board', elementCount: 250 },
      ],
      onBoardSwitch,
    });

    expectSuccess(output);
    expect(output.text).toContain('Switched to /My Board/');
    expect(output.text).not.toContain('Board ID:');
  });

  it('returns structured board listings for ls /', async () => {
    const currentBoard = createMockBoard({
      elements: Array.from({ length: 250 }, (_, index) => ({
        id: `shape-${index}`,
        type: 'geometry',
        shape: 'rectangle',
        points: [
          [0, 0],
          [100, 100],
        ],
        text: { children: [{ text: `Node ${index}` }] },
      }) as PlaitElement),
    });

    const output = await executeRun('ls /', {
      board: currentBoard,
      currentBoardId: 'board-1',
      currentBoardName: 'My Board',
      boards: [
        { id: 'board-1', name: 'My Board', elementCount: 250 },
        { id: 'board-hello', name: 'hello', elementCount: 1 },
      ],
    });

    expect(output.kind).toBe('board-list');
    expect(output.summary).toBe('Found 2 boards');
    expect(output.data).toEqual({
      boards: [
        {
          id: 'board-1',
          name: 'My Board',
          path: '/My Board/',
          elementCount: 250,
          isCurrent: true,
        },
        {
          id: 'board-hello',
          name: 'hello',
          path: '/hello/',
          elementCount: 1,
          isCurrent: false,
        },
      ],
      currentBoardId: 'board-1',
    });
  });

  it('rejects ambiguous board names for cd', async () => {
    const currentBoard = createMockBoard();
    const onBoardSwitch = vi.fn();

    const output = await executeRun('cd hello', {
      board: currentBoard,
      currentBoardId: 'board-1',
      currentBoardName: 'My Board',
      boards: [
        { id: 'board-2', name: 'hello', elementCount: 1 },
        { id: 'board-3', name: 'hello', elementCount: 2 },
      ],
      onBoardSwitch,
    });

    expect(output.text).toContain('[error] cd: hello: multiple boards match this name');
    expect(output.text).toContain('board-2 -> /hello/');
    expect(output.text).toContain('board-3 -> /hello/');
    expect(output.exitCode).toBe(1);
    expect(onBoardSwitch).not.toHaveBeenCalled();
  });

  it('removes a board with rmdir', async () => {
    const currentBoard = createMockBoard();
    const onBoardDelete = vi.fn(async () => ({
      deletedBoardId: 'board-hello',
      deletedBoardName: 'hello',
    }));

    const output = await executeRun('rmdir hello', {
      board: currentBoard,
      currentBoardId: 'board-1',
      currentBoardName: 'My Board',
      currentBoardCreatedAt: 1,
      currentBoardUpdatedAt: 1,
      boards: [
        { id: 'board-1', name: 'My Board', elementCount: 250 },
        { id: 'board-hello', name: 'hello', elementCount: 1 },
      ],
      onBoardDelete,
    });

    expectSuccess(output);
    expect(onBoardDelete).toHaveBeenCalledWith('board-hello');
    expect(output.text).toContain('Removed /hello/');
  });

  it('rejects ambiguous board names for rmdir', async () => {
    const currentBoard = createMockBoard();
    const onBoardDelete = vi.fn();

    const output = await executeRun('rmdir hello', {
      board: currentBoard,
      currentBoardId: 'board-1',
      currentBoardName: 'My Board',
      boards: [
        { id: 'board-2', name: 'hello', elementCount: 1 },
        { id: 'board-3', name: 'hello', elementCount: 2 },
      ],
      onBoardDelete,
    });

    expect(output.text).toContain('[error] rmdir: hello: multiple boards match this name');
    expect(output.text).toContain('board-2 -> /hello/');
    expect(output.text).toContain('board-3 -> /hello/');
    expect(output.exitCode).toBe(1);
    expect(onBoardDelete).not.toHaveBeenCalled();
  });

  it('continues on the fallback board after deleting the active board', async () => {
    const activeBoard = createMockBoard();
    const fallbackBoard = createMockBoard();
    const onBoardDelete = vi.fn(async () => ({
      deletedBoardId: 'board-hello',
      deletedBoardName: 'hello',
      nextBoard: {
        board: fallbackBoard,
        id: 'board-1',
        name: 'My Board',
        createdAt: 1,
        updatedAt: 1,
      },
    }));

    const output = await executeRun('rmdir hello && pwd', {
      board: activeBoard,
      currentBoardId: 'board-hello',
      currentBoardName: 'hello',
      currentBoardCreatedAt: 1,
      currentBoardUpdatedAt: 1,
      boards: [
        { id: 'board-hello', name: 'hello', elementCount: 1 },
        { id: 'board-1', name: 'My Board', elementCount: 250 },
      ],
      onBoardDelete,
    });

    expectSuccess(output);
    expect(output.text).toContain('/My Board/');
  });

  it('writes to the board created earlier in the same command chain', async () => {
    const currentBoard = createMockBoard();
    const createdBoard = createMockBoard();
    const onBoardCreate = vi.fn(async (name: string) => ({
      board: createdBoard,
      id: 'board-hello',
      name,
      createdAt: 1,
      updatedAt: 1,
    }));
    const onBoardPersist = vi.fn(async () => undefined);

    createdBoard.apply = vi.fn((operation: unknown) => {
      const insertOperation = operation as {
        type?: string;
        node?: PlaitElement;
        path?: number[];
      };

      if (
        insertOperation.type === 'insert_node' &&
        insertOperation.node &&
        insertOperation.path
      ) {
        createdBoard.children.splice(
          insertOperation.path[0],
          0,
          insertOperation.node,
        );
      }
    });

    const output = await executeRun(`mkdir hello && write mindmap "# HSC\\n- Prepare\\n- Revise"`, {
      board: currentBoard,
      currentBoardId: 'board-1',
      currentBoardName: 'My Board',
      currentBoardCreatedAt: 1,
      currentBoardUpdatedAt: 1,
      onBoardCreate,
      onBoardPersist,
    });

    expectSuccess(output);
    expect(currentBoard.children).toHaveLength(0);
    expect(createdBoard.children).toHaveLength(1);
    expect(onBoardPersist).toHaveBeenCalledTimes(1);
    expect(onBoardPersist).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'board-hello',
        name: 'hello',
        board: createdBoard,
      }),
    );

    const insertedMind = createdBoard.children[0] as MockMindElement;
    expect(insertedMind.type).toBe('mindmap');
    expect(insertedMind.data?.topic?.children?.[0]?.text).toBe('HSC');
  });
});
