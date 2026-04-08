param(
  [string[]]$FixtureName
)

$ErrorActionPreference = "Stop"

$root = "C:\src\fluidnc-posts\fixtures\expected\fusion"
$requestedFixtures = if ($FixtureName) { [System.Collections.Generic.HashSet[string]]::new([string[]]$FixtureName) } else { $null }
$results = [System.Collections.Generic.List[object]]::new()

function Add-Result {
  param(
    [string]$Fixture,
    [string]$Check,
    [bool]$Passed,
    [string]$Detail
  )

  $results.Add([pscustomobject]@{
      Fixture = $Fixture
      Check = $Check
      Status = if ($Passed) { "PASS" } else { "FAIL" }
      Detail = $Detail
    })
}

function Use-Fixture {
  param([string]$Name)

  if (-not $requestedFixtures) {
    return $true
  }

  return $requestedFixtures.Contains($Name)
}

function Read-Text {
  param([string]$Path)

  return Get-Content -LiteralPath $Path -Raw
}

function Check-FileExists {
  param(
    [string]$Fixture,
    [string]$Path,
    [string]$Label
  )

  $exists = Test-Path -LiteralPath $Path
  Add-Result -Fixture $Fixture -Check $Label -Passed $exists -Detail $(if ($exists) { "Found $(Split-Path -Leaf $Path)" } else { "Missing $Path" })
  return $exists
}

