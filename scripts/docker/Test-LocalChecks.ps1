[CmdletBinding()]
param(
    [string]$Node = "node",
    [string]$Npm = "npm",
    [string]$NpmCache = (Join-Path $env:TEMP "bugboard26-npm-cache"),
    [switch]$IncludeAudit
)

$ErrorActionPreference = "Stop"
$repository = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Push-Location $repository

function Invoke-Checked {
    param([string]$Label, [scriptblock]$Action)
    Write-Host "[check] $Label"
    & $Action
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE"
    }
}

try {
    New-Item -ItemType Directory -Path $NpmCache -Force | Out-Null

    Invoke-Checked "backend JavaScript syntax" { & $Node backend/scripts/check-syntax.js }
    Invoke-Checked "backend unit tests" { & $Npm --prefix backend run test:unit }
    Invoke-Checked "frontend production build" { & $Npm --prefix frontend run build }
    if ($IncludeAudit) {
        Invoke-Checked "backend runtime dependency audit" {
            & $Npm --prefix backend audit --omit=dev --cache $NpmCache --no-fund
        }
        Invoke-Checked "frontend runtime dependency audit" {
            & $Npm --prefix frontend audit --omit=dev --cache $NpmCache --no-fund
        }
    }

    $docs = @(Get-ChildItem -LiteralPath docs -File)
    if ($docs.Count -ne 1 -or $docs[0].Name -ne "BugBoard26.pdf") {
        throw "docs must contain only BugBoard26.pdf"
    }

    if (Test-Path -LiteralPath (Join-Path $repository ".git")) {
        $forbiddenTracked = @(git ls-files | Where-Object {
            $_ -match '(^|/)(node_modules|dist|build|target|coverage|\.env|\.sonar|\.scannerwork|tmp)(/|$)' `
                -or $_ -match '(^|/)lcov\.info$' `
                -or $_ -match '\.zip$'
        })
        if ($forbiddenTracked.Count -gt 0) {
            throw "Forbidden generated files are tracked: $($forbiddenTracked -join ', ')"
        }
    }

    Write-Host "[pass] local delivery checks completed"
    Write-Host "[info] Use Run-IntegrationTests.ps1 for the database-backed JUnit suite."
} finally {
    Pop-Location
}
