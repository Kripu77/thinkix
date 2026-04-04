export type StickyColorName = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';

export const STICKY_COLORS: Record<StickyColorName, { fill: string; stroke: string }> = {
  yellow: { fill: '#FFEAA7', stroke: '#F1C40F' },
  blue: { fill: '#AED6F1', stroke: '#3498DB' },
  green: { fill: '#ABEBC6', stroke: '#27AE60' },
  pink: { fill: '#F5B7B1', stroke: '#E74C3C' },
  purple: { fill: '#D7BDE2', stroke: '#9B59B6' },
  orange: { fill: '#FAD7A0', stroke: '#E67E22' },
};

export const STICKY_FILL_TO_COLOR: Record<string, StickyColorName> = {
  '#ffeaa7': 'yellow',
  '#aed6f1': 'blue',
  '#abebc6': 'green',
  '#f5b7b1': 'pink',
  '#d7bde2': 'purple',
  '#fad7a0': 'orange',
};

export const DEFAULT_STICKY_COLOR: StickyColorName = 'yellow';

export const STICKY_SUBTYPE = 'stickyNote' as const;
