import '@testing-library/jest-dom/vitest';
import { vi, afterEach, afterAll } from 'vitest';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;

globalThis.DOMRect = class DOMRect {
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  top = 0;
  right = 0;
  bottom = 0;
  left = 0;
  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.top = y;
    this.right = x + width;
    this.bottom = y + height;
    this.left = x;
  }
  toJSON() {
    return { x: this.x, y: this.y, width: this.width, height: this.height, top: this.top, right: this.right, bottom: this.bottom, left: this.left };
  }
} as typeof DOMRect;

globalThis.requestIdleCallback = vi.fn((cb: IdleRequestCallback) => {
  return setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 1);
});

globalThis.cancelIdleCallback = vi.fn((id: number) => clearTimeout(id));

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  root = null;
  rootMargin = '';
  thresholds = [];
}
globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class MockPointerEvent extends MouseEvent {
  coalesceX: number;
  coalesceY: number;
  pointerId: number;
  pointerType: string;
  pressure: number;
  tangentialPressure: number;
  tiltX: number;
  tiltY: number;
  twist: number;
  isPrimary: boolean;

  constructor(type: string, props: PointerEventInit = {}) {
    super(type, props);
    this.coalesceX = props.coalesceX ?? 0;
    this.coalesceY = props.coalesceY ?? 0;
    this.pointerId = props.pointerId ?? 0;
    this.pointerType = props.pointerType ?? '';
    this.pressure = props.pressure ?? 0;
    this.tangentialPressure = props.tangentialPressure ?? 0;
    this.tiltX = props.tiltX ?? 0;
    this.tiltY = props.tiltY ?? 0;
    this.twist = props.twist ?? 0;
    this.isPrimary = props.isPrimary ?? false;
  }
}
globalThis.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;

HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
  if (contextId === '2d') {
    return {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      canvas: null,
    } as unknown as CanvasRenderingContext2D;
  }
  return null;
});

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock');
HTMLCanvasElement.prototype.toBlob = vi.fn((callback: BlobCallback) => {
  callback(new Blob(['mock'], { type: 'image/png' }), null);
});

class MockFileSystemFileHandle {
  name = 'mock-file.thinkix';
  kind = 'file' as const;
  getFile = vi.fn().mockResolvedValue(new File(['{}'], 'mock-file.thinkix', { type: 'application/json' }));
  createWritable = vi.fn().mockResolvedValue({
    write: vi.fn(),
    close: vi.fn(),
  });
}

class MockFileSystemDirectoryHandle {
  name = 'mock-directory';
  kind = 'directory' as const;
  getFileHandle = vi.fn().mockResolvedValue(new MockFileSystemFileHandle());
  getDirectoryHandle = vi.fn().mockResolvedValue(new MockFileSystemDirectoryHandle());
  removeEntry = vi.fn().mockResolvedValue(undefined);
  resolve = vi.fn().mockResolvedValue([]);
  values = vi.fn().mockReturnValue([][Symbol.iterator]());
  keys = vi.fn().mockReturnValue([][Symbol.iterator]());
  entries = vi.fn().mockReturnValue([][Symbol.iterator]());
}

globalThis.FileSystemFileHandle = MockFileSystemFileHandle as unknown as typeof FileSystemFileHandle;
globalThis.FileSystemDirectoryHandle = MockFileSystemDirectoryHandle as unknown as typeof FileSystemDirectoryHandle;

vi.mock('browser-fs-access', () => ({
  fileOpen: vi.fn().mockResolvedValue(
    new File([JSON.stringify({ type: 'thinkix', version: 1, elements: [], viewport: { zoom: 1 } })], 'test.thinkix', {
      type: 'application/json',
    })
  ),
  fileSave: vi.fn().mockResolvedValue(new MockFileSystemFileHandle()),
}));

vi.mock('@plait/core', async () => {
  const actual = await vi.importActual('@plait/core');
  return {
    ...actual,
    toSvgData: vi.fn().mockResolvedValue('<svg></svg>'),
    toImage: vi.fn().mockResolvedValue('data:image/png;base64,mock'),
    getSelectedElements: vi.fn().mockReturnValue([]),
  };
});

