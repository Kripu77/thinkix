import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LsTreeView } from '@/features/agent/components/LsTreeView';

describe('LsTreeView', () => {
  it('renders root board listings as a filesystem tree', () => {
    render(
      <LsTreeView
        kind="board-list"
        data={{
          boards: [
            {
              id: 'board-1',
              name: 'My Board',
              path: '/My Board/',
              elementCount: 250,
              isCurrent: false,
            },
            {
              id: 'board-2',
              name: 'hello',
              path: '/hello/',
              elementCount: 1,
              isCurrent: true,
            },
          ],
          currentBoardId: 'board-2',
        }}
      />,
    );

    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('/My Board/')).toBeInTheDocument();
    expect(screen.getByText('/hello/')).toBeInTheDocument();
    expect(screen.getByText('current')).toBeInTheDocument();
    expect(screen.queryByText(/Other \(/)).not.toBeInTheDocument();
  });
});
