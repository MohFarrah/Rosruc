Set-Location $PSScriptRoot
$venv = Join-Path (Split-Path $PSScriptRoot -Parent) ".venv\Scripts\uvicorn.exe"
& $venv app.main:app --reload --port 8000
