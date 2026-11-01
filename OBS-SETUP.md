# OBS Virtual Camera Proof of Concept

This is the Phase 3 output path. OBS is used as a temporary output adapter; the SnapAway processing engine remains independent from OBS.

```text
Physical webcam → SnapAway Chrome app → OBS Window Capture → OBS Virtual Camera → Google Meet
```

## 1. Start SnapAway as an OBS source

From the project directory:

```bash
./run-obs-source.sh
```

This serves the built extension assets on `http://127.0.0.1:8765` and opens the studio in an app-style Chromium window. Allow camera access, then click **Enable camera**. In OBS mode the page hides its controls and presents only the processed video stage.

If the script cannot find Chromium or Chrome, start a local server manually:

```bash
python3 -m http.server 8765 --bind 127.0.0.1 --directory extension
```

Then open:

```text
http://127.0.0.1:8765/studio.html?obs=1
```

## 2. Add the source in OBS

1. Install and open OBS Studio.
2. Create a new scene named `SnapAway`.
3. Add **Window Capture** as a source.
4. Select the Chromium/Chrome app window showing the SnapAway stage.
5. Fit the source to the canvas with **Transform → Fit to screen**.
6. Confirm that the live camera and particle effect are visible in the OBS preview.

Window Capture is recommended for this proof of concept because browser camera permissions are more predictable in normal Chrome/Chromium than inside an OBS Browser Source.

## 3. Start the virtual camera

In OBS, choose **Start Virtual Camera**. Leave OBS running.

## 4. Select it in Google Meet

Join Google Meet and open **Settings → Video**. Choose **OBS Virtual Camera** as the camera. Join a test call with a second participant or a second account. Trigger the effect in the SnapAway app window and verify what the remote participant receives.

## Important validation rule

Seeing the effect in the OBS preview is not proof that a remote Meet participant sees it. The implementation is only validated for remote delivery after a second participant confirms the effect in the received video.

## Known limitations

- OBS is not installed or controlled automatically by the extension.
- Window Capture adds a desktop capture step and may add latency.
- The SnapAway app must remain open while OBS is using it.
- Meet camera selection and OBS Virtual Camera availability are platform-specific.
- The camera and processing remain local; no frames are uploaded by SnapAway.
