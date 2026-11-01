# SnapAway Desktop — Phase 5

This directory contains the standalone desktop shell and native-camera boundary.

## Architecture

```text
Electron renderer
  └─ existing SnapAway camera/segmentation/particle engine
       └─ canvas.captureStream(30)
            └─ native frame bridge (next implementation)
                 └─ OS virtual-camera driver
                      └─ Google Meet / OBS / other camera clients
```

The Electron shell loads the already-built local studio and grants camera permission through an isolated preload bridge. Native-camera operations are intentionally behind `snapAwayNativeCamera` and a platform adapter so the renderer does not depend on OS-specific code.

## Current status

The desktop shell and adapter boundary are implemented. The actual native frame writer and virtual-camera driver are **not complete**. Linux requires a loaded `v4l2loopback` device plus a process that writes the renderer’s video frames into that device. macOS requires a Core Media I/O camera extension, and Windows requires a Media Foundation or DirectShow virtual-camera implementation. These drivers cannot be validated in the current sandbox.

Do not describe this Phase 5 scaffold as a working native virtual camera yet.

## Run the shell on a desktop

```bash
cd desktop
npm install
npm start
```

The built extension must exist at `../extension` first:

```bash
cd ..
npm run build
cp src/manifest.json extension-build/manifest.json
cp src/meet-status.js extension-build/meet-status.js
rm -rf extension
mv extension-build extension
```
