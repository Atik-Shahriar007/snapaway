# Native virtual-camera implementation plan

The next engineering step is to choose a target operating system. A single cross-platform driver is not realistic because virtual cameras are OS-level components.

## Linux

Use `v4l2loopback` to create `/dev/videoN`, then write fixed-size frames to it with a native process. The renderer needs a low-latency frame transport such as shared memory, a local socket carrying NV12/I420 frames, or a native Electron capture bridge. The adapter must negotiate width, height, pixel format, and frame rate, and must close the device on app exit.

## macOS

Implement a Core Media I/O camera extension. The app communicates frames to the extension through an OS-supported IPC mechanism. This requires Apple platform signing and camera-extension entitlements; it cannot be completed or tested on Linux.

## Windows

Implement a Media Foundation or DirectShow virtual camera. The app supplies frames through the selected API and registers the device with the appropriate installer/signing flow. This requires Windows-specific development and testing.

## Required acceptance test

For the selected platform, the driver must appear as a camera in a native camera selector, accept frames for at least ten minutes without freezing, recover after the renderer restarts, and be selectable in Google Meet. Remote-participant visibility must then be retested using the Phase 4 procedure.
