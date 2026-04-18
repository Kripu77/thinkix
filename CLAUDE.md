# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Thinkix is an AI-native infinite canvas whiteboard built with Next.js 16, React 19, and the Plait board library. The AI agent can read the current board, create new structures, and edit existing elements via a Unix-shell-style command set and a custom DSL. The project uses Bun workspaces for shared code and Liveblocks + Yjs for live collaboration.

## Development Commands

```bash
bun install        # Install workspace dependencies (runs postinstall patches)
bun dev            # Start dev server at http://localhost:3000
bun run build      # Production build (runs prebuild: patches + DSL parser)
bun start          # Run production build
bun run lint       # ESLint
bun run typecheck  # tsc --noEmit --skipLibCheck
bun run build:parser # Regenerate features/agent/tools/dsl/parser.js

# Unit / integration / component tests (Vitest)
bun run test       # Vitest in watch mode
bun run test:run   # Vitest once (CI mode)
bun run test:ui    # Vitest UI
bun run test:coverage # Coverage + coverage-summary.ts

# E2E (Playwright)
bun run test:e2e       # Full run (builds and starts app on :3100)
bun run test:e2e:ui    # Playwright UI
bun run test:e2e:debug # Debug mode
bun run test:all       # test:run + test:e2e
```

**IMPORTANT: Do NOT run `bun test`.** That invokes Bun's native test runner, which is not configured for this project. Always use `bun run test` / `bun run test:run`. See `tests/README.md`.

### Single-test invocations

```bash
bun run test:run -- tests/unit/serializer.test.ts        # one Vitest file
bun run test:run -- -t "grep command"                   # by test name
bun run test:e2e -- tests/e2e/agent-pane.spec.ts        # one Playwright spec
bun run test:e2e -- --grep "create sticky"
```

### Generated files and build hooks

- `postinstall` and `prebuild` run `scripts/apply-patches.sh`, which patches `node_modules/@plait/draw` for the actually-installed `@plait/draw` version using the `.patch` files in `patches/`. Do not commit edits to `node_modules`; update the patch file instead.
- `prebuild` and `pretest` both run `build:parser`, which regenerates `features/agent/tools/dsl/parser.js` from `thinkix.peggy`. **Never hand-edit `parser.js`.** If you change `thinkix.peggy`, run `bun run build:parser` and commit the regenerated parser.

## Monorepo Structure

Bun workspaces declared under `packages/*`. Path aliases live in `tsconfig.json` and are mirrored in `vitest.config.mts`.

```text
thinkix/
├── app/                   # Next.js app router (pages, API routes, styles)
│   ├── api/agent/         # LLM streaming endpoint + /config subroute
│   ├── api/collaboration/ # Liveblocks auth
│   └── page.tsx           # Main board experience
├── features/              # App-level feature modules
│   ├── board/             # Canvas, plugins, grid, board utils
│   ├── agent/             # Agent pane, tools, DSL, command shell
│   ├── toolbar/           # Toolbars and inline formatting controls
│   ├── dialogs/           # MermaidToBoard, MarkdownToMindmap dialogs
│   ├── collaboration/     # Liveblocks room wrappers + collab UI
│   └── storage/           # Auto-save hook, BoardSwitcher
├── packages/              # Workspace packages (@thinkix/*)
├── shared/constants/      # App-level constants (JSX allowed)
├── tests/                 # Vitest + Playwright tests
├── scripts/               # apply-patches.sh, coverage-summary.ts
├── patches/               # @plait/draw patches keyed by version
└── public/
```

### Workspace packages (`packages/*`)

| Package | Import | Notes |
|--------|-----|-----|
| `@thinkix/ui` | `@thinkix/ui` | shadcn-style primitives (`Button`, `Tooltip`, `Dialog`, …) + `cn()` |
| `@thinkix/ai` | `@thinkix/ai`, `@thinkix/ai/tool-schemas`, `@thinkix/ai/prompts`, `@thinkix/ai/tools` | AI SDK v5 provider resolution, prompts, Zod tool schemas |
| `@thinkix/plait-utils` | `@thinkix/plait-utils` | Board helpers: `getCanvasContext`, `findElementById`, `parseMarkdownToMindElement` |
| `@thinkix/storage` | `@thinkix/storage` | Dexie/IndexedDB `useBoardStore`, `Board`, `BoardMetadata`, `SaveStatus` |
| `@thinkix/shared` | `@thinkix/shared` | **Types only** (no JSX) |
| `@thinkix/file-utils` | `@thinkix/file-utils` | File I/O, `.thinkix` import/export, SVG/PNG/JPG export |
| `@thinkix/collaboration` | `@thinkix/collaboration` + subpaths | Yjs + Liveblocks adapter, sync bus, cursor manager, presence. Sub-exports include `/hooks`, `/components`, `/providers`, `/adapter`, `/types`, `/test-utils` |
| `@thinkix/mermaid-to-thinkix` | `@thinkix/mermaid-to-thinkix` | Converts Mermaid diagrams into Plait elements. Transpiled by Next (`next.config.ts`) |

