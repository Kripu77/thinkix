import type { PlaitBoard } from '@plait/core'
import { getViewBox } from '@plait/core'
import {
  getBoardBackgroundColor,
  getBoardThemeMode,
  getBlueprintColors,
  getGridThemeColors,
  getRuledColors,
  rgba,
  type BoardBackground,
  type GridDensity,
  type GridThemeColors,
  type GridType,
} from '@thinkix/shared'

const DEFAULT_GRID_DENSITY: GridDensity = 24
const MAJOR_GRID_INTERVAL = 5
const GRID_DOT_RADIUS_BASE = 1
const GRID_LINE_WIDTH_BASE = 0.75
const GRID_MAJOR_LINE_WIDTH_BASE = 1.25
const GRID_RULED_MARGIN_OFFSET = 80
const ISOMETRIC_ANGLE_RAD = (30 * Math.PI) / 180
const GRID_OPACITY = {
  minor: 0.5,
  major: 0.7,
  dot: 0.6,
} as const
const MAX_EXPORT_CANVAS_DIMENSION = 16_384
const MAX_EXPORT_CANVAS_AREA = 67_108_864
const DEFAULT_EMPTY_EXPORT_WIDTH = 1200
const DEFAULT_EMPTY_EXPORT_HEIGHT = 800

export interface BoardWithGridConfig {
  getGridConfig?: () => Partial<BoardBackground> & { type: GridType }
}

interface SvgFrame {
  x: number
  y: number
  width: number
  height: number
  rasterWidth: number
  rasterHeight: number
}

const DEFAULT_GRID_CONFIG: BoardBackground = {
  type: 'blank',
  density: DEFAULT_GRID_DENSITY,
  showMajor: false,
}

export const getExportGridConfig = (board: PlaitBoard & BoardWithGridConfig): BoardBackground => {
  if (!board.getGridConfig) {
    return DEFAULT_GRID_CONFIG
  }

  const config = board.getGridConfig()
  return {
    type: config.type,
    density: config.density ?? DEFAULT_GRID_DENSITY,
    showMajor: config.showMajor ?? false,
  }
}

export const getBackgroundColor = (board: PlaitBoard & BoardWithGridConfig): string => {
  const config = getExportGridConfig(board)
  return getBoardBackgroundColor(config.type, getBoardThemeMode(board.theme))
}

const getMinorGridSpacing = (density: GridDensity): number => density
const getMajorGridSpacing = (density: GridDensity): number => density * MAJOR_GRID_INTERVAL

const getGridLines = (min: number, max: number, spacing: number): number[] => {
  if (!Number.isFinite(spacing) || spacing <= 0) {
    return []
  }

  const lines: number[] = []
  const start = Math.floor(min / spacing) * spacing
  const end = Math.ceil(max / spacing) * spacing

  for (let pos = start; pos <= end; pos += spacing) {
    lines.push(pos)
  }

  return lines
}

const isMajorLine = (pos: number, majorSpacing: number): boolean => {
  const ratio = pos / majorSpacing
  return Math.abs(ratio - Math.round(ratio)) < 1e-6
}

const formatNumber = (value: number): string => Number(value.toFixed(3)).toString()

const parseDimension = (value: string | undefined): number | null => {
  if (!value) {
    return null
  }
  const parsed = Number.parseFloat(value.replace('px', ''))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const getFiniteNumber = (value: unknown, fallback: number): number => {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

const getPositiveNumber = (value: unknown, fallback: number): number => {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
}

export const getSvgFrame = (svgData: string): SvgFrame | null => {
  const viewBoxMatch = svgData.match(/\sviewBox="([^"]+)"/)
  if (!viewBoxMatch) {
    return null
  }

  const [x, y, width, height] = viewBoxMatch[1]
    .split(/[\s,]+/)
    .map((part) => Number.parseFloat(part))

  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
    return null
  }

  const widthMatch = svgData.match(/\swidth="([^"]+)"/)
  const heightMatch = svgData.match(/\sheight="([^"]+)"/)
  return {
    x,
    y,
    width,
    height,
    rasterWidth: parseDimension(widthMatch?.[1]) ?? width,
    rasterHeight: parseDimension(heightMatch?.[1]) ?? height,
  }
}

