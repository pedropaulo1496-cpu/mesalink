$ErrorActionPreference = "Stop"

$projectRoot = Split-Path $PSScriptRoot -Parent
$androidRoot = Join-Path $projectRoot "android-twa"
$signingFile = Join-Path $projectRoot ".android-signing\signing.env"
$keystoreFile = Join-Path $projectRoot ".android-signing\mesalink-release.keystore"
$publicRoot = Join-Path $projectRoot "public"
$downloadsRoot = Join-Path $publicRoot "downloads"
$restaurantManifest = Join-Path $androidRoot "twa-manifest.json"

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

$variants = @(
  @{ Manifest = $restaurantManifest; Output = "MesaLink-Restaurantes-v1.1.0.apk" },
  @{ Manifest = (Join-Path $androidRoot "partners-manifest.json"); Output = "MesaLink-Parceiros-v1.0.0.apk" },
  @{ Manifest = (Join-Path $androidRoot "backoffice-manifest.json"); Output = "MesaLink-Backoffice-v1.0.0.apk" }
)

$iconServer = Start-Process python -ArgumentList @(
  "-m", "http.server", "8765", "--bind", "127.0.0.1", "--directory", $publicRoot
) -WindowStyle Hidden -PassThru

try {
  Start-Sleep -Seconds 1
  Push-Location $androidRoot
  try {
    foreach ($variant in $variants) {
      & npx bubblewrap update --skipVersionUpgrade --manifest $variant.Manifest
      if ($LASTEXITCODE -ne 0) { throw "Bubblewrap update failed for $($variant.Output)." }

      & node (Join-Path $PSScriptRoot "generate-android-splash.mjs") $androidRoot
      if ($LASTEXITCODE -ne 0) { throw "Android splash generation failed for $($variant.Output)." }

      & npx bubblewrap build --skipPwaValidation --manifest $variant.Manifest
      if ($LASTEXITCODE -ne 0) { throw "Bubblewrap build failed for $($variant.Output)." }

      Copy-Item -LiteralPath (Join-Path $androidRoot "app-release-signed.apk") -Destination (Join-Path $downloadsRoot $variant.Output) -Force
      Write-Host "Built $($variant.Output)"
    }
  }
  finally {
    & npx bubblewrap update --skipVersionUpgrade --manifest $restaurantManifest
    if ($LASTEXITCODE -eq 0) {
      & node (Join-Path $PSScriptRoot "generate-android-splash.mjs") $androidRoot
    }
    Pop-Location
  }
}
finally {
  Stop-Process -Id $iconServer.Id -ErrorAction SilentlyContinue
}

Write-Host "Android downloads: $downloadsRoot"
