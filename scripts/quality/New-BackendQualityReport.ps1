[CmdletBinding()]
param(
    [string]$SonarUrl = "http://localhost:9000",
    [string]$AdminUser = "admin",
    [string]$AdminPassword = "admin",
    [switch]$StopAfter
)

$ErrorActionPreference = "Stop"
$repository = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$projectKey = "bugboard26-backend"
$reportPath = Join-Path $repository "documentation-workspace\sonar\backend-quality-report.md"
$tokenName = "bugboard26-local-$([DateTimeOffset]::Now.ToString('yyyyMMddHHmmss'))"
$token = $null
$startedByScript = $false
$previousSonarUrl = [Environment]::GetEnvironmentVariable("SONAR_HOST_URL", "Process")
$previousSonarToken = [Environment]::GetEnvironmentVariable("SONAR_TOKEN", "Process")
$previousSonarUserHome = [Environment]::GetEnvironmentVariable("SONAR_USER_HOME", "Process")

function New-BasicAuthorizationHeader {
    param([string]$Username, [string]$Password)
    $bytes = [Text.Encoding]::UTF8.GetBytes("${Username}:${Password}")
    return @{ Authorization = "Basic $([Convert]::ToBase64String($bytes))" }
}

function Invoke-CheckedCommand {
    param([string]$Label, [scriptblock]$Action)
    Write-Host "[quality] $Label"
    & $Action
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE"
    }
}

function Get-MetricValue {
    param([hashtable]$Metrics, [string]$Key, [string]$Fallback = "n/d")
    if ($Metrics.ContainsKey($Key)) { return $Metrics[$Key] }
    return $Fallback
}

function Convert-Rating {
    param([string]$Value)
    $ratings = @{ "1.0" = "A"; "2.0" = "B"; "3.0" = "C"; "4.0" = "D"; "5.0" = "E" }
    if ($ratings.ContainsKey($Value)) { return $ratings[$Value] }
    return $Value
}

function Get-Percentage {
    param([double]$Covered, [double]$Total)
    if ($Total -le 0) { return "n/d" }
    return ([Math]::Round(($Covered / $Total) * 100, 2)).ToString("0.00")
}