### Shared code: two locations by design

| Location | Contents | Import |
|----------|----------|--------|
| `packages/shared/` | **Types only, no JSX** | `import type { … } from '@thinkix/shared'` |
| `shared/constants/` | **Constants, icons, JSX** | `import { BASIC_TOOLS } from '@/shared/constants'` |

Mixing them triggers React type duplication. When adding workspace packages with JSX, use `peerDependencies` for React and do not add `@types/react` to `devDependencies`.

## Architecture

### Board canvas (`features/board/`)

`BoardCanvas.tsx` wires Plait plugins in a fixed order:

```
withGrid → withDraw → withTextNormalization → withText → addTextRenderer →
addImageRenderer → withGroup → withMind → addEmojiRenderer → addMindNodeResize →
addPenMode → addImageInteractions → withScribble → withEraser → withStickyNote →
withHanddrawn → withToolSync → withPinchZoom
```

Notable custom plugins (`features/board/plugins/`):
- `add-text-renderer.tsx` — custom Slate-based renderer (replaces `@plait-board/react-text`). Fixes React 19 + `root.render()` persistence issues and removes the default "文本" placeholder. Text elements use `{ children: [{ text: '…' }] }`, `autoSize: true`.
- `with-tool-sync.ts` — monkey-patches `BoardTransforms.updatePointerType` to dispatch `CUSTOM_EVENTS.TOOL_CHANGE`. Plait has no native hook for internal pointer changes (e.g. after creating an element), so this bridges Plait state into React.
- `scribble/`, `handdrawn-mode/`, `with-sticky-note.ts`, `with-eraser.ts` — freehand drawing, hand-drawn aesthetic, sticky notes, eraser.

The grid system lives under `features/board/grid/` (separate plugin, constants, renderers, `GridToolbar`).

`BoardProvider` (`features/board/hooks/use-board-state.tsx`) exposes `board`, `state.activeTool`, `setActiveTool()`, `insertImage()`, pencil-mode state, and current-board id.

### AI agent (`features/agent/`)

Flow: `AgentPane` (Cmd/Ctrl+J) → `useAgentChat` → POST `/api/agent` (AI SDK v5 `streamText`) → streamed tool calls executed client-side in `tools/run-tool.ts`.

Two parallel tool layers exist; they share the same serializer:
1. **Shell commands** (`tools/commands/index.ts`) — a Unix-shell-style surface with `ls, cd, pwd, cat, touch, mkdir, rm, rmdir, cp, patch, write, select, grep`. Invoked through `chain-parser.ts` (supports `&&` / `;`). Board-scoped vs global (`ls /` lists boards).
2. **DSL** (`tools/dsl/`) — Peggy grammar in `thinkix.peggy`, generated `parser.js`, typed AST (`types.ts`), and AST-to-PlaitElement `compiler.ts`. Used by `write mermaid`/`write mindmap` and higher-level creation commands.

Other agent internals:
- `serializer.ts` — PlaitElement → text (`summary` / `full`) used for `ls`, `cat`, `grep` output.
- `connection-graph.ts` — resolves connection-heavy layouts.
- `diagram-layout.ts` — `relayoutHeaderDrivenDiagram` after Mermaid parsing.
- `presentation-layer.ts` — overflow output storage (`/tmp/cmd-output/<file>`).
- `result-types.ts` — structured `CommandResultData` variants rendered by `AgentToolRenderer`.

Server prompt + provider resolution:
- `packages/ai/prompts/system.ts` — system prompt builder.
- `packages/ai/src/core.ts` — `resolveAIProvider`, `resolveAIModel`, `resolveAIKey`, `resolveAIBaseURL`, `normalizeAIBaseURL` (handles z.ai `/v1/` quirk), `getClientAIConfig`. Default provider is OpenAI (`gpt-4o`); Anthropic default is `claude-opus-4-6`.

