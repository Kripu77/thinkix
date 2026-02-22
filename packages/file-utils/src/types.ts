import type { PlaitElement, PlaitTheme, Viewport } from '@plait/core';

export const FILE_EXTENSION = 'thinkix';
export const MIME_TYPE = 'application/json';

export interface ThinkixExportedData {
  type: 'thinkix';
  version: number;
  source: 'web';
  elements: PlaitElement[];
  viewport: Viewport;
  theme?: PlaitTheme;
}

export interface FileOpenOptions {
  description: string;
  extensions?: string[];
  mimeTypes?: string[];
}

export interface FileSaveOptions {
  name: string;
  extension: string;
  description: string;
  fileHandle?: FileSystemHandle | null;
}

export const CURRENT_VERSION = 1;
