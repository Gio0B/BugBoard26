[CmdletBinding()]
param(
    [string]$OutputPath = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")) "outputs\BugBoard26.zip")
)

$ErrorActionPreference = "Stop"
$repository = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$outputFullPath = [System.IO.Path]::GetFullPath($OutputPath)
$repositoryPrefix = $repository.TrimEnd('\') + '\'

if (-not (Test-Path -LiteralPath (Join-Path $repository ".git"))) {
    throw "Repository Git non trovato."
}

if ([System.IO.Path]::GetExtension($outputFullPath) -ne ".zip") {
    throw "Il file di destinazione deve avere estensione .zip."
}

if ($outputFullPath.StartsWith($repositoryPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Lo ZIP deve essere creato fuori dal repository."
}

$pending = @(git -C $repository status --porcelain)
if ($pending.Count -gt 0) {
    throw "Il repository deve essere pulito prima del packaging."
}

$outputDirectory = Split-Path -Parent $outputFullPath
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

git -C $repository archive --format=zip --prefix=BugBoard26/ --output=$outputFullPath HEAD
if ($LASTEXITCODE -ne 0) {
    throw "Creazione dello ZIP non riuscita."
}

$archive = Get-Item -LiteralPath $outputFullPath
Write-Host "Created $($archive.FullName) ($($archive.Length) bytes)"
