[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$repository = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$previousResetGuard = [Environment]::GetEnvironmentVariable("ALLOW_TEST_DB_RESET", "Process")
$composeInvoked = $false

Push-Location $repository
try {
    Get-Command docker -ErrorAction Stop | Out-Null
    $env:ALLOW_TEST_DB_RESET = "true"

    # The reset service drops the test schema. Recreating the dependency graph
    # guarantees that backend-test reruns migrations and seed afterwards instead
    # of reusing a stale, already-running container.
    $composeInvoked = $true
    & docker compose --profile test up --build --force-recreate `
        --abort-on-container-exit `
        --exit-code-from junit `
        junit

    if ($LASTEXITCODE -ne 0) {
        & docker compose --profile test logs --no-color
        throw "Integration test suite failed with exit code $LASTEXITCODE"
    }

    Write-Host "[pass] Docker/Neon/JUnit integration tests completed"
} finally {
    if ($composeInvoked) {
        & docker compose --profile test down --volumes --remove-orphans
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Docker test resources could not be removed automatically."
        }
    }
    if ($null -eq $previousResetGuard) {
        Remove-Item Env:ALLOW_TEST_DB_RESET -ErrorAction SilentlyContinue
    } else {
        $env:ALLOW_TEST_DB_RESET = $previousResetGuard
    }
    Pop-Location
}
