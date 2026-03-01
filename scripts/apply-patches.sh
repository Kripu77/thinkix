#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Get actual installed version of @plait/draw
DRAW_VERSION=$(node -p "require('$PROJECT_ROOT/node_modules/@plait/draw/package.json').version" 2>/dev/null || echo "unknown")
PATCH_FILE="$PROJECT_ROOT/patches/@plait+draw+$DRAW_VERSION.patch"
TARGET_DIR="$PROJECT_ROOT/node_modules/@plait/draw/fesm2022"
TARGET_FILE="$TARGET_DIR/plait-draw.mjs"

if [ "$DRAW_VERSION" = "unknown" ]; then
    echo "⚠ Could not determine @plait/draw version"
    exit 0
fi

if [ ! -f "$PATCH_FILE" ]; then
    echo "⚠ Patch file not found: $PATCH_FILE (looking for version $DRAW_VERSION)"
    exit 0
fi

if [ ! -f "$TARGET_FILE" ]; then
    echo "⚠ Target file not found: $TARGET_FILE"
    exit 0
fi

if grep -q "fillStyle: element.fillStyle" "$TARGET_FILE" 2>/dev/null; then
    echo "✓ Patch already applied to @plait/draw v$DRAW_VERSION"
else
    echo "Applying patch to @plait/draw v$DRAW_VERSION..."
    cd "$TARGET_DIR"
    patch -p0 < "$PATCH_FILE" --forward 2>/dev/null || {
        echo "⚠ Patch may have failed or already been applied"
    }
    cd - > /dev/null
fi
