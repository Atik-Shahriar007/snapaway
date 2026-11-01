# SnapAway

SnapAway is an MV3 Chrome extension prototype for a local, cinematic pixel-disintegration camera effect.

For future development sessions, read [context.md](context.md) first. It records the current architecture, build commands, known limitations, and recommended next work.

## Current build

The built extension is in `/home/ubuntu/snapaway/extension` and includes:

- A polished MV3 popup controller.
- A local camera studio opened from the popup.
- Bundled MediaPipe Image Segmenter and Hand Landmarker WASM/runtime assets.
- Local person/background segmentation using the landscape selfie-segmentation model.
- Hand-landmark pinch-and-release snap heuristic.
- Manual trigger and restore controls.
- Particle sampling from the segmented subject with snap-origin timing, directional drift, and twinkle variation.
- Reusable low-resolution mask buffers instead of allocating a new canvas on every frame.
- Stable `canvas.captureStream(30)` processed-video output with a live preview and track-health indicator.
- Local-only processing; camera frames are not uploaded or stored.

The old `/home/ubuntu/snapaway/prototype` folder remains as the lightweight pre-MediaPipe fallback demo.

## Load the extension

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select `/home/ubuntu/snapaway/extension`.
5. Click the SnapAway icon and choose **Open camera studio**.
6. Grant camera permission, then use **Trigger vanish** or pinch-and-release with one hand.

## Rebuild

From the project directory:

```bash
npm install
npm run build
cp src/manifest.json extension-build/manifest.json
cp src/meet-status.js extension-build/meet-status.js
rm -rf extension
mv extension-build extension
```

## Phase 2 output

After camera start, the studio exposes the processed stream at `globalThis.snapAwayOutput`. It provides `getStream()`, `getTrack()`, and `stop()` for the next OBS output adapter. The output stream is still local to the extension page and is not connected to OBS or Google Meet yet.

## Phase 3 OBS output

The OBS proof-of-concept uses a Chrome app-style window as the source, because camera permissions are more predictable there than inside an OBS Browser Source. Run `./run-obs-source.sh`, add the resulting SnapAway window to OBS with **Window Capture**, then choose **Start Virtual Camera** in OBS. Full setup and the required Google Meet camera selection steps are in [OBS-SETUP.md](OBS-SETUP.md).

## Phase 4 Google Meet validation

The end-to-end procedure is in [MEET-TEST.md](MEET-TEST.md). It requires OBS, a working desktop camera, two Google accounts, and a second participant or device. Run `./diagnose-pipeline.sh` first. The sandbox confirms the SnapAway assets and Chromium path, but it does not contain OBS or a second Meet participant, so remote visibility remains unvalidated here.

## Phase 5 desktop package

The standalone desktop shell and platform boundary are scaffolded under [desktop](desktop). It loads the existing processor in an Electron window and exposes a native-camera adapter interface. The actual OS virtual-camera driver is not complete: Linux needs a v4l2loopback frame writer, macOS needs a Core Media I/O camera extension, and Windows needs a Media Foundation or DirectShow implementation. See [desktop/NATIVE-DRIVER-PLAN.md](desktop/NATIVE-DRIVER-PLAN.md) before selecting a target platform.

For Windows Chrome, the practical runnable package is [snapaway-extension-windows.zip](snapaway-extension-windows.zip). Extract it, load its `extension` folder through `chrome://extensions`, install OBS Studio, and run [run-obs-source.bat](run-obs-source.bat). The full Windows procedure is in [WINDOWS-SETUP.md](WINDOWS-SETUP.md), and [diagnose-windows.ps1](diagnose-windows.ps1) checks the package before testing.

## Repository workflow

The repository is intended to be developed from the project root. After changing source files, run the build commands in [context.md](context.md), reload the unpacked `extension` folder in Chrome, and repeat the relevant OBS/Meet test. The repository intentionally documents remote-participant validation as pending until it is confirmed by a second participant.

## Important limitation

The extension does not claim that remote Google Meet participants can see the effect. The current build validates the local processing pipeline only. Google Meet does not expose a supported extension API for handing an unrelated processed track to its internal WebRTC sender.

A reliable remote-participant architecture needs a native virtual-camera producer, with this extension acting as its controller. An extension-only page-context interception experiment could be added, but it would be version-sensitive and must be separately tested in a real two-participant Meet call before being described as supported.
