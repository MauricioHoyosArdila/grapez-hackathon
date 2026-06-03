# deploy-frontend.ps1 — Deploy Grapez Frontend to Cloud Run
#
# Uso:
#   .\scripts\deploy-frontend.ps1
#
# Requisitos:
#   - gcloud autenticado con plataformas@grapezstudio.com
#   - frontend/.env.cloudrun.yaml actualizado con los valores correctos
#
# Variables de entorno cargadas desde frontend/.env.cloudrun.yaml:
#   AGENT_MODE, PLANNER_AGENT_ENGINE_ID, AGENT_ENGINE_REGION,
#   AGENT_ENGINE_PROJECT, SESSION_SECRET, GOOGLE_CLIENT_ID,
#   GOOGLE_CLIENT_SECRET, OAUTH_REDIRECT_URI, NEXT_PUBLIC_APP_URL
#
# Si agregas una nueva variable de entorno al frontend:
#   1. Agrégala a frontend/.env.local (desarrollo local)
#   2. Agrégala a frontend/.env.cloudrun.yaml (producción Cloud Run)
#   3. Corre este script para que el cambio llegue a producción

$ErrorActionPreference = "Stop"
$ProjectRoot  = Split-Path -Parent $PSScriptRoot
$FrontendDir  = Join-Path $ProjectRoot "frontend"
$EnvYaml      = Join-Path $FrontendDir ".env.cloudrun.yaml"
$ServiceName  = "grapez-frontend"
$Region       = "us-central1"
$Project      = "grapez-ecosistema-medicion"

Write-Host ""
Write-Host "=== Grapez Frontend Deploy ===" -ForegroundColor Cyan
Write-Host "Servicio : $ServiceName"
Write-Host "Region   : $Region"
Write-Host "Proyecto : $Project"
Write-Host "Fuente   : $FrontendDir"
Write-Host ""

# ── Verificar que .env.cloudrun.yaml existe y tiene contenido ─────────────────
if (-not (Test-Path $EnvYaml)) {
    Write-Host "ERROR: No se encontró frontend/.env.cloudrun.yaml" -ForegroundColor Red
    Write-Host "Crea el archivo con las variables requeridas antes de deployar." -ForegroundColor Red
    exit 1
}

$envVarCount = (Get-Content $EnvYaml | Where-Object { $_ -match "^\w" }).Count
Write-Host "[1/2] Variables de entorno encontradas en .env.cloudrun.yaml: $envVarCount" -ForegroundColor Yellow
Get-Content $EnvYaml | Where-Object { $_ -match "^\w" } | ForEach-Object {
    $key = $_.Split(":")[0].Trim()
    Write-Host "  $key"
}
Write-Host ""

# ── Deploy a Cloud Run con buildpacks (sin Dockerfile) ────────────────────────
Write-Host "[2/2] Deployando a Cloud Run (3-5 minutos)..." -ForegroundColor Yellow
Write-Host ""

# Forzar UTF-8 para evitar errores de encoding en Windows
$env:PYTHONUTF8 = "1"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$prevLocation = Get-Location
Set-Location $FrontendDir

try {
    gcloud run deploy $ServiceName `
        --source . `
        --region=$Region `
        --project=$Project `
        --env-vars-file=".env.cloudrun.yaml" `
        --allow-unauthenticated `
        --quiet

    $deployExitCode = $LASTEXITCODE
} finally {
    Set-Location $prevLocation
}

Write-Host ""
if ($deployExitCode -eq 0) {
    Write-Host ">> Deploy completado exitosamente." -ForegroundColor Green
    Write-Host ""
    Write-Host "URL: https://grapez-frontend-493646362074.us-central1.run.app" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Recuerda: si cambias variables de entorno localmente," -ForegroundColor Yellow
    Write-Host "actualiza frontend/.env.cloudrun.yaml y redeploya." -ForegroundColor Yellow
} else {
    Write-Host ">> Deploy falló (exit code $deployExitCode)." -ForegroundColor Red
    exit $deployExitCode
}
