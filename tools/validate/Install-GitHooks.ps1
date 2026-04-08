param()

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

Push-Location $repoRoot
try {
  git config core.hooksPath .githooks
  Write-Host "Configured core.hooksPath to .githooks"
} finally {
  Pop-Location
}
