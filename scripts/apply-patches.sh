#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PATCH_FILE="$PROJECT_ROOT/patches/@plait+draw+0.92.1.patch"
TARGET_DIR="$PROJECT_ROOT/node_modules/@plait/draw/fesm2022"
TARGET_FILE="$TARGET_DIR/plait-draw.mjs"

if [ ! -f "$PATCH_FILE" ]; then
    echo "⚠ Patch file not found: $PATCH_FILE"
    exit 0
fi

if [ ! -f "$TARGET_FILE" ]; then
    echo "⚠ Target file not found: $TARGET_FILE"
    exit 0
fi

if grep -q "fillStyle: element.fillStyle" "$TARGET_FILE" 2>/dev/null; then
    echo "✓ Patch already applied to @plait/draw"
else
    echo "Applying patch to @plait/draw..."
    cd "$TARGET_DIR"
    patch -p0 < "$PATCH_FILE" --forward 2>/dev/null || {
        echo "⚠ Patch may have failed or already been applied"
    }
    cd - > /dev/null
fi
