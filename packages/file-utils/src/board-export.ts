import type { PlaitBoard } from '@plait/core';
import { toSvgData, toImage, getSelectedElements, ThemeColorMode } from '@plait/core';
import type { ThinkixExportedData } from './types';
import { CURRENT_VERSION, FILE_EXTENSION, MIME_TYPE } from './types';
import { fileOpen, fileSave, parseFileContents, normalizeFile, base64ToBlob, download, isAbortError } from './filesystem';
import type { GridType } from '@thinkix/shared';
import { GRID_BACKGROUND_COLORS } from '@thinkix/shared';

const TRANSPARENT = 'transparent';

export const isValidThinkixData = (data: unknown): data is ThinkixExportedData => {
  return (
    data !== null &&
    typeof data === 'object' &&
    'type' in data &&
    data.type === 'thinkix' &&
    'elements' in data &&
    Array.isArray(data.elements) &&
    'viewport' in data &&
    typeof data.viewport === 'object'
  );
};

interface BoardWithGridConfig {
  getGridConfig?: () => { type: GridType }
}

export const getBackgroundColor = (board: PlaitBoard & BoardWithGridConfig): string => {
  const isDark = board.theme?.themeColorMode === ThemeColorMode.dark;
  
  if (board.getGridConfig) {
    const config = board.getGridConfig();
    if (config.type === 'blueprint') {
      return isDark ? GRID_BACKGROUND_COLORS.blueprint.dark : GRID_BACKGROUND_COLORS.blueprint.light;
    }
    if (config.type === 'ruled') {
      return GRID_BACKGROUND_COLORS.ruled;
    }
  }
  
  return isDark ? GRID_BACKGROUND_COLORS.dark : GRID_BACKGROUND_COLORS.light;
}

export const sanitizeFileName = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'board'
}

export const serializeBoard = (board: PlaitBoard): string => {
  const data: ThinkixExportedData = {
    type: 'thinkix',
    version: CURRENT_VERSION,
    source: 'web',
    elements: board.children,
    viewport: board.viewport,
    theme: board.theme,
  }

  return JSON.stringify(data, null, 2)
}

export const saveBoardToFile = async (
  board: PlaitBoard,
  name?: string
): Promise<{ fileHandle: FileSystemFileHandle | null } | null> => {
  try {
    const serialized = serializeBoard(board)
    const blob = new Blob([serialized], { type: MIME_TYPE })

    const fileHandle = await fileSave(blob, {
      name: sanitizeFileName(name ?? 'board'),
      extension: FILE_EXTENSION,
      description: 'Thinkix Board',
    })

    return fileHandle ? { fileHandle } : null
  } catch (error) {
    if (isAbortError(error)) {
      return null
    }
    throw error
  }
}

export const loadBoardFromFile = async (): Promise<ThinkixExportedData | null> => {
  try {
    const file = await fileOpen({
      description: 'Thinkix Board files',
      extensions: [`.${FILE_EXTENSION}`, '.json'],
      mimeTypes: [MIME_TYPE, 'application/json'],
    })

    const normalizedFile = await normalizeFile(file, FILE_EXTENSION)
    const contents = await parseFileContents(normalizedFile)

    try {
      const data = JSON.parse(contents)
      if (isValidThinkixData(data)) {
        return data
      }
      throw new Error('Invalid file format')
    } catch {
      throw new Error('Failed to parse board file')
    }
  } catch (error) {
    if (isAbortError(error)) {
      return null
    }
    throw error
  }
}

const isWhite = (color: string): boolean => {
  return color === '#ffffff' || color === '#fff' || color === 'white'
}

export const exportAsSvg = async (board: PlaitBoard, name?: string): Promise<void> => {
  const selectedElements = getSelectedElements(board)
  const backgroundColor = getBackgroundColor(board)

  const svgData = await toSvgData(board, {
    fillStyle: isWhite(backgroundColor) ? TRANSPARENT : backgroundColor,
    padding: 20,
    ratio: 4,
    elements: selectedElements.length > 0 ? selectedElements : undefined,
    inlineStyleClassNames: '.plait-text-container',
    styleNames: ['position'],
  })

  const blob = new Blob([svgData], { type: 'image/svg+xml' })
  const fileName = `${sanitizeFileName(name ?? 'board')}.svg`
  download(blob, fileName)
}

export const exportAsPng = async (board: PlaitBoard, transparent: boolean = true, name?: string): Promise<void> => {
  const selectedElements = getSelectedElements(board)
  const backgroundColor = getBackgroundColor(board)

  const imageData = await toImage(board, {
    elements: selectedElements.length > 0 ? selectedElements : undefined,
    fillStyle: transparent ? TRANSPARENT : backgroundColor,
    padding: 20,
    ratio: 4,
    inlineStyleClassNames: '.extend,.emojis,.text',
  })

  if (imageData) {
    const blob = base64ToBlob(imageData)
    const fileName = `${sanitizeFileName(name ?? 'board')}.png`
    download(blob, fileName)
  }
}

export const exportAsJpg = async (board: PlaitBoard, name?: string): Promise<void> => {
  const selectedElements = getSelectedElements(board)
  const backgroundColor = getBackgroundColor(board)

  const imageData = await toImage(board, {
    elements: selectedElements.length > 0 ? selectedElements : undefined,
    fillStyle: backgroundColor,
    padding: 20,
    ratio: 4,
    inlineStyleClassNames: '.extend,.emojis,.text',
  })

  if (imageData) {
    const blob = base64ToBlob(imageData)
    const fileName = `${sanitizeFileName(name ?? 'board')}.jpg`
    download(blob, fileName)
  }
}
