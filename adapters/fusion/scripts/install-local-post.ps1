param(
  [ValidateSet("Copy", "HardLink")]
  [string]$Mode = "HardLink",
  [string]$Source = "C:\src\fluidnc-posts\adapters\fusion\FluidNC.cps",
  [string]$Destination = "C:\Users\540ly\AppData\Roaming\Autodesk\Fusion 360 CAM\Posts\FluidNC.cps"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $Source)) {
  throw "Source post not found: $Source"
}

$destinationDir = Split-Path -Parent $Destination
if (-not (Test-Path -LiteralPath $destinationDir)) {
  throw "Destination folder not found: $destinationDir"
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = "$Destination.bak-$timestamp"

if (Test-Path -LiteralPath $Destination) {
  $existing = Get-Item -LiteralPath $Destination -Force
  $samePath = $false
  try {
    if ($existing.FullName -eq (Get-Item -LiteralPath $Source).FullName) {
      $samePath = $true
    }
  } catch {
  }

  if (-not $samePath) {
    Move-Item -LiteralPath $Destination -Destination $backup -Force
    Write-Host "Backed up existing post to $backup"
  } else {
    Remove-Item -LiteralPath $Destination -Force
  }
}

if ($Mode -eq "Copy") {
  Copy-Item -LiteralPath $Source -Destination $Destination -Force
  Write-Host "Installed repo post by copy."
} else {
  New-Item -ItemType HardLink -Path $Destination -Target $Source | Out-Null
  Write-Host "Installed repo post as a hard link."
}

Write-Host "Source:      $Source"
Write-Host "Destination: $Destination"
