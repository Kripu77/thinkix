import { StrokeStyle } from '@plait/common';
import {
  SolidLineIcon,
  DashedLineIcon,
  DottedLineIcon,
  SolidFillIcon,
  HachureFillIcon,
  ZigzagFillIcon,
  CrossHatchFillIcon,
  DotsFillIcon,
  DashedFillIcon,
  StraightArrowIcon,
  CurvedArrowIcon,
  ElbowArrowIcon,
} from './icons';
import { ArrowLineShape } from '@plait/draw';

export const INLINE_COLORS: readonly string[] = [
  '#FF1313', '#FF9900', '#FFD700', '#A5D65A', '#5CB85C', '#01A3A4',
  '#0078D7', '#5B2FC6', '#E84A7F', '#999999', '#666666', '#e7e7e7',
] as const;

export const NO_COLOR_SWATCH = '#e7e7e7';

export const NO_COLOR_PATTERN: Record<string, string> = {
  backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
  backgroundSize: '6px 6px',
  backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
};

export const FILL_STYLE_OPTIONS = [
  { value: 'solid', label: 'Solid', icon: SolidFillIcon },
  { value: 'hachure', label: 'Lines', icon: HachureFillIcon },
  { value: 'zigzag', label: 'Zigzag', icon: ZigzagFillIcon },
  { value: 'cross-hatch', label: 'Cross', icon: CrossHatchFillIcon },
  { value: 'dots', label: 'Dots', icon: DotsFillIcon },
  { value: 'dashed', label: 'Dashed', icon: DashedFillIcon },
] as const;

export const STROKE_STYLE_OPTIONS = [
  { value: StrokeStyle.solid, label: 'Solid', icon: SolidLineIcon },
  { value: StrokeStyle.dashed, label: 'Dashed', icon: DashedLineIcon },
  { value: StrokeStyle.dotted, label: 'Dotted', icon: DottedLineIcon },
] as const;

export const LINE_SHAPE_OPTIONS = [
  { value: ArrowLineShape.straight, label: 'Straight', icon: StraightArrowIcon },
  { value: ArrowLineShape.curve, label: 'Curved', icon: CurvedArrowIcon },
  { value: ArrowLineShape.elbow, label: 'Elbow', icon: ElbowArrowIcon },
] as const;
