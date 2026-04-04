import type { PlaitBoard } from '@plait/core';
import { parseChain, parseCommand } from './chain-parser';
import {
  commands,
  COMMAND_LIST,
  type BoardDirectory,
  type BoardHandle,
  type CommandResult,
  type CommandContext,
} from './commands';
import type { CommandResultKind, RunToolOutput } from './result-types';

export interface RunOptions {
  board: PlaitBoard;
  currentBoardId: string | null;
  currentBoardName: string;
  currentBoardCreatedAt?: number;
  currentBoardUpdatedAt?: number;
  boards?: BoardDirectory[];
  onBoardSwitch?: CommandContext['onBoardSwitch'];
  onBoardCreate?: CommandContext['onBoardCreate'];
  onBoardDelete?: CommandContext['onBoardDelete'];
  onBoardPersist?: (board: BoardHandle) => Promise<void> | void;
}

function upsertBoardDirectory(
  boards: BoardDirectory[],
  nextBoard: BoardDirectory,
): BoardDirectory[] {
  const existingIndex = boards.findIndex((board) => board.id === nextBoard.id);
  if (existingIndex === -1) {
    return [...boards, nextBoard];
  }

  return boards.map((board, index) =>
    index === existingIndex ? nextBoard : board,
  );
}

function inferSummary(output: string, exitCode: number): string {
  const firstLine = output.split('\n')[0]?.trim();
  if (firstLine) {
    return firstLine;
  }

  return exitCode === 0 ? 'Command complete' : 'Command failed';
}

function inferKind(result: CommandResult, exitCode: number): CommandResultKind {
  if (result.kind) {
    return result.kind;
  }

  return exitCode === 0 ? 'info' : 'error';
}

function finalizeRunOutput(
  result: CommandResult,
  durationMs: number,
): RunToolOutput {
  return {
    type: 'run-result',
    text: result.output,
    exitCode: result.exitCode,
    durationMs,
    kind: inferKind(result, result.exitCode),
    summary: result.summary ?? inferSummary(result.output, result.exitCode),
    data: result.data,
  };
}

export async function executeRun(
  command: string,
  options: RunOptions,
): Promise<RunToolOutput> {
  const start = performance.now();

  if (!command.trim()) {
    const duration = performance.now() - start;
    return {
      type: 'run-result',
      text: '[error] no command provided',
      exitCode: 1,
      durationMs: duration,
      kind: 'error',
      summary: 'no command provided',
    };
  }

  try {
    const chain = parseChain(command);
    let lastResult: CommandResult = {
      output: '',
      exitCode: 0,
    };
    let currentBoard = options.board;
    let currentBoardId = options.currentBoardId;
    let currentBoardName = options.currentBoardName;
    let currentBoardCreatedAt = options.currentBoardCreatedAt ?? Date.now();
    let currentBoardUpdatedAt = options.currentBoardUpdatedAt ?? Date.now();
    let boards = options.boards ?? [];

    if (currentBoardId) {
      boards = upsertBoardDirectory(boards, {
        id: currentBoardId,
        name: currentBoardName,
        elementCount: currentBoard.children.length,
      });
    }
    
    for (const step of chain) {
      const { name, args } = parseCommand(step.command);
      
      if (!name) {
        continue;
      }
      
      const cmd = commands[name];
      
      if (!cmd) {
        const duration = performance.now() - start;
        return {
          type: 'run-result',
          text: `[error] ${name}: command not found
${COMMAND_LIST}`,
          exitCode: 127,
          durationMs: duration,
          kind: 'error',
          summary: `${name}: command not found`,
        };
      }
      
      const ctx: CommandContext = {
        board: currentBoard,
        currentBoardId,
        currentBoardName,
        boards,
        stdin: lastResult.output,
        onBoardSwitch: options.onBoardSwitch,
        onBoardCreate: options.onBoardCreate,
        onBoardDelete: options.onBoardDelete,
      };
      
      const result = await cmd(args, ctx);
      lastResult = result;

      if (result.nextBoard) {
        currentBoard = result.nextBoard.board;
        currentBoardId = result.nextBoard.id;
        currentBoardName = result.nextBoard.name;
        currentBoardCreatedAt = result.nextBoard.createdAt;
        currentBoardUpdatedAt = result.nextBoard.updatedAt;
      }

      if (result.deletedBoardId) {
        boards = boards.filter((board) => board.id !== result.deletedBoardId);
      }

      if (currentBoardId) {
        boards = upsertBoardDirectory(boards, {
          id: currentBoardId,
          name: currentBoardName,
          elementCount: currentBoard.children.length,
        });
      }

      if (result.persistBoard && currentBoardId && options.onBoardPersist) {
        await options.onBoardPersist({
          board: currentBoard,
          id: currentBoardId,
          name: currentBoardName,
          createdAt: currentBoardCreatedAt,
          updatedAt: currentBoardUpdatedAt,
        });
        currentBoardUpdatedAt = Date.now();
      }
      
      if (step.operator === '&&' && result.exitCode !== 0) {
        break;
      }
      if (step.operator === '||' && result.exitCode === 0) {
        break;
      }
    }

    const duration = performance.now() - start;
    return finalizeRunOutput(lastResult, duration);
  } catch (err) {
    const duration = performance.now() - start;
    const message = `execution failed: ${err instanceof Error ? err.message : String(err)}`;
    return {
      type: 'run-result',
      text: `[error] ${message}`,
      exitCode: 1,
      durationMs: duration,
      kind: 'error',
      summary: message,
    };
  }
}

export { COMMAND_LIST };
