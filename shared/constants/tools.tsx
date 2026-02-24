import { PlaitPointerType } from '@plait/core';
import type { DrawingTool, ToolConfig } from '@thinkix/shared';
import {
  MousePointer2,
  Hand,
  Pencil,
  Square,
  Circle,
  Diamond,
  Triangle,
  Minus,
  ArrowRight,
  Type,
  ImageIcon,
  Hexagon,
  Star,
  Cloud,
  PenTool,
  Eraser,
  StickyNote,
  Shapes,
  Paintbrush,
} from 'lucide-react';
import { MindMapIcon } from './icons';

export const ERASER_POINTER = 'eraser';
export const LASER_POINTER = 'laser';
export const STICKY_NOTE_POINTER = 'sticky-note';

export const TOOL_TO_POINTER: Record<DrawingTool, string> = {
  hand: PlaitPointerType.hand,
  select: PlaitPointerType.selection,

  mind: 'mind',
  draw: 'ink',
  laser: LASER_POINTER,
  eraser: ERASER_POINTER,
  stickyNote: STICKY_NOTE_POINTER,

  rectangle: 'rectangle',
  ellipse: 'ellipse',
  diamond: 'diamond',
  triangle: 'triangle',
  roundRectangle: 'roundRectangle',
  parallelogram: 'parallelogram',
  trapezoid: 'trapezoid',
  pentagon: 'pentagon',
  hexagon: 'hexagon',
  octagon: 'octagon',
  star: 'star',
  cloud: 'cloud',

  arrow: 'straight',
  text: 'text',
  image: 'image',
};

export const DRAWING_TOOLS: Set<DrawingTool> = new Set([
  'draw',
  'rectangle',
  'ellipse',
  'diamond',
  'triangle',
  'roundRectangle',
  'parallelogram',
  'trapezoid',
  'pentagon',
  'hexagon',
  'octagon',
  'star',
  'cloud',
  'arrow',
  'mind',
]);

export const SELECTION_TOOLS: DrawingTool[] = ['select'];
export const NAVIGATION_TOOLS: DrawingTool[] = ['hand'];
export const DRAWING_TOOLS_LIST: DrawingTool[] = ['draw', 'mind'];
export const SHAPE_TOOLS: DrawingTool[] = [
  'rectangle',
  'ellipse',
  'diamond',
  'triangle',
  'roundRectangle',
  'parallelogram',
  'trapezoid',
  'pentagon',
  'hexagon',
  'octagon',
  'star',
  'cloud',
];
export const OTHER_TOOLS: DrawingTool[] = ['text', 'image', 'stickyNote'];

export const DEFAULT_TOOL: DrawingTool = 'select';

export const BASIC_TOOLS: ToolConfig[] = [
  { id: 'select', icon: <MousePointer2 />, label: 'Select' },
  { id: 'hand', icon: <Hand />, label: 'Pan' },
  { id: 'laser', icon: <PenTool />, label: 'Laser' },
  { id: 'eraser', icon: <Eraser />, label: 'Eraser' },
];

export const DRAWING_SECTION_TOOLS: ToolConfig[] = [
  { id: 'draw', icon: <Pencil />, label: 'Freehand' },
];

export const ARROW_TOOL: ToolConfig = { id: 'arrow', icon: <ArrowRight />, label: 'Arrow' };

export const HANDRAWN_ICON = <Paintbrush />;

export const SHAPE_DROPDOWN_ICON = <Shapes />;

export const SHAPE_TOOL_CONFIGS: ToolConfig[] = [
  { id: 'rectangle', icon: <Square />, label: 'Rectangle' },
  { id: 'ellipse', icon: <Circle />, label: 'Ellipse' },
  { id: 'diamond', icon: <Diamond />, label: 'Diamond' },
  { id: 'triangle', icon: <Triangle />, label: 'Triangle' },
  {
    id: 'roundRectangle',
    icon: <Square className="rounded-[2px]" />,
    label: 'Rounded Rect',
  },
  {
    id: 'parallelogram',
    icon: <Minus className="-rotate-12" />,
    label: 'Parallelogram',
  },
  { id: 'trapezoid', icon: <Minus className="rotate-12" />, label: 'Trapezoid' },
  { id: 'pentagon', icon: <Hexagon />, label: 'Pentagon' },
  { id: 'hexagon', icon: <Hexagon />, label: 'Hexagon' },
  { id: 'octagon', icon: <Hexagon />, label: 'Octagon' },
  { id: 'star', icon: <Star />, label: 'Star' },
  { id: 'cloud', icon: <Cloud />, label: 'Cloud' },
];

export const OTHER_TOOL_CONFIGS: ToolConfig[] = [
  { id: 'mind', icon: <MindMapIcon />, label: 'Mind Map' },
  { id: 'stickyNote', icon: <StickyNote />, label: 'Sticky Note' },
  { id: 'text', icon: <Type />, label: 'Text' },
  { id: 'image', icon: <ImageIcon />, label: 'Image' },
];