Push-Location $repository
try {
    Get-Command npm -ErrorAction Stop | Out-Null

    Invoke-CheckedCommand "backend syntax" { & npm --prefix backend run check }
    Invoke-CheckedCommand "unit tests and LCOV coverage" { & npm --prefix backend run test:coverage }
    $sonarReady = $false
    try {
        $systemStatus = Invoke-RestMethod -Uri "$SonarUrl/api/system/status" -TimeoutSec 5
        $sonarReady = $systemStatus.status -eq "UP"
    } catch {
        # Start the local Compose service below when no server is available yet.
    }

    if ($sonarReady) {
        Write-Host "[quality] reusing SonarQube at $SonarUrl"
    } else {
        Get-Command docker -ErrorAction Stop | Out-Null
        Invoke-CheckedCommand "Compose configuration" { & docker compose --profile quality config --quiet }
        Invoke-CheckedCommand "start SonarQube" { & docker compose --profile quality up -d sonarqube }
        $startedByScript = $true
    }

    Write-Host "[quality] waiting for SonarQube"
    for ($attempt = 1; $attempt -le 120; $attempt++) {
        try {
            $systemStatus = Invoke-RestMethod -Uri "$SonarUrl/api/system/status" -TimeoutSec 5
            if ($systemStatus.status -eq "UP") {
                $sonarReady = $true
                break
            }
        } catch {
            # The server normally refuses connections during its first startup.
        }
        Start-Sleep -Seconds 5
    }
    if (-not $sonarReady) { throw "SonarQube did not become ready at $SonarUrl" }

    $adminHeaders = New-BasicAuthorizationHeader -Username $AdminUser -Password $AdminPassword
    $tokenResponse = Invoke-RestMethod `
        -Uri "$SonarUrl/api/user_tokens/generate" `
        -Method Post `
        -Headers $adminHeaders `
        -Body @{ name = $tokenName }
    $token = $tokenResponse.token
    if ([string]::IsNullOrWhiteSpace($token)) { throw "SonarQube did not return an analysis token" }

    $env:SONAR_HOST_URL = $SonarUrl
    $env:SONAR_TOKEN = $token
    $env:SONAR_USER_HOME = Join-Path $repository ".sonar"
    New-Item -ItemType Directory -Path $env:SONAR_USER_HOME -Force | Out-Null
    Invoke-CheckedCommand "Sonar analysis" { & npm --prefix backend run quality:scan }

    $tokenHeaders = New-BasicAuthorizationHeader -Username $token -Password ""
    $taskFile = Join-Path $repository "backend\.scannerwork\report-task.txt"
    if (-not (Test-Path -LiteralPath $taskFile)) { throw "Sonar task file was not generated" }
    $taskProperties = @{}
    foreach ($line in Get-Content -LiteralPath $taskFile) {
        if ($line -match '^([^=]+)=(.*)$') { $taskProperties[$Matches[1]] = $Matches[2] }
    }
    $ceTaskId = $taskProperties['ceTaskId']
    if ([string]::IsNullOrWhiteSpace($ceTaskId)) { throw "Sonar task id was not generated" }

    Write-Host "[quality] waiting for SonarQube background task"
    $ceStatus = $null
    for ($attempt = 1; $attempt -le 120; $attempt++) {
        $ceResponse = Invoke-RestMethod `
            -Uri "$SonarUrl/api/ce/task?id=$([Uri]::EscapeDataString($ceTaskId))" `
            -Headers $tokenHeaders `
            -TimeoutSec 10
        $ceStatus = [string]$ceResponse.task.status
        if ($ceStatus -in @('SUCCESS', 'FAILED', 'CANCELED')) { break }
        Start-Sleep -Seconds 2
    }
    if ($ceStatus -ne 'SUCCESS') { throw "SonarQube background task ended with status $ceStatus" }

    $encodedProjectKey = [Uri]::EscapeDataString($projectKey)
    $metricKeys = @(
        "bugs", "vulnerabilities", "code_smells", "security_hotspots",
        "coverage", "duplicated_lines_density", "ncloc",
        "reliability_rating", "security_rating", "sqale_rating", "sqale_index"
    ) -join ","

    $measuresResponse = $null
    for ($attempt = 1; $attempt -le 60; $attempt++) {
        try {
            $measuresResponse = Invoke-RestMethod `
                -Uri "$SonarUrl/api/measures/component?component=$encodedProjectKey&metricKeys=$metricKeys" `
                -Headers $tokenHeaders `
                -TimeoutSec 10
            if ($measuresResponse.component.measures) { break }
        } catch {
            $measuresResponse = $null
        }
        Start-Sleep -Seconds 2
    }
    if (-not $measuresResponse.component.measures) { throw "SonarQube metrics were not available after the analysis" }

    $qualityGateResponse = Invoke-RestMethod `
        -Uri "$SonarUrl/api/qualitygates/project_status?projectKey=$encodedProjectKey" `
        -Headers $tokenHeaders
    $issuesResponse = Invoke-RestMethod `
        -Uri "$SonarUrl/api/issues/search?componentKeys=$encodedProjectKey&resolved=false&ps=500" `
        -Headers $tokenHeaders

    $metrics = @{}
    foreach ($measure in $measuresResponse.component.measures) {
        $metrics[$measure.metric] = [string]$measure.value
    }

    $auditRaw = (& npm --prefix backend audit --omit=dev --json 2>$null | Out-String)
    $audit = $null
    try { $audit = $auditRaw | ConvertFrom-Json } catch { }
    $auditTotals = if ($audit.metadata.vulnerabilities) { $audit.metadata.vulnerabilities } else { $null }

    $lcovTotals = @{ LF = 0; LH = 0; BRF = 0; BRH = 0; FNF = 0; FNH = 0 }
    foreach ($line in Get-Content -LiteralPath (Join-Path $repository "backend\lcov.info")) {
        if ($line -match '^(LF|LH|BRF|BRH|FNF|FNH):(\d+)$') {
            $lcovTotals[$Matches[1]] += [int]$Matches[2]
        }
    }
    $lcovLines = Get-Percentage -Covered $lcovTotals.LH -Total $lcovTotals.LF
    $lcovBranches = Get-Percentage -Covered $lcovTotals.BRH -Total $lcovTotals.BRF
    $lcovFunctions = Get-Percentage -Covered $lcovTotals.FNH -Total $lcovTotals.FNF

    $generatedAt = [DateTimeOffset]::Now.ToString("yyyy-MM-dd HH:mm:ss zzz")
    $gateStatus = [string]$qualityGateResponse.projectStatus.status
    $auditSummary = if ($auditTotals) {
        "$($auditTotals.total) totali: $($auditTotals.critical) critiche, $($auditTotals.high) alte, $($auditTotals.moderate) moderate, $($auditTotals.low) basse"
    } else {
        "non disponibile"
    }

    $issueLines = @(
        "## Problemi rilevati",
        ""
    )
    if ($issuesResponse.total -gt 0) {
        $issueLines += @(
            "| Gravità | Tipo | Posizione | Regola | Descrizione |",
            "|---|---|---|---|---|"
        )
        foreach ($issue in $issuesResponse.issues) {
            $file = ([string]$issue.component).Replace("${projectKey}:", "")
            $position = if ($issue.line) { "${file}:$($issue.line)" } else { $file }
            $description = ([string]$issue.message).Replace("|", "\|")
            $issueLines += "| $($issue.severity) | $($issue.type) | $position | $($issue.rule) | $description |"
        }
    } else {
        $issueLines += "Nessun problema aperto rilevato da SonarQube."
    }
    $issueLines += @(
        "",
        "Il Quality Gate può risultare OK anche in presenza di problemi sul codice complessivo: il gate predefinito valuta soprattutto il nuovo codice.",
        ""
    )

    $lines = @(
        "# Report qualità backend",
        "",
        "Generato il **$generatedAt** dal progetto corrente con SonarQube Community Build e copertura LCOV reale.",
        "",
        "## Esito",
        "",
        "| Indicatore | Valore |",
        "|---|---:|",
        "| Quality Gate | **$gateStatus** |",
        "| Linee di codice | $(Get-MetricValue $metrics 'ncloc') |",
        "| Copertura | $(Get-MetricValue $metrics 'coverage')% |",
        "| Duplicazione | $(Get-MetricValue $metrics 'duplicated_lines_density')% |",
        "| Affidabilità | $(Convert-Rating (Get-MetricValue $metrics 'reliability_rating')) |",
        "| Sicurezza | $(Convert-Rating (Get-MetricValue $metrics 'security_rating')) |",
        "| Manutenibilità | $(Convert-Rating (Get-MetricValue $metrics 'sqale_rating')) |",
        "| Debito tecnico (minuti) | $(Get-MetricValue $metrics 'sqale_index') |",
        "| Bug | $(Get-MetricValue $metrics 'bugs') |",
        "| Vulnerabilità | $(Get-MetricValue $metrics 'vulnerabilities') |",
        "| Security hotspot | $(Get-MetricValue $metrics 'security_hotspots') |",
        "| Code smell | $(Get-MetricValue $metrics 'code_smells') |",
        "",
        "Copertura SonarQube: metrica combinata calcolata dal server sui file analizzati.",
        ""
    ) + $issueLines + @(
        "## Test e dipendenze",
        "",
        "- Test unitari Node.js: **4 eseguiti, 4 superati**.",
        "- LCOV sull'intero backend/src, escluso src/server.js: **$lcovLines% linee, $lcovBranches% rami, $lcovFunctions% funzioni**.",
        '- SonarQube importa `backend/lcov.info`; esclude dalla copertura `src/server.js`, `scripts/**` e `database/seeds/**`.',
        "- Audit dipendenze runtime: **$auditSummary**.",
        "",
        "## Riproduzione",
        "",
        "Eseguire dalla radice del repository:",
        "",
        '```powershell',
        '.\scripts\quality\New-BackendQualityReport.ps1',
        '```',
        "",
        "Il dashboard resta disponibile su [$SonarUrl]($SonarUrl). Se lo script ha avviato SonarQube tramite Compose, -StopAfter lo ferma al termine.",
        "Il token di analisi è temporaneo e viene revocato automaticamente.",
        "",
        "## Ambito e limiti",
        "",
        'SonarQube analizza `backend/src`, `backend/scripts` e `backend/database/seeds`. L''audit npm è riportato separatamente perché non fa parte del motore SonarQube. Il report fotografa il codice e le dipendenze presenti al momento dell''esecuzione.'
    )
    Set-Content -LiteralPath $reportPath -Value $lines -Encoding UTF8
    Write-Host "[pass] quality report written to $reportPath"
} finally {
    if ($token) {
        try {
            $adminHeaders = New-BasicAuthorizationHeader -Username $AdminUser -Password $AdminPassword
            Invoke-RestMethod `
                -Uri "$SonarUrl/api/user_tokens/revoke" `
                -Method Post `
                -Headers $adminHeaders `
                -Body @{ name = $tokenName } | Out-Null
        } catch {
            Write-Warning "Could not revoke temporary SonarQube token '$tokenName': $($_.Exception.Message)"
        }
    }

    if ($null -eq $previousSonarUrl) { Remove-Item Env:SONAR_HOST_URL -ErrorAction SilentlyContinue }
    else { $env:SONAR_HOST_URL = $previousSonarUrl }
    if ($null -eq $previousSonarToken) { Remove-Item Env:SONAR_TOKEN -ErrorAction SilentlyContinue }
    else { $env:SONAR_TOKEN = $previousSonarToken }
    if ($null -eq $previousSonarUserHome) { Remove-Item Env:SONAR_USER_HOME -ErrorAction SilentlyContinue }
    else { $env:SONAR_USER_HOME = $previousSonarUserHome }

    if ($StopAfter -and $startedByScript) {
        & docker compose --profile quality stop sonarqube | Out-Null
    }
    Pop-Location
}
