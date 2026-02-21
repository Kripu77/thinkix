import type { StrokeStyle } from '@plait/common';
import type { ArrowLineMarkerType, ArrowLineShape } from '@plait/draw';

export interface ElementColors {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle | string;
  fillStyle: string;
  sourceMarker?: ArrowLineMarkerType;
  targetMarker?: ArrowLineMarkerType;
  arrowLineShape?: ArrowLineShape;
  text: string;
  textMarks: {
    bold?: boolean;
    italic?: boolean;
    underlined?: boolean;
    strike?: boolean;
    fontSize?: string;
  };
}

export interface StrokeFillProperties {
  strokeColor?: string;
  fill?: string;
  strokeWidth?: number;
  fillStyle?: string;
}
