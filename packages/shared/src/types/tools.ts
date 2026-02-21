export type DrawingTool =
  | 'select'
  | 'hand'
  | 'mind'
  | 'draw'
  | 'laser'
  | 'eraser'
  | 'stickyNote'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'triangle'
  | 'roundRectangle'
  | 'parallelogram'
  | 'trapezoid'
  | 'pentagon'
  | 'hexagon'
  | 'octagon'
  | 'star'
  | 'cloud'
  | 'arrow'
  | 'text'
  | 'image';

export type ToolCategory = 'selection' | 'navigation' | 'drawing' | 'shapes' | 'other';

export interface ToolConfig {
  id: DrawingTool;
  icon: React.ReactNode;
  label: string;
}
