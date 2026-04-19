#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

if ! command -v node >/dev/null 2>&1; then
    echo "✗ apply-patches: 'node' is required but not on PATH" >&2
    exit 1
fi

if ! command -v patch >/dev/null 2>&1; then
    echo "✗ apply-patches: 'patch' binary not available — install GNU patch" >&2
    echo "  alpine: apk add patch" >&2
    echo "  debian/ubuntu: apt-get install patch" >&2
    exit 1
fi

DRAW_PKG_JSON=$(node -p "require.resolve('@plait/draw/package.json')" 2>/dev/null) || {
    echo "✗ apply-patches: cannot resolve @plait/draw — is it installed?" >&2
    echo "  cwd: $PROJECT_ROOT" >&2
    exit 1
}

DRAW_VERSION=$(node -p "require('$DRAW_PKG_JSON').version")
PATCH_FILE="$PROJECT_ROOT/patches/@plait+draw+$DRAW_VERSION.patch"
TARGET_DIR="$(dirname "$DRAW_PKG_JSON")/fesm2022"
TARGET_FILE="$TARGET_DIR/plait-draw.mjs"
MARKER="fillStyle: element.fillStyle"

if [ ! -f "$PATCH_FILE" ]; then
    echo "✗ apply-patches: patch file not found for @plait/draw v$DRAW_VERSION" >&2
    echo "  expected: $PATCH_FILE" >&2
    echo "  available patches:" >&2
    ls "$PROJECT_ROOT/patches/" >&2 || true
    exit 1
fi

if [ ! -f "$TARGET_FILE" ]; then
    echo "✗ apply-patches: target file not found: $TARGET_FILE" >&2
    exit 1
fi

cd "$TARGET_DIR"

if patch -p0 --reverse --dry-run --silent < "$PATCH_FILE" >/dev/null 2>&1; then
    echo "✓ apply-patches: @plait/draw v$DRAW_VERSION already patched"
    exit 0
fi

echo "  applying patch to @plait/draw v$DRAW_VERSION..."
if ! patch -p0 --forward < "$PATCH_FILE"; then
    echo "✗ apply-patches: patch failed to apply cleanly" >&2
    exit 1
fi

if ! grep -q "$MARKER" "$TARGET_FILE"; then
    echo "✗ apply-patches: post-apply verification failed — marker not found" >&2
    echo "  $TARGET_FILE may be partially patched or unmodified" >&2
    exit 1
fi

echo "✓ apply-patches: @plait/draw v$DRAW_VERSION patched"
