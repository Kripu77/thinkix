import type { PlaitBoard, PlaitElement } from '@plait/core';
import { StrokeStyle } from '@plait/common';
import {
  PlaitDrawElement,
  isClosedDrawElement,
  isDrawElementsIncludeText,
  isClosedCustomGeometry,
  getStrokeColorByElement,
  getStrokeStyleByElement,
  PlaitArrowLine,
  ArrowLineMarkerType,
  ArrowLineShape,
} from '@plait/draw';
import {
  MindElement,
  getStrokeColorByElement as getStrokeColorByMindElement,
  getFillByElement as getFillByMindElement,
} from '@plait/mind';
import { getTextMarks } from '@thinkix/plait-utils';
import type { ElementColors, StrokeFillProperties } from '@thinkix/shared';
import { ScribbleElement } from '@/features/board/plugins/scribble/types';

export function getStrokeFillProperties(element: PlaitElement): StrokeFillProperties {
  return element as PlaitElement & StrokeFillProperties;
}

export function getElementColors(board: PlaitBoard, elements: PlaitElement[]): ElementColors | null {
  if (elements.length === 0) return null;

  const first = elements[0];
  const firstProps = getStrokeFillProperties(first);
  let fill = firstProps.fill;
  let stroke = firstProps.strokeColor;

  if (!fill) {
    if (MindElement.isMindElement(board, first)) {
      fill = getFillByMindElement(board, first as MindElement);
    } else if (PlaitDrawElement.isDrawElement(first)) {
      fill = firstProps.fill;
    } else if (ScribbleElement.isScribble(first)) {
      fill = firstProps.fill;
    }
  }

  if (!stroke) {
    if (MindElement.isMindElement(board, first)) {
      stroke = getStrokeColorByMindElement(board, first as MindElement);
    } else if (PlaitDrawElement.isDrawElement(first) || ScribbleElement.isScribble(first)) {
      stroke = getStrokeColorByElement(board, first);
    }
  }

  const textMarks = getTextMarks(first, board);
  const textColor = textMarks?.color || '';

  const strokeStyle = getStrokeStyleByElement(board, first) || StrokeStyle.solid;
  const fillStyle = firstProps.fillStyle || 'solid';

  let sourceMarker: ArrowLineMarkerType | undefined;
  let targetMarker: ArrowLineMarkerType | undefined;
  let arrowLineShape: ArrowLineShape | undefined;

  if (PlaitDrawElement.isArrowLine(first)) {
    const arrowLine = first as PlaitArrowLine;
    sourceMarker = arrowLine.source?.marker;
    targetMarker = arrowLine.target?.marker;
    arrowLineShape = arrowLine.shape;
  }

  const colors: ElementColors = {
    fill: fill || '',
    stroke: stroke || '',
    strokeWidth: firstProps.strokeWidth || 2,
    strokeStyle,
    fillStyle,
    sourceMarker,
    targetMarker,
    arrowLineShape,
    text: textColor,
    textMarks: {
      bold: textMarks?.bold,
      italic: textMarks?.italic,
      underlined: textMarks?.underlined,
      strike: textMarks?.strike,
      fontSize: textMarks?.fontSize ? String(textMarks.fontSize) : undefined,
    },
  };

  for (let i = 1; i < elements.length; i++) {
    const el = elements[i];
    const elProps = getStrokeFillProperties(el);
    if (elProps.fill !== colors.fill) colors.fill = '';
    if (elProps.strokeColor !== colors.stroke) colors.stroke = '';
    if (elProps.strokeWidth !== colors.strokeWidth) colors.strokeWidth = 0;

    const elStrokeStyle = getStrokeStyleByElement(board, el) || StrokeStyle.solid;
    if (elStrokeStyle !== colors.strokeStyle) colors.strokeStyle = '';

    const elFillStyle = elProps.fillStyle || 'solid';
    if (elFillStyle !== colors.fillStyle) colors.fillStyle = '';

    if (PlaitDrawElement.isArrowLine(el)) {
      const arrowLine = el as PlaitArrowLine;
      if (arrowLine.source?.marker !== colors.sourceMarker) colors.sourceMarker = undefined;
      if (arrowLine.target?.marker !== colors.targetMarker) colors.targetMarker = undefined;
      if (arrowLine.shape !== colors.arrowLineShape) colors.arrowLineShape = undefined;
    } else {
      colors.sourceMarker = undefined;
      colors.targetMarker = undefined;
      colors.arrowLineShape = undefined;
    }

    const elTextMarks = getTextMarks(el, board);
    const elTextColor = elTextMarks?.color || '';
    if (elTextColor !== colors.text) colors.text = '';
    if (elTextMarks?.bold !== colors.textMarks.bold) colors.textMarks.bold = undefined;
    if (elTextMarks?.italic !== colors.textMarks.italic) colors.textMarks.italic = undefined;
    if (elTextMarks?.underlined !== colors.textMarks.underlined) colors.textMarks.underlined = undefined;
    if (elTextMarks?.strike !== colors.textMarks.strike) colors.textMarks.strike = undefined;
    if (elTextMarks?.fontSize !== colors.textMarks.fontSize) colors.textMarks.fontSize = undefined;
  }

  return colors;
}

export function hasClosedShape(board: PlaitBoard, elements: PlaitElement[]): boolean {
  return elements.some((el) => {
    if (MindElement.isMindElement(board, el)) return true;
    if (ScribbleElement.isScribble(el)) {
      return isClosedCustomGeometry(board, el);
    }
    if (PlaitDrawElement.isDrawElement(el)) {
      return isClosedDrawElement(el);
    }
    return false;
  });
}

export function hasStrokeProperty(board: PlaitBoard, elements: PlaitElement[]): boolean {
  return elements.some((el) => {
    if (MindElement.isMindElement(board, el)) return true;
    if (ScribbleElement.isScribble(el)) return true;
    if (PlaitDrawElement.isDrawElement(el)) {
      return !PlaitDrawElement.isImage(el);
    }
    return false;
  });
}

export function isArrowLineOnly(elements: PlaitElement[]): boolean {
  return elements.length > 0 && elements.every((el) => PlaitDrawElement.isArrowLine(el));
}

export function hasTextProperty(board: PlaitBoard, elements: PlaitElement[]): boolean {
  return elements.some((el) => {
    if (MindElement.isMindElement(board, el)) return true;

    if (PlaitDrawElement.isDrawElement(el)) {
      if (PlaitDrawElement.isText(el)) return true;
      if (PlaitDrawElement.isShapeElement(el) && !PlaitDrawElement.isImage(el)) {
        return true;
      }
      return isDrawElementsIncludeText([el]);
    }

    return false;
  });
}