const renderBackgroundRect = (frame: SvgFrame, fill: string): string => {
  return `<rect data-thinkix-export-background="true" x="${formatNumber(frame.x)}" y="${formatNumber(frame.y)}" width="${formatNumber(frame.width)}" height="${formatNumber(frame.height)}" fill="${fill}" />`
}

const renderPatternRect = (frame: SvgFrame, id: string): string => {
  return `<rect data-thinkix-export-grid-fill="true" x="${formatNumber(frame.x)}" y="${formatNumber(frame.y)}" width="${formatNumber(frame.width)}" height="${formatNumber(frame.height)}" fill="url(#${id})" />`
}

const getViewportFrame = (board: PlaitBoard): SvgFrame => {
  let viewBox: { x?: number; y?: number; width?: number; height?: number } | null = null

  try {
    viewBox = getViewBox(board)
  } catch {
    viewBox = null
  }

  const width = getPositiveNumber(viewBox?.width, DEFAULT_EMPTY_EXPORT_WIDTH)
  const height = getPositiveNumber(viewBox?.height, DEFAULT_EMPTY_EXPORT_HEIGHT)

  return {
    x: getFiniteNumber(viewBox?.x, 0),
    y: getFiniteNumber(viewBox?.y, 0),
    width,
    height,
    rasterWidth: width,
    rasterHeight: height,
  }
}

const renderDotGrid = (frame: SvgFrame, config: BoardBackground, colors: GridThemeColors, idPrefix: string): string => {
  const spacing = getMinorGridSpacing(config.density)
  const dotId = `${idPrefix}-dot`
  const dotColor = rgba(colors.primary, GRID_OPACITY.dot)
  const pattern = `<pattern id="${dotId}" x="0" y="0" width="${formatNumber(spacing)}" height="${formatNumber(spacing)}" patternUnits="userSpaceOnUse"><circle cx="0" cy="0" r="${GRID_DOT_RADIUS_BASE}" fill="${dotColor}" /></pattern>`
  return `<defs>${pattern}</defs>${renderPatternRect(frame, dotId)}`
}

const renderSquareGrid = (frame: SvgFrame, config: BoardBackground, colors: GridThemeColors, idPrefix: string): string => {
  const minorSpacing = getMinorGridSpacing(config.density)
  const majorSpacing = getMajorGridSpacing(config.density)
  const minorId = `${idPrefix}-minor`
  const majorId = `${idPrefix}-major`
  const minorColor = rgba(colors.primary, GRID_OPACITY.minor)
  const majorColor = rgba(colors.major, GRID_OPACITY.major)
  const minorPattern = `<pattern id="${minorId}" x="0" y="0" width="${formatNumber(minorSpacing)}" height="${formatNumber(minorSpacing)}" patternUnits="userSpaceOnUse"><path d="M ${formatNumber(minorSpacing)} 0 L 0 0 L 0 ${formatNumber(minorSpacing)}" fill="none" stroke="${minorColor}" stroke-width="${GRID_LINE_WIDTH_BASE}" /></pattern>`
  const majorPattern = config.showMajor
    ? `<pattern id="${majorId}" x="0" y="0" width="${formatNumber(majorSpacing)}" height="${formatNumber(majorSpacing)}" patternUnits="userSpaceOnUse"><path d="M ${formatNumber(majorSpacing)} 0 L 0 0 L 0 ${formatNumber(majorSpacing)}" fill="none" stroke="${majorColor}" stroke-width="${GRID_MAJOR_LINE_WIDTH_BASE}" /></pattern>`
    : ''

  return `<defs>${minorPattern}${majorPattern}</defs>${renderPatternRect(frame, minorId)}${config.showMajor ? renderPatternRect(frame, majorId) : ''}`
}

