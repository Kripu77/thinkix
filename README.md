# Thinkix

An AI-powered infinite canvas whiteboard for visual thinking. Create mind maps, draw freehand, add shapes, and let AI help organize your thoughts.

## Features

- **Infinite Canvas** - Pan, zoom, and explore without limits
- **Mind Maps** - Create structured diagrams with the mind map tool
- **Freehand Drawing** - Sketch ideas with the pen tool
- **Shapes & Text** - Add rectangles, ellipses, diamonds, and text elements
- **Images** - Drag, drop, or paste images with an integrated viewer
- **Grid Backgrounds** - Choose from dots, square, blueprint, isometric, ruled, or blank paper styles
- **AI Assistant** - Chat with AI to organize and structure your thinking (BYOK - Bring Your Own Key)
- **Board Management** - Open, save, and export boards as `.thinkix` files
- **Auto-Save** - Automatic saving to IndexedDB with browser-level persistence

## Tech Stack

- **Framework:** Next.js 16 (React 19, Turbopack)
- **Canvas:** [Plait Board](https://github.com/worktile/plait) - Infinite whiteboard engine
- **AI:** Vercel AI SDK (OpenAI, Anthropic support)
- **UI:** shadcn/ui components with Tailwind CSS v4
- **Monorepo:** Bun workspaces with shared packages
- **Runtime:** Bun for package management and execution
- **Testing:** Vitest with happy-dom

## Project Structure

```
thinkix/
├── app/                      # Next.js app router & API routes
│   ├── api/
│   │   ├── chat/            # AI chat streaming endpoint
│   │   └── structure/       # Content-to-mindmap endpoint
│   ├── styles/              # Global styles
│   └── globals.css          # CSS variables & animations
│
├── packages/                # Workspace packages
│   ├── ui/                  # @thinkix/ui - Shared UI components
│   ├── ai/                  # @thinkix/ai - AI SDK integration
│   ├── plait-utils/         # @thinkix/plait-utils - Board helpers
│   ├── storage/             # @thinkix/storage - IndexedDB storage
│   ├── shared/              # @thinkix/shared - Shared types
│   └── file-utils/          # @thinkix/file-utils - File operations
│
├── features/                # Feature modules
│   ├── board/               # Canvas, state, plugins
│   │   ├── components/      # BoardCanvas
│   │   ├── hooks/           # Board state management
│   │   ├── plugins/         # Custom Plait plugins
│   │   └── utils/           # Laser pointer, etc.
│   ├── toolbar/             # Toolbar UI components
│   │   └── components/
│   │       ├── BoardToolbar.tsx
│   │       ├── AppMenu.tsx
│   │       └── inline/      # Selection toolbar
│   └── storage/             # Board persistence
│       ├── components/      # BoardSwitcher
│       └── hooks/           # Auto-save hook
│
├── shared/                  # App-level shared code (JSX allowed)
│   └── constants/           # Tool configs, icons
│
└── tests/                   # Test suite
    ├── __mocks__/           # Global mocks
    ├── __utils__/           # Test utilities
    ├── components/          # Component tests
    ├── integration/         # Integration tests
    └── unit/                # Unit tests
```

## Getting Started

### Prerequisites

Install [Bun](https://bun.sh):

```bash
curl -fsSL https://bun.sh/install | bash
```

### Installation

```bash
bun install
```

### Development

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
bun run build
bun start
```

## Testing

This project uses **Vitest** (not Bun's native test runner).

```bash
bun run test          # Run tests in watch mode
bun run test:run      # Run tests once (CI)
bun run test:coverage # Run with coverage
```

**Note:** Do NOT use `bun test` - use `bun run test` commands.

## Usage

### Tools

| Tool | Shortcut | Description |
|------|----------|-------------|
| Select | V | Select and move elements |
| Hand | H | Pan around the canvas |
| Mind Map | - | Create mind map diagrams |
| Freehand | - | Draw with pen/pencil |
| Shapes | - | Add rectangles, ellipses, diamonds, etc. |
| Text | T | Add text elements |

### File Operations

- **Open File** - Load `.thinkix` board files from your computer
- **Save File** - Export current board as `.thinkix` file
- **Export Image** - Export as SVG, PNG (transparent/white BG), or JPG
- **Clear Board** - Remove all elements from the current board

### AI Features

Thinkix supports AI-powered assistance through a Bring-Your-Own-Key (BYOK) model:

1. **Chat** - Stream responses from OpenAI or Anthropic (Claude)
2. **Structure** - Convert unstructured content into mind map JSON

To use AI features, provide your API key when prompted, or set environment variables:

```bash
OPENAI_API_KEY=sk-...    # For GPT-4o
ANTHROPIC_API_KEY=sk-... # For Claude
```

## Workspace Packages

### `@thinkix/ui`
Shared React components built on shadcn/ui patterns.

```tsx
import { Button, Tooltip, Dialog, LoadingLogo } from '@thinkix/ui';
```

### `@thinkix/ai`
AI SDK integration with multi-provider support.

```ts
import { MODELS, createAIProvider, executeCommand } from '@thinkix/ai';
```

### `@thinkix/plait-utils`
Helper functions for Plait board operations.

```ts
import { getCanvasContext, findElementById, getSelectedElements } from '@thinkix/plait-utils';
```

### `@thinkix/storage`
IndexedDB-based board storage with Dexie.

```ts
import { useBoardStore, useAutoSave } from '@thinkix/storage';
```

### `@thinkix/file-utils`
File operations for board import/export.

```ts
import { 
  saveBoardToFile, 
  loadBoardFromFile, 
  exportAsPng, 
  exportAsSvg 
} from '@thinkix/file-utils';
```

### `@thinkix/shared`
Shared TypeScript types.

```ts
import type { DrawingTool, BoardState } from '@thinkix/shared';
```

## Custom Plugins

Thinkix extends Plait with custom plugins:

| Plugin | Description |
|--------|-------------|
| `withGrid` | Grid background patterns (dots, lines, blueprint, isometric, ruled) |
| `addTextRenderer` | Custom Slate-based text editor |
| `addImageRenderer` | React-based image rendering |
| `addEmojiRenderer` | Emoji rendering for mind maps |
| `addMindNodeResize` | Resize handles for mind nodes |
| `addPenMode` | Stylus/pencil detection |
| `addImageInteractions` | Drag-drop, paste, view images |
| `withScribble` | Freehand drawing with smoothing |
| `withEraser` | Eraser tool |
| `withStickyNote` | Sticky note support with drag-preview |
| `withHanddrawn` | Hand-drawn style mode |

## Keyboard Shortcuts

- `Cmd/Ctrl + Z` - Undo
- `Cmd/Ctrl + Shift + Z` - Redo
- `Delete/Backspace` - Delete selected elements
- `Escape` - Exit pen mode or close dialogs

## Development Scripts

```bash
bun dev             # Start development server
bun run build       # Build for production
bun run lint        # Run ESLint
bun run typecheck   # Run TypeScript check
bun run test        # Run Vitest in watch mode
bun run test:run    # Run tests once
bun run test:coverage # Run tests with coverage report
```

## CI/CD

Tests run automatically on:
- Every push to `main`
- Every pull request to `main`

The CI workflow runs:
1. **Lint** - ESLint code quality checks
2. **Type Check** - TypeScript validation
3. **Test with Coverage** - Vitest with v8 coverage
4. **Build** - Next.js production build

### Coverage Reports

For pull requests:
- Coverage summary is posted as a PR comment
- Full HTML coverage report is uploaded as an artifact
- Download from the workflow run → Artifacts section

Coverage reports are retained for 14 days.

## License

MIT
