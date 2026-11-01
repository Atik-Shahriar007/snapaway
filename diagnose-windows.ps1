$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pass = 0
$warn = 0
$fail = 0
function Pass($label) { Write-Host "[PASS] $label" -ForegroundColor Green; $script:pass++ }
function Warn($label) { Write-Host "[WARN] $label" -ForegroundColor Yellow; $script:warn++ }
function Fail($label) { Write-Host "[FAIL] $label" -ForegroundColor Red; $script:fail++ }
function Need($label, $path) { if (Test-Path $path) { Pass $label } else { Fail $label } }
Need 'MV3 manifest exists' (Join-Path $root 'extension\manifest.json')
Need 'studio page exists' (Join-Path $root 'extension\studio.html')
Need 'person segmentation model exists' (Join-Path $root 'extension\models\selfie_segmenter_landscape.tflite')
Need 'hand landmark model exists' (Join-Path $root 'extension\models\hand_landmarker.task')
Need 'WASM runtime exists' (Join-Path $root 'extension\wasm\vision_wasm_internal.wasm')
Need 'Windows launcher exists' (Join-Path $root 'run-obs-source.bat')
if (Get-Command chrome.exe -ErrorAction SilentlyContinue) { Pass 'Chrome is on PATH' } elseif (Get-Command msedge.exe -ErrorAction SilentlyContinue) { Pass 'Edge is on PATH' } else { Warn 'Chrome/Edge is not on PATH; launch the source URL manually' }
if (Get-Command obs64.exe -ErrorAction SilentlyContinue) { Pass 'OBS is on PATH' } else { Warn 'OBS is not on PATH; install OBS Studio before the Meet test' }
Write-Host "`nResult: $pass passed, $warn warnings, $fail failed"
if ($fail -gt 0) { exit 1 }
