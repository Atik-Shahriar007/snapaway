# SnapAway Project Context

## Project goal

SnapAway is a local camera effect that makes the presenter gradually disintegrate into pixels after a finger snap during a Google Meet call. The person should disappear while the room/background remains visible.

## Current architecture

The current runnable path is:

```text
Physical webcam → SnapAway local processor → Chrome/Chromium source window → OBS Window Capture → OBS Virtual Camera → Google Meet
```

The Chrome MV3 extension is the local controller and studio. The OBS Virtual Camera is the temporary camera-output provider. A custom native virtual-camera driver is not implemented.

## Repository layout

- `src/`: Vite source for the MV3 popup and local studio.
- `public/models/`: MediaPipe selfie segmentation and hand landmark model assets.
- `public/wasm/`: bundled MediaPipe WASM runtime.
- `extension/`: current built unpacked extension; load this folder in `chrome://extensions`.
- `prototype/`: earlier lightweight webcam fallback prototype.
- `desktop/`: Electron shell and native-camera adapter boundary scaffold; not a finished native driver.
- `OBS-SETUP.md`: OBS Virtual Camera proof-of-concept instructions.
- `MEET-TEST.md`: two-participant Google Meet validation procedure.
- `WINDOWS-SETUP.md`: Windows Chrome + OBS setup and troubleshooting.
- `run-obs-source.sh`: Linux/macOS-style local source launcher.
- `run-obs-source.bat`: Windows local source launcher.
- `diagnose-pipeline.sh`: Linux-style diagnostics.
- `diagnose-windows.ps1`: Windows diagnostics.

## Implemented features

- Manifest V3 extension popup.
- Local webcam capture.
- MediaPipe Image Segmenter person mask.
- MediaPipe Hand Landmarker.
- Pinch-and-release snap heuristic.
- Manual trigger and restore.
- Segmented subject particle sampling.
- Progressive subject fade, directional particle drift, dust/twinkle variation.
- Local processed stream with `canvas.captureStream(30)`.
- Full-screen OBS source mode at `studio.html?obs=1`.
- WASM CSP fix in `manifest.json`: `wasm-unsafe-eval` is required by MediaPipe.

## Build commands

From the repository root:

```bash
npm install
npm run build
cp src/manifest.json extension-build/manifest.json
cp src/meet-status.js extension-build/meet-status.js
rm -rf extension
mv extension-build extension
```

The build creates the unpacked extension in `extension/`.

## Windows run path

1. Extract the Windows ZIP or clone the repository.
2. Load `extension/` through `chrome://extensions` with Developer mode enabled.
3. Install OBS Studio.
4. Run `run-obs-source.bat`.
5. Allow camera access and use the SnapAway source window.
6. Add that window to OBS with Window Capture.
7. Start OBS Virtual Camera.
8. Select OBS Virtual Camera in Google Meet.
9. Test with a second participant using `MEET-TEST.md`.

## Known limitations

Remote Google Meet visibility has not been validated in this sandbox because OBS and a second Meet participant are unavailable. Do not describe remote delivery as proven until the two-participant test passes.

The snap detector is a landmark-based pinch-and-release heuristic, not a verified acoustic finger-snap classifier. Manual triggering is intentionally retained.

The native desktop shell under `desktop/` is a scaffold. A custom Windows Media Foundation/DirectShow virtual-camera driver is not included. The current practical Windows path uses OBS Virtual Camera.

## Important implementation notes

The built extension must be reloaded after changing the manifest or source build. If MediaPipe reports a WebAssembly CSP error, replace the old `extension/` folder and click Reload at `chrome://extensions`; the manifest must contain `script-src 'self' 'wasm-unsafe-eval'; object-src 'self'`.

The processing is local. No camera frames are uploaded or stored by the project.

## Suggested next work

- Run the Windows two-participant Meet test and record the result.
- Tune segmentation edge quality under real lighting and backgrounds.
- Improve snap detection with temporal confidence and optional audio confirmation.
- Decide whether a native Windows virtual camera is worth implementing after OBS validation.
