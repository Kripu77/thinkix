# Thinkix

Thinkix is an AI-native infinite canvas for visual thinking. You can sketch, map ideas, build diagrams, and then ask an agent to inspect the board, create new structures, or edit what is already on the canvas.

## Why Thinkix

Most whiteboards stop at drawing, and most AI tools stop at chat. Thinkix combines both:

- AI can read the active board state
- AI can create diagrams directly on the canvas
- AI can modify existing board content with board-aware tools
- Humans and AI work in the same visual space instead of separate tabs

## Current Capabilities

- Infinite canvas with pan, zoom, selection, and history
- Mind maps, freehand drawing, shapes, arrows, text, sticky notes, and images
- Multiple boards with local persistence
- Live collaboration with Liveblocks
- AI agent pane with server defaults or per-user API keys
- Agent tools for board inspection, search, creation, patching, selection, and layout-aware inserts
- Mermaid and markdown-to-mindmap flows that insert directly onto the board
- Import/export for `.thinkix`, SVG, PNG, and JPG

## Signature Workflows

Try one of these first:

- Turn rough notes into a mind map
- Generate a system design diagram from a prompt
- Ask the agent to inspect an existing board and restructure it
- Research a topic and map the findings onto the canvas

The agent pane opens with `Cmd/Ctrl + J`.

## Quick Start

### Prerequisites

- [Bun](https://bun.sh)

### Install

```bash
bun install
```

### Configure Environment

Copy the template if you want server-backed AI, collaboration, analytics, or web search:

```bash
cp .env.example .env.local
```

### Run the App

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

### AI

Thinkix supports two AI modes:

- local user settings entered in the agent pane
- server defaults configured through environment variables

Supported variables:

| Variable | Purpose |
| --- | --- |
| `AI_PROVIDER` | Optional default provider: `openai` or `anthropic` |
| `AI_MODEL` | Optional default model |
| `AI_API_KEY` | Generic fallback API key |
| `AI_BASE_URL` | Generic server-side fallback base URL |
| `OPENAI_API_KEY` | Preferred OpenAI server key |
| `OPENAI_BASE_URL` | Optional OpenAI server base URL |
| `ANTHROPIC_API_KEY` | Preferred Anthropic server key |
| `ANTHROPIC_BASE_URL` | Optional Anthropic server base URL |

If only one provider key is configured, Thinkix will use that provider automatically when the user has not saved a local key.

### Collaboration

| Variable | Purpose |
| --- | --- |
| `LIVEBLOCKS_SECRET_KEY` | Required for collaboration auth |
| `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` | Client-side collaboration key |

### Search

| Variable | Purpose |
| --- | --- |
| `EXA_API_KEY` | Enables server-side web search for the agent |

### Analytics

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional PostHog host |

## Example Prompts

- `Create a system design diagram for a ride-sharing app and highlight the real-time components.`
- `Inspect this board and turn the current notes into a cleaner decision tree.`
- `Research the top technology trends for 2026 and build a visual map with relationships.`
- `Create a mind map from these rough product launch notes.`

## Scripts

```bash
bun dev
bun run build
bun start
bun run lint
bun run typecheck
bun run test:run
bun run test:e2e
bun run build:parser
```

## Testing

Thinkix uses:

- Vitest for unit, component, and integration coverage
- Playwright for end-to-end coverage

Run the core validation set:

```bash
bun run lint
bun run typecheck
bun run test:run
bun run test:e2e
```

## Architecture Overview

### App Surface

- `app/page.tsx` hosts the main board experience
- `app/api/agent` streams AI responses and tool calls
- `app/api/agent/config` exposes safe client config such as default provider availability
- `app/api/collaboration/auth` handles collaboration auth

### Feature Modules

- `features/board/` contains the Plait canvas, plugins, board utilities, and insertion logic
- `features/agent/` contains the agent pane, tool rendering, tool execution, serializer, and DSL
- `features/toolbar/` contains app, zoom, selection, and board toolbar controls
- `features/dialogs/` contains import/transform flows such as Mermaid and markdown-to-mindmap

### Workspace Packages

- `@thinkix/ai` for provider resolution, prompts, and tool schemas
- `@thinkix/storage` for IndexedDB-backed board persistence
- `@thinkix/file-utils` for import/export flows
- `@thinkix/plait-utils` for board helpers
- `@thinkix/ui` for shared UI primitives
- `@thinkix/collaboration` for collaboration support

## Project Structure

```text
thinkix/
├── app/
│   ├── api/
│   │   ├── agent/
│   │   └── collaboration/
│   ├── globals.css
│   └── page.tsx
├── features/
│   ├── agent/
│   ├── board/
│   ├── dialogs/
│   ├── storage/
│   └── toolbar/
├── packages/
│   ├── ai/
│   ├── collaboration/
│   ├── file-utils/
│   ├── mermaid-to-thinkix/
│   ├── plait-utils/
│   ├── shared/
│   ├── storage/
│   └── ui/
└── tests/
```

## Known Limitations

- The agent is optimized around supported board tools and diagram workflows, not arbitrary code execution.
- Collaboration requires Liveblocks configuration.
- Web search requires `EXA_API_KEY`.
- Thinkix is still in active product iteration, so some UI flows may continue to evolve quickly.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
