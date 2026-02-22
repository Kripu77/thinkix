# Thinkix

An AI-powered infinite canvas whiteboard for visual thinking. Create mind maps, draw freehand, add shapes, and let AI help organize your thoughts.

## Features

- **Infinite Canvas** - Pan, zoom, and explore without limits
- **Mind Maps** - Create structured diagrams with the mind map tool
- **Freehand Drawing** - Sketch ideas with the pen tool
- **Shapes & Text** - Add rectangles, ellipses, diamonds, and text elements
- **Images** - Drag, drop, or paste images with an integrated viewer
- **AI Assistant** - Chat with AI to organize and structure your thinking (BYOK - Bring Your Own Key)

## Tech Stack

- **Framework:** Next.js 16 (React 19, Turbopack)
- **Canvas:** [Plait Board](https://github.com/worktile/plait) - Infinite whiteboard engine
- **AI:** Vercel AI SDK (OpenAI, Anthropic support)
- **UI:** shadcn/ui components with Tailwind CSS v4
- **Monorepo:** Bun workspaces with shared packages
- **Runtime:** Bun for package management and execution

## Project Structure

```
thinkix/
├── app/                    # Next.js app router & API routes
│   ├── api/
│   │   ├── chat/          # AI chat streaming endpoint
│   │   └── structure/     # Content-to-mindmap endpoint
│   └── ...
├── packages/              # Workspace packages
│   ├── ui/               # @thinkix/ui - Shared UI components
│   ├── ai/               # @thinkix/ai - AI SDK integration
│   └── plait-utils/      # @thinkix/plait-utils - Board helpers
├── features/             # Feature modules
│   ├── board/            # Canvas, state, plugins
│   └── toolbar/          # Toolbar UI
└── shared/               # Shared types & constants
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

## Usage

### Tools

| Tool | Shortcut | Description |
|------|----------|-------------|
| Select | V | Select and move elements |
| Pan | H | Pan around the canvas |
| Mind Map | - | Create mind map diagrams |
| Freehand | - | Draw with pen/pencil |
| Shapes | - | Add rectangles, ellipses, diamonds, etc. |
| Text | T | Add text elements |

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
import { Button, Tooltip } from '@thinkix/ui';
```

### `@thinkix/ai`
AI SDK integration with multi-provider support.

```ts
import { MODELS, createAIProvider, executeCommand } from '@thinkix/ai';
```

### `@thinkix/plait-utils`
Helper functions for Plait board operations.

```ts
import { getCanvasContext, findElementById } from '@thinkix/plait-utils';
```

## Keyboard Shortcuts

- `Cmd/Ctrl + Z` - Undo
- `Cmd/Ctrl + Shift + Z` - Redo
- `Delete/Backspace` - Delete selected elements
- `Escape` - Exit pen mode or close image viewer

## License

MIT
