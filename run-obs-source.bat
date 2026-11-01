@echo off
setlocal
cd /d "%~dp0"
set PORT=8765
if not "%SNAPAWAY_PORT%"=="" set PORT=%SNAPAWAY_PORT%
set URL=http://127.0.0.1:%PORT%/studio.html?obs=1

echo Starting SnapAway local source on %URL%
start "SnapAway HTTP Server" /min cmd /c "python -m http.server %PORT% --bind 127.0.0.1 --directory extension"
timeout /t 2 /nobreak >nul

where chrome.exe >nul 2>&1
if %ERRORLEVEL%==0 (
  start "SnapAway" chrome.exe --app="%URL%"
  goto :done
)
where msedge.exe >nul 2>&1
if %ERRORLEVEL%==0 (
  start "SnapAway" msedge.exe --app="%URL%"
  goto :done
)

echo Chrome or Edge was not found on PATH.
echo Open this URL manually: %URL%
:startwait
pause
:done
endlocal
