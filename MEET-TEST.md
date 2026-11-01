# Phase 4: Google Meet End-to-End Test

This test verifies the complete path:

```text
Physical webcam → SnapAway → OBS Window Capture → OBS Virtual Camera → Google Meet → remote participant
```

A local OBS preview is not enough. Phase 4 passes only when a second participant confirms that the received video shows the disintegration.

## Before starting

Use a desktop with a working webcam, Chrome or Chromium, OBS Studio with Virtual Camera support, and two Google accounts. Use a second computer or a phone for the observer when possible. Keep the observer’s microphone muted unless it is needed for a voice check.

Make sure SnapAway is built and that OBS is installed. From the project directory, run:

```bash
./run-obs-source.sh
```

Allow camera access in the SnapAway window and click **Enable camera**. Confirm that the normal camera image appears in the stage.

## Configure OBS

Open OBS Studio and create a scene named `SnapAway`. Add **Window Capture** and select the SnapAway app window. Fit the capture to the OBS canvas. Confirm that the OBS preview shows the normal camera image and that clicking **Trigger vanish** changes the OBS preview.

Click **Start Virtual Camera** in OBS. Do not close OBS or the SnapAway window while testing.

## Configure Google Meet

On the presenter account, join or create a Meet call. Open **More options → Settings → Video** and select **OBS Virtual Camera**. Confirm that the Meet self-preview shows the OBS scene. If Meet only shows the physical webcam, refresh the device list by leaving and rejoining the call after starting OBS Virtual Camera.

Join the same meeting from the observer account on a separate device. The observer should select a different microphone and speaker path where possible to avoid feedback. Keep both participants visible during the test.

## Test cases

### Normal output

The observer confirms that the presenter’s live camera is visible before triggering the effect. The presenter then moves slightly and confirms that the OBS preview and Meet self-preview remain live.

### Manual trigger

The presenter clicks **Trigger vanish**. The effect should begin progressively, spread across the segmented person, emit particles, and leave the background visible. The observer must confirm that the same animation appears in the received remote video.

### Snap trigger

Restore the video. Place one hand clearly in view, bring the thumb and index finger together, then separate them quickly. The snap heuristic should trigger once. Ordinary hand movement should not repeatedly trigger the effect.

### Restore

Click **Restore**. The live camera should return without reloading Meet. The observer confirms that the presenter is visible again.

### Camera recovery

Disable and re-enable the camera in Meet. Verify that the OBS Virtual Camera remains selectable and that the SnapAway source can restart without leaving a frozen frame.

## Pass criteria

Phase 4 passes only if all of the following are true:

- The observer sees the normal presenter video.
- The observer sees the complete progressive disintegration.
- The background remains visible after the presenter disappears.
- The observer sees the effect, not only the presenter’s local preview.
- Restore returns to the live presenter feed.
- The effect does not permanently freeze or disable the camera.
- Camera frames remain local to the processing path.

Record the date, operating system, Chrome version, OBS version, camera model, output resolution, and whether the observer saw the effect. If any pass criterion fails, mark remote delivery as **not validated**.

## Troubleshooting

### OBS Virtual Camera is missing in Meet

Start OBS Virtual Camera before opening Meet’s camera settings. Close other applications that may be using the camera, then refresh Meet or leave and rejoin. Confirm that the OBS Virtual Camera appears in another camera application. If it is absent everywhere, repair or reinstall OBS rather than changing SnapAway code.

### Meet shows a black frame

Check the OBS preview first. If OBS is black, verify that the correct SnapAway window is captured and that the camera permission was granted to the SnapAway app. If OBS is correct but Meet is black, stop and restart OBS Virtual Camera, then refresh Meet. Confirm that the OBS canvas has a nonzero resolution and that the source is not hidden.

### The local effect works but the observer sees the physical webcam

Meet is using the wrong camera. Open Meet video settings and select **OBS Virtual Camera** explicitly. If the device list was opened before OBS started, refresh the meeting after starting the virtual camera.

### The effect appears locally but not in OBS

Make sure OBS is capturing the SnapAway app window rather than the browser tab or a different window. Keep the app window open and visible. Window Capture can stop updating when the source window is minimized or moved to a desktop session that the capture backend cannot see.

### Snap detection triggers accidentally

Use the manual trigger while testing the visual pipeline. Improve lighting, keep the hand fully in frame, increase the distance threshold gap, and avoid rapid hand movements near the camera. The snap detector is a landmark-based pinch-and-release heuristic, not an audio-verified snap classifier.

### Video is delayed or stutters

Lower the camera resolution, reduce particle intensity, close other GPU-heavy applications, and use a 30 fps OBS canvas. Avoid running another segmentation effect at the same time. If the OBS preview is smooth but Meet is not, check the OBS output resolution and network conditions.

### Audio feedback occurs

The current SnapAway processor does not route microphone audio. Use a separate microphone and speaker arrangement for the two participants, mute the observer, or use headphones.
