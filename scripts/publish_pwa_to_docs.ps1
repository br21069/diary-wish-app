param(
    [string]$Source = "pwa_app",
    [string]$Destination = "docs"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$sourcePath = Join-Path $repoRoot $Source
$destinationPath = Join-Path $repoRoot $Destination

if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "Source folder not found: $sourcePath"
}

if (Test-Path -LiteralPath $destinationPath) {
    Remove-Item -LiteralPath $destinationPath -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $destinationPath | Out-Null

$excludeDirectories = @("api")
$excludeFiles = @(".env", ".env.local")

Get-ChildItem -LiteralPath $sourcePath -Recurse -Force | ForEach-Object {
    $relativePath = $_.FullName.Substring($sourcePath.Length).TrimStart("\", "/")
    if (-not $relativePath) {
        return
    }

    $parts = $relativePath -split "[\\/]"
    if ($parts | Where-Object { $excludeDirectories -contains $_ }) {
        return
    }

    if (-not $_.PSIsContainer -and ($excludeFiles -contains $_.Name)) {
        return
    }

    $target = Join-Path $destinationPath $relativePath
    if ($_.PSIsContainer) {
        New-Item -ItemType Directory -Force -Path $target | Out-Null
    } else {
        $targetParent = Split-Path -Parent $target
        New-Item -ItemType Directory -Force -Path $targetParent | Out-Null
        Copy-Item -LiteralPath $_.FullName -Destination $target -Force
    }
}

if (-not (Test-Path -LiteralPath (Join-Path $destinationPath ".nojekyll"))) {
    New-Item -ItemType File -Path (Join-Path $destinationPath ".nojekyll") | Out-Null
}

Write-Host "Copied $Source to $Destination for GitHub Pages."
