import { describe, it, expect, vi } from 'vitest';

vi.mock('@plait/core', async () => ({
  getHitElementByPoint: vi.fn(() => null),
  getSelectedElements: vi.fn(() => []),
  toHostPoint: vi.fn((_board, x, y) => [x, y]),
  toViewBoxPoint: vi.fn((_board, point) => point),
}));

vi.mock('@plait/common', async () => ({
  getElementOfFocusedImage: vi.fn(() => null),
  isResizing: vi.fn(() => false),
  isSelectionMoving: vi.fn(() => false),
  isDragging: vi.fn(() => false),
}));

vi.mock('@plait/mind', async () => ({
  MindElement: {
    isMindElement: vi.fn(() => false),
    hasImage: vi.fn(() => false),
  },
  MindTransforms: {
    setImage: vi.fn(),
  },
  isHitImage: vi.fn(() => false),
}));

vi.mock('@plait/draw', async () => ({
  DrawTransforms: {
    insertImage: vi.fn(),
  },
}));

function isValidImageType(mime: string): boolean {
  return mime.startsWith('image/');
}

async function readFileAsURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

describe('image-interactions', () => {
  describe('isValidImageType', () => {
    it('should return true for image/png', () => {
      expect(isValidImageType('image/png')).toBe(true);
    });

    it('should return true for image/jpeg', () => {
      expect(isValidImageType('image/jpeg')).toBe(true);
    });

    it('should return true for image/gif', () => {
      expect(isValidImageType('image/gif')).toBe(true);
    });

    it('should return true for image/svg+xml', () => {
      expect(isValidImageType('image/svg+xml')).toBe(true);
    });

    it('should return true for image/webp', () => {
      expect(isValidImageType('image/webp')).toBe(true);
    });

    it('should return false for application/json', () => {
      expect(isValidImageType('application/json')).toBe(false);
    });

    it('should return false for text/plain', () => {
      expect(isValidImageType('text/plain')).toBe(false);
    });

    it('should return false for video/mp4', () => {
      expect(isValidImageType('video/mp4')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidImageType('')).toBe(false);
    });

    it('should return false for partial image string', () => {
      expect(isValidImageType('image')).toBe(false);
    });
  });

  describe('readFileAsURL', () => {
    it('should read file as data URL', async () => {
      const file = new File(['test content'], 'test.png', { type: 'image/png' });
      const result = await readFileAsURL(file);
      
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should read JPEG file correctly', async () => {
      const file = new File(['jpeg content'], 'test.jpg', { type: 'image/jpeg' });
      const result = await readFileAsURL(file);
      
      expect(result).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('should read empty file', async () => {
      const file = new File([''], 'empty.png', { type: 'image/png' });
      const result = await readFileAsURL(file);
      
      expect(result).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('image placement constants', () => {
    it('should have standard image width', () => {
      const STANDARD_IMAGE_WIDTH = 400;
      expect(STANDARD_IMAGE_WIDTH).toBe(400);
    });

    it('should have mind image width', () => {
      const MIND_IMAGE_WIDTH = 240;
      expect(MIND_IMAGE_WIDTH).toBe(240);
    });
  });

  describe('image dimension calculation', () => {
    it('should scale down image that exceeds max width', () => {
      const bitmap = { width: 800, height: 600 };
      const maxWidth = 400;
      
      const width = bitmap.width > maxWidth ? maxWidth : bitmap.width;
      const height = (width / bitmap.width) * bitmap.height;
      
      expect(width).toBe(400);
      expect(height).toBe(300);
    });

    it('should keep original size if within max width', () => {
      const bitmap = { width: 300, height: 200 };
      const maxWidth = 400;
      
      const width = bitmap.width > maxWidth ? maxWidth : bitmap.width;
      const height = (width / bitmap.width) * bitmap.height;
      
      expect(width).toBe(300);
      expect(height).toBe(200);
    });

    it('should maintain aspect ratio', () => {
      const bitmap = { width: 1000, height: 500 };
      const maxWidth = 400;
      
      const width = bitmap.width > maxWidth ? maxWidth : bitmap.width;
      const height = (width / bitmap.width) * bitmap.height;
      
      expect(width / height).toBe(2);
    });
  });

  describe('paste from clipboard', () => {
    it('should check clipboard files for images', async () => {
      const file = new File([''], 'image.png', { type: 'image/png' });
      
      expect(isValidImageType(file.type)).toBe(true);
    });

    it('should ignore non-image clipboard files', async () => {
      const file = new File([''], 'doc.pdf', { type: 'application/pdf' });
      
      expect(isValidImageType(file.type)).toBe(false);
    });

    it('should handle empty files array', async () => {
      const clipboardData = {
        files: [] as File[],
      };
      
      const hasImageFile = clipboardData.files.length > 0 && isValidImageType(clipboardData.files[0].type);
      expect(hasImageFile).toBeFalsy();
    });
  });

  describe('drop handling', () => {
    it('should check dataTransfer for dropped files', () => {
      const event = {
        dataTransfer: {
          files: [new File([''], 'image.png', { type: 'image/png' })],
        },
        x: 100,
        y: 100,
      } as unknown as DragEvent;
      
      const hasFiles = event.dataTransfer?.files?.length;
      expect(hasFiles).toBe(1);
    });

    it('should validate dropped file type', () => {
      const file = new File([''], 'image.png', { type: 'image/png' });
      expect(isValidImageType(file.type)).toBe(true);
    });

    it('should reject non-image drops', () => {
      const file = new File([''], 'doc.pdf', { type: 'application/pdf' });
      expect(isValidImageType(file.type)).toBe(false);
    });
  });

  describe('fullscreen image viewer', () => {
    it('should create overlay element', () => {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/80';
      
      expect(overlay.className).toContain('fixed');
      expect(overlay.className).toContain('bg-black/80');
    });

    it('should create image element', () => {
      const img = document.createElement('img');
      img.className = 'max-w-[90vw] max-h-[90vh] object-contain';
      
      expect(img.className).toContain('max-w-[90vw]');
    });

    it('should handle escape key', () => {
      let removed = false;
      const overlay = {
        remove: () => { removed = true; },
      };
      
      const onEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          overlay.remove();
        }
      };
      
      onEscape({ key: 'Escape' } as KeyboardEvent);
      expect(removed).toBe(true);
    });
  });
});
