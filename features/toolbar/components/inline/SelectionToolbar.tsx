'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useBoard } from '@plait-board/react-board';
import {
  getSelectedElements,
  PlaitElement,
  getRectangleByElements,
  RectangleClient,
  toHostPointFromViewBoxPoint,
  toScreenPointFromHostPoint,
  isDragging,
  isMovingElements,
  isSelectionMoving,
  PlaitBoard,
  Path,
  Transforms,
  ATTACHED_ELEMENT_CLASS_NAME,
} from '@plait/core';
import { PropertyTransforms, StrokeStyle } from '@plait/common';
import { applyTextMark, applyTextColor, applyFontSize } from '@thinkix/plait-utils';
import {
  PlaitDrawElement,
  isClosedDrawElement,
  PlaitArrowLine,
  ArrowLineMarkerType,
  ArrowLineShape,
  DrawTransforms,
} from '@plait/draw';
import { MindElement } from '@plait/mind';
import { isNoColor, cn, Button, Separator } from '@thinkix/ui';
import { useFloating, flip, offset, VirtualElement } from '@floating-ui/react';
import { getMemorizeKey } from '@plait/draw';
import { Bold, Italic, Underline, Strikethrough } from 'lucide-react';
import { ColorDropdown } from './ColorDropdown';
import { ArrowDropdown } from './ArrowDropdown';
import { TextColorDropdown } from './TextColorDropdown';
import { FontSizeControl } from './FontSizeControl';
import {
  getElementColors,
  hasClosedShape,
  hasStrokeProperty,
  isArrowLineOnly,
  hasTextProperty,
} from './utils';
import type { ElementColors } from '@thinkix/shared';
import { NO_COLOR_SWATCH } from '@/shared/constants/inline-toolbar';
import posthog from 'posthog-js';