const renderRuledGrid = (frame: SvgFrame, config: BoardBackground, colors: GridThemeColors): string => {
  const minorSpacing = getMinorGridSpacing(config.density)
  const majorSpacing = getMajorGridSpacing(config.density)
  const x1 = frame.x
  const x2 = frame.x + frame.width
  const yLines = getGridLines(frame.y, frame.y + frame.height, minorSpacing)
  const majorYLines = config.showMajor ? getGridLines(frame.y, frame.y + frame.height, majorSpacing) : []
  const minorColor = rgba(colors.primary, GRID_OPACITY.minor)
  const majorColor = rgba(colors.major, GRID_OPACITY.major)
  const marginColor = rgba(colors.secondary, 0.6)
  const lineElements = yLines
    .filter((y) => !config.showMajor || !isMajorLine(y, majorSpacing))
    .map((y) => `<line x1="${formatNumber(x1)}" y1="${formatNumber(y)}" x2="${formatNumber(x2)}" y2="${formatNumber(y)}" stroke="${minorColor}" stroke-width="${GRID_LINE_WIDTH_BASE}" />`)
    .join('')
  const majorLineElements = majorYLines
    .map((y) => `<line x1="${formatNumber(x1)}" y1="${formatNumber(y)}" x2="${formatNumber(x2)}" y2="${formatNumber(y)}" stroke="${majorColor}" stroke-width="${GRID_MAJOR_LINE_WIDTH_BASE}" />`)
    .join('')
  const marginX = frame.x + GRID_RULED_MARGIN_OFFSET
  const marginLine = `<line x1="${formatNumber(marginX)}" y1="${formatNumber(frame.y)}" x2="${formatNumber(marginX)}" y2="${formatNumber(frame.y + frame.height)}" stroke="${marginColor}" stroke-width="1.5" />`

  return `<g data-thinkix-export-grid-ruled="true">${lineElements}${majorLineElements}${marginLine}</g>`
}

const getIsometricPoints = (
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  spacing: number
): Array<{ start: { x: number; y: number }; end: { x: number; y: number }; side: 'left' | 'right' }> => {
  if (!Number.isFinite(spacing) || spacing <= 0) {
    return []
  }

  const lines: Array<{ start: { x: number; y: number }; end: { x: number; y: number }; side: 'left' | 'right' }> = []
  const tanAngle = Math.tan(ISOMETRIC_ANGLE_RAD)
  const dx = spacing / Math.cos(ISOMETRIC_ANGLE_RAD)
  const expandedMinX = minX - (maxY - minY) / tanAngle - spacing
  const expandedMaxX = maxX + (maxY - minY) / tanAngle + spacing
  const expandedMinY = minY - spacing
  const expandedMaxY = maxY + spacing

  for (let offset = expandedMinX; offset <= expandedMaxX; offset += dx) {
    const startY = expandedMinY
    const endY = expandedMaxY
    lines.push({
      side: 'left',
      start: { x: offset + (endY - startY) / tanAngle, y: startY },
      end: { x: offset, y: endY },
    })
    lines.push({
      side: 'right',
      start: { x: offset, y: startY },
      end: { x: offset + (endY - startY) / tanAngle, y: endY },
    })
  }

  return lines
}

const renderIsometricGrid = (frame: SvgFrame, config: BoardBackground, colors: GridThemeColors): string => {
  const spacing = config.density * 1.5
  const majorSpacing = spacing * MAJOR_GRID_INTERVAL
  const minorColor = rgba(colors.primary, GRID_OPACITY.minor)
  const majorColor = rgba(colors.major, GRID_OPACITY.major)
  const lines = getIsometricPoints(frame.x, frame.x + frame.width, frame.y, frame.y + frame.height, spacing)
  const lineElements = lines
    .map((line) => {
      const avgX = (line.start.x + line.end.x) / 2
      const rem = ((avgX % majorSpacing) + majorSpacing) % majorSpacing
      const isMajor = config.showMajor && (rem < majorSpacing * 0.1 || rem > majorSpacing * 0.9)
      return `<line x1="${formatNumber(line.start.x)}" y1="${formatNumber(line.start.y)}" x2="${formatNumber(line.end.x)}" y2="${formatNumber(line.end.y)}" stroke="${isMajor ? majorColor : minorColor}" stroke-width="${isMajor ? GRID_MAJOR_LINE_WIDTH_BASE : GRID_LINE_WIDTH_BASE}" />`
    })
    .join('')

  return `<g data-thinkix-export-grid-isometric="true">${lineElements}</g>`
}