vi.mock('@plait-board/react-board', () => ({
  useBoard: vi.fn().mockReturnValue({
    children: [],
    viewport: { zoom: 1, x: 0, y: 0 },
    selection: null,
    theme: { themeColorMode: 'light' },
  }),
  useListRender: vi.fn().mockReturnValue({
    update: vi.fn(),
  }),
}));

const indexedDBMock = {
  open: vi.fn().mockReturnValue({
    result: {
      createObjectStore: vi.fn(),
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          get: vi.fn().mockReturnValue({
            onsuccess: null,
            result: null,
          }),
          put: vi.fn().mockReturnValue({
            onsuccess: null,
          }),
          delete: vi.fn().mockReturnValue({
            onsuccess: null,
          }),
          getAll: vi.fn().mockReturnValue({
            onsuccess: null,
            result: [],
          }),
        }),
      }),
    },
    onsuccess: null,
    onerror: null,
  }),
};

Object.defineProperty(globalThis, 'indexedDB', {
  value: indexedDBMock,
  writable: true,
});

vi.mock('laser-pen', () => ({
  drainPoints: vi.fn((points) => points),
  drawLaserPen: vi.fn(),
  setColor: vi.fn(),
  setDelay: vi.fn(),
  setRoundCap: vi.fn(),
  setMaxWidth: vi.fn(),
  setMinWidth: vi.fn(),
  setOpacity: vi.fn(),
}));

vi.mock('roughjs', () => ({
  default: vi.fn().mockImplementation(() => ({
    curve: vi.fn().mockReturnValue(document.createElementNS('http://www.w3.org/2000/svg', 'g')),
    line: vi.fn().mockReturnValue(document.createElementNS('http://www.w3.org/2000/svg', 'g')),
    rectangle: vi.fn().mockReturnValue(document.createElementNS('http://www.w3.org/2000/svg', 'g')),
    circle: vi.fn().mockReturnValue(document.createElementNS('http://www.w3.org/2000/svg', 'g')),
  })),
}));

vi.mock('is-hotkey', () => ({
  isKeyHotkey: vi.fn().mockReturnValue(false),
}));

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    mermaidAPI: {
      getDiagramFromText: vi.fn().mockResolvedValue({
        type: 'flowchart-v2',
        parser: {
          yy: {
            getVertices: () => new Map(),
            getEdges: () => [],
            getSubgraphs: () => [],
          },
        },
      }),
    },
    render: vi.fn().mockResolvedValue({
      svg: '<svg></svg>',
    }),
  },
}));

vi.mock('dompurify', () => ({
  default: {
    addHook: vi.fn(),
    removeHook: vi.fn(),
    sanitize: vi.fn((text) => text),
  },
}));

const mockUpdateMyPresence = vi.fn();
const mockOthers = vi.fn(() => []);
const mockStatus = vi.fn(() => 'connected');
const mockRoom = { id: 'test-room' };
const mockStorage = { elements: [] };
const mockMutationFn = vi.fn();
const mockSelf = { connectionId: 'test-conn' };

vi.mock('@liveblocks/react', () => ({
  useMyPresence: () => [{}, mockUpdateMyPresence],
  useOthers: () => mockOthers(),
  useStatus: () => mockStatus(),
  useRoom: () => mockRoom,
  useStorage: (selector: (root: { elements: unknown[] }) => unknown) => selector(mockStorage),
  useMutation: () => mockMutationFn,
  useSelf: () => mockSelf,
}));

vi.mock('@liveblocks/react/suspense', () => ({
  useMyPresence: () => [{}, mockUpdateMyPresence],
  useOthers: () => mockOthers(),
  useStatus: () => mockStatus(),
  useRoom: () => mockRoom,
  useStorage: (selector: (root: { elements: unknown[] }) => unknown) => selector(mockStorage),
  useMutation: () => mockMutationFn,
  useSelf: () => mockSelf,
}));

const originalFetch = globalThis.fetch;
globalThis.fetch = vi.fn();

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});
