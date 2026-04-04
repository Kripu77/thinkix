'use client';
 
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import type { PlaitBoard } from '@plait/core';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { executeRun, type RunOptions } from '../tools/run-tool';
import { useBoardStore, type Board, type BoardMetadata } from '@thinkix/storage';
import { useBoardState } from '@/features/board/hooks/use-board-state';
import type { SystemPromptContext } from '@thinkix/ai';
 
interface UseAgentChatOptions {
  provider?: string;
  model?: string;
  apiKey?: string;
  onError?: (error: Error) => void;
}

export function useAgentChat(options: UseAgentChatOptions = {}) {
  const { board } = useBoardState();
  const { boards, currentBoard } = useBoardStore();

  const boardRef = useRef(board);
  const boardsRef = useRef(boards);
  const currentBoardRef = useRef(currentBoard);

  useEffect(() => {
    boardRef.current = board;
    boardsRef.current = boards;
    currentBoardRef.current = currentBoard;
  }, [board, boards, currentBoard]);

  const provider = options.provider;
  const model = options.model;
  const apiKey = options.apiKey;
  const onError = options.onError;

  const promptContext = useMemo<SystemPromptContext>(() => {
    const activeBoard = currentBoard;
    const elementCount = board?.children.length ?? activeBoard?.elements.length ?? 0;

    return {
      activeBoard: activeBoard
        ? {
            id: activeBoard.id,
            name: activeBoard.name,
            path: `/${activeBoard.name}/`,
            elementCount,
            isEmpty: elementCount === 0,
          }
        : null,
      workspace: {
        boardCount: boards.length,
      },
    };
  }, [board, boards.length, currentBoard]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/agent',
        body: {
          ...(provider ? { provider } : {}),
          ...(model ? { model } : {}),
          ...(apiKey ? { apiKey } : {}),
          context: promptContext,
        },
      }),
    [provider, model, apiKey, promptContext]
  );

  const waitForBoardActivation = useCallback(
    async (
      targetBoardId: string,
      previousBoard: PlaitBoard | null,
      previousBoardId: string | null,
    ) => {
      if (previousBoardId === targetBoardId && boardRef.current) {
        return boardRef.current;
      }

      const startedAt = performance.now();
      while (performance.now() - startedAt < 2000) {
        const activeBoard = currentBoardRef.current;
        const liveBoard = boardRef.current;

        if (activeBoard?.id === targetBoardId && liveBoard && liveBoard !== previousBoard) {
          return liveBoard;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 16));
      }

      throw new Error(`Timed out activating board ${targetBoardId}`);
    },
    [],
  );

  const toBoardHandle = useCallback(
    async (
      boardData: Board,
      previousBoard: PlaitBoard | null,
      previousBoardId: string | null,
    ) => {
      const liveBoard = await waitForBoardActivation(
        boardData.id,
        previousBoard,
        previousBoardId,
      );

      return {
        board: liveBoard,
        id: boardData.id,
        name: boardData.name,
        createdAt: boardData.createdAt,
        updatedAt: boardData.updatedAt,
      };
    },
    [waitForBoardActivation],
  );

  const handleBoardSwitch = useCallback<NonNullable<RunOptions['onBoardSwitch']>>(
    async (boardId) => {
      if (!boardId) {
        return null;
      }

      const store = useBoardStore.getState();
      const previousBoard = boardRef.current;
      const previousBoardId = currentBoardRef.current?.id ?? null;
      const boardData = await store.switchBoard(boardId);
      if (!boardData) {
        return null;
      }

      return toBoardHandle(boardData, previousBoard, previousBoardId);
    },
    [toBoardHandle],
  );

  const handleBoardCreate = useCallback<NonNullable<RunOptions['onBoardCreate']>>(
    async (name) => {
      const store = useBoardStore.getState();
      const previousBoard = boardRef.current;
      const previousBoardId = currentBoardRef.current?.id ?? null;
      const boardData = await store.createBoard(name);
      return toBoardHandle(boardData, previousBoard, previousBoardId);
    },
    [toBoardHandle],
  );

  const handleBoardDelete = useCallback<NonNullable<RunOptions['onBoardDelete']>>(
    async (boardId) => {
      if (!boardId) {
        return null;
      }

      const store = useBoardStore.getState();
      const targetBoard = store.boards.find((board) => board.id === boardId);

      if (!targetBoard) {
        return null;
      }

      const isDeletingCurrent = currentBoardRef.current?.id === targetBoard.id;
      const previousBoard = boardRef.current;
      const previousBoardId = currentBoardRef.current?.id ?? null;

      const nextActiveBoard = await store.deleteBoard(targetBoard.id);

      if (!isDeletingCurrent || !nextActiveBoard) {
        return {
          deletedBoardId: targetBoard.id,
          deletedBoardName: targetBoard.name,
        };
      }

      return {
        deletedBoardId: targetBoard.id,
        deletedBoardName: targetBoard.name,
        nextBoard: await toBoardHandle(
          nextActiveBoard,
          previousBoard,
          previousBoardId,
        ),
      };
    },
    [toBoardHandle],
  );

  const handleBoardPersist = useCallback<NonNullable<RunOptions['onBoardPersist']>>(
    async (activeBoard) => {
      await useBoardStore.getState().saveBoard({
        id: activeBoard.id,
        name: activeBoard.name,
        elements: activeBoard.board.children,
        viewport: {
          x: activeBoard.board.viewport.x ?? 0,
          y: activeBoard.board.viewport.y ?? 0,
          zoom: activeBoard.board.viewport.zoom ?? 1,
        },
        createdAt: activeBoard.createdAt,
        updatedAt: Date.now(),
      });
    },
    [],
  );
 
  const { messages, sendMessage, status, stop, setMessages, addToolOutput } = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onError(error) {
      console.error('[agent-chat] error:', error);
      onError?.(error);
    },
    async onToolCall({ toolCall }) {
      const toolName = (toolCall as { toolName?: string }).toolName;
      const toolCallId = (toolCall as { toolCallId: string }).toolCallId;
      const input = ((toolCall as { input?: Record<string, unknown> }).input ?? {}) as Record<string, unknown>;

      if (!toolName) return;
      
      const serverSideTools = ['web_search'];
      if (serverSideTools.includes(toolName)) {
        return;
      }

      let output: unknown;
      try {
        if (toolName === 'run') {
          const command = input.command as string;
          const activeBoard = currentBoardRef.current;
          const liveBoard = boardRef.current;
          if (!liveBoard) {
            throw new Error('Board is not ready yet');
          }

          const runOptions: RunOptions = {
            board: liveBoard,
            currentBoardId: activeBoard?.id ?? null,
            currentBoardName: activeBoard?.name ?? '',
            currentBoardCreatedAt: activeBoard?.createdAt,
            currentBoardUpdatedAt: activeBoard?.updatedAt,
            boards: boardsRef.current.map((board: BoardMetadata) => ({
              id: board.id,
              name: board.name,
              elementCount: board.elementCount,
            })),
            onBoardSwitch: handleBoardSwitch,
            onBoardCreate: handleBoardCreate,
            onBoardDelete: handleBoardDelete,
            onBoardPersist: handleBoardPersist,
          };
          output = await executeRun(command, runOptions);
        } else {
          output = `[error] Unknown tool: ${toolName}`;
        }
      } catch (err) {
        const errorText = err instanceof Error ? err.message : 'Unknown error';
        addToolOutput({
          tool: toolName as never,
          toolCallId,
          state: 'output-error',
          errorText,
        });
        return;
      }

      addToolOutput({
        tool: toolName as never,
        toolCallId,
        state: 'output-available',
        output: output as never,
      });
    },
  });
 
  const resetChat = useCallback(() => {
    setMessages([]);
  }, [setMessages]);
 
  return { messages, sendMessage, status, stop, resetChat };
}
