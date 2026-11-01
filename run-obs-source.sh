#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
PORT="${SNAPAWAY_PORT:-8765}"
URL="http://127.0.0.1:${PORT}/studio.html?obs=1"

python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT/extension" >/tmp/snapaway-http.log 2>&1 &
SERVER_PID=$!
cleanup() { kill "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
sleep 1

BROWSER="${BROWSER:-chromium}"
if ! command -v "$BROWSER" >/dev/null 2>&1; then
  echo "Could not find Chromium/Chrome. Start a browser manually at: $URL" >&2
  echo "Local server is running on port $PORT. Press Ctrl+C to stop." >&2
  wait "$SERVER_PID"
fi

"$BROWSER" --app="$URL" "$@"
