import type { PlaitBoard, PlaitElement } from '@plait/core';
import { toSvgData, toImage, getSelectedElements } from '@plait/core';
import type { ThinkixExportedData } from './types';
import { CURRENT_VERSION, FILE_EXTENSION, MIME_TYPE } from './types';
import { fileOpen, fileSave, parseFileContents, normalizeFile, base64ToBlob, download, isAbortError } from './filesystem';
import {
  createSvgWithBoardBackground,
  enhanceSvgWithBoardBackground,
  getBackgroundColor,
  getSvgFrame,
  hasVisibleGrid,
  shouldKeepCanvasBackground,
  svgToImageData,
} from './grid-export';
export { createSvgWithBoardBackground, enhanceSvgWithBoardBackground, getBackgroundColor, getSvgFrame } from './grid-export';

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

const imageDataToBlob = async (imageData: string): Promise<Blob> => {
  if (typeof fetch === 'function') {
    try {
      const response = await fetch(imageData)
      if (response?.ok) {
        return response.blob()
      }
    } catch {}
  }

  return base64ToBlob(imageData)
}

const isUsableImageData = (imageData: string | undefined): imageData is string => {
  if (!imageData?.startsWith('data:image/')) {
    return false
  }

  const [, payload = ''] = imageData.split(',')
  return payload.length > 0
}

const downloadImageData = async (imageData: string | undefined, fileName: string): Promise<void> => {
  if (!isUsableImageData(imageData)) {
    throw new Error('Failed to export image data')
  }

  const blob = await imageDataToBlob(imageData)
  if (blob.size === 0) {
    throw new Error('Failed to export non-empty image')
  }

  download(blob, fileName)
}

const hasElementContent = (board: PlaitBoard, elements?: PlaitElement[]): boolean => {
  return (elements?.length ?? board.children.length) > 0
}

const getSvgDataWithFallbackFrame = async (
  board: PlaitBoard,
  options: NonNullable<Parameters<typeof toSvgData>[1]>,
  includeBackground: boolean
): Promise<string> => {
  const svgData = enhanceSvgWithBoardBackground(await toSvgData(board, options), board, includeBackground)
  if (getSvgFrame(svgData) || hasElementContent(board, options.elements)) {
    return svgData
  }

  return createSvgWithBoardBackground(board, includeBackground)
}

const rasterizeGridExport = async (
  board: PlaitBoard,
  options: NonNullable<Parameters<typeof toSvgData>[1]>,
  includeBackground: boolean,
  mimeType: 'image/png' | 'image/jpeg'
): Promise<string | undefined> => {
  const svgData = await getSvgDataWithFallbackFrame(board, options, includeBackground)
  const imageData = await svgToImageData(svgData, 4, mimeType).catch(() => undefined)
  if (imageData || hasElementContent(board, options.elements)) {
    return imageData
  }

  return svgToImageData(createSvgWithBoardBackground(board, includeBackground), 4, mimeType)
}

const rasterizeViewportExport = (
  board: PlaitBoard,
  includeBackground: boolean,
  mimeType: 'image/png' | 'image/jpeg'
): Promise<string | undefined> => {
  return svgToImageData(createSvgWithBoardBackground(board, includeBackground), 4, mimeType)
}

export const exportAsSvg = async (board: PlaitBoard, name?: string): Promise<void> => {
  const selectedElements = getSelectedElements(board)
  const backgroundColor = getBackgroundColor(board)
  const includeBackground = !isWhite(backgroundColor)

  const svgData = await getSvgDataWithFallbackFrame(board, {
    fillStyle: isWhite(backgroundColor) ? TRANSPARENT : backgroundColor,
    padding: 20,
    ratio: 4,
    elements: selectedElements.length > 0 ? selectedElements : undefined,
    inlineStyleClassNames: '.plait-text-container',
    styleNames: ['position'],
  }, includeBackground)

  const blob = new Blob([svgData], { type: 'image/svg+xml' })
  const fileName = `${sanitizeFileName(name ?? 'board')}.svg`
  download(blob, fileName)
}

export const exportAsPng = async (board: PlaitBoard, transparent: boolean = true, name?: string): Promise<void> => {
  const selectedElements = getSelectedElements(board)
  const backgroundColor = getBackgroundColor(board)
  const shouldRenderGrid = hasVisibleGrid(board)
  let imageData: string | undefined

  if (shouldRenderGrid) {
    imageData = await rasterizeGridExport(board, {
      elements: selectedElements.length > 0 ? selectedElements : undefined,
      fillStyle: transparent ? TRANSPARENT : backgroundColor,
      padding: 20,
      ratio: 4,
      inlineStyleClassNames: '.extend,.emojis,.text',
    }, shouldKeepCanvasBackground(board, transparent), 'image/png')
  } else {
    imageData = await toImage(board, {
      elements: selectedElements.length > 0 ? selectedElements : undefined,
      fillStyle: transparent ? TRANSPARENT : backgroundColor,
      padding: 20,
      ratio: 4,
      inlineStyleClassNames: '.extend,.emojis,.text',
    })

    if (!isUsableImageData(imageData) && !hasElementContent(board, selectedElements.length > 0 ? selectedElements : undefined)) {
      imageData = await rasterizeViewportExport(board, !transparent, 'image/png')
    }
  }

  await downloadImageData(imageData, `${sanitizeFileName(name ?? 'board')}.png`)
}

export const exportAsJpg = async (board: PlaitBoard, name?: string): Promise<void> => {
  const selectedElements = getSelectedElements(board)
  const backgroundColor = getBackgroundColor(board)
  const shouldRenderGrid = hasVisibleGrid(board)
  let imageData: string | undefined

  if (shouldRenderGrid) {
    imageData = await rasterizeGridExport(board, {
      elements: selectedElements.length > 0 ? selectedElements : undefined,
      fillStyle: backgroundColor,
      padding: 20,
      ratio: 4,
      inlineStyleClassNames: '.extend,.emojis,.text',
    }, true, 'image/jpeg')
  } else {
    imageData = await toImage(board, {
      elements: selectedElements.length > 0 ? selectedElements : undefined,
      fillStyle: backgroundColor,
      padding: 20,
      ratio: 4,
      inlineStyleClassNames: '.extend,.emojis,.text',
    })

    if (!isUsableImageData(imageData) && !hasElementContent(board, selectedElements.length > 0 ? selectedElements : undefined)) {
      imageData = await rasterizeViewportExport(board, true, 'image/jpeg')
    }
  }

  await downloadImageData(imageData, `${sanitizeFileName(name ?? 'board')}.jpg`)
}
