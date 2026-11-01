#!/usr/bin/env bash
set -u
ROOT="$(cd "$(dirname "$0")" && pwd)"
pass=0
warn=0
fail=0
check(){ local label="$1"; shift; if "$@" >/dev/null 2>&1; then printf '[PASS] %s\n' "$label"; pass=$((pass+1)); else printf '[FAIL] %s\n' "$label"; fail=$((fail+1)); fi; }
warncheck(){ local label="$1"; shift; if "$@" >/dev/null 2>&1; then printf '[PASS] %s\n' "$label"; pass=$((pass+1)); else printf '[WARN] %s\n' "$label"; warn=$((warn+1)); fi; }

check 'built MV3 manifest exists' test -f "$ROOT/extension/manifest.json"
check 'studio entry exists' test -f "$ROOT/extension/studio.html"
check 'segmentation model exists' test -s "$ROOT/extension/models/selfie_segmenter_landscape.tflite"
check 'hand landmark model exists' test -s "$ROOT/extension/models/hand_landmarker.task"
check 'WASM runtime exists' test -s "$ROOT/extension/wasm/vision_wasm_internal.wasm"
check 'OBS launcher is executable' test -x "$ROOT/run-obs-source.sh"
warncheck 'Chromium or Chrome is installed' bash -c 'command -v chromium || command -v google-chrome || command -v chrome'
warncheck 'OBS is installed' bash -c 'command -v obs || command -v obs-studio'

printf '\nResult: %d passed, %d warnings, %d failed\n' "$pass" "$warn" "$fail"
if [ "$fail" -gt 0 ]; then exit 1; fi
