# deploy-agents.ps1 — Deploy Grapez Analytics Agents to Agent Runtime
#
# Uso:
#   .\scripts\deploy-agents.ps1
#   .\scripts\deploy-agents.ps1 -UpdateExisting   # actualiza un deploy existente
#
# Requisitos:
#   - .venv activo (o adk en el PATH)
#   - .env configurado con GOOGLE_CLOUD_PROJECT y GOOGLE_CLOUD_LOCATION
#   - gcloud autenticado con la cuenta correcta
#
# Por qué existe este script:
#   ADK deploy agent_engine en Windows copia .git al temp folder y falla al limpiarlo
#   porque los objetos de git son read-only. Este script crea un paquete limpio sin
#   .git, ejecuta el deploy, y limpia el temp folder correctamente.

param(
    [switch]$UpdateExisting
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DeployDir = Join-Path $env:TEMP "grapez_agent_deploy"
$EnvFile = Join-Path $ProjectRoot ".env"

# ── Leer .env para mostrar configuración ──────────────────────────────────────
$project = (Get-Content $EnvFile | Select-String "^GOOGLE_CLOUD_PROJECT=").ToString().Split("=",2)[1]
$region  = (Get-Content $EnvFile | Select-String "^GOOGLE_CLOUD_LOCATION=").ToString().Split("=",2)[1]

Write-Host ""
Write-Host "=== Grapez Agent Deploy ===" -ForegroundColor Cyan
Write-Host "Proyecto : $project"
Write-Host "Region   : $region"
Write-Host "Fuente   : $ProjectRoot"
Write-Host ""

# ── Paso 1: Crear paquete limpio sin .git ─────────────────────────────────────
Write-Host "[1/4] Preparando paquete de deploy..." -ForegroundColor Yellow

if (Test-Path $DeployDir) {
    # Forzar escritura antes de borrar (fix para objetos read-only de .git)
    Get-ChildItem -Path $DeployDir -Recurse -Force |
        Where-Object { -not $_.PSIsContainer } |
        ForEach-Object { $_.Attributes = "Normal" }
    Remove-Item -Recurse -Force $DeployDir
}
New-Item -ItemType Directory -Path $DeployDir | Out-Null

# Copiar archivos del agente (sin .git, .venv, frontend, etc.)
$items = @("agents", "agent.py", "requirements.txt")
foreach ($item in $items) {
    $src = Join-Path $ProjectRoot $item
    $dst = Join-Path $DeployDir $item
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  copiado: $item"
    } else {
        Write-Warning "  no encontrado: $item"
    }
}

# Generar .env limpio: solo variables no-vacias que el agente necesita en produccion.
# Agent Runtime rechaza env vars con value="" (400 INVALID_ARGUMENT).
# Variables excluidas: frontend (SESSION_SECRET, NEXT_PUBLIC_*), dev-only (TEST_*),
# infra no usada en runtime (FIRESTORE_DATABASE, GOOGLE_APPLICATION_CREDENTIALS),
# variables que se asignan despues del deploy (PLANNER_AGENT_ENGINE_ID, DEMO_*).
$excludePrefix = @(
    "SESSION_SECRET", "ENCRYPTION_KEY", "NEXT_PUBLIC_", "OAUTH_REDIRECT_URI",
    "TEST_ACCESS_TOKEN", "TEST_REFRESH_TOKEN", "FIRESTORE_DATABASE",
    "GOOGLE_APPLICATION_CREDENTIALS", "PLANNER_AGENT_ENGINE_ID",
    "AGENT_ENGINE_", "DEMO_", "GOOGLE_GEMINI_API_KEY"
)

$cleanEnvLines = Get-Content $EnvFile | Where-Object {
    # Excluir comentarios y lineas vacias
    if ($_ -match "^#" -or $_ -match "^\s*$") { return $false }
    # Excluir variables sin valor (KEY= sin nada despues)
    if ($_ -match "^[^=]+=\s*$") { return $false }
    # Excluir variables de frontend/dev-only
    foreach ($prefix in $excludePrefix) {
        if ($_.StartsWith($prefix)) { return $false }
    }
    return $true
}

$cleanEnvPath = Join-Path $DeployDir ".env"
$cleanEnvLines | Set-Content $cleanEnvPath -Encoding UTF8
Write-Host "  generado: .env ($($cleanEnvLines.Count) variables para Agent Runtime)"

# ── Paso 2: Determinar flags del deploy ───────────────────────────────────────
Write-Host ""
Write-Host "[2/4] Configurando deploy..." -ForegroundColor Yellow

$deployArgs = @(
    "deploy", "agent_engine", $DeployDir,
    "--project", $project,
    "--region", $region,
    "--display_name", "Grapez Analytics Agent",
    "--trace_to_cloud"
)

# Si hay un Agent Engine ID existente en .env, actualiza en vez de crear nuevo
if ($UpdateExisting) {
    $existingId = (Get-Content $EnvFile | Select-String "^PLANNER_AGENT_ENGINE_ID=").ToString().Split("=",2)[1]
    if ($existingId -and $existingId.Trim() -ne "") {
        $deployArgs += @("--agent_engine_id", $existingId.Trim())
        Write-Host "  Actualizando Agent Engine ID: $existingId"
    } else {
        Write-Warning "  -UpdateExisting pasado pero PLANNER_AGENT_ENGINE_ID no encontrado en .env. Creando nuevo."
    }
}

# ── Paso 3: Ejecutar deploy ────────────────────────────────────────────────────
Write-Host ""
Write-Host "[3/4] Ejecutando adk deploy (5-10 minutos)..." -ForegroundColor Yellow
Write-Host ""

$adk = Join-Path $ProjectRoot ".venv\Scripts\adk.exe"
if (-not (Test-Path $adk)) { $adk = "adk" }  # fallback a PATH

& $adk @deployArgs
$deployExitCode = $LASTEXITCODE

# ── Paso 4: Limpiar temp (forzando escritura primero) ─────────────────────────
Write-Host ""
Write-Host "[4/4] Limpiando directorio temporal..." -ForegroundColor Yellow

if (Test-Path $DeployDir) {
    Get-ChildItem -Path $DeployDir -Recurse -Force |
        Where-Object { -not $_.PSIsContainer } |
        ForEach-Object { $_.Attributes = "Normal" }
    Remove-Item -Recurse -Force $DeployDir
    Write-Host "  Limpieza completada."
}

# ── Resultado ─────────────────────────────────────────────────────────────────
Write-Host ""
if ($deployExitCode -eq 0) {
    Write-Host ">> Deploy completado exitosamente." -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximo paso: copia el Agent Engine ID del output de arriba"
    Write-Host "y agregalo a .env como PLANNER_AGENT_ENGINE_ID=<id>" -ForegroundColor Cyan
} else {
    Write-Host ">> Deploy fallo (exit code $deployExitCode). Revisa el output de arriba." -ForegroundColor Red
    exit $deployExitCode
}
