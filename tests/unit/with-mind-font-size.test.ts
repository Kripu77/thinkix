import { describe, it, expect, vi } from 'vitest';
import { withMindFontSize } from '@/features/board/plugins/with-mind-font-size';
import { createMockBoard } from '../__utils__/test-utils';
import type { PlaitOperation, PlaitElement } from '@plait/core';

describe('withMindFontSize', () => {
  it('should set fontSize to 18 on mind elements when inserted', () => {
    const mockBoard = createMockBoard();
    let capturedOperation: PlaitOperation | null = null;
    
    mockBoard.apply = vi.fn((op: PlaitOperation) => {
      capturedOperation = op;
    });
    
    const enhancedBoard = withMindFontSize(mockBoard);
    
    const mindElement: PlaitElement = {
      id: 'test-id',
      type: 'mind',
      data: {
        topic: {
          type: 'paragraph',
          children: [{ text: 'Test Topic' }],
        },
      },
      points: [[0, 0]],
    };
    
    const operation: PlaitOperation = {
      type: 'insert_node',
      path: [0],
      node: mindElement,
    };
    
    enhancedBoard.apply(operation);
    
    expect(capturedOperation).not.toBeNull();
    const node = (capturedOperation as { node: PlaitElement }).node;
    expect(node.data.topic.children[0].fontSize).toBe(18);
  });

  it('should set fontSize to 18 on mind_child elements when inserted', () => {
    const mockBoard = createMockBoard();
    let capturedOperation: PlaitOperation | null = null;
    
    mockBoard.apply = vi.fn((op: PlaitOperation) => {
      capturedOperation = op;
    });
    
    const enhancedBoard = withMindFontSize(mockBoard);
    
    const mindElement: PlaitElement = {
      id: 'test-id',
      type: 'mind_child',
      data: {
        topic: {
          type: 'paragraph',
          children: [{ text: 'Child Topic', fontSize: 14 }],
        },
      },
    };
    
    const operation: PlaitOperation = {
      type: 'insert_node',
      path: [0],
      node: mindElement,
    };
    
    enhancedBoard.apply(operation);
    
    expect(capturedOperation).not.toBeNull();
    const node = (capturedOperation as { node: PlaitElement }).node;
    expect(node.data.topic.children[0].fontSize).toBe(18);
  });

  it('should not modify non-mind elements', () => {
    const mockBoard = createMockBoard();
    let capturedOperation: PlaitOperation | null = null;
    
    mockBoard.apply = vi.fn((op: PlaitOperation) => {
      capturedOperation = op;
    });
    
    const enhancedBoard = withMindFontSize(mockBoard);
    
    const drawElement: PlaitElement = {
      id: 'test-id',
      type: 'draw',
      points: [[0, 0], [100, 100]],
    };
    
    const operation: PlaitOperation = {
      type: 'insert_node',
      path: [0],
      node: drawElement,
    };
    
    enhancedBoard.apply(operation);
    
    expect(capturedOperation).not.toBeNull();
    const node = (capturedOperation as { node: PlaitElement }).node;
    expect(node.type).toBe('draw');
    expect(node.data).toBeUndefined();
  });

  it('should set fontSize on nested mind children', () => {
    const mockBoard = createMockBoard();
    let capturedOperation: PlaitOperation | null = null;
    
    mockBoard.apply = vi.fn((op: PlaitOperation) => {
      capturedOperation = op;
    });
    
    const enhancedBoard = withMindFontSize(mockBoard);
    
    const mindElement: PlaitElement = {
      id: 'parent-id',
      type: 'mind',
      data: {
        topic: {
          type: 'paragraph',
          children: [{ text: 'Parent' }],
        },
      },
      points: [[0, 0]],
      children: [
        {
          id: 'child-id',
          type: 'mind_child',
          data: {
            topic: {
              type: 'paragraph',
              children: [{ text: 'Child' }],
            },
          },
        },
      ],
    };
    
    const operation: PlaitOperation = {
      type: 'insert_node',
      path: [0],
      node: mindElement,
    };
    
    enhancedBoard.apply(operation);
    
    expect(capturedOperation).not.toBeNull();
    const node = (capturedOperation as { node: PlaitElement & { children: PlaitElement[] } }).node;
    expect(node.data.topic.children[0].fontSize).toBe(18);
    expect(node.children[0].data.topic.children[0].fontSize).toBe(18);
  });

  it('should pass through other operations unchanged', () => {
    const mockBoard = createMockBoard();
    let capturedOperation: PlaitOperation | null = null;
    
    mockBoard.apply = vi.fn((op: PlaitOperation) => {
      capturedOperation = op;
    });
    
    const enhancedBoard = withMindFontSize(mockBoard);
    
    const operation: PlaitOperation = {
      type: 'set_selection',
      newProperties: { anchor: { path: [0], offset: 0 }, focus: { path: [0], offset: 5 } },
    };
    
    enhancedBoard.apply(operation);
    
    expect(capturedOperation).toBe(operation);
  });
});
