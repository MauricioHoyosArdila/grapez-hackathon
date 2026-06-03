# DEPLOY.md — Instrucciones de Despliegue

> Referenciado desde CLAUDE.md. Actualizado: junio 2026.
> Proyecto GCP: `grapez-ecosistema-medicion` | Región: `us-central1`

---

## Servicios en producción

| Servicio | URL | Qué es |
|---|---|---|
| **Frontend** | `https://grapez-frontend-493646362074.us-central1.run.app` | Next.js — Cloud Run `grapez-frontend` |
| **Agent Runtime** | ID `4586839804418719744` | Planner Agent — Vertex AI Reasoning Engine |
| **Brave MCP Server** | `https://brave-mcp-server-493646362074.us-central1.run.app` | Cloud Run `brave-mcp-server` |

---

## 1. Deploy del Agente (Agent Runtime)

### Primera vez
```powershell
.\.venv\Scripts\Activate.ps1
.\scripts\deploy-agents.ps1
# Copia el Agent Engine ID del output y agrégalo a .env como PLANNER_AGENT_ENGINE_ID=<id>
```

### Actualizar agente existente
```powershell
.\.venv\Scripts\Activate.ps1
.\scripts\deploy-agents.ps1 -UpdateExisting
```

**Qué hace el script:**
1. Copia `agents/`, `agent.py`, `requirements.txt` a directorio temporal limpio (sin `.git`)
2. Lee `.env` y filtra solo las variables necesarias para Agent Runtime (excluye SESSION_SECRET, credenciales frontend, etc.)
3. Ejecuta `adk deploy agent_engine` con `--agent_engine_id` si `-UpdateExisting`
4. Limpia el directorio temporal

**Tiempo:** ~5-10 minutos

**Variables que llegan al Agent Runtime** (verificar con):
```powershell
$token = gcloud auth print-access-token
Invoke-RestMethod -Uri "https://us-central1-aiplatform.googleapis.com/v1beta1/projects/grapez-ecosistema-medicion/locations/us-central1/reasoningEngines/4586839804418719744" -Headers @{Authorization = "Bearer $token"} | Select-Object -ExpandProperty spec | Select-Object -ExpandProperty deploymentSpec | Select-Object -ExpandProperty env
```

---

## 2. Deploy del Frontend (Cloud Run)

```powershell
cd frontend

gcloud run deploy grapez-frontend `
  --source . `
  --region us-central1 `
  --project grapez-ecosistema-medicion `
  --allow-unauthenticated `
  --env-vars-file .env.cloudrun.yaml
```

**Tiempo:** ~5-8 minutos (Buildpacks detecta Next.js automáticamente)

**Variables de entorno:** definidas en `frontend/.env.cloudrun.yaml` (no commitear con secretos reales — el archivo actual tiene referencias a Secret Manager o valores de entorno).

---

## 3. Deploy del Brave MCP Server (Cloud Run)

```powershell
cd brave_mcp_server   # o desde la raíz:

gcloud run deploy brave-mcp-server `
  --source ./brave_mcp_server `
  --region us-central1 `
  --project grapez-ecosistema-medicion `
  --update-secrets="BRAVE_API_KEY=BRAVE_API_KEY:latest" `
  --no-allow-unauthenticated
```

**Tiempo:** ~3-5 minutos

**IAM del MCP server** (permite que Agent Runtime lo invoque):
```powershell
gcloud run services get-iam-policy brave-mcp-server --region us-central1 --project grapez-ecosistema-medicion
# Debe incluir: allAuthenticatedUsers, service-493646362074@gcp-sa-aiplatform.iam.gserviceaccount.com
```

---

## 4. Actualizar secretos en Secret Manager

### BRAVE_API_KEY (sin BOM — importante en Windows)
```powershell
$braveKey = (Get-Content ".env" | Select-String "^BRAVE_API_KEY=").ToString().Split("=",2)[1].Trim()
$tempFile = "$env:TEMP\brave_key_nobom.txt"
# UTF-8 sin BOM — PowerShell 5.1 agrega BOM con -Encoding UTF8, esto lo evita
[System.IO.File]::WriteAllText($tempFile, $braveKey, [System.Text.UTF8Encoding]::new($false))
gcloud secrets versions add BRAVE_API_KEY --data-file=$tempFile --project=grapez-ecosistema-medicion
Remove-Item $tempFile
```

> **ADVERTENCIA:** No usar `$key | gcloud secrets versions add ... --data-file=-` en PowerShell 5.1.
> El pipe incluye un UTF-8 BOM (`﻿`) que corrompe el valor del secreto.

---

## 5. Verificar el estado del sistema

### Logs del Agent Runtime (últimos errores)
```powershell
gcloud logging read "resource.type=aiplatform.googleapis.com/ReasoningEngine" --limit=20 --project=grapez-ecosistema-medicion --freshness=30m --format="table(timestamp,textPayload)"
```

### Logs del MCP server
```powershell
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=brave-mcp-server" --limit=15 --project=grapez-ecosistema-medicion --freshness=10m --format="table(timestamp,textPayload)"
```

### Logs del frontend
```powershell
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=grapez-frontend" --limit=15 --project=grapez-ecosistema-medicion --freshness=10m --format="table(timestamp,textPayload)"
```

---

## 6. Orden correcto para un deploy completo (primera vez en una máquina nueva)

1. Configurar ADC: `gcloud auth application-default login`
2. Configurar proyecto: `gcloud config set project grapez-ecosistema-medicion`
3. Crear/actualizar secretos en Secret Manager (BRAVE_API_KEY)
4. Deploy Brave MCP Server → obtener URL
5. Deploy Agent Runtime → obtener Agent Engine ID → actualizar `.env`
6. Deploy Frontend

---

## 7. Errores comunes y soluciones

| Error | Causa | Fix |
|---|---|---|
| Agent Runtime retorna body vacío (len=0) | Sesión no creada o endpoint `v1` en vez de `v1beta1` | Verificar URL usa `/v1beta1/` y sesión se crea antes de `streamQuery` |
| `asyncio.run() cannot be called from a running event loop` | Llamar `asyncio.run()` dentro de coroutine ADK | Usar `async def` + `await` o `run_in_executor` |
| `unhandled errors in a TaskGroup` | `anyio.TaskGroup` de MCP en conflicto con event loop de ADK | Usar `loop.run_in_executor(None, _run_mcp_in_thread, ...)` |
| MCP server retorna `421 Misdirected Request` | FastMCP rechaza el Host header de Cloud Run | `_CloudRunHostMiddleware` reescribe Host a `localhost:{PORT}` |
| `'ascii' codec can't encode '﻿'` | BRAVE_API_KEY guardada con UTF-8 BOM de PowerShell | Re-crear secreto con `UTF8Encoding(false)` (ver sección 4) |
| `MALFORMED_FUNCTION_CALL: display_a2ui_card()` | Gemini inventa función para A2UI en vez de emitir JSON | Agregar regla explícita en instruction: "A2UI son texto plano, no funciones" |
| Session create 400: `Unknown name "session_id"` | Agent Runtime no acepta IDs personalizados | Crear sesión sin `session_id` en el body; usar el ID asignado por el servidor |
