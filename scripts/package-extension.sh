#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <extension-dir>"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EXT_DIR_INPUT="$1"
EXT_DIR="$(cd "$ROOT_DIR" && cd "$EXT_DIR_INPUT" && pwd)"
EXT_NAME="$(basename "$EXT_DIR")"
DIST_DIR="$ROOT_DIR/dist"
TMP_DIR="$DIST_DIR/.tmp-$EXT_NAME"

VERSION=$(python3 - <<'PY' "$EXT_DIR/manifest.json"
import json, sys
with open(sys.argv[1], 'r', encoding='utf-8') as f:
    print(json.load(f)['version'])
PY
)

OUTPUT_BASE="$DIST_DIR/${EXT_NAME}-v${VERSION}"
ZIP_PATH="${OUTPUT_BASE}.zip"
XPI_PATH="${OUTPUT_BASE}.xpi"

rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR" "$DIST_DIR"
rsync -a --delete \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude '*.zip' \
  --exclude '*.xpi' \
  "$EXT_DIR/" "$TMP_DIR/"

(
  cd "$TMP_DIR"
  zip -qr "$ZIP_PATH" .
)
cp "$ZIP_PATH" "$XPI_PATH"
rm -rf "$TMP_DIR"

echo "Created:"
echo "  $ZIP_PATH"
echo "  $XPI_PATH"