export function SelectionToolbar() {
  const board = useBoard();
  const [movingOrDragging, setMovingOrDragging] = useState(false);
  const movingOrDraggingRef = useRef(movingOrDragging);
  const [colors, setColors] = useState<ElementColors | null>(null);

  const { refs, floatingStyles } = useFloating({
    placement: 'top',
    middleware: useMemo(() => [offset(8), flip()], []),
  });

  useEffect(() => {
    movingOrDraggingRef.current = movingOrDragging;
  }, [movingOrDragging]);

  useEffect(() => {
    if (!board) return;
    
    const pointerUp = board.pointerUp?.bind(board);
    const pointerMove = board.pointerMove?.bind(board);

    // eslint-disable-next-line react-hooks/immutability
    board.pointerMove = (event: PointerEvent) => {
      if (
        (isMovingElements(board) || isDragging(board)) &&
        !movingOrDraggingRef.current
      ) {
        setMovingOrDragging(true);
      }
      if (pointerMove) {
        pointerMove(event);
      }
    };

    board.pointerUp = (event: PointerEvent) => {
      if (
        movingOrDraggingRef.current &&
        (isMovingElements(board) || isDragging(board))
      ) {
        setMovingOrDragging(false);
      }
      if (pointerUp) {
        pointerUp(event);
      }
    };

    return () => {
      board.pointerUp = pointerUp;
      board.pointerMove = pointerMove;
    };
  }, [board]);

  const selectedElements = board ? getSelectedElements(board) : [];
  const hasSelectionNow = selectedElements.length > 0 &&
    board &&
    !isSelectionMoving(board) &&
    !movingOrDragging;

  const hasFill = hasSelectionNow && board && hasClosedShape(board, selectedElements) && !PlaitBoard.hasBeenTextEditing(board);
  const hasStroke = hasSelectionNow && board && hasStrokeProperty(board, selectedElements) && !PlaitBoard.hasBeenTextEditing(board);
  const hasText = hasSelectionNow && board && hasTextProperty(board, selectedElements);

  const showToolbar = hasSelectionNow && board && !PlaitBoard.hasBeenTextEditing(board);

  useEffect(() => {
    if (!hasSelectionNow || !board) return;

    const elements = getSelectedElements(board);
    const rectangle = getRectangleByElements(board, elements, false);
    const [start, end] = RectangleClient.getPoints(rectangle);
    const screenStart = toScreenPointFromHostPoint(
      board,
      toHostPointFromViewBoxPoint(board, start)
    );
    const screenEnd = toScreenPointFromHostPoint(
      board,
      toHostPointFromViewBoxPoint(board, end)
    );
    const width = screenEnd[0] - screenStart[0];
    const height = screenEnd[1] - screenStart[1];

    const virtualEl: VirtualElement = {
      getBoundingClientRect() {
        return {
          width,
          height,
          x: screenStart[0],
          y: screenStart[1],
          top: screenStart[1],
          left: screenStart[0],
          right: screenStart[0] + width,
          bottom: screenStart[1] + height,
        };
      },
    };

    refs.setPositionReference(virtualEl);

    const elementColors = getElementColors(board, elements);
    setColors(elementColors);
  }, [board, board?.viewport, board?.selection, hasSelectionNow, movingOrDragging, refs]);

  const refreshColors = () => {
    if (!board) return;
    const elements = getSelectedElements(board);
    const updated = getElementColors(board, elements);
    if (updated) setColors(updated);
  };

  const handleFillChange = (color: string) => {
    const fillColor = color === NO_COLOR_SWATCH || isNoColor(color) ? null : color;

    PropertyTransforms.setFillColor(board, null, {
      getMemorizeKey,
      callback: (element: PlaitElement, path: Path) => {
        if (MindElement.isMindElement(board, element)) {
          Transforms.setNode(board, { fill: fillColor }, path);
        } else if (PlaitDrawElement.isDrawElement(element)) {
          if (isClosedDrawElement(element)) {
            Transforms.setNode(board, { fill: fillColor }, path);
          }
        } else if (hasClosedShape(board, [element])) {
          Transforms.setNode(board, { fill: fillColor }, path);
        }
      },
    });
    refreshColors();
    posthog.capture('fill_color_changed', { color: fillColor });
  };

  const handleStrokeChange = (color: string) => {
    const strokeColor = color === NO_COLOR_SWATCH || isNoColor(color) ? null : color;

    PropertyTransforms.setStrokeColor(board, null, {
      getMemorizeKey,
      callback: (element: PlaitElement, path: Path) => {
        if (MindElement.isMindElement(board, element)) {
          Transforms.setNode(board, { strokeColor }, path);
        } else if (PlaitDrawElement.isDrawElement(element)) {
          if (!PlaitDrawElement.isImage(element)) {
            Transforms.setNode(board, { strokeColor }, path);
          }
        } else if (hasStrokeProperty(board, [element])) {
          Transforms.setNode(board, { strokeColor }, path);
        }
      },
    });
    refreshColors();
    posthog.capture('stroke_color_changed', { color: strokeColor });
  };

  const handleStrokeWidthChange = (width: number) => {
    PropertyTransforms.setStrokeWidth(board, width, { getMemorizeKey });
    refreshColors();
    posthog.capture('stroke_width_changed', { width });
  };

  const handleStrokeStyleChange = (style: StrokeStyle) => {
    PropertyTransforms.setStrokeStyle(board, style, { getMemorizeKey });
    refreshColors();
    posthog.capture('stroke_style_changed', { style });
  };

  const handleFillStyleChange = (fillStyle: string) => {
    const elements = getSelectedElements(board);
    elements.forEach((element) => {
      const path = PlaitBoard.findPath(board, element);
      if (path) {
        Transforms.setNode(board, { fillStyle }, path);
      }
    });
    refreshColors();
    posthog.capture('fill_style_changed', { fillStyle });
  };

  const handleArrowMarkerChange = (end: 'source' | 'target', marker: ArrowLineMarkerType) => {
    const elements = getSelectedElements(board);
    elements.forEach((element) => {
      if (PlaitDrawElement.isArrowLine(element)) {
        const path = PlaitBoard.findPath(board, element);
        if (path) {
          const arrowLine = element as PlaitArrowLine;
          const currentHandle = arrowLine[end] || { marker: ArrowLineMarkerType.none };
          Transforms.setNode(board, {
            [end]: {
              ...currentHandle,
              marker,
            },
          }, path);
        }
      }
    });
    refreshColors();
  };

  const handleArrowLineShapeChange = (shape: ArrowLineShape) => {
    DrawTransforms.setArrowLineShape(board, { shape });
    refreshColors();
  };

  const handleTextChange = (color: string) => {
    const newColor = isNoColor(color) ? null : color;
    applyTextColor(board, newColor);
    refreshColors();
  };

  const toggleMark = (mark: 'bold' | 'italic' | 'underlined' | 'strike') => {
    applyTextMark(board, mark);
    refreshColors();
  };

  const setFontSize = (size: string) => {
    applyFontSize(board, size);
    refreshColors();
  };

  if (!showToolbar || !colors) return null;

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      data-testid="selection-toolbar"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border bg-background/95 backdrop-blur px-1 py-1 shadow-lg',
        ATTACHED_ELEMENT_CLASS_NAME
      )}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {hasFill && (
        <ColorDropdown
          type="fill"
          currentColor={colors.fill}
          onColorChange={handleFillChange}
          showFillStyle
          fillStyle={colors.fillStyle}
          onFillStyleChange={handleFillStyleChange}
        />
      )}

      {hasStroke && (
        <>
          {hasFill && <Separator orientation="vertical" className="mx-0.5 h-5" />}
          <ColorDropdown
            type="stroke"
            currentColor={colors.stroke}
            onColorChange={handleStrokeChange}
            showStrokeWidth
            strokeWidth={colors.strokeWidth || 2}
            onStrokeWidthChange={handleStrokeWidthChange}
            showStrokeStyle
            strokeStyle={colors.strokeStyle}
            onStrokeStyleChange={handleStrokeStyleChange}
          />
        </>
      )}

      {isArrowLineOnly(selectedElements) && (
        <>
          {(hasFill || hasStroke) && <Separator orientation="vertical" className="mx-0.5 h-5" />}
          <ArrowDropdown
            lineShape={colors.arrowLineShape}
            onLineShapeChange={handleArrowLineShapeChange}
            sourceMarker={colors.sourceMarker}
            targetMarker={colors.targetMarker}
            onMarkerChange={handleArrowMarkerChange}
          />
        </>
      )}

      {hasText && (
        <>
          {(hasFill || hasStroke || isArrowLineOnly(selectedElements)) && (
            <Separator orientation="vertical" className="mx-0.5 h-5" />
          )}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 w-7 p-0',
                colors.textMarks.bold && 'bg-accent text-accent-foreground'
              )}
              onClick={() => toggleMark('bold')}
            >
              <Bold className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 w-7 p-0',
                colors.textMarks.italic && 'bg-accent text-accent-foreground'
              )}
              onClick={() => toggleMark('italic')}
            >
              <Italic className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 w-7 p-0',
                colors.textMarks.underlined && 'bg-accent text-accent-foreground'
              )}
              onClick={() => toggleMark('underlined')}
            >
              <Underline className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 w-7 p-0',
                colors.textMarks.strike && 'bg-accent text-accent-foreground'
              )}
              onClick={() => toggleMark('strike')}
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </Button>

            <Separator orientation="vertical" className="mx-0.5 h-5" />

            <FontSizeControl
              currentFontSize={colors.textMarks.fontSize || '16'}
              onChange={setFontSize}
            />

            <TextColorDropdown
              currentColor={colors.text}
              onColorChange={handleTextChange}
            />
          </div>
        </>
      )}
    </div>
  );
}