### Collaboration

`@thinkix/collaboration` wraps Liveblocks + Yjs. `SyncBus` (`sync-bus.tsx`) broadcasts local element changes and subscribes to remote changes. `BoardCanvas` consumes it via `useOptionalSyncBus()` and routes remote updates through `syncElementsForBoardTheme` + `listRender.update`. `cursor-manager.ts` + `user-identity.ts` drive presence cursors. Auth is served from `app/api/collaboration/auth`. Requires `LIVEBLOCKS_SECRET_KEY` and `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY`; otherwise collab is gracefully absent.

### Dialogs (`features/dialogs/`)

- `MermaidToBoardDialog` — paste Mermaid, convert via `@thinkix/mermaid-to-thinkix`, insert onto the board.
- `MarkdownToMindmapDialog` — markdown outline → mind map via `parseMarkdownToMindElement`.

### API routes

- `app/api/agent/route.ts` — `POST` streams AI responses and tool calls.
- `app/api/agent/config/route.ts` — safe client config (`getClientAIConfig`); the client never receives raw keys.
- `app/api/collaboration/auth/` — Liveblocks token endpoint.

## Environment variables

The agent accepts per-user keys entered in the UI *and* server-side env defaults. Resolution order: UI settings → provider-specific env (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) → generic env (`AI_API_KEY`, `AI_PROVIDER`, `AI_MODEL`, `AI_BASE_URL`) → provider defaults in `packages/ai/src/core.ts`.

```bash
# AI (any combination)
AI_PROVIDER=openai|anthropic
AI_MODEL=gpt-4o
AI_API_KEY=...
AI_BASE_URL=...
OPENAI_API_KEY=...
OPENAI_BASE_URL=...
ANTHROPIC_API_KEY=...
ANTHROPIC_BASE_URL=...

# Collaboration
LIVEBLOCKS_SECRET_KEY=...
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=...

# Web search tool
EXA_API_KEY=...

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=...
```

## Configuration gotchas

- **`next.config.ts`** transpiles `@plait-board/react-board`, `@plait-board/react-text`, and `@thinkix/mermaid-to-thinkix`. Add new packages that ship untranspiled TS/JSX here.
- **Do not add webpack `resolve.alias` for `@plait/*` packages** — it breaks Plait's internal dependency graph. Use the TS path aliases only.
- **Path aliases** (`tsconfig.json`): `@/*`, `@/features/*`, `@/shared/*`, and every `@thinkix/*` package plus their sub-exports. `vitest.config.mts` mirrors these.
- **Patches** live in `patches/@plait+draw+<version>.patch`. When upgrading `@plait/draw`, regenerate the patch for the new version (otherwise `apply-patches.sh` logs a warning and exits 0).

## Testing

- **Vitest** (`tests/unit/`, `tests/integration/`, `tests/components/`) with `happy-dom`, coverage via `@vitest/coverage-v8`. Global setup in `tests/__mocks__/setup.mts` mocks Canvas, FileSystem, IndexedDB, `matchMedia`, `ResizeObserver`, and Plait APIs. Shared helpers in `tests/__utils__/test-utils.ts` (`createMockBoard`, `createMockThinkixFile`).
- **Playwright** (`tests/e2e/`) runs a real production build on `:3100`. Retries once on CI, 6 workers on CI. `tests/e2e/helpers/` holds shared page-object helpers.
- Coverage excludes: `node_modules`, `scratch`, `.next`, `tests`, `app`, config files. Threshold is 70% across lines/functions/branches/statements.

## CI

`.github/workflows/ci.yml` runs `lint`, `typecheck`, and `test:coverage` in parallel; all must pass before `build`. Reusable setup at `.github/actions/setup-bun` (caches Bun + workspace `node_modules`). Coverage is uploaded and commented on PRs by `.github/actions/coverage-report` + `.github/scripts/coverage-summary.sh`.

## Code conventions

- Self-documenting code; no ceremonial comments. Only comment non-obvious *why*.
- Feature modules expose a small `index.ts` barrel. Follow existing patterns instead of introducing new ones.
- Types flow from `@thinkix/shared` (no JSX) and `shared/constants` (JSX allowed).
- Prefer early returns (`if (!board) return null`).
- Keep PRs focused; if you change the DSL grammar, regenerate the parser before opening the PR (see `CONTRIBUTING.md`).
