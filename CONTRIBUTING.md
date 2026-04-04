# Contributing to Thinkix

Thanks for contributing. Thinkix is an AI-native whiteboard, and we want the repo to stay approachable for both product-focused contributors and deep technical contributors.

## Ground Rules

- Keep changes focused. A tight PR is easier to review and ship.
- Prefer improving an existing pattern over introducing a second pattern.
- Match the existing product language and visual style unless the change is intentionally redesigning that area.
- If you change the agent DSL grammar, regenerate the parser before opening a PR.

## Local Setup

1. Install [Bun](https://bun.sh).
2. Install dependencies:

   ```bash
   bun install
   ```

3. Copy the environment template if you need server-backed AI, collaboration, analytics, or web search:

   ```bash
   cp .env.example .env.local
   ```

4. Start the app:

   ```bash
   bun dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Useful Commands

```bash
bun dev
bun run build
bun run lint
bun run typecheck
bun run test:run
bun run test:e2e
bun run build:parser
```

## Working on the Agent

The AI pane lives under `features/agent/` and uses:

- `app/api/agent` for streaming responses
- `features/agent/tools/` for board inspection and mutation commands
- `features/agent/tools/dsl/thinkix.peggy` for the DSL grammar

If you change the grammar, run:

```bash
bun run build:parser
```

Do not manually edit the generated parser output unless you are debugging generation itself.

## Testing Expectations

Before opening a PR, run:

```bash
bun run lint
bun run typecheck
bun run test:run
bun run test:e2e
```

For doc-only changes, you can skip the heavier suite, but mention that in the PR description.

## PR Guidelines

- Explain the user-facing outcome first.
- Call out any risks, follow-up work, or known gaps.
- Include screenshots or short recordings for visible UI changes when possible.
- Add or update tests when behavior changes.

## Reporting Bugs and Discussing Ideas

- Use GitHub Issues for reproducible bugs and focused feature requests.
- Use Discussions, if enabled for the repository, for broader product ideas and workflow questions.
- For security issues, follow [SECURITY.md](SECURITY.md) and avoid public disclosure first.
