import { describe, expect, it } from 'vitest';
import type { PlaitElement } from '@plait/core';
import { relayoutHeaderDrivenDiagram } from '@/features/agent/tools/diagram-layout';

function createCard(
  id: string,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
): PlaitElement {
  return {
    id,
    type: 'geometry',
    shape: 'rectangle',
    points: [
      [x, y],
      [x + width, y + height],
    ],
    text: {
      children: [{ text }],
    },
  } as PlaitElement;
}

function getBounds(element: PlaitElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const points = element.points as [[number, number], [number, number]];

  return {
    x: points[0][0],
    y: points[0][1],
    width: points[1][0] - points[0][0],
    height: points[1][1] - points[0][1],
  };
}

describe('diagram-layout', () => {
  it('reflows header-driven card diagrams into sections with cards below each header', () => {
    const elements = [
      createCard('phase-1', 'PHASE 1\nFOUNDATION\n(Q1)', 0, 0, 140, 120),
      createCard(
        'client',
        'Client Management\n• Add/edit clients',
        220,
        0,
        220,
        140,
      ),
      createCard(
        'invoice',
        'Invoicing\n• Create & send invoices',
        470,
        0,
        220,
        140,
      ),
      createCard(
        'time',
        'Time Tracking\n• Weekly timesheets',
        720,
        0,
        220,
        140,
      ),
      createCard('phase-2', 'PHASE 2\nGROWTH\n(Q2)', 1000, 0, 150, 120),
      createCard(
        'project',
        'Project Management\n• Kanban boards',
        1230,
        0,
        240,
        140,
      ),
      createCard(
        'expense',
        'Expense Tracking\n• Receipt uploads',
        1500,
        0,
        240,
        140,
      ),
    ];

    const relaidOut = relayoutHeaderDrivenDiagram(elements);

    const phaseOne = relaidOut.find((element) => element.id === 'phase-1')!;
    const phaseTwo = relaidOut.find((element) => element.id === 'phase-2')!;
    const client = relaidOut.find((element) => element.id === 'client')!;
    const invoice = relaidOut.find((element) => element.id === 'invoice')!;
    const time = relaidOut.find((element) => element.id === 'time')!;
    const project = relaidOut.find((element) => element.id === 'project')!;
    const expense = relaidOut.find((element) => element.id === 'expense')!;

    const phaseOneBounds = getBounds(phaseOne);
    const phaseTwoBounds = getBounds(phaseTwo);
    const clientBounds = getBounds(client);
    const invoiceBounds = getBounds(invoice);
    const timeBounds = getBounds(time);
    const projectBounds = getBounds(project);
    const expenseBounds = getBounds(expense);

    expect(phaseOneBounds.y).toBe(0);
    expect(phaseTwoBounds.y).toBe(0);
    expect(clientBounds.y).toBeGreaterThan(phaseOneBounds.y + phaseOneBounds.height);
    expect(invoiceBounds.y).toBe(clientBounds.y);
    expect(timeBounds.y).toBe(clientBounds.y);
    expect(projectBounds.y).toBeGreaterThan(phaseTwoBounds.y + phaseTwoBounds.height);
    expect(expenseBounds.y).toBe(projectBounds.y);
    expect(phaseTwoBounds.x).toBeGreaterThan(timeBounds.x + timeBounds.width);
  });

  it('leaves connector-based diagrams untouched', () => {
    const elements = [
      createCard('start', 'Start', 0, 0, 100, 80),
      createCard('end', 'End', 260, 0, 100, 80),
      {
        id: 'line-1',
        type: 'arrow-line',
        points: [
          [100, 40],
          [260, 40],
        ],
      } as PlaitElement,
    ];

    const relaidOut = relayoutHeaderDrivenDiagram(elements);

    expect(relaidOut).toEqual(elements);
  });
});
