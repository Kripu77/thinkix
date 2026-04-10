import { describe, expect, it } from 'vitest';
import type { PlaitElement } from '@plait/core';
import { THINKIX_MIND_THEME_COLORS, syncElementsForBoardTheme } from '@/features/board/utils';

describe('syncElementsForBoardTheme', () => {
  it('brightens default black strokes and text for dark board themes', () => {
    const elements = [
      {
        id: 'shape-1',
        type: 'geometry',
        shape: 'rectangle',
        strokeColor: '#000000',
        text: {
          children: [{ text: 'Dark-ready', color: '#000000' }],
        },
      },
      {
        id: 'line-1',
        type: 'line',
        strokeColor: '#000',
        texts: [
          {
            position: 0.5,
            text: {
              children: [{ text: 'Label', color: '#000000' }],
            },
          },
        ],
      },
    ] as unknown as PlaitElement[];

    const nextElements = syncElementsForBoardTheme(elements, 'dark') as Array<{
      strokeColor?: string;
      text?: { children: Array<{ color?: string }> };
      texts?: Array<{ text?: { children: Array<{ color?: string }> } }>;
    }>;

    expect(nextElements).not.toBe(elements);
    expect(nextElements[0].strokeColor).toBe('#e5e7eb');
    expect(nextElements[0].text?.children[0].color).toBe('#f8fafc');
    expect(nextElements[1].strokeColor).toBe('#e5e7eb');
    expect(nextElements[1].texts?.[0].text?.children[0].color).toBe('#f8fafc');
  });

  it('restores default ink when returning to a light board theme', () => {
    const elements = [
      {
        id: 'shape-1',
        type: 'geometry',
        shape: 'rectangle',
        strokeColor: '#e5e7eb',
        text: {
          children: [{ text: 'Back to light', color: '#f8fafc' }],
        },
      },
    ] as unknown as PlaitElement[];

    const nextElements = syncElementsForBoardTheme(elements, 'default') as Array<{
      strokeColor?: string;
      text?: { children: Array<{ color?: string }> };
    }>;

    expect(nextElements[0].strokeColor).toBe('#000000');
    expect(nextElements[0].text?.children[0].color).toBe('#000000');
  });

  it('preserves custom colors and returns the original array when nothing changes', () => {
    const elements = [
      {
        id: 'shape-1',
        type: 'geometry',
        strokeColor: '#9370DB',
        text: {
          children: [{ text: 'Custom', color: '#ff00aa' }],
        },
        children: [
          {
            id: 'child-1',
            type: 'geometry',
            strokeColor: '#3498db',
            text: { children: [{ text: 'Child', color: '#27ae60' }] },
          },
        ],
      },
    ] as unknown as PlaitElement[];

    const nextElements = syncElementsForBoardTheme(elements, 'starry');

    expect(nextElements).toBe(elements);
  });

  it('assigns readable default strokes when a shape or arrow has no explicit ink', () => {
    const elements = [
      {
        id: 'shape-1',
        type: 'geometry',
        shape: 'diamond',
        text: { children: [{ text: 'Implicit' }] },
      },
      {
        id: 'arrow-1',
        type: 'arrow',
      },
    ] as unknown as PlaitElement[];

    const nextElements = syncElementsForBoardTheme(elements, 'starry') as Array<{
      strokeColor?: string;
    }>;

    expect(nextElements[0].strokeColor).toBe('#e5e7eb');
    expect(nextElements[1].strokeColor).toBe('#e5e7eb');
  });

  it('assigns readable default text and remaps default fills for dark board themes', () => {
    const elements = [
      {
        id: 'mind-root',
        type: 'mindmap',
        fill: '#ffffff',
        data: {
          topic: {
            children: [{ text: 'Root' }],
          },
        },
      },
      {
        id: 'shape-1',
        type: 'geometry',
        shape: 'rectangle',
        fill: '#ECECFF',
        text: {
          children: [{ text: 'Box' }],
        },
      },
      {
        id: 'text-1',
        type: 'text',
        text: {
          children: [{ text: 'Loose label' }],
        },
      },
    ] as unknown as PlaitElement[];

    const nextElements = syncElementsForBoardTheme(elements, 'starry') as Array<{
      fill?: string;
      color?: string;
      text?: { children: Array<{ color?: string }> };
      data?: { topic?: { children: Array<{ color?: string }> } };
    }>;

    expect(nextElements[0].fill).toBe('#17344b');
    expect(nextElements[0].data?.topic?.children[0].color).toBe('#f8fafc');
    expect(nextElements[1].fill).toBe('#1f3f60');
    expect(nextElements[1].text?.children[0].color).toBe('#f8fafc');
    expect(nextElements[2].color).toBe('#f8fafc');
    expect(nextElements[2].text?.children[0].color).toBe('#f8fafc');
  });

  it('overrides the plait mind root colors for dark board themes', () => {
    const defaultTheme = THINKIX_MIND_THEME_COLORS.find((theme) => theme.mode === 'default');
    const darkTheme = THINKIX_MIND_THEME_COLORS.find((theme) => theme.mode === 'dark');
    const colorfulTheme = THINKIX_MIND_THEME_COLORS.find((theme) => theme.mode === 'colorful');
    const starryTheme = THINKIX_MIND_THEME_COLORS.find((theme) => theme.mode === 'starry');

    expect(defaultTheme?.rootFill).toBe('#f5f5f5');
    expect(darkTheme?.rootFill).toBe('#1f2937');
    expect(darkTheme?.rootTextColor).toBe('#f8fafc');
    expect(colorfulTheme?.rootFill).toBe('#e0f7ff');
    expect(starryTheme?.rootFill).toBe('#17344b');
    expect(starryTheme?.rootTextColor).toBe('#f8fafc');
  });

  it('remaps an explicit dark mind root fill back to a light-compatible fill', () => {
    const elements = [
      {
        id: 'mind-root',
        type: 'mindmap',
        isRoot: true,
        fill: '#1f2937',
        data: {
          topic: {
            children: [{ text: 'Root' }],
          },
        },
      },
    ] as unknown as PlaitElement[];

    const nextElements = syncElementsForBoardTheme(elements, 'default') as Array<{
      fill?: string;
    }>;

    expect(nextElements[0].fill).toBe('#f5f5f5');
  });

  it('assigns the active theme root fill to a root node that has no explicit fill', () => {
    const elements = [
      {
        id: 'mind-root',
        type: 'mindmap',
        isRoot: true,
        layout: 'right',
        data: {
          topic: {
            children: [{ text: 'Root' }],
          },
        },
      },
    ] as unknown as PlaitElement[];

    const nextElements = syncElementsForBoardTheme(elements, 'starry') as Array<{
      fill?: string;
    }>;

    expect(nextElements[0].fill).toBe('#17344b');
  });
});
