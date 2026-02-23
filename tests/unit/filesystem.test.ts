// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isAbortError,
  parseFileContents,
  blobToArrayBuffer,
  normalizeFile,
  base64ToBlob,
  download,
} from '@thinkix/file-utils/filesystem';

describe('filesystem utilities', () => {
  describe('isAbortError', () => {
    it('should return true for AbortError DOMException', () => {
      const error = new DOMException('Aborted', 'AbortError');
      expect(isAbortError(error)).toBe(true);
    });

    it('should return true for NotReadableError DOMException', () => {
      const error = new DOMException('Not readable', 'NotReadableError');
      expect(isAbortError(error)).toBe(true);
    });

    it('should return false for other DOMException types', () => {
      const error = new DOMException('Not found', 'NotFoundError');
      expect(isAbortError(error)).toBe(false);
    });

    it('should return false for non-DOMException errors', () => {
      expect(isAbortError(new Error('test'))).toBe(false);
      expect(isAbortError('string error')).toBe(false);
      expect(isAbortError(null)).toBe(false);
      expect(isAbortError(undefined)).toBe(false);
    });
  });

  describe('parseFileContents', () => {
    it('should parse blob text using blob.text() when available', async () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const result = await parseFileContents(blob);
      expect(result).toBe('test content');
    });

    it('should parse file text', async () => {
      const file = new File(['file content'], 'test.txt', { type: 'text/plain' });
      const result = await parseFileContents(file);
      expect(result).toBe('file content');
    });

    it('should handle empty blob', async () => {
      const blob = new Blob([], { type: 'text/plain' });
      const result = await parseFileContents(blob);
      expect(result).toBe('');
    });

    it('should handle JSON content', async () => {
      const jsonContent = JSON.stringify({ key: 'value' });
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const result = await parseFileContents(blob);
      expect(result).toBe(jsonContent);
      expect(JSON.parse(result)).toEqual({ key: 'value' });
    });

    it('should handle UTF-8 content', async () => {
      const utf8Content = 'Hello 世界 🌍';
      const blob = new Blob([utf8Content], { type: 'text/plain; charset=utf-8' });
      const result = await parseFileContents(blob);
      expect(result).toBe(utf8Content);
    });
  });

  describe('blobToArrayBuffer', () => {
    it('should convert blob to arrayBuffer', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const buffer = await blobToArrayBuffer(blob);
      expect(buffer).toBeInstanceOf(ArrayBuffer);
      
      const view = new Uint8Array(buffer);
      const decoder = new TextDecoder();
      expect(decoder.decode(view)).toBe('test');
    });

    it('should convert empty blob', async () => {
      const blob = new Blob([], { type: 'text/plain' });
      const buffer = await blobToArrayBuffer(blob);
      expect(buffer.byteLength).toBe(0);
    });

    it('should convert binary data', async () => {
      const data = new Uint8Array([0, 255, 128, 64]);
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const buffer = await blobToArrayBuffer(blob);
      
      const view = new Uint8Array(buffer);
      expect(Array.from(view)).toEqual([0, 255, 128, 64]);
    });
  });

  describe('normalizeFile', () => {
    it('should return file unchanged if type is set', async () => {
      const file = new File(['{}'], 'test.json', { type: 'application/json' });
      const result = await normalizeFile(file, 'thinkix');
      expect(result).toBe(file);
    });

    it('should add type for extension match without type', async () => {
      const file = new File(['{}'], 'test.thinkix', { type: '' });
      const result = await normalizeFile(file, 'thinkix');
      expect(result.type).toBe('application/json');
      expect(result.name).toBe('test.thinkix');
    });

    it('should not modify if extension does not match', async () => {
      const file = new File(['{}'], 'test.json', { type: '' });
      const result = await normalizeFile(file, 'thinkix');
      expect(result).toBe(file);
    });

    it('should preserve file content', async () => {
      const content = '{"key": "value"}';
      const file = new File([content], 'board.thinkix', { type: '' });
      const result = await normalizeFile(file, 'thinkix');
      
      const text = await result.text();
      expect(text).toBe(content);
    });
  });

  describe('base64ToBlob', () => {
    beforeEach(() => {
      global.atob = vi.fn((base64: string) => {
        const binary = [];
        for (let i = 0; i < base64.length; i++) {
          binary.push(String.fromCharCode(base64.charCodeAt(i)));
        }
        return binary.join('');
      });
    });

    it('should convert base64 data URL to blob', () => {
      const base64 = 'data:image/png;base64,iVBORw0KGgo=';
      const blob = base64ToBlob(base64);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });

    it('should return empty string if mime type not found', () => {
      const base64 = 'data:;base64,abc';
      const blob = base64ToBlob(base64);
      expect(blob.type).toBe('');
    });

    it('should handle jpeg mime type', () => {
      const base64 = 'data:image/jpeg;base64,/9j/4AAQ=';
      const blob = base64ToBlob(base64);
      expect(blob.type).toBe('image/jpeg');
    });

    it('should handle svg mime type', () => {
      const base64 = 'data:image/svg+xml;base64,PHN2Zz4=';
      const blob = base64ToBlob(base64);
      expect(blob.type).toBe('image/svg+xml');
    });
  });

  describe('download', () => {
    let createElementSpy: ReturnType<typeof vi.spyOn>;
    let appendSpy: ReturnType<typeof vi.spyOn>;
    let removeSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      createElementSpy = vi.spyOn(document, 'createElement');
      appendSpy = vi.spyOn(document.body, 'append');
      removeSpy = vi.spyOn(Element.prototype, 'remove');
    });

    afterEach(() => {
      createElementSpy.mockRestore();
      appendSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it('should create download link and trigger download', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
        remove: vi.fn(),
      };
      
      createElementSpy.mockReturnValue(mockAnchor as unknown as HTMLAnchorElement);
      
      download(blob, 'test.txt');
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toBe('test.txt');
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(appendSpy).toHaveBeenCalled();
    });

    it('should revoke object URL after download', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
      
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
        remove: vi.fn(),
      };
      
      createElementSpy.mockReturnValue(mockAnchor as unknown as HTMLAnchorElement);
      
      download(blob, 'test.txt');
      
      expect(revokeSpy).toHaveBeenCalled();
    });
  });
});
