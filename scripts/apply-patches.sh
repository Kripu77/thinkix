#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)

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

# Check if patch is already applied by looking for removed patterns
# The patch removes "fillStyle: 'solid'" - if we find it, patch is NOT applied
if grep -q "fillStyle: 'solid'" "$TARGET_FILE" 2>/dev/null; then
    echo "Applying patch to @plait/draw v$DRAW_VERSION..."
    cd "$TARGET_DIR"
    # Use --batch to avoid prompts, --backup to save original
    if patch -p0 < "$PATCH_FILE" --batch --backup 2>&1; then
        echo "✓ Patch applied successfully to @plait/draw v$DRAW_VERSION"
    else
        echo "⚠ Patch application had issues (may be partial or already applied)"
    fi
    cd - > /dev/null
else
    echo "✓ Patch already applied to @plait/draw v$DRAW_VERSION"
fi
