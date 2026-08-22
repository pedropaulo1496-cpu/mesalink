param(
  [ValidateSet("All", "Restaurant", "Partners", "HQ")]
  [string]$Only = "All"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path $PSScriptRoot -Parent
$androidRoot = Join-Path $projectRoot "android-twa"
$signingFile = Join-Path $projectRoot ".android-signing\signing.env"
$keystoreFile = Join-Path $projectRoot ".android-signing\mesalink-release.keystore"
$publicRoot = Join-Path $projectRoot "public"
$downloadsRoot = Join-Path $publicRoot "downloads"
$restaurantManifest = Join-Path $androidRoot "twa-manifest.json"
$directRestaurantManifest = Join-Path $androidRoot "direct-manifest.json"
$gradleWrapper = Join-Path $androidRoot "gradlew.bat"

function Stop-AndroidGradle {
  if (Test-Path -LiteralPath $gradleWrapper) {
    & $gradleWrapper --stop | Out-Null
    Start-Sleep -Milliseconds 500
  }
}

function Set-AndroidAppLinks {
  param(
    [Parameter(Mandatory = $true)][string]$ManifestPath,
    [Parameter(Mandatory = $true)][AllowEmptyCollection()][string[]]$Paths
  )

  [xml]$document = Get-Content -LiteralPath $ManifestPath
  $androidNamespace = "http://schemas.android.com/apk/res/android"
  $namespaces = New-Object System.Xml.XmlNamespaceManager($document.NameTable)
  $namespaces.AddNamespace("android", $androidNamespace)
  $filters = $document.SelectNodes("//activity/intent-filter[action[@android:name='android.intent.action.VIEW']]", $namespaces)

  foreach ($filter in $filters) {
    @($filter.SelectNodes("data")) | ForEach-Object { [void]$filter.RemoveChild($_) }
    if ($Paths.Count -eq 0) {
      [void]$filter.ParentNode.RemoveChild($filter)
      continue
    }
    foreach ($path in $Paths) {
      $data = $document.CreateElement("data")
      $data.SetAttribute("scheme", $androidNamespace, "https")
      $data.SetAttribute("host", $androidNamespace, "@string/hostName")
      $data.SetAttribute("pathPrefix", $androidNamespace, $path)
      [void]$filter.AppendChild($data)
    }
  }

  $settings = New-Object System.Xml.XmlWriterSettings
  $settings.Indent = $true
  $settings.Encoding = New-Object System.Text.UTF8Encoding($false)
  $writer = [System.Xml.XmlWriter]::Create($ManifestPath, $settings)
  try { $document.Save($writer) } finally { $writer.Dispose() }
}

& node (Join-Path $PSScriptRoot "generate-app-icons.mjs")
if ($LASTEXITCODE -ne 0) { throw "MesaLink app icon generation failed." }

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

$restaurantPaths = @("/login", "/dashboard", "/restaurants", "/billing", "/onboarding", "/trial-expired")
$variants = @(
  @{ Name = "Restaurant"; Manifest = $directRestaurantManifest; Output = "MesaLink-Restaurantes-v1.1.4.apk"; Paths = $restaurantPaths },
  # Partners e HQ abrem pelo ícone. Sem App Links, nunca capturam páginas públicas
  # como /reserve/... que pertencem ao browser e aos clientes do restaurante.
  @{ Name = "Partners"; Manifest = (Join-Path $androidRoot "partners-manifest.json"); Output = "MesaLink-Parceiros-v1.0.3.apk"; Paths = @() },
  @{ Name = "HQ"; Manifest = (Join-Path $androidRoot "backoffice-manifest.json"); Output = "MesaLink-HQ-v1.1.1.apk"; Paths = @() }
)
if ($Only -ne "All") {
  $variants = @($variants | Where-Object { $_.Name -eq $Only })
}

$iconServer = Start-Process python -ArgumentList @(
  "-m", "http.server", "8765", "--bind", "127.0.0.1", "--directory", $publicRoot
) -WindowStyle Hidden -PassThru

try {
  Start-Sleep -Seconds 1
  Push-Location $androidRoot
  try {
    foreach ($variant in $variants) {
      Stop-AndroidGradle
      & npx bubblewrap update --skipVersionUpgrade --manifest $variant.Manifest
      if ($LASTEXITCODE -ne 0) { throw "Bubblewrap update failed for $($variant.Output)." }

      Set-AndroidAppLinks -ManifestPath (Join-Path $androidRoot "app\src\main\AndroidManifest.xml") -Paths $variant.Paths

      & node (Join-Path $PSScriptRoot "generate-android-splash.mjs") $androidRoot
      if ($LASTEXITCODE -ne 0) { throw "Android splash generation failed for $($variant.Output)." }

      & npx bubblewrap build --skipPwaValidation --manifest $variant.Manifest
      if ($LASTEXITCODE -ne 0) { throw "Bubblewrap build failed for $($variant.Output)." }

      Copy-Item -LiteralPath (Join-Path $androidRoot "app-release-signed.apk") -Destination (Join-Path $downloadsRoot $variant.Output) -Force
      Write-Host "Built $($variant.Output)"
    }
  }
  finally {
    Stop-AndroidGradle
    & npx bubblewrap update --skipVersionUpgrade --manifest $restaurantManifest
    if ($LASTEXITCODE -eq 0) {
      Set-AndroidAppLinks -ManifestPath (Join-Path $androidRoot "app\src\main\AndroidManifest.xml") -Paths $restaurantPaths
      & node (Join-Path $PSScriptRoot "generate-android-splash.mjs") $androidRoot
    }
    Pop-Location
  }
}
finally {
  Stop-Process -Id $iconServer.Id -ErrorAction SilentlyContinue
}

Write-Host "Android downloads: $downloadsRoot"