function Check-Contains {
  param(
    [string]$Fixture,
    [string]$Text,
    [string]$Pattern,
    [string]$Label,
    [string]$Detail
  )

  Add-Result -Fixture $Fixture -Check $Label -Passed ($Text.IndexOf($Pattern, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) -Detail $Detail
}

function Check-NotContains {
  param(
    [string]$Fixture,
    [string]$Text,
    [string]$Pattern,
    [string]$Label,
    [string]$Detail
  )

  Add-Result -Fixture $Fixture -Check $Label -Passed ($Text.IndexOf($Pattern, [System.StringComparison]::OrdinalIgnoreCase) -lt 0) -Detail $Detail
}

function Check-MatchCountAtLeast {
  param(
    [string]$Fixture,
    [string]$Text,
    [string]$Pattern,
    [int]$Minimum,
    [string]$Label,
    [string]$DetailPrefix
  )

  $options = [System.Text.RegularExpressions.RegexOptions]::Multiline -bor [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
  $count = [regex]::Matches($Text, $Pattern, $options).Count
  Add-Result -Fixture $Fixture -Check $Label -Passed ($count -ge $Minimum) -Detail "$DetailPrefix Found $count."
}

function Check-PostedSidecars {
  param(
    [string]$Fixture,
    [string]$Directory,
    [string[]]$RunIds
  )

  foreach ($runId in $RunIds) {
    $propertiesPath = Join-Path $Directory ($runId + ".properties.txt")
    if (Check-FileExists -Fixture $Fixture -Path $propertiesPath -Label "$runId properties") {
      $propertiesText = Read-Text -Path $propertiesPath
      Check-Contains -Fixture $Fixture -Text $propertiesText -Pattern "status: posted" -Label "$runId properties status" -Detail "$runId properties should be marked posted."
    }

    $reviewPath = Join-Path $Directory ($runId + ".review.md")
    if (Check-FileExists -Fixture $Fixture -Path $reviewPath -Label "$runId review") {
      $reviewText = Read-Text -Path $reviewPath
      Check-Contains -Fixture $Fixture -Text $reviewText -Pattern "- Result: PASS" -Label "$runId review result" -Detail "$runId review should record PASS."
    }
  }
}

if (Use-Fixture "inch-job") {
  $fixture = "inch-job"
  $dir = Join-Path $root $fixture
  $runs = @("base-inch", "safe-start-inch")
  Check-PostedSidecars -Fixture $fixture -Directory $dir -RunIds $runs

  foreach ($run in $runs) {
    $path = Join-Path $dir ($run + ".nc")
    if (-not (Check-FileExists -Fixture $fixture -Path $path -Label "$run nc")) {
      continue
    }

    $text = Read-Text -Path $path
    Check-Contains -Fixture $fixture -Text $text -Pattern "G20" -Label "$run inch mode" -Detail "$run should emit inch mode."
    Check-NotContains -Fixture $fixture -Text $text -Pattern "G21" -Label "$run no metric mode" -Detail "$run should not emit metric mode."
    Check-Contains -Fixture $fixture -Text $text -Pattern "G90 G94 G20 G17" -Label "$run section reset" -Detail "$run should restate inch-safe modal state."
    Check-Contains -Fixture $fixture -Text $text -Pattern "(02_arc_profile)" -Label "$run second section" -Detail "$run should include the second operation section."
    Check-MatchCountAtLeast -Fixture $fixture -Text $text -Pattern "^G53 G0 Z0\r?$" -Minimum 3 -Label "$run safe retracts" -DetailPrefix "$run should retract to machine Z multiple times."
  }
}

if (Use-Fixture "multi-tool") {
  $fixture = "multi-tool"
  $dir = Join-Path $root $fixture
  $defaultRun = "manual-toolchange-default"
  $noStopRun = "manual-toolchange-no-optional-stop"
  Check-PostedSidecars -Fixture $fixture -Directory $dir -RunIds @($defaultRun, $noStopRun)

  $defaultPath = Join-Path $dir ($defaultRun + ".nc")
  if (Check-FileExists -Fixture $fixture -Path $defaultPath -Label "$defaultRun nc") {
    $text = Read-Text -Path $defaultPath
    Check-MatchCountAtLeast -Fixture $fixture -Text $text -Pattern "^M1\r?$" -Minimum 2 -Label "$defaultRun optional stops" -DetailPrefix "Default run should emit optional stops at tool boundaries."
    Check-Contains -Fixture $fixture -Text $text -Pattern "M8" -Label "$defaultRun coolant on" -Detail "Default run should emit coolant-on codes."
    Check-Contains -Fixture $fixture -Text $text -Pattern "M9" -Label "$defaultRun coolant off" -Detail "Default run should emit coolant-off codes."
    Check-Contains -Fixture $fixture -Text $text -Pattern "T1" -Label "$defaultRun tool 1" -Detail "Default run should reference tool 1."
    Check-Contains -Fixture $fixture -Text $text -Pattern "T2" -Label "$defaultRun tool 2" -Detail "Default run should reference tool 2."
    Check-MatchCountAtLeast -Fixture $fixture -Text $text -Pattern "G4 P3\." -Minimum 3 -Label "$defaultRun spindle dwell" -DetailPrefix "Default run should restart spindle with warmup dwell."
    Check-MatchCountAtLeast -Fixture $fixture -Text $text -Pattern "^G53 G0 Z0\r?$" -Minimum 4 -Label "$defaultRun safe retracts" -DetailPrefix "Default run should retract safely around tool changes."
  }

  $noStopPath = Join-Path $dir ($noStopRun + ".nc")
  if (Check-FileExists -Fixture $fixture -Path $noStopPath -Label "$noStopRun nc") {
    $text = Read-Text -Path $noStopPath
    Check-NotContains -Fixture $fixture -Text $text -Pattern "M1" -Label "$noStopRun no optional stops" -Detail "No-optional-stop run should not emit M1."
    Check-Contains -Fixture $fixture -Text $text -Pattern "M8" -Label "$noStopRun coolant on" -Detail "No-optional-stop run should emit coolant-on codes."
    Check-Contains -Fixture $fixture -Text $text -Pattern "M9" -Label "$noStopRun coolant off" -Detail "No-optional-stop run should emit coolant-off codes."
    Check-Contains -Fixture $fixture -Text $text -Pattern "T1" -Label "$noStopRun tool 1" -Detail "No-optional-stop run should reference tool 1."
    Check-Contains -Fixture $fixture -Text $text -Pattern "T2" -Label "$noStopRun tool 2" -Detail "No-optional-stop run should reference tool 2."
    Check-MatchCountAtLeast -Fixture $fixture -Text $text -Pattern "G4 P3\." -Minimum 3 -Label "$noStopRun spindle dwell" -DetailPrefix "No-optional-stop run should restart spindle with warmup dwell."
    Check-MatchCountAtLeast -Fixture $fixture -Text $text -Pattern "^G53 G0 Z0\r?$" -Minimum 4 -Label "$noStopRun safe retracts" -DetailPrefix "No-optional-stop run should retract safely around tool changes."
  }
}

if (Use-Fixture "tiny-segment-storm") {
  $fixture = "tiny-segment-storm"
  $dir = Join-Path $root $fixture
  $runs = @("no-filter", "default-filter", "aggressive-filter")
  Check-PostedSidecars -Fixture $fixture -Directory $dir -RunIds $runs

  $lineCounts = @{}
  $expectedHeaders = @{
    "no-filter" = "min_seg=0mm"
    "default-filter" = "min_seg=0.05mm"
    "aggressive-filter" = "min_seg=0.1mm"
  }

  foreach ($run in $runs) {
    $path = Join-Path $dir ($run + ".nc")
    if (-not (Check-FileExists -Fixture $fixture -Path $path -Label "$run nc")) {
      continue
    }

    $text = Read-Text -Path $path
    $lineCounts[$run] = (Get-Content -LiteralPath $path).Count
    Check-Contains -Fixture $fixture -Text $text -Pattern $expectedHeaders[$run] -Label "$run header" -Detail "$run should report the configured minimum segment length."
    Check-Contains -Fixture $fixture -Text $text -Pattern "(02_circle_profile)" -Label "$run second section" -Detail "$run should include the bore section after the dense contour."
    Check-Contains -Fixture $fixture -Text $text -Pattern "M30" -Label "$run program end" -Detail "$run should terminate cleanly."
  }

  if (($lineCounts.ContainsKey("no-filter")) -and ($lineCounts.ContainsKey("default-filter")) -and ($lineCounts.ContainsKey("aggressive-filter"))) {
    Add-Result -Fixture $fixture -Check "monotonic line count reduction" -Passed (($lineCounts["no-filter"] -gt $lineCounts["default-filter"]) -and ($lineCounts["default-filter"] -gt $lineCounts["aggressive-filter"])) -Detail "Observed counts: no-filter=$($lineCounts["no-filter"]), default-filter=$($lineCounts["default-filter"]), aggressive-filter=$($lineCounts["aggressive-filter"])."
  }
}

if (Use-Fixture "split-file") {
  $fixture = "split-file"
  $dir = Join-Path $root $fixture
  $runs = @("split-by-tool", "split-by-toolpath", "split-by-tool-safe-start")
  Check-PostedSidecars -Fixture $fixture -Directory $dir -RunIds $runs

  $runSubfiles = @{
    "split-by-tool" = @(
      "split-by-tool_1_T1.nc",
      "split-by-tool_2_T2.nc",
      "split-by-tool_3_T1.nc"
    )
    "split-by-toolpath" = @(
      "split-by-toolpath_1_01_rough_pocket_t1_T1.nc",
      "split-by-toolpath_2_02_bore_12mm_t2_T2.nc",
      "split-by-toolpath_3_03_outer_profile_t1_T1.nc"
    )
    "split-by-tool-safe-start" = @(
      "split-by-tool-safe-start_1_T1.nc",
      "split-by-tool-safe-start_2_T2.nc",
      "split-by-tool-safe-start_3_T1.nc"
    )
  }

  foreach ($run in $runs) {
    $masterPath = Join-Path $dir ($run + ".nc")
    if (Check-FileExists -Fixture $fixture -Path $masterPath -Label "$run master") {
      $masterText = Read-Text -Path $masterPath
      Check-Contains -Fixture $fixture -Text $masterText -Pattern "(***THIS FILE DOES NOT CONTAIN NC CODE***)" -Label "$run master placeholder" -Detail "$run master should be a placeholder file."
      Check-Contains -Fixture $fixture -Text $masterText -Pattern "G90 G94 G21 G17" -Label "$run master startup" -Detail "$run master should still restate base modal state."
    }

    foreach ($subfile in $runSubfiles[$run]) {
      $subfilePath = Join-Path $dir $subfile
      if (-not (Check-FileExists -Fixture $fixture -Path $subfilePath -Label "$subfile exists")) {
        continue
      }

      $text = Read-Text -Path $subfilePath
      Check-Contains -Fixture $fixture -Text $text -Pattern "G21" -Label "$subfile metric mode" -Detail "$subfile should restate metric mode."
      Check-Contains -Fixture $fixture -Text $text -Pattern "G54" -Label "$subfile wcs" -Detail "$subfile should restate WCS."
      Check-Contains -Fixture $fixture -Text $text -Pattern "G53 G0 Z0" -Label "$subfile safe retract" -Detail "$subfile should contain machine-coordinate Z retract."
      Check-Contains -Fixture $fixture -Text $text -Pattern "M30" -Label "$subfile program end" -Detail "$subfile should terminate cleanly."
    }
  }
}

$sortedResults = $results | Sort-Object Fixture, Check
$sortedResults | Format-Table -AutoSize

$failed = @($sortedResults | Where-Object { $_.Status -eq "FAIL" })
if ($failed.Count -gt 0) {
  Write-Error "$($failed.Count) fixture validation checks failed."
}

Write-Host ""
Write-Host "Validated $($sortedResults.Count) checks across $(@($sortedResults.Fixture | Select-Object -Unique).Count) fixture families."
