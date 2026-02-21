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
  'arrow',
];
export const OTHER_TOOLS: DrawingTool[] = ['text', 'image', 'stickyNote'];

export const DEFAULT_TOOL: DrawingTool = 'select';

export const BASIC_TOOLS: ToolConfig[] = [
  { id: 'select', icon: <MousePointer2 className="h-6 w-6" />, label: 'Select' },
  { id: 'hand', icon: <Hand className="h-6 w-6" />, label: 'Pan' },
  { id: 'laser', icon: <PenTool className="h-6 w-6" />, label: 'Laser' },
  { id: 'eraser', icon: <Eraser className="h-6 w-6" />, label: 'Eraser' },
];

export const SHAPE_TOOL_CONFIGS: ToolConfig[] = [
  { id: 'draw', icon: <Pencil className="h-6 w-6" />, label: 'Freehand' },
  { id: 'rectangle', icon: <Square className="h-6 w-6" />, label: 'Rectangle' },
  { id: 'ellipse', icon: <Circle className="h-6 w-6" />, label: 'Ellipse' },
  { id: 'diamond', icon: <Diamond className="h-6 w-6" />, label: 'Diamond' },
  { id: 'triangle', icon: <Triangle className="h-6 w-6" />, label: 'Triangle' },
  {
    id: 'roundRectangle',
    icon: <Square className="h-4 w-4 rounded-[2px]" />,
    label: 'Rounded Rect',
  },
  {
    id: 'parallelogram',
    icon: <Minus className="h-4 w-4 -rotate-12" />,
    label: 'Parallelogram',
  },
  { id: 'trapezoid', icon: <Minus className="h-4 w-4 rotate-12" />, label: 'Trapezoid' },
  { id: 'pentagon', icon: <Hexagon className="h-6 w-6" />, label: 'Pentagon' },
  { id: 'hexagon', icon: <Hexagon className="h-6 w-6" />, label: 'Hexagon' },
  { id: 'octagon', icon: <Hexagon className="h-6 w-6" />, label: 'Octagon' },
  { id: 'star', icon: <Star className="h-6 w-6" />, label: 'Star' },
  { id: 'cloud', icon: <Cloud className="h-6 w-6" />, label: 'Cloud' },
  { id: 'arrow', icon: <ArrowRight className="h-6 w-6" />, label: 'Arrow' },
];

export const OTHER_TOOL_CONFIGS: ToolConfig[] = [
  { id: 'mind', icon: <MindMapIcon className="h-6 w-6" />, label: 'Mind Map' },
  { id: 'stickyNote', icon: <StickyNote className="h-6 w-6" />, label: 'Sticky Note' },
  { id: 'text', icon: <Type className="h-6 w-6" />, label: 'Text' },
  { id: 'image', icon: <ImageIcon className="h-6 w-6" />, label: 'Image' },
];
