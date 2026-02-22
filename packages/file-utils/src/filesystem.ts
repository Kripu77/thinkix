import {
  fileOpen as _fileOpen,
  fileSave as _fileSave,
} from 'browser-fs-access';
import type { FileOpenOptions, FileSaveOptions } from './types';

export const isAbortError = (error: unknown): boolean => {
  return (
    error instanceof DOMException &&
    (error.name === 'AbortError' || error.name === 'NotReadableError')
  );
};

export const fileOpen = async (
  opts: FileOpenOptions
): Promise<File> => {
  return _fileOpen({
    description: opts.description,
    extensions: opts.extensions,
    mimeTypes: opts.mimeTypes,
    multiple: false,
  }) as Promise<File>;
};

export const fileSave = async (
  blob: Blob | Promise<Blob>,
  opts: FileSaveOptions
): Promise<FileSystemFileHandle | null | undefined> => {
  return _fileSave(
    blob,
    {
      fileName: `${opts.name}.${opts.extension}`,
      description: opts.description,
      extensions: [`.${opts.extension}`],
    },
    opts.fileHandle as FileSystemFileHandle | null | undefined
  );
};

export const parseFileContents = async (blob: Blob | File): Promise<string> => {
  if ('text' in Blob) {
    return blob.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(blob, 'utf8');
    reader.onloadend = () => {
      if (reader.readyState === FileReader.DONE) {
        resolve(reader.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
  });
};

export const blobToArrayBuffer = async (blob: Blob): Promise<ArrayBuffer> => {
  if ('arrayBuffer' in blob) {
    return blob.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error('Failed to convert blob to ArrayBuffer'));
      }
      resolve(event.target.result as ArrayBuffer);
    };
    reader.readAsArrayBuffer(blob);
  });
};

export const normalizeFile = async (file: File, extension: string): Promise<File> => {
  if (!file.type && file.name?.endsWith(`.${extension}`)) {
    const arrayBuffer = await blobToArrayBuffer(file);
    return new File([arrayBuffer], file.name, {
      type: 'application/json',
    });
  }
  return file;
};

export const base64ToBlob = (base64: string): Blob => {
  const arr = base64.split(',');
  const fileType = arr[0].match(/:(.*?);/)?.[1] ?? 'image/png';
  const bstr = atob(arr[1]);
  const u8Arr = new Uint8Array(bstr.length);

  for (let i = 0; i < bstr.length; i++) {
    u8Arr[i] = bstr.charCodeAt(i);
  }

  return new Blob([u8Arr], { type: fileType });
};

export const download = (blob: Blob | MediaSource, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
};
