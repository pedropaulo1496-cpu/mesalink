$ErrorActionPreference = "Stop"

$projectRoot = Split-Path $PSScriptRoot -Parent
$androidRoot = Join-Path $projectRoot "android-twa"
$signingFile = Join-Path $projectRoot ".android-signing\signing.env"
$keystoreFile = Join-Path $projectRoot ".android-signing\mesalink-release.keystore"
$publicRoot = Join-Path $projectRoot "public"

if (-not (Test-Path -LiteralPath $signingFile)) {
  throw "Missing Android signing credentials: $signingFile"
}

Get-Content -LiteralPath $signingFile | ForEach-Object {
  if ($_ -match "^([^#=]+)=(.*)$") {
    [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
  }
}

if (-not (Test-Path -LiteralPath $keystoreFile)) {
  throw "Missing Android signing key: $keystoreFile"
}

$iconServer = Start-Process python -ArgumentList @(
  "-m", "http.server", "8765", "--bind", "127.0.0.1", "--directory", $publicRoot
) -WindowStyle Hidden -PassThru

try {
  Start-Sleep -Seconds 1
  Push-Location $androidRoot
  try {
    & npx bubblewrap update --skipVersionUpgrade
    if ($LASTEXITCODE -ne 0) { throw "Bubblewrap update failed." }

    & node (Join-Path $PSScriptRoot "generate-android-splash.mjs") $androidRoot
    if ($LASTEXITCODE -ne 0) { throw "Android splash generation failed." }

    & npx bubblewrap build
    if ($LASTEXITCODE -ne 0) { throw "Bubblewrap build failed." }
  }
  finally {
    Pop-Location
  }
}
finally {
  Stop-Process -Id $iconServer.Id -ErrorAction SilentlyContinue
}

Write-Host "Android APK: $androidRoot\app-release-signed.apk"
Write-Host "Google Play bundle: $androidRoot\app-release-bundle.aab"
