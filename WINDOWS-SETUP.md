# SnapAway on Windows Chrome

This package is runnable on Windows through Chrome plus OBS Virtual Camera. It does not require the unfinished custom native-camera driver.

## 1. Copy the project

Copy the entire `snapaway` folder to the Windows machine. The built extension is already in the `extension` folder.

Run the PowerShell diagnostic from the project folder:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\diagnose-windows.ps1
```

The diagnostic checks the bundled manifest, MediaPipe models, WASM runtime, and available browser/OBS commands.

The extension manifest includes the `wasm-unsafe-eval` permission required by the local MediaPipe WebAssembly runtime. If you previously loaded an older ZIP, open `chrome://extensions` and click **Reload** after replacing the extracted `extension` folder.

## 2. Load the Chrome extension

Open Chrome and visit `chrome://extensions`. Enable **Developer mode**, choose **Load unpacked**, and select the `extension` folder.

The extension popup opens the local studio. The local studio can also be run as the OBS source window using the launcher in the next step.

## 3. Start the OBS source

Install OBS Studio with Virtual Camera support. Double-click `run-obs-source.bat`.

The script starts a local server and opens a Chrome app-style window at:

```text
http://127.0.0.1:8765/studio.html?obs=1
```

Allow camera access. Click **Enable camera** in the normal studio before using the OBS source. The app-style OBS mode hides the controls after loading; use the normal extension studio window for the trigger controls if needed, or temporarily open the URL without `?obs=1` for visible controls.

## 4. Configure OBS

Create a scene called `SnapAway`. Add **Window Capture**, select the SnapAway Chrome app window, and fit the source to the canvas. Confirm that OBS shows the live processed camera.

Click **Start Virtual Camera** in OBS.

## 5. Configure Meet

Join Google Meet in Chrome. Open **Settings → Video**, choose **OBS Virtual Camera**, and confirm the Meet preview shows the SnapAway output. Join the same meeting from a second account or device and ask the observer to confirm the effect.

The end-to-end test passes only when the remote participant sees the disintegration. OBS’s local preview is not sufficient evidence.

## Troubleshooting

If the camera permission prompt does not appear, open the normal studio URL without `?obs=1`, grant camera permission there, then restart the OBS source window. If OBS does not show the window, keep the Chrome app window open and use Window Capture rather than Browser Source. If Meet shows the physical webcam, explicitly select OBS Virtual Camera and refresh Meet after OBS Virtual Camera has started.

If Chrome reports `WebAssembly.instantiateStreaming()` or says that `wasm-unsafe-eval` is not allowed, the old extension is still loaded. Replace the extracted folder with the new package, return to `chrome://extensions`, click **Reload**, close all old SnapAway studio windows, and open a fresh one. Do not try to fix this by enabling unsafe flags in Chrome.

If Chrome blocks the local page, use `http://127.0.0.1:8765` exactly rather than a network IP. Windows Firewall should not need an inbound rule because the server binds to loopback only.

If the effect stutters, use 1280×720 camera input, reduce the particle intensity, close GPU-heavy applications, and keep OBS at 30 fps.

## Current limitation

The Windows-ready path uses OBS as the virtual-camera provider. The custom SnapAway native Windows driver is not included in this package. A native driver would require a separately signed Media Foundation or DirectShow implementation and Windows hardware testing.
