param(
  [Parameter(Mandatory = $true)]
  [string]$FixtureName,
  [string]$DesignFile,
  [switch]$Force
)

$ErrorActionPreference = "Stop"

function Parse-FixtureFile {
  param([string]$Path)

  $lines = Get-Content -LiteralPath $Path
  $fixtureId = $null
  $documentUnits = $null
  $runs = @()
  $inPostRuns = $false
  $inProperties = $false
  $currentRun = $null

  foreach ($line in $lines) {
    if (-not $fixtureId -and $line -match '^id:\s*(.+?)\s*$') {
      $fixtureId = $matches[1]
      continue
    }

    if (-not $documentUnits -and $line -match '^\s*document_units:\s*(.+?)\s*$') {
      $documentUnits = $matches[1]
      continue
    }

    if ($line -match '^post_runs:\s*$') {
      $inPostRuns = $true
      $inProperties = $false
      continue
    }

    if ($inPostRuns -and $line -match '^[A-Za-z_].*:\s*$') {
      if ($currentRun) {
        $runs += $currentRun
        $currentRun = $null
      }
      $inPostRuns = $false
      $inProperties = $false
    }

    if (-not $inPostRuns) {
      continue
    }

    if ($line -match '^\s{2}- id:\s*(.+?)\s*$') {
      if ($currentRun) {
        $runs += $currentRun
      }
      $currentRun = [ordered]@{
        id = $matches[1]
        properties = [ordered]@{}
      }
      $inProperties = $false
      continue
    }

    if ($line -match '^\s{4}properties:\s*$') {
      $inProperties = $true
      continue
    }

    if ($inProperties -and $line -match '^\s{6}([A-Za-z0-9_]+):\s*(.+?)\s*$') {
      $currentRun.properties[$matches[1]] = $matches[2]
      continue
    }

    if ($inProperties -and $line -match '^\s{2}- id:\s*(.+?)\s*$') {
      if ($currentRun) {
        $runs += $currentRun
      }
      $currentRun = [ordered]@{
        id = $matches[1]
        properties = [ordered]@{}
      }
      $inProperties = $false
      continue
    }
  }

  if ($currentRun) {
    $runs += $currentRun
  }

  if (-not $fixtureId) {
    throw "Could not parse fixture id from $Path"
  }

  return [pscustomobject]@{
    id = $fixtureId
    documentUnits = $documentUnits
    runs = $runs
  }
}

function Write-IfNeeded {
  param(
    [string]$Path,
    [string]$Content
  )

  if ((Test-Path -LiteralPath $Path) -and -not $Force) {
    Write-Host "Skipped existing file: $Path"
    return
  }

  Set-Content -LiteralPath $Path -Value $Content
  Write-Host "Wrote: $Path"
}

$fixturePath = Join-Path "C:\src\fluidnc-posts\fixtures\cases" (Join-Path $FixtureName "fixture.yaml")
if (-not (Test-Path -LiteralPath $fixturePath)) {
  throw "Fixture file not found: $fixturePath"
}

$fixture = Parse-FixtureFile -Path $fixturePath
$targetDir = Join-Path "C:\src\fluidnc-posts\fixtures\expected\fusion" $fixture.id
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

if ($DesignFile) {
  if (-not (Test-Path -LiteralPath $DesignFile)) {
    throw "Design file not found: $DesignFile"
  }
  $designExt = [IO.Path]::GetExtension($DesignFile)
  $designTarget = Join-Path $targetDir ("fixture-" + $fixture.id + $designExt)
  if (-not (Test-Path -LiteralPath $designTarget) -or $Force) {
    Copy-Item -LiteralPath $DesignFile -Destination $designTarget -Force
    Write-Host "Copied design file to $designTarget"
  } else {
    Write-Host "Skipped existing design file: $designTarget"
  }
}

foreach ($run in $fixture.runs) {
  $propertiesLines = @(
    "fixture: $($fixture.id)",
    "run: $($run.id)"
  )

  if ($fixture.documentUnits) {
    $propertiesLines += "document_units: $($fixture.documentUnits)"
  }

  foreach ($entry in $run.properties.GetEnumerator()) {
    $propertiesLines += "$($entry.Key): $($entry.Value)"
  }

  $propertiesLines += "post: FluidNC.cps"
  $propertiesLines += "status: pending"

  $propertiesPath = Join-Path $targetDir ($run.id + ".properties.txt")
  Write-IfNeeded -Path $propertiesPath -Content ($propertiesLines -join [Environment]::NewLine)

  $reviewContent = @(
    "# $($run.id) review",
    "",
    "- Result: pending",
    "- Checked startup block:",
    "- Checked section start:",
    "- Checked restart/re-entry behavior:",
    "- Notes:"
  ) -join [Environment]::NewLine

  $reviewPath = Join-Path $targetDir ($run.id + ".review.md")
  Write-IfNeeded -Path $reviewPath -Content $reviewContent
}

$checklist = @()
$checklist += "# $($fixture.id) posting checklist"
$checklist += ""
$checklist += 'Output folder: `C:\src\fluidnc-posts\fixtures\expected\fusion\' + $fixture.id + '`'
$checklist += ""
$checklist += "Runs to post:"
$checklist += ""
foreach ($run in $fixture.runs) {
  $checklist += "- $($run.id) -> $($run.id).nc"
}
$checklist += ""
$checklist += "After posting each run:"
$checklist += ""
$checklist += "- mark the matching `.properties.txt` file as posted if needed"
$checklist += "- fill in the matching `.review.md` file"

$checklistPath = Join-Path $targetDir "_posting-checklist.md"
Write-IfNeeded -Path $checklistPath -Content ($checklist -join [Environment]::NewLine)
