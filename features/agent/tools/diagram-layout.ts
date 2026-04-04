import type { PlaitElement } from '@plait/core';

interface GeometryCard extends PlaitElement {
  type: 'geometry';
  points: [[number, number], [number, number]];
  text?: {
    children?: unknown[];
  };
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SectionLayout {
  header: GeometryCard;
  children: GeometryCard[];
}

const SECTION_GAP = 180;
const HEADER_GAP = 56;
const CARD_GAP_X = 36;
const CARD_GAP_Y = 36;
const MAX_SECTION_COLUMNS = 3;
const HEADER_KEYWORDS = [
  /\bphase\b/i,
  /\bq[1-4]\b/i,
  /\bstage\b/i,
  /\bmilestone\b/i,
  /\broadmap\b/i,
  /\bpillar\b/i,
  /\btheme\b/i,
];

function isLineElement(element: PlaitElement): boolean {
  return element.type?.includes('line') ?? false;
}

function isGeometryCard(element: PlaitElement): element is GeometryCard {
  return (
    element.type === 'geometry' &&
    Array.isArray(element.points) &&
    element.points.length === 2 &&
    element.points.every(
      (point) =>
        Array.isArray(point) &&
        point.length === 2 &&
        Number.isFinite(point[0]) &&
        Number.isFinite(point[1]),
    )
  );
}

function collectText(value: unknown): string {
  if (!value) return '';

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(collectText).join('');
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.text === 'string') {
      return record.text;
    }
    if (Array.isArray(record.children)) {
      return record.children.map(collectText).join('');
    }
  }

  return '';
}

function getCardText(card: GeometryCard): string {
  return collectText(card.text?.children).trim();
}

function getBounds(card: GeometryCard): Bounds {
  const [start, end] = card.points;
  return {
    x: Math.min(start[0], end[0]),
    y: Math.min(start[1], end[1]),
    width: Math.abs(end[0] - start[0]),
    height: Math.abs(end[1] - start[1]),
  };
}

function setBounds(card: GeometryCard, bounds: Bounds): void {
  card.points = [
    [bounds.x, bounds.y],
    [bounds.x + bounds.width, bounds.y + bounds.height],
  ];
}

function estimateHeaderWidth(card: GeometryCard): number {
  const text = getCardText(card);
  const longestLineLength = text
    .split('\n')
    .map((line) => line.trim().length)
    .reduce((max, length) => Math.max(max, length), 0);
  const currentBounds = getBounds(card);
  const estimatedWidth = longestLineLength * 12 + 80;

  return Math.max(currentBounds.width, Math.min(420, estimatedWidth));
}

function scoreHeader(card: GeometryCard): number {
  const text = getCardText(card);
  if (!text) return 0;

  const alphaChars = text.match(/[A-Za-z]/g) ?? [];
  const uppercaseChars = text.match(/[A-Z]/g) ?? [];
  const uppercaseRatio =
    alphaChars.length > 0 ? uppercaseChars.length / alphaChars.length : 0;
  const normalizedLength = text.replace(/\s+/g, ' ').trim().length;
  const lineCount = text.split('\n').filter(Boolean).length;
  const hasBullets = /(^|\n)\s*[•*-]\s+/m.test(text);
  const hasKeyword = HEADER_KEYWORDS.some((pattern) => pattern.test(text));

  let score = 0;

  if (hasKeyword) score += 3;
  if (!hasBullets) score += 2;
  if (uppercaseRatio >= 0.45) score += 2;
  if (normalizedLength <= 48) score += 1;
  if (lineCount <= 3) score += 1;

  return score;
}

function chooseColumnCount(cardCount: number): number {
  if (cardCount <= 1) return 1;
  return Math.min(MAX_SECTION_COLUMNS, cardCount);
}

function assignSections(
  headers: GeometryCard[],
  cards: GeometryCard[],
): SectionLayout[] {
  const sections: SectionLayout[] = headers.map((header) => ({
    header,
    children: [],
  }));

  if (headers.length === 1) {
    sections[0].children = cards;
    return sections;
  }

  const headerCenters = headers.map((header) => {
    const bounds = getBounds(header);
    return bounds.x;
  });

  for (const card of cards) {
    const bounds = getBounds(card);
    let sectionIndex = 0;

    for (let index = 0; index < headerCenters.length; index++) {
      if (headerCenters[index] <= bounds.x) {
        sectionIndex = index;
      }
    }

    sections[sectionIndex].children.push(card);
  }

  return sections;
}

function sortCards(cards: GeometryCard[]): GeometryCard[] {
  return [...cards].sort((left, right) => {
    const leftBounds = getBounds(left);
    const rightBounds = getBounds(right);

    if (Math.abs(leftBounds.y - rightBounds.y) > 24) {
      return leftBounds.y - rightBounds.y;
    }

    return leftBounds.x - rightBounds.x;
  });
}

export function relayoutHeaderDrivenDiagram(
  elements: PlaitElement[],
): PlaitElement[] {
  const cloned = JSON.parse(JSON.stringify(elements)) as PlaitElement[];

  if (
    cloned.length < 4 ||
    cloned.some((element) => isLineElement(element) || !isGeometryCard(element))
  ) {
    return cloned;
  }

  const cards = cloned.filter(isGeometryCard);
  const headerCards = cards
    .filter((card) => scoreHeader(card) >= 4)
    .sort((left, right) => getBounds(left).x - getBounds(right).x);

  if (headerCards.length === 0 || headerCards.length === cards.length) {
    return cloned;
  }

  const headerIds = new Set(headerCards.map((card) => card.id));
  const contentCards = cards.filter((card) => !headerIds.has(card.id));

  if (contentCards.length < 2) {
    return cloned;
  }

  const sections = assignSections(headerCards, contentCards);
  const minX = Math.min(...cards.map((card) => getBounds(card).x));
  const minY = Math.min(...cards.map((card) => getBounds(card).y));
  let cursorX = minX;

  for (const section of sections) {
    const orderedChildren = sortCards(section.children);
    const headerBounds = getBounds(section.header);
    const headerWidth = estimateHeaderWidth(section.header);
    const headerHeight = headerBounds.height;
    const columnCount = chooseColumnCount(orderedChildren.length);
    const childWidths = orderedChildren.map((card) => getBounds(card).width);
    const childHeights = orderedChildren.map((card) => getBounds(card).height);
    const cellWidth = childWidths.length > 0 ? Math.max(...childWidths) : 0;
    const cellHeight = childHeights.length > 0 ? Math.max(...childHeights) : 0;
    const gridWidth =
      orderedChildren.length > 0
        ? columnCount * cellWidth + (columnCount - 1) * CARD_GAP_X
        : 0;
    const sectionWidth = Math.max(headerWidth, gridWidth);
    const headerX = cursorX + (sectionWidth - headerWidth) / 2;

    setBounds(section.header, {
      x: headerX,
      y: minY,
      width: headerWidth,
      height: headerHeight,
    });

    orderedChildren.forEach((card, index) => {
      const col = index % columnCount;
      const row = Math.floor(index / columnCount);
      const bounds = getBounds(card);
      const x = cursorX + col * (cellWidth + CARD_GAP_X);
      const y =
        minY + headerHeight + HEADER_GAP + row * (cellHeight + CARD_GAP_Y);

      setBounds(card, {
        x,
        y,
        width: bounds.width,
        height: bounds.height,
      });
    });

    cursorX += sectionWidth + SECTION_GAP;
  }

  return cloned;
}
