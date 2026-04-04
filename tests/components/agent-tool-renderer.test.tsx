import { fireEvent, render, screen } from '@testing-library/react';
import { AgentToolRenderer } from '@/features/agent/components/AgentToolRenderer';

vi.mock('@/features/agent/components/DiagramPreview', () => ({
  DiagramPreview: ({
    type,
  }: {
    content: string;
    type: 'mermaid' | 'mindmap';
  }) => <div data-testid="diagram-preview">{type} preview</div>,
}));

describe('AgentToolRenderer', () => {
  it('keeps a write success card collapsed until the user expands it', () => {
    render(
      <AgentToolRenderer
        part={{
          input: {
            command:
              'write mermaid "flowchart TD\nA[Energy-Efficient Computing] --> B[Agentic AI]"',
          },
          output: {
            durationMs: 12,
            exitCode: 0,
            kind: 'info',
            summary: 'Created 12 elements from mermaid diagram',
            text:
              'Created 12 elements from mermaid diagram\n' +
              'shape:eAftc rect "Energy-Efficient Computing"\n' +
              'shape:yPpkw rect "Agentic AI"\n' +
              'shape:mGnDG rect "Quantum Computing"\n' +
              'shape:ZNMGS rect "AI-Augmented Security"\n' +
              'shape:ihnBs rect "Human-AI Collaboration"\n' +
              'line:DcaNR id:eAftc -> id:yPpkw\n' +
              'line:YsnSa id:eAftc -> id:mGnDG\n' +
              'line:AzFNP id:mGnDG -> id:yPpkw\n' +
              'line:TDhNW id:yPpkw -> id:ZNMGS\n' +
              'line:byQPF id:mGnDG -> id:ZNMGS\n' +
              'line:qqQPF id:ZNMGS -> id:ihnBs\n' +
              'line:rrQPF id:yPpkw -> id:ihnBs',
            type: 'run-result',
          },
          state: 'output-available',
          toolCallId: 'tool-1',
          type: 'tool-run',
        }}
      />,
    );

    expect(screen.getByText('Created Flowchart')).toBeInTheDocument();
    expect(screen.getByText('Energy-Efficient Computing')).toBeInTheDocument();
    expect(screen.getByText('12 elements')).toBeInTheDocument();
    expect(screen.getByText('5 shapes')).toBeInTheDocument();
    expect(screen.getByText('7 connections')).toBeInTheDocument();
    expect(screen.queryByTestId('diagram-preview')).not.toBeInTheDocument();
    expect(screen.queryByText('Mermaid')).not.toBeInTheDocument();
    expect(screen.queryByText('Technical details')).not.toBeInTheDocument();
    expect(screen.queryByText('Mermaid source')).not.toBeInTheDocument();
    expect(screen.queryByText(/shape:eAftc/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByTestId('diagram-preview')).toBeInTheDocument();
  });

  it('keeps a running write command collapsed until the user expands it', () => {
    render(
      <AgentToolRenderer
        part={{
          input: {
            command: 'write mermaid "flowchart TD\nA[Client Layer] --> B[',
          },
          state: 'input-streaming',
          toolCallId: 'tool-streaming-1',
          type: 'tool-run',
        }}
      />,
    );

    expect(screen.getByText('Creating Flowchart')).toBeInTheDocument();
    expect(screen.getByText('Client Layer')).toBeInTheDocument();
    expect(screen.queryByTestId('diagram-preview')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tool-loading-block')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByTestId('tool-loading-block')).toBeInTheDocument();
  });

  it('keeps an errored tool collapsed until the user expands it', () => {
    render(
      <AgentToolRenderer
        part={{
          errorText: 'Missing API key',
          input: {
            command: 'run something',
          },
          state: 'output-error',
          toolCallId: 'tool-error-1',
          type: 'tool-run',
        }}
      />,
    );

    expect(screen.queryByText('Missing API key')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Missing API key')).toBeInTheDocument();
  });
});
