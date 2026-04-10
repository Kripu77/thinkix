import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { DiagramPreview } from '@/features/agent/components/DiagramPreview';

const { parseMermaidToBoard, updateViewport, mockBoard } = vi.hoisted(() => ({
  parseMermaidToBoard: vi.fn(),
  updateViewport: vi.fn(),
  mockBoard: { viewport: { zoom: 1 } },
}));

vi.mock('@thinkix/mermaid-to-thinkix', () => ({
  parseMermaidToBoard,
}));

vi.mock('@plait-board/react-board', () => ({
  useBoard: () => mockBoard,
  Wrapper: ({
    children,
    value,
    theme,
  }: {
    children: ReactNode;
    value: unknown;
    theme?: unknown;
  }) => (
    <div
      data-elements={JSON.stringify(value)}
      data-testid="preview-wrapper"
      data-theme={JSON.stringify(theme)}
    >
      {children}
    </div>
  ),
  Board: () => <div data-testid="preview-board" />,
}));

vi.mock('@plait/core', async () => {
  const actual = await vi.importActual<typeof import('@plait/core')>('@plait/core');

  return {
    ...actual,
    BoardTransforms: {
      ...actual.BoardTransforms,
      updateViewport,
    },
  };
});

vi.mock('@/features/board/plugins/add-text-renderer', () => ({
  addTextRenderer: vi.fn(),
}));

vi.mock('@thinkix/plait-utils', () => ({
  parseMarkdownToMindElement: vi.fn((text: string) => ({
    id: 'mind-root',
    type: 'mindmap',
    isRoot: true,
    points: [[0, 0]],
    fill: undefined,
    data: {
      topic: {
        children: [{ text }],
      },
    },
    children: [],
  })),
}));

describe('DiagramPreview', () => {
  beforeEach(() => {
    parseMermaidToBoard.mockReset();
    updateViewport.mockReset();
  });

  it('renders a readonly board preview for mermaid content', async () => {
    parseMermaidToBoard.mockResolvedValue({
      elements: [
        {
          id: 'shape-1',
          points: [
            [0, 0],
            [120, 60],
          ],
          type: 'geometry',
        },
      ],
      warnings: [],
    });

    render(
      <DiagramPreview
        content={'flowchart TD\nA[Start] --> B[Done]'}
        type="mermaid"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('preview-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('preview-board')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(updateViewport).toHaveBeenCalled();
    });
  });

  it('shows a fallback when mermaid parsing fails', async () => {
    parseMermaidToBoard.mockRejectedValue(new Error('Unexpected end of input'));

    render(
      <DiagramPreview
        content={'flowchart TD\nA[Client Layer] --> B['}
        type="mermaid"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Flowchart')).toBeInTheDocument();
      expect(screen.getByText('Preview available on the board')).toBeInTheDocument();
    });
  });

  it('keeps parsed mermaid geometry intact and fits the preview viewport', async () => {
    parseMermaidToBoard.mockResolvedValue({
      elements: [
        {
          id: 'shape-1',
          points: [
            [960, 320],
            [1240, 520],
          ],
          type: 'geometry',
        },
      ],
      warnings: [],
    });

    render(
      <DiagramPreview
        content={'flowchart TD\nA[Tech Trends] --> B[Agentic AI]'}
        type="mermaid"
      />,
    );

    await waitFor(() => {
      const wrapper = screen.getByTestId('preview-wrapper');
      const value = wrapper.getAttribute('data-elements');

      expect(value).toContain('960');
      expect(value).toContain('1240');
    });

    await waitFor(() => {
      expect(updateViewport).toHaveBeenCalledWith(
        mockBoard,
        expect.any(Array),
        expect.any(Number),
      );
    });
  });

  it('applies the active board theme to mind map previews', async () => {
    render(
      <DiagramPreview
        content={'# 2026 Tech Trends\n- Agentic AI'}
        theme={{ themeColorMode: 'starry' } as never}
        type="mindmap"
      />,
    );

    await waitFor(() => {
      const wrapper = screen.getByTestId('preview-wrapper');
      expect(wrapper.getAttribute('data-theme')).toContain('starry');
      expect(wrapper.getAttribute('data-elements')).toContain('#17344b');
    });
  });
});
