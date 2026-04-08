param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path,
  [string]$RepoPath,
  [string]$LocalPath = (Join-Path $env:APPDATA "Autodesk\Fusion 360 CAM\Posts\FluidNC.cps")
)

$ErrorActionPreference = "Stop"

if (-not $RepoPath) {
  $RepoPath = Join-Path $RepoRoot "adapters\fusion\FluidNC.cps"
}

$repo = Get-Item -LiteralPath $RepoPath -Force
$local = Get-Item -LiteralPath $LocalPath -Force

$repoHash = (Get-FileHash -LiteralPath $RepoPath -Algorithm SHA256).Hash
$localHash = (Get-FileHash -LiteralPath $LocalPath -Algorithm SHA256).Hash

[pscustomobject]@{
  RepoPath = $repo.FullName
  LocalPath = $local.FullName
  RepoLength = $repo.Length
  LocalLength = $local.Length
  RepoModified = $repo.LastWriteTime
  LocalModified = $local.LastWriteTime
  RepoHash = $repoHash
  LocalHash = $localHash
  HashMatch = ($repoHash -eq $localHash)
}