const renderGridLayer = (
  board: PlaitBoard & BoardWithGridConfig,
  frame: SvgFrame,
  includeBackground: boolean
): string => {
  const config = getExportGridConfig(board)
  const theme = getBoardThemeMode(board.theme)
  const colors =
    config.type === 'blueprint'
      ? getBlueprintColors(theme)
      : config.type === 'ruled'
        ? getRuledColors(theme)
        : getGridThemeColors(theme)
  const background = includeBackground ? renderBackgroundRect(frame, getBackgroundColor(board)) : ''
  const idPrefix = `thinkix-export-grid-${config.type}`

  switch (config.type) {
    case 'dot':
      return `${background}${renderDotGrid(frame, config, colors, idPrefix)}`
    case 'square':
      return `${background}${renderSquareGrid(frame, config, colors, idPrefix)}`
    case 'blueprint':
      return `${background}${renderSquareGrid(frame, config, colors, idPrefix)}`
    case 'ruled':
      return `${background}${renderRuledGrid(frame, config, colors)}`
    case 'isometric':
      return `${background}${renderIsometricGrid(frame, config, colors)}`
    case 'blank':
    default:
      return background
  }
}

export const enhanceSvgWithBoardBackground = (
  svgData: string,
  board: PlaitBoard & BoardWithGridConfig,
  includeBackground: boolean
): string => {
  const frame = getSvgFrame(svgData)
  if (!frame) {
    return svgData
  }

  const layer = renderGridLayer(board, frame, includeBackground)
  if (!layer) {
    return svgData
  }

  return svgData.replace(/(<svg\b[^>]*>)/, `$1<g data-thinkix-export-background-layer="true">${layer}</g>`)
}

export const createSvgWithBoardBackground = (
  board: PlaitBoard & BoardWithGridConfig,
  includeBackground: boolean
): string => {
  const frame = getViewportFrame(board)
  const layer = renderGridLayer(board, frame, includeBackground)
  const viewBox = `${formatNumber(frame.x)} ${formatNumber(frame.y)} ${formatNumber(frame.width)} ${formatNumber(frame.height)}`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${formatNumber(frame.rasterWidth)}" height="${formatNumber(frame.rasterHeight)}" viewBox="${viewBox}"><g data-thinkix-export-background-layer="true">${layer}</g></svg>`
}

export const hasVisibleGrid = (board: PlaitBoard & BoardWithGridConfig): boolean => {
  return getExportGridConfig(board).type !== 'blank'
}

export const shouldKeepCanvasBackground = (board: PlaitBoard & BoardWithGridConfig, transparent: boolean): boolean => {
  if (!transparent) {
    return true
  }

  const gridType = getExportGridConfig(board).type
  return gridType === 'blueprint' || gridType === 'ruled'
}

const getSafeRasterRatio = (frame: SvgFrame, ratio: number): number => {
  const requestedRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 1
  const dimensionRatio = Math.min(
    MAX_EXPORT_CANVAS_DIMENSION / frame.rasterWidth,
    MAX_EXPORT_CANVAS_DIMENSION / frame.rasterHeight
  )
  const areaRatio = Math.sqrt(MAX_EXPORT_CANVAS_AREA / (frame.rasterWidth * frame.rasterHeight))
  return Math.max(0.01, Math.min(requestedRatio, dimensionRatio, areaRatio))
}

const isValidImageDataUrl = (imageData: string): boolean => {
  const [, payload = ''] = imageData.split(',')
  return imageData.startsWith('data:image/') && payload.length > 0
}

export const svgToImageData = async (
  svgData: string,
  ratio: number,
  mimeType: 'image/png' | 'image/jpeg'
): Promise<string | undefined> => {
  const frame = getSvgFrame(svgData)
  if (!frame) {
    return undefined
  }

  const safeRatio = getSafeRasterRatio(frame, ratio)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.floor(frame.rasterWidth * safeRatio))
  canvas.height = Math.max(1, Math.floor(frame.rasterHeight * safeRatio))
  const context = canvas.getContext('2d')
  if (!context) {
    return undefined
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load exported SVG'))
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`
  })

  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const imageData = canvas.toDataURL(mimeType)
  return isValidImageDataUrl(imageData) ? imageData : undefined
}
