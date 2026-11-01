# Windows-ready package status

The SnapAway Chrome extension and OBS Virtual Camera path are packaged for Windows use.

Ready:

- Built MV3 extension in `extension`.
- Local MediaPipe models and WASM assets.
- Chrome app-style OBS source launcher: `run-obs-source.bat`.
- PowerShell diagnostics: `diagnose-windows.ps1`.
- Windows setup and troubleshooting: `WINDOWS-SETUP.md`.

Not included:

- A custom SnapAway Windows virtual-camera driver.
- Automated OBS installation or control.
- Remote Google Meet validation from this sandbox.

The practical Windows workflow is Chrome/Chromium → OBS Window Capture → OBS Virtual Camera → Google Meet.
