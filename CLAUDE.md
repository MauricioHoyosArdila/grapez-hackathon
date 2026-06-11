# CLAUDE.md — Grapez Analytics Agents
## Google for Startups AI Agents Challenge — Hackathon 2026

> **Deadline**: Junio 5, 2026 — **5:00 PM PT** | **Estado detallado**: `STATE.md`

---

## 1. Qué es este proyecto

**Grapez Analytics Agents** es un sistema multi-agente que permite a consultores de Grapez Studio conectar la cuenta Google de un cliente y diagnosticar + configurar automáticamente su ecosistema completo de marketing analytics:

- **Google Analytics 4** — auditoría de configuración, eventos, conversiones, dimensiones
- **Google Tag Manager** — contenedores, tags, triggers, variables, dataLayer
- **Sitio web del cliente** — detección de implementaciones existentes via crawl con Playwright

El sistema no solo diagnostica: **genera un plan de implementación y lo ejecuta** usando APIs nativas (lectura + escritura completa), reportando cada acción al consultor via UI dinámica (A2UI).

### Por qué existe
El servicio "Ecosistema de Medición" de Grapez tarda 2-3 semanas por cliente con trabajo manual intensivo. Este sistema lo reduce a 1-2 días con supervisión humana. Meta: atender 10x más clientes con el mismo equipo.

### Alcance para el hackathon
- **Uso interno** de Grapez Studio primero (consultores reales, cuentas reales de clientes)
- Arquitectura diseñada para escalar a SaaS público con cambios mínimos
- Demo con datos reales: GA4 Demo Account (Google oficial) + propiedad de prueba "TiendaDemo"

---

## 2. Reglas del Hackathon (leer antes de construir)

**Concurso**: Google for Startups AI Agents Challenge (Devpost)
**Deadline**: 5 de junio 2026, **5:00 PM PT** ← reglas oficiales sección 4 (¡no 11:59 PM!)
**Repositorio**: debe ser público en GitHub al momento del submit

### Requisitos técnicos obligatorios
- [x] Usar **Gemini API** (directo o via Vertex AI) — `gemini-2.5-flash` via Vertex AI
- [x] Usar **ADK** (Agent Development Kit) — `google-adk==2.1.0`
- [x] Desplegar en **Google Cloud Platform** — Agent Engine (agentes) + Cloud Run (frontend, Playwright Service, Brave MCP Server)
- [x] Proyecto **nuevo** (no adaptación de proyecto existente)

### Criterios de evaluación (total 100 pts)
| Criterio | Peso | Qué buscan |
|---|---|---|
| Technical Implementation | 30% | Multi-agent, herramientas reales, arquitectura sólida |
| Business Case | 30% | ROI real, problema real, usuarios reales |
| Innovation | 20% | Uso creativo de ADK/A2UI/Agent Engine |
| Demo | 20% | Video 1-2 min claro y convincente |

### Entregables requeridos (reglas oficiales — sección 6 del PDF)
- [ ] Video demo **1-2 minutos** — **en inglés o con subtítulos en inglés** (solo se evalúan los primeros 2 min)
- [ ] Repositorio GitHub **público** al momento del submit
- [ ] Diagrama de arquitectura — requerido **en el texto de Devpost** (no solo en `/architecture/`)
- [ ] Descripción Devpost **en inglés**: resumen, features, tecnologías, fuentes de datos, arquitectura, aprendizajes
- [ ] Link a demo accesible para jueces + testing instructions en inglés (URL + credenciales si es privado)
- [ ] **Mauro y Juan Camilo** ambos registrados como team members en Devpost for Teams

### MCP — obligatorio en Track 1
Track 1 exige explícitamente: *"Show us how your agent uses the **Model Context Protocol (MCP)** to securely connect to external tools."*

- **[INTEGRADO]** **Brave Search MCP Server propio** deployado en Cloud Run (`brave_mcp_server/` — FastMCP + Streamable HTTP, autenticado con Google OIDC identity tokens). La tool `brave_web_search` del Planner ([agents/planner_agent/tools/brave_search.py](agents/planner_agent/tools/brave_search.py)) abre una `ClientSession` MCP por request; si el MCP server no responde, hace fallback HTTP directo a la Brave API. El Planner lo usa en el PASO 1 para investigar el negocio del cliente antes del diagnóstico.
- **[DESCARTADO]** skill `analytics-tracking` de MCP Market — no se integró; el requisito MCP del Track 1 lo cubre el Brave MCP Server
- Documentar en Devpost: *"We deployed our own MCP server (Brave Search, Streamable HTTP on Cloud Run, secured with Google OIDC) which the Planner Agent connects to via the MCP Python client to research the client's business context before running any diagnostic."*

### Premio — contexto Colombia
| Premio | Monto | Cómo ganar |
|---|---|---|
| **Overall Grand Prize** | $15K USD + $10K GCP credits | Proyecto con mayor puntaje global |
| **Best of Track 1** | $10K USD + $7.5K GCP credits | Mejor proyecto en Track 1 (Build) |
| Regional Winners | $5K USD + $2.5K GCP | Solo APAC y EMEA — Colombia **no aplica** |

Objetivo: **Best of Track 1** + aspirar a **Overall Grand Prize**.

### Lo que maximiza el score
- MCP integration (analytics-tracking skill) → Technical Implementation + **(obligatorio Track 1)**
- A2UI renderer custom + protocolo A2UI → Innovation +
- A2A Protocol implementado en el agente → Innovation + Technical Implementation +
- Agent Engine deploy + SSE streaming → Technical Implementation +
- Múltiples agentes especializados con tools reales de escritura (GA4/GTM/Ads) → Technical Implementation +
- Datos reales de Grapez Studio en el demo → Business Case +

---

## 3. Stack Técnico

### Backend — Agentes (deployados en Vertex AI Agent Engine, ID `4586839804418719744`)
| Tecnología | Versión / Detalles | Para qué |
|---|---|---|
| **Python** | 3.11+ | Lenguaje de todos los agentes |
| **Google ADK** | `google-adk==2.1.0` | Framework de agentes — `LlmAgent` + `AgentTool` + plain function tools |
| **Gemini 2.5 Flash** | `gemini-2.5-flash` via Vertex AI | Modelo de los 4 agentes (ver 19.3 — 3.5 aún no disponible en el proyecto) |
| **Vertex AI Agent Engine** | deploy via `adk deploy agent_engine` | Hosting de los agentes (script: `scripts/deploy-agents.ps1`) |
| **mcp** | ≥1.27.2 | Cliente MCP — conexión al Brave MCP Server |
| **httpx** | ≥0.27.0 | Llamadas HTTP al Playwright Service |
| **google-analytics-admin** | ≥0.22.0 | GA4 Admin API (read+write) |
| **google-analytics-data** | ≥0.18.0 | GA4 Data API (read) |
| **google-api-python-client** | ≥2.126.0 | GTM API v2 (read+write) |
| **google-auth** | ≥2.29.0 | OAuth2 con refresh tokens |

### Microservicios (Cloud Run — 3 servicios activos en `us-central1`)
| Servicio | Stack | Para qué |
|---|---|---|
| **grapez-frontend** | Next.js 16 (source deploy con buildpacks) | UI del consultor — `https://grapez-frontend-493646362074.us-central1.run.app` |
| **playwright-service** | FastAPI + Uvicorn + Playwright/Chromium (Docker `mcr.microsoft.com/playwright/python:v1.59.0-noble`) | Crawl, screenshots y detección de tracking del sitio del cliente — endpoints `/screenshot`, `/analyze`, `/crawl_site`, `/health` |
| **brave-mcp-server** | FastMCP + Streamable HTTP | MCP server propio para Brave Search (requisito MCP Track 1) |

### Frontend
| Tecnología | Versión | Para qué |
|---|---|---|
| **Next.js** | 16.2.6 App Router | Frontend principal |
| **React** | 19.2.4 | UI |
| **TypeScript** | 5+ | Tipado |
| **Tailwind CSS** | 4 | Estilos |
| **iron-session** | 8.0.4 | Tokens OAuth + clientes creados en cookie cifrada |
| **A2UI Client** | renderer custom (ver sección 7) | Renderizar UI dinámica del agente — 6 tipos de componente |
| **undici** | ≥7 | Dispatcher sin timeouts para el streaming SSE del Agent Engine |

> **NO se usan en producción**: Firestore y Secret Manager. Quedaron descartados para el demo —
> los tokens OAuth y los clientes creados viven en la cookie iron-session (ver 19.8 y 19.13).
> Las dependencias `google-cloud-firestore` / `google-cloud-secret-manager` siguen en
> requirements.txt pero ningún código las invoca.

### APIs externas (Google)
| API | Scopes OAuth | Operaciones |
|---|---|---|
| GA4 Admin API | `analytics.edit` | Leer/crear propiedades, streams, eventos, conversiones |
| GA4 Data API | `analytics.readonly` | Leer reportes, dimensiones, métricas |
| GTM API | `tagmanager.edit.containers` | Leer/crear tags, triggers, variables, versiones |

### Scopes OAuth consolidados (pedir todos juntos)
```
https://www.googleapis.com/auth/analytics.edit
https://www.googleapis.com/auth/analytics.readonly
https://www.googleapis.com/auth/tagmanager.edit.containers
https://www.googleapis.com/auth/tagmanager.edit.containerversions
https://www.googleapis.com/auth/tagmanager.publish
```

> `tagmanager.edit.containerversions` es obligatorio para `create_version` — GTM separa
> la gestión de versiones del scope de edición. Sin él la API devuelve "Insufficient
> Permission" aunque la cuenta sea propietaria del contenedor (detectado jun 10, 2026).

---

## 4. Arquitectura del Sistema

> **Estado al 10 junio 2026** — TODO DEPLOYADO Y FUNCIONANDO end-to-end.
> Leyenda: ✅ Implementado y en producción

```
┌─────────────────────────────────────────────────────────────────────┐
│   FRONTEND Next.js 16 ✅ — Cloud Run: grapez-frontend               │
│   https://grapez-frontend-493646362074.us-central1.run.app                   │
│   OAuth iron-session + Chat UI SSE + A2UIRenderer (6 componentes)   │
│   app/dev/tokens/ para testing local                                │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ ✅ HTTP/SSE → streamQuery del Agent Engine
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│   VERTEX AI AGENT ENGINE ✅ — ID 4586839804418719744 (us-central1)  │
│   PLANNER AGENT (gemini-2.5-flash)                                  │
│   LlmAgent + AgentTool (GA4/GTM/Web) + brave_web_search (MCP)       │
│   + screenshot_site / crawl_site (→ Playwright Service)             │
│   5 tools propias: get_session_info, load_client_tokens,            │
│   set_business_context, set_audit_mode, confirm_action              │
│   (ideal_spec y ga4_findings se guardan solos via output_key)       │
└──────┬────────────┬───────────────┬───────────────┬─────────────────┘
       │ AgentTool  │ AgentTool     │ AgentTool     │ MCP client (per-request)
       ▼            ▼               ▼               ▼
  ┌──────────┐ ┌──────────┐  ┌──────────────┐  ┌──────────────────┐
  │ GA4 ✅   │ │ GTM ✅   │  │ WEB ANALYZER │  │ brave-mcp-server │
  │ 13 read  │ │ 10 read  │  │ ✅ 2 tools:  │  │ ✅ Cloud Run     │
  │  3 write │ │ 10 write │  │ screenshot_  │  │ FastMCP +        │
  │  1 shared│ │  2 shared│  │ site,        │  │ Streamable HTTP  │
  │  total:17│ │  total:22│  │ analyze_site │  │ + OIDC auth      │
  └──────┬───┘ └──────┬───┘  └──────┬───────┘  └──────────────────┘
         │            │             │ HTTP POST
    GA4 Admin API  GTM API    ┌─────▼──────────────┐
    GA4 Data API   v2 Python  │ playwright-service │
    (google-analytics-        │ ✅ Cloud Run       │
     admin/data)              │ FastAPI + Chromium │
                              │ /screenshot        │
    Tokens via                │ /analyze           │
    ToolContext.state         │ /crawl_site        │
    ← iron-session (frontend) └────────────────────┘

[DESCARTADO DEL SCOPE]: Implementation Agent — las operaciones write
están directamente en GA4 Agent y GTM Agent, activadas por confirm_action()
[DESCARTADO DEL SCOPE]: Firestore y Secret Manager — no se usan; tokens y
clientes viven en la cookie iron-session (ver 19.8 y 19.13)
```

### Flujo actual (producción end-to-end; también local con `adk web agents/planner_agent`)
1. Consultor abre chat → Planner recibe objetivo + tokens OAuth via initialState
2. Planner investiga en silencio: brave_web_search (MCP) + crawl_site (Playwright Service)
3. Planner presenta mapa del sitio (tabla A2UI + image_card con screenshot real) y mapea
   el funnel de conversión con choice_cards (screenshot_site automático por cada URL mencionada)
4. Planner confirma modo de trabajo (choice_card) → set_audit_mode()
5. Planner llama web_analyzer_tool → analyze_site detecta GTM ID, GA4 ID y dataLayer reales
   → la respuesta (current_state + ideal_spec) se guarda sola en state via output_key
6. Planner llama ga4_tool → diagnóstico completo con GA4 Admin API + Data API reales
   → findings se guardan solos en state via output_key
7. Planner llama gtm_tool → GTM Agent lee ideal_spec + GA4 findings del state
   (get_ideal_spec_from_state / get_ga4_findings_from_state) → gap analysis cruzado
8. Planner consolida → genera tabla A2UI + action cards con hallazgos
9. Si modo implementación: consultor confirma acción → confirm_action() setea flag
10. GA4/GTM Agent ejecuta write operation con verificación del flag
11. Reporte final A2UI summary_card

### Playwright Service — ✅ construido y deployado
Agent Engine no tiene Chromium (sandbox Python puro). Solución en producción:
- **Web Analyzer Agent** (y el Planner directamente para screenshots/crawl) llaman via
  HTTP POST al **Playwright Service** en Cloud Run (`playwright_service/`)
- **Stack**: FastAPI + Uvicorn + Playwright, imagen `mcr.microsoft.com/playwright/python:v1.59.0-noble`
- **Endpoints**: `/screenshot` (screenshot + elementos interactivos), `/analyze` (GTM/GA4 IDs,
  dataLayer, errores de tracking), `/crawl_site` (home + hasta 6 páginas internas priorizadas
  por señales de conversión), `/screenshots/{id}` (sirve los PNG), `/health`
- URL: `https://playwright-service-hgsyggbcaq-uc.a.run.app` (env `PLAYWRIGHT_SERVICE_URL`)

---

## 5. Los 4 Agentes — Especificación Implementada

> **Nota**: Implementation Agent descartado del scope del hackathon. Las operaciones write están en GA4 Agent y GTM Agent, activadas via `confirm_action()` del Planner.

### 5.1 Planner Agent (Orchestrador) ✅
**Archivo**: [agents/planner_agent/agent.py](agents/planner_agent/agent.py)
**Modelo**: `gemini-2.5-flash`
**Rol**: Punto de entrada. Conduce al consultor por un flujo de 5 pasos (los mismos que ve el consultor, en inglés en la UI): (1) conocer tu negocio — investigación con Brave + crawl + mapeo del funnel, (2) decidir cómo trabajamos — modo + scope GA4/GTM, (3) revisar tu medición — web analyzer + GA4 + GTM, (4) resultados — tabla A2UI + action cards, (5) mejoras y resumen final.

**Herramientas propias** (en [agents/planner_agent/tools/client_tools.py](agents/planner_agent/tools/client_tools.py)):
- `get_session_info()` — verifica presencia de tokens OAuth en session.state
- `load_client_tokens(access_token, refresh_token)` — carga tokens en session.state
- `set_business_context(business_type, website_url, key_conversions)` — tipos válidos: ecommerce, lead_generation, saas, marketplace, media, otro
- `set_audit_mode(mode)` — "auditoria" (solo lectura) o "auditoria_implementacion"
- `confirm_action(action_description)` — setea `implementation_confirmed=True` en state

> **Nota (jun 10, 2026)**: `save_ideal_spec` y `save_ga4_findings` fueron **eliminadas**.
> Pasar el diagnóstico completo como argumento de función producía "Malformed function call"
> en Gemini (strings grandes rompen el function calling). Ahora GA4 Agent tiene
> `output_key="ga4_findings"` y Web Analyzer `output_key="ideal_spec"` — ADK guarda su
> respuesta final en `session.state` automáticamente y `AgentTool` propaga el state_delta
> a la sesión del Planner. GTM/GA4 lo leen con las tools de `agents/shared/state_tools.py`.

**Sub-agentes como AgentTool**:
- `ga4_tool = AgentTool(agent=ga4_agent)` — GA4 completo
- `gtm_tool = AgentTool(agent=gtm_agent)` — GTM completo
- `web_analyzer_tool = AgentTool(agent=web_analyzer_agent)` — generador de ideal_spec

**Tools directas adicionales del Planner**:
- `brave_web_search(query)` ([tools/brave_search.py](agents/planner_agent/tools/brave_search.py)) — cliente MCP per-request al Brave MCP Server en Cloud Run (Streamable HTTP + OIDC), con fallback HTTP directo a la Brave API en desarrollo local
- `screenshot_site(url)` y `crawl_site(url)` (de [web_analyzer_agent/tools/playwright_tools.py](agents/web_analyzer_agent/tools/playwright_tools.py)) — el Planner las usa directamente en el Paso 1 para la investigación previa y el mapeo del funnel con screenshots reales

---

### 5.2 GA4 Agent ✅
**Archivo**: [agents/ga4_agent/agent.py](agents/ga4_agent/agent.py)
**Modelo**: `gemini-2.5-flash`
**Rol**: Diagnóstico completo y configuración de Google Analytics 4. Analiza UNA propiedad a la vez (restricción en instruction).

**Herramientas de lectura** ([agents/ga4_agent/tools/ga4_admin_tools.py](agents/ga4_agent/tools/ga4_admin_tools.py) + [ga4_data_tools.py](agents/ga4_agent/tools/ga4_data_tools.py)):
```python
list_accounts()                              # GA4 Admin API
list_properties(account_id)
get_property_details(property_id)
list_data_streams(property_id)
check_enhanced_measurement(property_id, stream_id)
list_conversions(property_id)
list_custom_dimensions(property_id)
list_custom_metrics(property_id)
list_audiences(property_id)
get_data_retention_settings(property_id)
get_events_last_30_days(property_id)         # GA4 Data API — top 50 eventos
check_data_freshness(property_id)            # últimos 7 días, detecta si tracking está activo
get_conversion_report(property_id)           # conversiones con sesiones + usuarios (30 días)
```

**Herramientas de escritura** (requieren `implementation_confirmed=True` en state):
```python
create_conversion_event(property_id, event_name)
create_custom_dimension(property_id, display_name, parameter_name, scope, description)
update_data_retention(property_id, months)   # 2 o 14 meses
```

**Herramienta compartida** ([agents/shared/state_tools.py](agents/shared/state_tools.py)):
```python
get_ideal_spec_from_state()  # lee session.state["ideal_spec"] para gap analysis
```

**Guardrails implementados**:
- Todas las write tools verifican `implementation_confirmed` flag antes de ejecutar
- El flag se consume al TERMINAR la invocación del sub-agente (`ConfirmationScopedAgentTool`
  en [agents/shared/confirmation_scoped_agent_tool.py](agents/shared/confirmation_scoped_agent_tool.py)) —
  una confirmación = una acción completa, que puede encadenar varias escrituras
  (ej. GTM: workspace + variables + triggers + tags en una sola confirmación)
- Límites GA4 enforced en instruction: event names ≤40 chars, max 25 params/evento, 50 custom dims event-scoped

---

### 5.3 GTM Agent ✅
**Archivo**: [agents/gtm_agent/agent.py](agents/gtm_agent/agent.py)
**Modelo**: `gemini-2.5-flash`
**Rol**: Diagnóstico completo y configuración de Google Tag Manager. Analiza UN contenedor a la vez (restricción en instruction).

**Herramientas de lectura** ([agents/gtm_agent/tools/gtm_tools.py](agents/gtm_agent/tools/gtm_tools.py)):
```python
list_accounts()                              # GTM API v2 via google-api-python-client
list_containers(account_id)
get_container(account_id, container_id)
list_workspaces(account_id, container_id)
list_tags(account_id, container_id, workspace_id)
list_triggers(account_id, container_id, workspace_id)
list_variables(account_id, container_id, workspace_id)
list_versions(account_id, container_id)
get_container_version(account_id, container_id, version_id)
get_workspace_status(account_id, container_id, workspace_id)
```

**Herramientas de escritura** (requieren `implementation_confirmed=True` en state):
```python
create_workspace(account_id, container_id, name, description)
create_tag(...)        # nunca modifica Default Workspace
create_trigger(...)    # orden de implementación: variables → triggers → tags
create_variable(...)
create_version(account_id, container_id, workspace_id, version_name, version_notes)
publish_version(account_id, container_id, version_id)
rename_gtm_tag(...)    # protocolo deprecación: renombra con prefijo "⚠️ MEJORADO — "
rename_gtm_trigger(...)
rename_gtm_variable(...)
pause_gtm_tag(...)     # pausa sin eliminar
```

**Herramientas compartidas** ([agents/shared/state_tools.py](agents/shared/state_tools.py)):
```python
get_ideal_spec_from_state()    # ideal_spec del Web Analyzer
get_ga4_findings_from_state()  # hallazgos GA4 para análisis cruzado
```

**Protocolo workspace** (enforced en instruction):
- NUNCA modificar Default Workspace
- Crear workspace nuevo: `"Grapez — [descripción] — [YYYY-MM-DD]"`
- Orden obligatorio: variables → triggers → tags (dependencias)

---

### 5.4 Web Analyzer Agent ✅
**Archivo**: [agents/web_analyzer_agent/agent.py](agents/web_analyzer_agent/agent.py)
**Modelo**: `gemini-2.5-flash` | `output_key="ideal_spec"` (su respuesta se guarda sola en state)
**Rol**: Genera el `ideal_spec` — configuración de tracking óptima para el cliente específico — y detecta el estado actual del tracking del sitio con un browser real.

**Arquitectura en dos capas (en producción)**: el agente corre en Agent Engine (sandbox Python puro, sin Chromium); el browser headless corre en el **Playwright Service** en Cloud Run (`playwright_service/` — ver sección 4). Las tools hacen HTTP POST al servicio.

**Tools implementadas** ([agents/web_analyzer_agent/tools/playwright_tools.py](agents/web_analyzer_agent/tools/playwright_tools.py)):
```python
screenshot_site(url)   # POST /screenshot — screenshot PNG + elementos interactivos (botones, forms, links)
analyze_site(url, business_type, key_conversions)
                       # POST /analyze — GTM container IDs, GA4 measurement IDs,
                       #                 eventos del dataLayer, errores de tracking
crawl_site(url)        # POST /crawl_site — home + hasta 6 páginas internas priorizadas
                       #                    por señales de conversión (usada por el Planner en Paso 1)
```
El agente usa `tools=[screenshot_site, analyze_site]`; `crawl_site` y `screenshot_site` también
están registradas directamente en el Planner para la investigación del Paso 1.
Si el Playwright Service no responde, las tools devuelven `crawl_method: "error"` y el agente
cae a **modo inferencia** (marca la salida con `"crawl_method": "inferido"`).

**Por qué Playwright y no HTTP requests simples**: los sitios modernos renderizan con
JavaScript (React/Angular/Next.js). GTM se carga via `<script>`, `window.dataLayer` se puebla
en runtime y Consent Mode v2 solo es visible en un browser real.

**Output requerido** (JSON siempre, dos secciones):
```json
{
  "current_state": {
    "gtm_container_id": "GTM-XXXXXX o null",
    "ga4_measurement_id": "G-XXXXXX o null",
    "consent_mode_v2": true,
    "events_found": [...],
    "errors_found": [...],
    "crawl_method": "playwright_real | inferido"
  },
  "ideal_spec": {
    "business_type": "ecommerce",
    "key_conversions": ["compra completada"],
    "required_events": [...],
    "required_gtm_variables": [...],
    "required_custom_dimensions": [...],
    "gaps_vs_current": [...],
    "ambiguities": [...]  // máx. 3, específicas al cliente
  }
}
```

---

### 5.5 Implementation Agent — ❌ DESCARTADO
No existe como agente separado. Las operaciones write viven directamente en GA4 Agent y
GTM Agent, protegidas por el flag `implementation_confirmed` que solo `confirm_action()`
del Planner puede activar (una confirmación = una operación). El protocolo de workspace
GTM (nunca tocar Default Workspace, crear versión borrador, no publicar sin aprobación)
está enforced en la instruction y las tools del GTM Agent.

---

## 6. Arquitectura ADK — Cómo Construir los Agentes

### Imports verificados (google-adk v1.33.0 — mayo 2026)

```python
# Agentes
from google.adk.agents import LlmAgent, SequentialAgent, ParallelAgent, LoopAgent

# Tools (ADK 2.x — sin @tool decorator, plain functions auto-wrapeadas)
from google.adk.tools import ToolContext
from google.adk.tools import FunctionTool
from google.adk.tools.agent_tool import AgentTool  # sub-agente como tool

# Skills
from google.adk.skills import load_skill_from_dir
from google.adk.tools import SkillToolset

# Auth
from google.adk.auth import AuthCredential, AuthCredentialTypes, OAuth2Auth
```

> **IMPORTANTE**: `UnsafeLocalCodeExecutor` existe pero es **solo para desarrollo local**.
> En Agent Runtime no funciona — el sandbox no permite procesos externos.
> En este proyecto NO se usa code execution del ADK: los agentes usan `@tool` functions
> normales que llaman las APIs de Google directamente con `google-analytics-admin`, etc.

### Patrón base de un agente (GA4 Agent como ejemplo)

```python
# agents/ga4_agent/agent.py
from google.adk.agents import LlmAgent
from .tools.ga4_admin_tools import (
    list_accounts, list_properties, get_property_details,
    list_conversions, list_custom_events, check_enhanced_measurement,
    create_conversion_event, update_data_retention,
)
from .tools.ga4_data_tools import get_event_count_last_30_days

root_agent = LlmAgent(
    model="gemini-2.5-flash",
    name="ga4_agent",
    # ADK guarda la respuesta final en session.state["ga4_findings"] — evita que el
    # Planner copie el diagnóstico como argumento de tool (rompe el function calling)
    output_key="ga4_findings",
    description="Especialista en diagnóstico y configuración de Google Analytics 4.",
    instruction="""
Cuando diagnoses una propiedad GA4:
1. Lista todas las propiedades disponibles para el cliente
2. Para cada propiedad: verifica streams, eventos, conversiones, dimensiones
3. Clasifica hallazgos: ✅ correcto | ⚠️ mejorable | ❌ crítico
4. Propone acciones concretas ordenadas por impacto
""",
    tools=[
        list_accounts, list_properties, get_property_details,
        list_conversions, list_custom_events, check_enhanced_measurement,
        create_conversion_event, update_data_retention,
        get_event_count_last_30_days,
    ],
)
```

### Patrón de tool (ADK 2.x — plain function, sin @tool decorator)

```python
# agents/ga4_agent/tools/ga4_admin_tools.py
from google.adk.tools import ToolContext
from google.analytics.admin import AnalyticsAdminServiceClient
from google.oauth2.credentials import Credentials
import os

def list_properties(account_id: str, tool_context: ToolContext) -> dict:
    """
    Lista todas las propiedades GA4 de una cuenta.

    Args:
        account_id: ID de la cuenta GA4 (ej: "123456789")
        tool_context: Contexto de sesión — contiene access_token y refresh_token

    Returns:
        dict con lista de propiedades y sus detalles básicos
    """
    access_token = tool_context.state.get("access_token")
    refresh_token = tool_context.state.get("refresh_token")

    credentials = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ["GOOGLE_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
    )
    client = AnalyticsAdminServiceClient(credentials=credentials)
    props = client.list_properties(filter=f"parent:accounts/{account_id}")
    return {"properties": [{"id": p.name, "display_name": p.display_name} for p in props]}
```

### Patrón del Planner Agent (orquestador con AgentTool) — versión simplificada del real

```python
# agents/planner_agent/agent.py (extracto — ver el archivo real para la instruction completa)
from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from google.adk.tools import ToolContext

# Importar los sub-agentes ya construidos
from agents.ga4_agent.agent import root_agent as ga4_agent
from agents.gtm_agent.agent import root_agent as gtm_agent
from agents.web_analyzer_agent.agent import root_agent as web_analyzer_agent

# Envolver como AgentTools para llamada explícita y controlada
ga4_tool = AgentTool(agent=ga4_agent)
gtm_tool = AgentTool(agent=gtm_agent)
web_analyzer_tool = AgentTool(agent=web_analyzer_agent)

def load_client_tokens(access_token: str, refresh_token: str, tool_context: ToolContext,
                       token_expiry: float = 0.0) -> dict:
    """Carga los tokens OAuth en session.state (solo desarrollo local —
    en producción llegan via initialState desde el frontend)."""
    tool_context.state["access_token"] = access_token
    tool_context.state["refresh_token"] = refresh_token
    if token_expiry > 0:
        tool_context.state["token_expiry"] = token_expiry
    return {"status": "tokens_loaded"}

root_agent = LlmAgent(
    model="gemini-2.5-flash",
    name="planner_agent",
    description="Orquestador del ecosistema de medición de Grapez Studio.",
    instruction="...",  # flujo de 5 pasos — ver agents/planner_agent/agent.py
    tools=[
        get_session_info, load_client_tokens, set_business_context, set_audit_mode,
        confirm_action, screenshot_site, crawl_site,
        ga4_tool, gtm_tool, web_analyzer_tool, brave_web_search,
    ],
)
```

### Por qué plain function tools en vez de code execution

Los MCP servers disponibles para GA4/GTM son **solo lectura** por defecto. Necesitamos escritura:
- GA4 Admin API con scope `analytics.edit` — crear conversiones, dimensiones, audiencias
- GTM API v2 con scope `tagmanager.edit.containers` — crear tags, triggers, publicar borradores

Usando plain function tools de ADK, los agentes llaman las librerías Python oficiales de Google con los tokens del cliente desde `ToolContext.state`. No se necesita `UnsafeLocalCodeExecutor` ni code execution.

---

## 7. A2UI — Interfaz Dinámica del Agente

### Qué es A2UI (estado verificado a mayo 2026)

A2UI es un **protocolo open-source real de Google** (repo: `github.com/google/A2UI`, licencia Apache 2.0, sitio: `a2ui.org`). Anunciado en Google Next 2025. El agente devuelve JSON estructurado → el frontend lo renderiza como componentes visuales.

**Lo que NO existe**: Paquete npm `@google/a2ui` para React. El renderer oficial de React está en roadmap pero no publicado. El renderer disponible es para Lit (Web Components) y Flutter.

**Decisión para este proyecto**: Implementar un **renderer custom en React/Next.js** que siga el contrato JSON de A2UI — 6 componentes implementados (table, action_card, progress, summary_card, choice_card, image_card). No dependemos de un paquete externo que puede cambiar.

### Contrato JSON A2UI (spec v0.9 — lo que devuelve el agente)

El agente incluye un bloque JSON en su respuesta. El frontend lo detecta por el campo `"__a2ui": true`:

```json
// Tabla de hallazgos del diagnóstico
{
  "__a2ui": true,
  "type": "table",
  "title": "Diagnóstico GA4 — TiendaDemo",
  "columns": ["Área", "Estado", "Descripción", "Prioridad"],
  "rows": [
    ["Conversiones", "❌", "No hay eventos de purchase configurados", "Alta"],
    ["Retención", "⚠️", "Configurada en 2 meses (recomendado: 14)", "Media"],
    ["Enhanced Measurement", "✅", "Activado correctamente", "-"]
  ]
}

// Card de acción con confirmación
{
  "__a2ui": true,
  "type": "action_card",
  "title": "Crear conversión 'purchase'",
  "description": "Se creará el evento de conversión 'purchase' en la propiedad GA4-123456",
  "impact": "high",
  "requires_confirmation": true,
  "action_id": "create_conversion_purchase"
}

// Progress bar durante implementación
{
  "__a2ui": true,
  "type": "progress",
  "title": "Implementando cambios GTM",
  "current": 3,
  "total": 8,
  "current_step": "Creando variable dataLayer 'transaction_id'"
}

// Reporte final
{
  "__a2ui": true,
  "type": "summary_card",
  "title": "Ecosistema configurado exitosamente",
  "sections": [
    {"label": "GA4", "items_fixed": 4, "status": "complete"},
    {"label": "GTM", "items_fixed": 7, "status": "complete"},
    {"label": "Google Ads", "items_fixed": 2, "status": "complete"}
  ]
}
```

### Implementación: renderer custom en Next.js + Tailwind (✅ en producción — 6 tipos)

```
frontend/components/a2ui/
├── A2UIRenderer.tsx     ← dispatcher: lee "type" y renderiza el componente correcto
├── DiagnosisTable.tsx   ← type: "table"
├── ActionCard.tsx       ← type: "action_card" con botones Confirmar/Omitir
├── ProgressBar.tsx      ← type: "progress"
├── SummaryCard.tsx      ← type: "summary_card"
├── ChoiceCard.tsx       ← type: "choice_card" — opciones clicables (modo, conversiones, scope)
└── ImageCard.tsx        ← type: "image_card" — screenshots del sitio (Playwright Service)
```

**A2UIRenderer.tsx** (dispatcher real):
```tsx
// frontend/components/a2ui/A2UIRenderer.tsx
export function A2UIRenderer({ component, onConfirm, onCancel, onChoice }: A2UIRendererProps) {
  switch (component.type) {
    case "table":        return <DiagnosisTable data={component} />
    case "action_card":  return <ActionCard data={component} onConfirm={onConfirm} onCancel={onCancel} />
    case "progress":     return <ProgressBar data={component} />
    case "summary_card": return <SummaryCard data={component} />
    case "choice_card":  return <ChoiceCard data={component} onChoice={onChoice} />
    case "image_card":   return <ImageCard data={component} />
  }
}
```

**Cómo el frontend detecta mensajes A2UI**: [frontend/lib/parse-a2ui.ts](frontend/lib/parse-a2ui.ts)
extrae los bloques ```` ```json ```` con `"__a2ui": true` del texto del agente (soporta múltiples
bloques por mensaje y bloques incompletos durante el streaming).

### Cómo el agente genera los componentes A2UI

El agente incluye en su `instruction` las reglas para emitir JSON A2UI. No es una tool — es parte del output del LLM:

```python
# En el instruction del Planner Agent:
"""
Cuando presentes resultados de diagnóstico, incluye siempre un bloque JSON con el formato A2UI:
```json
{"__a2ui": true, "type": "table", ...}
```
Cuando necesites confirmación del consultor, usa action_card con requires_confirmation: true.
"""
```

### Links de referencia A2UI
- Repo oficial: https://github.com/google/A2UI
- Sitio: https://a2ui.org
- Blog: https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/

---

## 8. Base de Datos — Firestore ❌ NO SE USA

> **Decisión final (junio 2026)**: Firestore y Secret Manager quedaron **fuera del sistema**.
> No hay base de datos: los tokens OAuth y los clientes creados por el consultor viven en la
> cookie cifrada de iron-session (ver secciones 9, 19.8 y 19.13). Ningún código del repo
> invoca Firestore ni Secret Manager. Esta sección se conserva solo como **referencia de
> diseño** por si en el futuro se necesita persistencia multi-usuario — no es trabajo pendiente.

### Colecciones (diseño de referencia, no implementado)
```
clients/
  {clientId}/
    name: string
    website_url: string
    industry: string
    created_at: timestamp
    google_tokens/
      access_token: string (encrypted)
      refresh_token: string (encrypted)
      expires_at: timestamp
      scopes: string[]
    ga4_properties/
      {propertyId}/
        display_name: string
        last_diagnosed: timestamp
    sessions/
      {sessionId}/
        agent_session_id: string (Agent Engine session)
        created_at: timestamp
        status: "active" | "completed"
```

### Encriptación de tokens (solo si algún día se implementa Firestore)
Si se llegara a persistir tokens OAuth en Firestore, DEBEN ir encriptados (Fernet o Cloud KMS),
nunca en texto plano. Hoy no aplica: los tokens solo existen en la cookie iron-session, que ya
va cifrada.

---

## 9. OAuth Google — Flujo para el Demo (iron-session)

### Estrategia elegida: tokens on-the-fly (no Firestore para tokens en el demo)

Los tokens OAuth se almacenan en una **cookie de sesión cifrada del servidor** (iron-session). El usuario se re-autentica al iniciar cada sesión de chat. Esto:
- Elimina Firestore como dependencia para el demo
- Hace explícito el flujo OAuth ante los jueces (ven la pantalla de permisos de Google con los 5 scopes)
- Reduce el scope de desarrollo en ~4 días

### Scopes (todos juntos en una sola autorización)
```python
SCOPES = [
    "https://www.googleapis.com/auth/analytics.edit",
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/tagmanager.edit.containers",
    "https://www.googleapis.com/auth/tagmanager.edit.containerversions",  # create_version
    "https://www.googleapis.com/auth/tagmanager.publish",
    "openid",
    "email",
    "profile",
]
```

### Implementación iron-session

```typescript
// frontend/lib/session.ts
import { SessionOptions } from "iron-session"

export interface SessionData {
  accessToken?: string
  refreshToken?: string
  userEmail?: string
  isLoggedIn: boolean
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,  // mín. 32 chars — guardar en Secret Manager
  cookieName: "grapez-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 3600,  // 1 hora — mismo TTL que el access token de Google
  },
}
```

### Endpoints OAuth

```
GET /api/oauth/google/start    → genera URL OAuth con 5 scopes + prompt:"consent"
GET /api/oauth/google/callback → recibe code → tokens → guarda en iron-session → redirect al chat
GET /api/oauth/google/status   → 200 con { email } si sesión activa, 401 si no
```

### Cómo los tokens llegan al agente

```typescript
// frontend/app/api/chat/route.ts
import { getIronSession } from "iron-session"

export async function POST(req: Request) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  if (!session.isLoggedIn) {
    return Response.json({ error: "not_authenticated" }, { status: 401 })
  }
  const agentResponse = await callAgentEngine({
    message: await req.json(),
    initialState: {
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
    },
  })
  return agentResponse
}
```

### Tool del Planner (recibe tokens del frontend via initialState)

```python
# agents/planner_agent/tools/client_tools.py
@tool
def load_client_tokens(access_token: str, refresh_token: str, tool_context: ToolContext) -> dict:
    """Carga tokens OAuth en el estado de sesión del agente."""
    tool_context.state["access_token"] = access_token
    tool_context.state["refresh_token"] = refresh_token
    return {"status": "tokens_loaded"}
```

### Desarrollo local sin OAuth — Juan Camilo

```python
# agents/dev_utils.py — SOLO para desarrollo local, nunca a producción
import os
from google.adk.tools import ToolContext

def inject_local_tokens(tool_context: ToolContext) -> None:
    """Inyecta tokens de prueba desde .env — evita OAuth durante desarrollo de agentes."""
    tool_context.state["access_token"] = os.environ["TEST_ACCESS_TOKEN"]
    tool_context.state["refresh_token"] = os.environ["TEST_REFRESH_TOKEN"]
    tool_context.state["client_id"] = "tiendademo"
```

Los tokens de prueba se generan en el navegador con `frontend/app/dev/tokens` (corre el
frontend local, autentica con OAuth y copia los tokens al `.env` como TEST_ACCESS_TOKEN /
TEST_REFRESH_TOKEN).

### Persistencia futura (solo referencia)
iron-session es la solución definitiva del sistema actual. Si algún día se necesita
persistencia multi-usuario de tokens, el diseño de referencia (Firestore + Fernet) está en
la sección 8 — hoy no es trabajo pendiente.

---

## 10. Skills ADK — Proceso de Descubrimiento

> **Estado final**: los agentes ya están construidos y este proceso quedó **cerrado**.
> No se integró ninguna skill de MCP Market (la candidata `analytics-tracking` se descartó —
> ver 19.9). El conocimiento de dominio vive en `agents/shared/prompts.py` y en la skill
> custom `skills/grapez-analytics-standards/SKILL.md`. Esta sección se conserva como
> referencia del proceso.

### Qué son las skills en ADK
Las skills son unidades de conocimiento + herramientas empaquetadas que se cargan dinámicamente en el agente via `SkillToolset`. Cada skill tiene un `SKILL.md` con:
- Descripción del dominio
- Reglas y mejores prácticas (forman parte del contexto del agente)
- Scripts Python incluidos
- Herramientas disponibles

### Cuándo buscar skills
**NO buscar ahora**. Buscar al momento de construir cada agente específico. El proceso:

1. Identificar qué agente estás construyendo (ej: GA4 Agent)
2. Buscar en MCP Market: https://mcp.so/search
3. Queries de búsqueda sugeridas por agente:
   - **GA4 Agent**: "analytics tracking", "google analytics 4", "measurement protocol", "event schema"
   - **GTM Agent**: "google tag manager", "datalayer", "tag management"
   - **Ads Agent**: "google ads", "conversion tracking", "attribution"
   - **Web Analyzer**: "web scraping", "playwright", "tracking detection"
   - **Implementation**: "analytics implementation", "gtm deployment"
4. Para cada skill candidata: leer el `SKILL.md` completo
5. Evaluar: ¿el contenido de SKILL.md mejora el contexto del agente? ¿Los scripts son útiles?
6. Integrar las mejores 2-3 skills por agente en `/skills/{agent_name}/`

### Skill conocida (ya identificada)
- **analytics-tracking** by borghei — MCP Market — 101 stars
  - Cubre: event taxonomy (`object_action` snake_case), GA4 config rules, GTM architecture, dataLayer push pattern, SPA handling, Consent Mode v2, debugging workflow, audit checklist
  - Incluye 3 scripts Python: `utm_validator.py`, `event_schema_checker.py`, `funnel_drop_off_analyzer.py`
  - Usar para: GA4 Agent y GTM Agent principalmente

---

## 11. Entorno Demo — Setup para el Hackathon

El demo del video NO puede usar datos reales de clientes (privacidad). Estrategia:

### Demo Account GA4 (diagnóstico)
- **URL**: https://support.google.com/analytics/answer/6367342
- Es la propiedad GA4 oficial de Google con datos reales de Google Merchandise Store
- Solo lectura — perfecta para mostrar el diagnóstico
- No necesita credenciales: se puede pedir acceso público o usar cuenta demo de Google

### Propiedad de prueba "TiendaDemo" (implementación)
- Crear en la cuenta Google de Grapez una propiedad GA4 llamada "TiendaDemo"
- Propiedad vacía o con configuración incompleta (para que el agente tenga algo que arreglar)
- Errores plantados: sin conversiones, retención en 2 meses, sin dimensiones custom
- El agente diagnostica + implementa los cambios aquí

### Contenedor GTM "TiendaDemo"
- Crear en la cuenta GTM de Grapez un contenedor de prueba
- Errores plantados:
  - Tag de GA4 duplicado
  - Trigger mal configurado (dispara en todos los clicks, no solo en botón de compra)
  - Variables de dataLayer faltantes
  - Sin workspace limpio (todo en Default Workspace)
- El agente detecta estos errores y los corrige

### Sitio demo (para Web Analyzer)
- Crear sitio demo simple en Vercel con Next.js (tiendademo.grapez.co o similar)
- Implementar GTM con dataLayer básico de ecommerce
- Algunos eventos correctos, algunos faltantes — para que el Web Analyzer tenga qué reportar
- Script para plantear errores: `/demo/setup_demo_site.js`

### Script de reset del demo
```python
# /demo/reset_demo_environment.py
# Resetea todas las propiedades demo a su estado "con errores"
# para poder repetir el demo del video
```

---

## 12. Variables de Entorno

> Estado real del `.env` (raíz, gitignored). El frontend tiene además `frontend/.env.local`
> (desarrollo) y `frontend/.env.cloudrun.yaml` (producción Cloud Run — lo lee `deploy-frontend.ps1`).

```bash
# .env (gitignored — copiar de .env.example)

# Google Cloud
GOOGLE_CLOUD_PROJECT=grapez-ecosistema-medicion
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=true   # sin esto ADK pide GOOGLE_API_KEY y falla

# Google OAuth (para conectar cuentas de clientes)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback

# Vertex AI Agent Engine (donde corren los agentes)
AGENT_ENGINE_REGION=us-central1
AGENT_ENGINE_PROJECT=grapez-ecosistema-medicion
PLANNER_AGENT_ENGINE_ID=   # lo devuelve scripts/deploy-agents.ps1 en el primer deploy

# Microservicios Cloud Run
PLAYWRIGHT_SERVICE_URL=    # https://playwright-service-....run.app
BRAVE_MCP_URL=             # https://brave-mcp-server-....run.app/mcp
BRAVE_API_KEY=             # fallback directo a Brave API en desarrollo local

# Frontend
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=            # iron-session — mín. 32 chars: openssl rand -base64 32

# Tokens de prueba para desarrollo local de agentes (no producción)
# Generar en el navegador con frontend/app/dev/tokens
TEST_ACCESS_TOKEN=
TEST_REFRESH_TOKEN=

# Demo (cuentas de prueba para el video)
DEMO_GTM_ACCOUNT_ID=
DEMO_GTM_CONTAINER_ID=
DEMO_WEBSITE_URL=
```

> `FIRESTORE_DATABASE` y `ENCRYPTION_KEY` pueden seguir presentes en `.env` por herencia
> pero **ningún código las usa** (Firestore/Secret Manager descartados — sección 8).
> `scripts/deploy-agents.ps1` las excluye del paquete que sube a Agent Engine.

---

## 13. Deploy en Google Cloud — ✅ TODO DEPLOYADO

> Proyecto GCP: `grapez-ecosistema-medicion` | Región: `us-central1`
> El deploy se hace con los **scripts en `scripts/`** — no a mano. Si cambias código de
> agentes, corre `deploy-agents.ps1 -UpdateExisting`; si cambias frontend, `deploy-frontend.ps1`.

### Servicios GCP en producción
| Servicio | Qué corre | Estado |
|---|---|---|
| Vertex AI Agent Engine | Los 4 agentes (un solo deploy del Planner que importa los sub-agentes) — ID `4586839804418719744` | ✅ |
| Cloud Run `grapez-frontend` | Next.js 16 (source deploy con buildpacks) — `https://grapez-frontend-493646362074.us-central1.run.app` | ✅ |
| Cloud Run `playwright-service` | FastAPI + Chromium (Docker, 2Gi RAM) — `https://playwright-service-hgsyggbcaq-uc.a.run.app` | ✅ |
| Cloud Run `brave-mcp-server` | MCP server propio de Brave Search — `https://brave-mcp-server-hgsyggbcaq-uc.a.run.app` | ✅ |
| Cloud Trace | Observabilidad de los agentes (deploy con `--trace_to_cloud`) | ✅ |

> Firestore y Secret Manager **no se usan** (sección 8).

### 1. Agentes → `scripts/deploy-agents.ps1`
```powershell
.\scripts\deploy-agents.ps1                  # primer deploy — crea Agent Engine nuevo
.\scripts\deploy-agents.ps1 -UpdateExisting  # actualiza el Agent Engine de PLANNER_AGENT_ENGINE_ID
```
Qué hace: empaqueta `agents/` + `agent.py` + `requirements.txt` en un temp limpio (sin `.git`,
que rompe el deploy de ADK en Windows), genera un `.env` filtrado solo con las variables que
el agente necesita en runtime (excluye frontend/dev/Firestore), y ejecuta
`adk deploy agent_engine` con `--trace_to_cloud`. Tarda 5-10 minutos.

### 2. Frontend → `scripts/deploy-frontend.ps1`
```powershell
.\scripts\deploy-frontend.ps1
```
Qué hace: `gcloud run deploy grapez-frontend --source .` desde `frontend/` con las variables
de `frontend/.env.cloudrun.yaml`. Si agregas una env var al frontend: agrégala a
`.env.local` (dev) Y a `.env.cloudrun.yaml` (prod), luego corre el script.

### 3. Playwright Service (solo si cambia `playwright_service/`)
```powershell
gcloud run deploy playwright-service --source .\playwright_service --region=us-central1 --project=grapez-ecosistema-medicion --memory=2Gi --timeout=120 --allow-unauthenticated
```

### 4. Brave MCP Server (solo si cambia `brave_mcp_server/`)
```powershell
gcloud run deploy brave-mcp-server --source .\brave_mcp_server --region=us-central1 --project=grapez-ecosistema-medicion
```
Autenticado con OIDC: la tool `brave_web_search` obtiene un identity token de Google
automáticamente (funciona en Agent Engine, Cloud Run y local con ADC).

### Dependencias entre deploys
- Los agentes leen `PLAYWRIGHT_SERVICE_URL` y `BRAVE_MCP_URL` de su `.env` empaquetado →
  si cambian esas URLs, redeploya los agentes con `-UpdateExisting`.
- El frontend lee `PLANNER_AGENT_ENGINE_ID` de `.env.cloudrun.yaml` → si se crea un Agent
  Engine nuevo (no update), actualiza el yaml y redeploya el frontend.

---

## 14. Plan de Construcción — Semana a Semana

**Hoy**: 1 de junio 2026 — Semana 5 en curso | **Deadline**: 5 de junio 2026, **5:00 PM PT** | **Tiempo disponible**: 4 días

> Equipo: **Mauro** (Infra + Frontend) y **Juan Camilo** (Agentes Python).

### Semana 2 (May 10-16): Setup base — ✅ COMPLETADA

**Mauro (Infra + Frontend)**:
- [x] GCP project `grapez-ecosistema-medicion` creado + APIs habilitadas
- [x] OAuth 2.0 Client ID + Service Account + `.env` base configurado
- [x] iron-session OAuth flow: `/api/oauth/google/start` → callback → status
- [x] Mock clients UI: `frontend/lib/mock-clients.ts`
- [x] `frontend/app/dev/tokens/page.tsx` — reemplaza scripts/generate_test_tokens.py
- [x] Compartir `service-account.json` + `.env` con Juan Camilo

**Juan Camilo (Agentes)**:
- [x] Python env: `.venv` + `pip install -r requirements.txt` + credenciales de Mauro
- [x] `agents/dev_utils.py` — `inject_local_tokens()` desde .env
- [x] GA4 Agent: 13 read + 3 write + 1 shared (17 tools total)
- [ ] ~~Integrar skill `analytics-tracking` via MCP Market~~ — se integró **Brave Search MCP** en cambio (satisface requisito MCP Track 1)
- [x] GTM Agent: 10 read + 10 write + 2 shared (22 tools total)
- [x] Probar agentes localmente con `adk web agents/planner_agent`

---

### Semana 3 (May 17-23): Web Analyzer + Planner + Chat UI — ✅ COMPLETADA (sin Playwright)

**Mauro (Infra + Frontend)**:
- [x] A2UIRenderer + DiagnosisTable + ActionCard + ProgressBar + SummaryCard
- [x] Chat UI con SSE (`frontend/app/clients/[id]/chat/ChatClient.tsx`)
- [ ] Planner Agent skeleton deployado en Agent Engine — **movido a Semana 5**
- [ ] Setup TiendaDemo: GA4 property + GTM container con errores plantados — **pendiente**

**Juan Camilo (Agentes)**:
- [x] Web Analyzer Agent: instrucciones completas + ideal_spec format + modo inferencia
- [x] Planner Agent: flujo de 5 pasos, AgentTool (GA4+GTM+Web) + Brave Search MCP
- [x] `agents/shared/state_tools.py` + `agents/shared/prompts.py` — contexto cruzado entre agentes
- [x] Flujo de confirmación: `confirm_action()` → `implementation_confirmed` flag → write tools

---

### Semana 4 (May 24-30): Deploy + End-to-end — ✅ COMPLETADA (cerrada en Semana 5)

**Mauro (Infra + Frontend)**:
- [x] Playwright Service: Docker build + Cloud Run (`playwright-service`)
- [x] Web Analyzer Agent → HTTP Playwright Service (screenshot_site, analyze_site, crawl_site)
- [x] Deploy completo: Agentes (Agent Engine) → Frontend (Cloud Run)
- [x] Flujo completo end-to-end OAuth → Chat → A2UI — **funcionando en producción**
- [ ] ~~Sitio demo en Vercel (tiendademo)~~ — no se hizo; el demo usa sitios reales

**Juan Camilo (Agentes)**:
- [ ] ~~Implementation Agent separado~~ — **descartado**; write ops integradas en GA4/GTM Agents directamente
- [x] GA4 write operations: create_conversion_event, create_custom_dimension, update_data_retention
- [x] GTM write operations: todos (workspace, tags, triggers, variables, versiones, rename, pause)
- [x] Flujo de confirmación via A2UI action cards — implementado en Planner + state flag
- [ ] ~~Logs en Firestore~~ — **descartado** (Firestore fuera del sistema — sección 8)
- [ ] ~~Rollback snapshot Firestore~~ — **descartado**

---

### Semana 5 (Jun 1-4): Deploy + Submit

**Crítico** — ✅ COMPLETADO:
- [x] **Deploy: Planner Agent a Agent Engine** — via `scripts/deploy-agents.ps1` (`adk deploy agent_engine`)
- [x] **Conectar frontend al Agent Engine** — `PLANNER_AGENT_ENGINE_ID` configurado, chat con SSE funcionando
- [x] **Brave MCP Server propio en Cloud Run** (no estaba planeado — reemplazó al MCPToolset)

**Submission (entregables del hackathon)** — verificar estado en `STATE.md`:
- [x] Diagrama de arquitectura en `/architecture/` (diagram.svg fuente + diagram.png para Devpost)
- [ ] Repo GitHub **público** — barrido de seguridad ✅ completado (jun 10): sin credenciales en código ni historial
- [x] README en **inglés** (features, setup, arquitectura, diagrama embebido)
- [ ] Descripción Devpost en **inglés**
- [ ] Video demo 1-2 minutos en **inglés o subtítulos en inglés** (guión en `docs/demo-script.md`)
- [x] Testing instructions en inglés — `docs/testing-instructions.md` (credenciales de la cuenta de prueba van en las notas privadas del submit de Devpost, NUNCA en el repo)
- [ ] **Mauro y Juan Camilo** registrados como team members en Devpost for Teams

---

## 15. Estructura de Archivos del Proyecto

> Estado real al 10 junio 2026. ✅ = existe | ❌ = pendiente de crear

```
grapez-hackathon/
├── CLAUDE.md              ✅ este archivo
├── STATE.md               ✅ log de sesiones y progreso
├── README.md              ✅ (inglés pendiente para hackathon)
├── agent.py               ✅ entry point para adk web / adk deploy
├── .env                   ✅ gitignored
├── .env.example           ✅ template público completo
├── .gitignore             ✅
├── requirements.txt       ✅ dependencias de los agentes
├── service-account.json   ✅ gitignored
├── skills-lock.json       ✅
│
├── architecture/
│   ├── diagram.svg        ✅ fuente del diagrama (editable)
│   └── diagram.png        ✅ render 2x para Devpost y README
│
├── agents/
│   ├── __init__.py        ✅
│   ├── dev_utils.py       ✅ inject_local_tokens() para desarrollo local
│   ├── planner_agent/
│   │   ├── __init__.py    ✅
│   │   ├── agent.py       ✅ LlmAgent + AgentTool(GA4/GTM/Web) + brave_web_search
│   │   │                     + screenshot_site/crawl_site directas
│   │   └── tools/
│   │       ├── __init__.py ✅
│   │       ├── client_tools.py ✅ 5 tools: get_session_info, load_client_tokens,
│   │       │                              set_business_context, set_audit_mode,
│   │       │                              confirm_action
│   │       └── brave_search.py ✅ brave_web_search — cliente MCP per-request
│   │                              (Streamable HTTP + OIDC) con fallback Brave API directa
│   ├── ga4_agent/
│   │   ├── __init__.py    ✅
│   │   ├── agent.py       ✅ 17 tools | output_key="ga4_findings"
│   │   └── tools/
│   │       ├── __init__.py       ✅
│   │       ├── ga4_admin_tools.py ✅ 13 read + 3 write via google-analytics-admin
│   │       └── ga4_data_tools.py  ✅ read via google-analytics-data
│   ├── gtm_agent/
│   │   ├── __init__.py    ✅
│   │   ├── agent.py       ✅ 22 tools implementadas
│   │   └── tools/
│   │       ├── __init__.py  ✅
│   │       └── gtm_tools.py ✅ 10 read + 10 write via google-api-python-client
│   ├── web_analyzer_agent/
│   │   ├── __init__.py    ✅
│   │   ├── agent.py       ✅ tools=[screenshot_site, analyze_site] | output_key="ideal_spec"
│   │   └── tools/
│   │       ├── __init__.py         ✅
│   │       └── playwright_tools.py ✅ screenshot_site, analyze_site, crawl_site
│   │                                  (HTTP POST → Playwright Service)
│   └── shared/
│       ├── __init__.py    ✅
│       ├── prompts.py     ✅ GA4_STANDARDS, GTM_STANDARDS, A2UI_FORMAT_EXAMPLES,
│       │                     COMMUNICATION_RULES, SUMMARY_CARD_FORMAT, GRAPEZ_VOICE, etc.
│       └── state_tools.py ✅ get_ideal_spec_from_state(), get_ga4_findings_from_state()
│
├── playwright_service/    ✅ deployado en Cloud Run (playwright-service)
│   ├── Dockerfile         ✅ mcr.microsoft.com/playwright/python:v1.59.0-noble
│   ├── app.py             ✅ FastAPI: /screenshot, /analyze, /crawl_site,
│   │                         /screenshots/{id}, /health
│   └── requirements.txt   ✅ fastapi, uvicorn, playwright
│
├── brave_mcp_server/      ✅ deployado en Cloud Run (brave-mcp-server)
│   ├── Dockerfile         ✅
│   ├── server.py          ✅ MCP server (Streamable HTTP) — tool brave_web_search
│   └── requirements.txt   ✅
│
├── frontend/              ✅ Next.js 16 App Router — deployado en Cloud Run (grapez-frontend)
│   ├── app/
│   │   ├── layout.tsx            ✅
│   │   ├── page.tsx              ✅ home: Nuevo análisis CTA + Mis análisis + Demos
│   │   ├── globals.css           ✅
│   │   ├── clients/
│   │   │   ├── new/
│   │   │   │   ├── page.tsx          ✅ Server Component — formulario nuevo cliente
│   │   │   │   └── NewClientForm.tsx ✅ Client Component — nombre, URL, industria
│   │   │   └── [id]/chat/
│   │   │       ├── page.tsx          ✅ resuelve mock ∪ session.createdClients → demo|live
│   │   │       └── ChatClient.tsx    ✅ Chat UI + A2UIRenderer + readOnly mode para demos
│   │   ├── dev/tokens/
│   │   │   ├── page.tsx          ✅ genera/copia tokens para testing
│   │   │   └── CopyButton.tsx    ✅
│   │   └── api/
│   │       ├── chat/route.ts         ✅ conectado al Agent Engine (streamQuery SSE,
│   │       │                            undici sin timeouts, refresh proactivo de tokens)
│   │       ├── clients/route.ts      ✅ POST crea cliente en session; DELETE elimina
│   │       ├── session/[clientId]/
│   │       │   └── route.ts          ✅ DELETE resetea sesión ADK del cliente
│   │       └── oauth/google/
│   │           ├── start/route.ts    ✅
│   │           ├── callback/route.ts ✅ iron-session fix: req+response pattern
│   │           ├── status/route.ts   ✅ 200 con { email } si sesión activa
│   │           └── logout/route.ts   ✅ iron-session fix: req+response pattern
│   ├── components/a2ui/
│   │   ├── A2UIRenderer.tsx   ✅ dispatcher por type (6 tipos)
│   │   ├── DiagnosisTable.tsx ✅ type: "table"
│   │   ├── ActionCard.tsx     ✅ type: "action_card" con Confirmar/Omitir
│   │   ├── ProgressBar.tsx    ✅ type: "progress"
│   │   ├── SummaryCard.tsx    ✅ type: "summary_card"
│   │   ├── ChoiceCard.tsx     ✅ type: "choice_card"
│   │   └── ImageCard.tsx      ✅ type: "image_card" — screenshots del Playwright Service
│   ├── lib/
│   │   ├── mock-clients.ts    ✅ demos con conversaciones completas A2UI
│   │   ├── session.ts         ✅ iron-session: SessionData + StoredClient[] + 24h TTL
│   │   ├── types.ts           ✅ Client (isDemo, demoConversation), ChatMessage, A2UIComponent
│   │   ├── parse-a2ui.ts      ✅ extrae bloques JSON A2UI (múltiples por mensaje, streaming)
│   │   ├── normalize-conversation.ts ✅
│   │   └── render-markdown.tsx ✅ render del markdown del agente en el chat
│   ├── .env.cloudrun.yaml     ✅ gitignored — env vars de producción (lee deploy-frontend.ps1)
│   ├── package.json           ✅
│   └── next.config.ts         ✅
│
├── skills/
│   └── grapez-analytics-standards/
│       └── SKILL.md           ✅ estándares custom de Grapez
│
├── demo/
│   └── reset_demo.py          ✅
│
├── docs/
│   ├── demo-script.md         ✅ guión del video
│   └── business-case.md       ✅ para descripción Devpost
│
└── scripts/
    ├── deploy-agents.ps1      ✅ empaqueta agents/ y ejecuta adk deploy agent_engine
    └── deploy-frontend.ps1    ✅ gcloud run deploy desde frontend/ con .env.cloudrun.yaml
```

---

## 16. Contexto de Negocio — Para el Business Case del Hackathon

### Grapez Studio
Agencia de growth marketing enfocada en ecommerce y retail. Servicio principal: "Ecosistema de Medición" — implementación y mantenimiento de GA4 + GTM + Google Ads para clientes.

### El problema que resuelve este sistema
- Diagnóstico manual GA4/GTM/Ads: 4-8 horas por cliente
- Implementación manual: 1-3 días por cliente
- Errores comunes (configuración duplicada, conversiones mal vinculadas) se repiten en todos los clientes
- Capacidad actual: ~4 clientes/mes por consultor

### El impacto esperado
- Diagnóstico automatizado: 15-30 minutos
- Implementación guiada: 2-4 horas (con confirmación humana en puntos críticos)
- Capacidad proyectada: ~12-15 clientes/mes por consultor
- ROI: 3x más ingresos por consultor, mismo equipo

### Números para el video
> "Con este sistema, un consultor de Grapez puede diagnosticar el ecosistema de medición completo de un cliente en 20 minutos — trabajo que antes tomaba un día entero. El agente no solo encuentra los problemas: los explica, propone soluciones y las implementa con un clic."

---

## 17. Instrucciones para el Agente de Construcción (Claude Code)

Si eres Claude Code leyendo este archivo: bienvenido. La arquitectura está **completamente definida** — no hay pendientes de investigación. Lee la sección 19 antes de cualquier otra cosa.

### Antes de construir cualquier agente
1. **Lee** la sección 19 (Decisiones Técnicas Verificadas) — ya resuelve todas las dudas
2. **Lee** la sección completa del agente específico en este CLAUDE.md
3. **Busca skills** en MCP Market (https://mcp.so) para el agente específico
4. **Configura el entorno virtual** (obligatorio — ver sección completa abajo)

### Setup del entorno local (virtual environment — obligatorio)

El proyecto usa un entorno virtual `.venv` para aislar las dependencias de Python del sistema global. Esto evita conflictos con otras librerías instaladas en la máquina (ej: `msal`, `azure-*`, etc.) y garantiza que todos trabajen con exactamente las mismas versiones.

**Crear el entorno (una sola vez por máquina):**
```bash
# Desde la raíz del proyecto (grapez-hackathon/)
python -m venv .venv

# Activar — Windows PowerShell
.venv\Scripts\Activate.ps1

# Activar — macOS / Linux
source .venv/bin/activate

# Instalar todas las dependencias del proyecto
pip install -r requirements.txt
```

El prompt cambiará a `(.venv) PS C:\...>` confirmando que el entorno está activo.

**Activar al inicio de cada sesión de trabajo:**
```bash
# Windows
.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

**Configurar autenticación Gemini (una sola vez por máquina):**
```bash
# Apuntar al proyecto GCP correcto
gcloud config set project grapez-ecosistema-medicion

# Configurar Application Default Credentials
gcloud auth application-default login
# Se abre el browser — autenticar con plataformas@grapezstudio.com
```

Asegurarse de que `.env` tenga:
```bash
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_LOCATION=us-central1
```

Sin esto, ADK busca `GOOGLE_API_KEY` y falla con "No API key was provided".

**Luego ya puedes correr el agente:**
```bash
adk web agents/planner_agent
```

> **Importante**: NO correr `adk web` desde la raíz del proyecto — ADK usaría el nombre del directorio `grapez-hackathon` (con guión) como identificador, lo cual es un identificador Python inválido y lanza `ValueError`. El comando correcto siempre apunta al directorio del agente.

**Notas importantes:**
- `.venv/` está en `.gitignore` — nunca se sube al repositorio
- El entorno virtual NO afecta producción — Agent Runtime instala desde `requirements.txt` en su propio sandbox
- Si instalas una nueva dependencia, agrégala a `requirements.txt` antes de hacer commit
- Python requerido: **3.11+** (verificar con `python --version` antes de crear el venv)

### Al construir herramientas de API (plain functions ADK 2.x)
1. Los tokens van en `ToolContext.state` — NUNCA como parámetros que el LLM puede ver
2. Siempre usar `Credentials` de `google.oauth2.credentials` con access + refresh token
3. Manejar `google.auth.exceptions.RefreshError` — devolver mensaje claro al consultor
4. Los nombres exactos de métodos de las APIs están en la sección de cada agente
5. **Sin `@tool` decorator** — plain functions auto-wrapeadas por ADK (ver sección 19.1b)

### Metodología Grapez — Guardrails de Confirmación (obligatorio en todos los agentes)

Esta sección define cómo los agentes de Grapez se comportan diferente a un chatbot genérico: **nunca modifican sin confirmar, siempre diagnostican con contexto de negocio, y siguen el proceso consultivo de Grapez Studio**. Cada agente que construyas debe implementar los tres niveles descritos abajo.

#### Los docstrings son contratos con Gemini, no comentarios para humanos

ADK convierte el docstring de cada función en el campo `description` del JSON schema que Gemini lee para decidir cuándo y cómo llamar la función. Una restricción en el docstring es una instrucción directa al modelo:

```python
def create_conversion_event(property_id: str, event_name: str, tool_context: ToolContext) -> dict:
    """
    Marca un evento como conversión en GA4.
    GUARDRAIL: Solo ejecutar después de confirmación explícita del consultor via confirm_action().
    """
```

Gemini recibe: `"description": "Marca un evento como conversión en GA4.\nGUARDRAIL: Solo ejecutar después de confirmación explícita del consultor via confirm_action()."`. La restricción es una instrucción operativa para el modelo, no documentación decorativa.

#### Arquitectura de 3 capas — implementar las 3 siempre

**Capa 1 — Docstring (guía al LLM en su decisión)**
Incluir en TODOS los write tools la línea de guardrail en el docstring:
```
GUARDRAIL: Solo ejecutar después de confirmación explícita del consultor via confirm_action().
```

**Capa 2 — Agent instruction (define el estilo consultivo)**
La `instruction` de cada agente especialista debe tener una sección "AL IMPLEMENTAR" con reglas explícitas del orden y las restricciones. Ver ejemplos en ga4_agent/agent.py y gtm_agent/agent.py.

**Capa 3 — State check en Python (bloqueo real, independiente del LLM)**
Esta es la garantía real. El código Python verifica `tool_context.state.get("implementation_confirmed")` antes de ejecutar cualquier operación de escritura. Si el flag no está activo, la función **rechaza la operación independientemente de lo que el LLM decidió**. No confía en que Gemini siempre interprete bien las instrucciones.

#### Patrón exacto — copiar al inicio de cada write tool

```python
# Copiar este bloque al inicio de TODA función que modifique datos en APIs externas.
# NO consumir el flag aquí: lo consume ConfirmationScopedAgentTool al terminar la
# invocación del sub-agente — así una acción confirmada puede encadenar varias escrituras.
if not tool_context.state.get("implementation_confirmed"):
    return {
        "blocked": True,
        "reason": "Operación de escritura bloqueada — requiere confirmación previa del consultor.",
        "instruction": "NO llames confirm_action — no es una tool tuya (pertenece al Planner). Reporta este bloqueo en tu respuesta de texto.",
    }
```

#### Flujo de confirmación end-to-end

```
1. GA4/GTM Agent diagnostica → devuelve hallazgos al Planner (texto con clasificación ✅/⚠️/❌)
2. Planner consolida → incluye A2UI action_card en su respuesta para cada acción propuesta:
      {"__a2ui": true, "type": "action_card", "title": "Crear conversión 'purchase'", ...}
3. Consultor ve la card → responde "Confirmo" o "Cancelo"
4. Planner detecta "Confirmo" → llama confirm_action(action_description="Crear conversión purchase en GA4-123456")
      → confirm_action() setea tool_context.state["implementation_confirmed"] = True
5. Planner llama ga4_agent o gtm_agent (via ConfirmationScopedAgentTool) con instrucción
   específica de implementación
6. Sub-agente encadena las write tools que la acción necesite (ej. GTM: create_workspace
   → create_variable → create_trigger → create_tag) — todas verifican el flag == True
7. Al terminar la invocación, ConfirmationScopedAgentTool consume el flag (→ False)
   — la siguiente acción requiere confirm_action() de nuevo
8. Sub-agente reporta resultado al Planner
9. Planner reporta al consultor → genera siguiente action_card si hay más acciones pendientes
```

La tool `confirm_action` vive en `agents/planner_agent/tools/client_tools.py`. Solo el Planner la llama — los sub-agentes nunca la invocan directamente.

#### Si el agente no puede determinar el contexto del cliente

Antes de diagnosticar, el agente debe tener contexto del tipo de negocio del cliente para saber qué conversiones son críticas (ecommerce → purchase; lead gen → form_submit; SaaS → signup, trial_start). Si este contexto no está disponible:

1. El Planner pregunta al consultor al inicio: "¿Cuál es el modelo de negocio del cliente? (ecommerce, generación de leads, SaaS, otro)"
2. El consultor responde → el Planner guarda en `tool_context.state["business_type"]`
3. Los agentes GA4 y GTM leen ese contexto para priorizar los hallazgos correctos

Si el agente recibe respuestas vacías o errores de la API que le impiden diagnosticar completamente, **debe declararlo explícitamente** — nunca asume ni inventa datos.

#### Estilo consultivo Grapez — cómo debe sonar cada agente

Todos los agentes comunican como consultores senior de Grapez Studio. No son APIs que reportan datos en crudo.

**NO** (estilo técnico frío — inaceptable):
> "event_data_retention: TWO_MONTHS, is_recommended: false"

**SÍ** (estilo Grapez — obligatorio):
> "❌ **Retención de datos en 2 meses** — GA4 borrará el historial de usuarios cada 60 días. Consecuencia directa: no podrás comparar temporadas completas ni analizar el ciclo de vida de tus clientes. Acción recomendada: configurar en 14 meses."

Reglas del estilo Grapez para incluir en la `instruction` de cada agente:
1. **Hallazgo + impacto en negocio**: no solo qué está mal, sino qué consecuencia tiene para el cliente
2. **Clasificación obligatoria**: `✅ Correcto` | `⚠️ Mejorable` | `❌ Crítico` — siempre una de las tres
3. **Prioridad por revenue**: conversiones (afectan decisiones de inversión) > retención (afectan análisis histórico) > configuración menor
4. **Accionable**: decir qué hacer, no solo qué está mal. "Configura retención en 14 meses" — no "La retención está en 2 meses"
5. **Español profesional**: nunca inglés técnico sin traducir, nunca jerga sin contexto
6. **Nunca inventar**: si la API devuelve error o vacío, reportarlo — no asumir configuración por defecto

### Al construir el frontend
1. No hay paquete npm `@google/a2ui` — implementar renderer custom (ver sección 7)
2. SSE está soportado nativamente en Agent Engine — usar `streamQuery` endpoint
3. El chat detecta bloques `\`\`\`json` con `__a2ui: true` y renderiza con A2UIRenderer

### Al construir el Playwright Service
1. Usar imagen base: `mcr.microsoft.com/playwright/python:v1.59.0-noble`
2. `--memory=2Gi` en Cloud Run es obligatorio — Chromium necesita al menos 1GB
3. El agente llama el servicio via `httpx.post(PLAYWRIGHT_SERVICE_URL + "/analyze", ...)`

### Al construir el deploy
1. Orden obligatorio: Playwright Service → Agentes → Frontend
2. Verificar: `gcloud --version` y `adk --version` antes de deployar
3. Siempre `--region=us-central1`

### Principios de código
- Python 3.11+ para agentes; TypeScript strict para frontend
- Tokens OAuth NUNCA se persisten fuera de la cookie cifrada de iron-session (no hay base de datos)
- Manejo de errores explícito — el agente comunica errores en lenguaje natural al consultor
- Tests mínimos para las tools de escritura (create_conversion_event, create_tag, etc.)

### Restricciones absolutas (nunca sin aprobación)
- No cambiar la arquitectura de 4 agentes (Planner + GA4 + GTM + Web Analyzer)
- No usar modelo distinto a `gemini-2.5-flash` (ver sección 19.3 — cambiar a 3.5 cuando llegue al proyecto)
- No persistir tokens OAuth fuera de la cookie iron-session
- No publicar versiones de GTM directamente — siempre crear borrador primero
- No escribir en GA4 Demo Account (solo lectura)

---

## 18. Links de Referencia

> **NOTA**: `google.github.io/adk-docs/` redirige permanentemente a `adk.dev/` desde mayo 2026. Usar siempre `adk.dev/`.

### ADK 2.x — Documentación oficial (verificada 26 mayo 2026)

| Recurso | URL | Para qué |
|---|---|---|
| ADK Docs (sitio principal) | https://adk.dev/ | Punto de entrada — redirige desde google.github.io/adk-docs |
| ADK LlmAgent | https://adk.dev/agents/llm-agents/ | Clase principal, parámetros, ejemplos |
| ADK Multi-agents | https://adk.dev/agents/multi-agents/ | AgentTool, ParallelAgent, orquestación |
| ADK Custom Tools | https://adk.dev/tools-custom/ | ToolContext, plain functions, FunctionTool |
| ADK Function Tools | https://adk.dev/tools-custom/function-tools/ | Patrón sin @tool decorator (ADK 2.x) |
| ADK State & Session | https://adk.dev/sessions/state/ | Cómo leer/escribir tool_context.state |
| ADK Skills | https://adk.dev/skills/ | SkillToolset, load_skill_from_dir |
| ADK Auth | https://adk.dev/tools-custom/authentication/ | OAuth2, AuthCredential |
| ADK 2.0 Migration | https://adk.dev/2.0/ | Breaking changes 1.x → 2.0 |
| ADK Callbacks | https://adk.dev/callbacks/ | BeforeAgentCallback, AfterAgentCallback (reemplazan override de métodos internos) |
| google-adk PyPI | https://pypi.org/project/google-adk/ | Versión latest, changelog |
| adk-python GitHub | https://github.com/google/adk-python | Releases, CHANGELOG.md, issues |
| adk-python Releases | https://github.com/google/adk-python/releases | Notas de cada versión |

### Gemini Models

| Recurso | URL | Para qué |
|---|---|---|
| Gemini 3.5 Flash (DeepMind) | https://deepmind.google/models/gemini/flash/ | Model card oficial, capacidades |
| Gemini 3.5 Flash (Model Card) | https://deepmind.google/models/model-cards/gemini-3-5-flash/ | Especificaciones técnicas |
| Gemini API Models | https://ai.google.dev/gemini-api/docs/models | IDs de todos los modelos disponibles |
| Gemini I/O 2026 Blog | https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-5/ | Anuncio de Gemini 3.5 |

### Agents CLI y Agent Platform

| Recurso | URL | Para qué |
|---|---|---|
| Agent Runtime Deploy (Agents CLI) | https://docs.cloud.google.com/gemini-enterprise-agent-platform/agents/quickstart-adk | Deploy a Agent Runtime |
| Agents CLI — GitHub | https://github.com/google/agents-cli | Código fuente, issues |
| Agents CLI — Docs | https://google.github.io/agents-cli/ | Comandos: create, deploy, publish, eval |
| Agent Studio — Docs | https://docs.cloud.google.com/gemini-enterprise-agent-platform/agent-studio/overview | Prototipado visual de instrucciones |
| Gemini Enterprise Agent Platform | https://cloud.google.com/products/gemini-enterprise-agent-platform | Página del producto (Agent Runtime) |

### APIs Google (Analytics, GTM, Ads)

| Recurso | URL | Para qué |
|---|---|---|
| GA4 Admin API (Python) | https://googleapis.dev/python/google-analytics-admin/latest/ | Métodos exactos: list_properties, create_conversion_event, etc. |
| GA4 Data API (Python) | https://googleapis.dev/python/google-analytics-data/latest/ | run_report, RunReportRequest, DateRange |
| GTM API v2 | https://developers.google.com/tag-manager/api/v2 | Referencia completa de endpoints GTM |
| Google Ads API Python | https://github.com/googleads/google-ads-python | Librería oficial |

### A2UI, Playwright, Infraestructura

| Recurso | URL | Para qué |
|---|---|---|
| A2UI Repo | https://github.com/google/A2UI | Protocolo oficial, spec JSON |
| A2UI Blog | https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/ | Contexto del protocolo |
| Playwright Docker Images | https://mcr.microsoft.com/en-us/product/playwright/python/about | Imagen base para Playwright Service |
| Playwright en Cloud Run | https://playwright.dev/python/docs/docker | Deploy Chromium en Cloud Run |

### Hackathon

| Recurso | URL | Para qué |
|---|---|---|
| Hackathon Devpost | https://googleforstartups-aiagents.devpost.com | Reglas, submit, team registration |
| MCP Market | https://mcp.so | Buscar skills (analytics-tracking, GTM, etc.) |
| analytics-tracking skill | https://mcp.so/server/analytics-tracking | Skill principal para GA4 + GTM agents |

---

## 19. Decisiones Técnicas Verificadas

> **Esta sección resuelve todas las deudas técnicas.**
> Última actualización: **10 de junio 2026** — ADK 2.1.0, gemini-2.5-flash, sin @tool decorator,
> todo deployado (Agent Engine + 3 servicios Cloud Run). Investigación inicial: 11 de mayo 2026.

### 19.1 Google ADK — Versión y Imports

**Versión**: `google-adk==2.1.0` (lanzada 23 mayo 2026 — **usar esta versión**)

> ADK 2.0 GA lanzado el 19 mayo 2026 con breaking changes. Versión 1.33.0 queda obsoleta.

**Imports verificados (ADK 2.x)**:
```python
from google.adk.agents import LlmAgent, SequentialAgent, ParallelAgent, LoopAgent
from google.adk.tools import ToolContext          # inyectado automáticamente por ADK
from google.adk.tools import FunctionTool         # wrapper explícito (opcional en 2.x)
from google.adk.tools.agent_tool import AgentTool # sub-agente como tool
from google.adk.skills import load_skill_from_dir
from google.adk.tools import SkillToolset
from google.adk.auth import AuthCredential, AuthCredentialTypes, OAuth2Auth
```

**Patrón de orquestación elegido**: `AgentTool` (no `sub_agents`)
- **Por qué**: El Planner necesita control explícito sobre cuándo y qué agente invocar. `sub_agents` deja la decisión al LLM de forma implícita. Con `AgentTool`, el Planner invoca cada agente como si fuera una function call controlada.
- **ParallelAgent**: Disponible para el diagnóstico paralelo (GA4 + GTM + Ads + Web simultáneamente). Reduce el tiempo total a ~el tiempo del agente más lento en vez de la suma.

**`UnsafeLocalCodeExecutor`**: Existe pero SOLO para desarrollo local. No funciona en Agent Engine. **No se usa en este proyecto** — se reemplaza con `@tool` functions normales que llaman las APIs de Google.

---

### 19.1b ADK 2.x — Patrón correcto de tools (sin @tool decorator)

> **Breaking change ADK 2.0**: El decorator `@tool` de `google.adk.tools` fue eliminado.
> Las funciones plain Python son auto-wrapeadas por ADK al pasarlas a `tools=[]`.
> **NUNCA** usar `from google.adk.tools import tool` — ese import ya no existe en 2.x.

```python
# ✅ CORRECTO en ADK 2.x — plain function, ToolContext inyectado automáticamente
from google.adk.tools import ToolContext

def list_properties(account_id: str, tool_context: ToolContext) -> dict:
    """Lista propiedades GA4. No incluir tool_context en el docstring."""
    tokens = tool_context.state.get("access_token")
    # ...

root_agent = LlmAgent(
    model="gemini-3.5-flash",
    tools=[list_properties],  # ADK auto-wrapea la función como FunctionTool
)

# ❌ INCORRECTO en ADK 2.x — @tool decorator eliminado
from google.adk.tools import tool  # ImportError en ADK 2.x
@tool
def list_properties(...): ...
```

### 19.2 Agent Runtime (Gemini Enterprise Agent Platform) — Deploy y Streaming

**Qué es**: El runtime managed para agentes ADK. Antes llamado "Agent Engine" / "Reasoning Engine", ahora es "Agent Runtime" dentro de la **Gemini Enterprise Agent Platform** (renombrado en Google Cloud Next '26, abril 2026). Mismo servicio, nueva marca. Endpoint regional en `us-central1-aiplatform.googleapis.com`.

**Deploy real del proyecto** (ver sección 13): `scripts/deploy-agents.ps1`, que ejecuta
`adk deploy agent_engine` sobre un paquete limpio (sin `.git`) con `.env` filtrado y
`--trace_to_cloud`. Se eligió sobre `agents-cli deploy` porque funcionó de forma confiable
en Windows y permite controlar exactamente qué archivos y variables suben al runtime.
Para actualizar el deploy existente: `.\scripts\deploy-agents.ps1 -UpdateExisting`.

**SSE confirmado**: Soporta streaming nativo via `streamQuery?alt=sse`. El frontend consume el stream directamente.

**Limitación crítica**: Code executors NO se combinan con otras tools en el mismo agente. Irrelevante para este proyecto porque no usamos code execution.

**Estructura del deploy**: Todos los agentes se despliegan como un paquete Python. El Planner importa los sub-agentes como módulos Python — no son endpoints separados. Un solo deploy del Planner incluye todos los agentes.

---

### 19.3 Modelo Gemini

**Modelo en uso**: `gemini-2.5-flash` — único disponible en el proyecto Vertex AI `grapez-ecosistema-medicion` (verificado 27 mayo 2026).

> **Nota**: `gemini-3.5-flash` fue anunciado GA el 19 mayo 2026 pero su rollout en Vertex AI no ha llegado al proyecto. Cuando esté disponible, cambiar el `model=` en los 3 agentes. Por ahora `gemini-2.5-flash` es superior a `gemini-2.0-flash` y no tiene fecha de expiración.

**Modelos verificados en el proyecto** (via `google.genai.Client(vertexai=True)`):
| ID | Estado en nuestro proyecto | Notas |
|---|---|---|
| `gemini-2.5-flash` | ✅ **DISPONIBLE — el que usamos** | Mejor razonamiento que 2.0 |
| `gemini-3.5-flash` | ❌ 404 en Vertex AI | Rollout pendiente — cambiar cuando llegue |
| `gemini-2.0-flash` | ❌ Retirado del proyecto | Apagado junio 1, 2026 |
| `gemini-1.5-flash` | ❌ Retirado del proyecto | Apagado |

**Acceso**: Via Vertex AI con Application Default Credentials — configurar con `gcloud auth application-default login` + `GOOGLE_GENAI_USE_VERTEXAI=true` en `.env`.

---

### 19.4 Web Analyzer — Playwright en Google Cloud ✅ EN PRODUCCIÓN

**Problema**: Agent Engine no puede correr Playwright/Chromium — es un sandbox Python puro sin procesos de navegador ni Chromium instalado.

**Solución implementada**: Playwright Service como microservicio independiente en Cloud Run con Docker (`playwright_service/`, servicio `playwright-service`). Endpoints: `/screenshot`, `/analyze`, `/crawl_site`, `/screenshots/{id}`, `/health`. Las tools del Web Analyzer (y del Planner) le hacen HTTP POST via `httpx` usando `PLAYWRIGHT_SERVICE_URL`.

**Por qué Cloud Run y no otras opciones**:
- GKE: overkill para hackathon, más configuración, más costoso
- Browserless/Apify: servicios de terceros, no es tecnología Google (penalizaría en el hackathon)
- Cloud Run: mismo ecosistema GCP, Docker nativo, escala a cero, ~$0 costo con tráfico mínimo

**Imagen Docker**: `mcr.microsoft.com/playwright/python:v1.59.0-noble` — imagen oficial de Playwright con todas las dependencias del sistema ya instaladas (libatk, libnss3, libdbus, etc.). Evita los ~20 `apt-get install` manuales.

**RAM**: `--memory=2Gi` obligatorio. Chromium headless consume 500MB-1GB en operación.

**Por qué Playwright y no HTTP requests simples**: Los sitios modernos son SPAs (React/Angular/Next.js) que cargan contenido vía JavaScript. Un HTTP request simple ve HTML vacío o el shell del app. Playwright ejecuta Chrome real, corre el JavaScript, y permite leer `window.dataLayer`, capturar network requests a `google-analytics.com`, y detectar el GTM ID. Sin esto, el Web Analyzer no puede hacer su trabajo.

---

### 19.5 A2UI — Estado Real y Decisión

**Existe y es real**: `github.com/google/A2UI` — protocolo open-source de Google, licencia Apache 2.0. Sitio: `a2ui.org`. Lanzado diciembre 2025.

**Lo que NO existe**: Paquete npm `@google/a2ui` para React. El renderer oficial de React está en roadmap pero no publicado a mayo 2026. Renderers disponibles: Lit (Web Components) y Flutter.

**Decisión**: Renderer custom en React/Next.js + Tailwind. 6 componentes implementados (table, action_card, progress, summary_card, choice_card, image_card). El contrato JSON de A2UI sí está especificado en el repo oficial — nuestro renderer lo implementa directamente.

**Cómo mencionar A2UI en el hackathon**: "Implementamos el protocolo A2UI de Google para generar UI dinámica desde el agente." Esto es preciso y técnicamente correcto aunque el renderer sea custom.

---

### 19.6 OAuth y Tokens — Flujo en los Agentes

**Patrón elegido**: `ToolContext.state`

```python
# El frontend pasa los tokens via initialState al crear la sesión del Agent Engine,
# o el Planner los carga con load_client_tokens() en desarrollo local:
tool_context.state["access_token"] = access_token
tool_context.state["refresh_token"] = refresh_token

# Cada sub-agente los lee en sus tools:
access_token = tool_context.state.get("access_token")
```

**Por qué este patrón**: Es el más directo para el flujo de este proyecto. El OAuth ocurre en el frontend Next.js — los tokens viven en la cookie cifrada de iron-session y llegan al agente via `initialState` en cada sesión de chat (`frontend/app/api/chat/route.ts`, que además refresca el access token proactivamente antes de cada turno). El state los propaga a todos los sub-agentes automáticamente. No hay Firestore ni Fernet — los tokens nunca se persisten fuera de la cookie.

---

### 19.7 Resumen de Cambios vs CLAUDE.md Original

| Qué cambió | Antes | Ahora |
|---|---|---|
| Diagrama de arquitectura | Web Analyzer en Agent Engine | Web Analyzer Agent + Playwright Service (Cloud Run) |
| ADK pattern principal | `Agent` + `SkillToolset` | `LlmAgent` + `AgentTool` + `@tool` functions |
| Code execution | `UnsafeLocalCodeExecutor` en producción | NO se usa — @tool functions con APIs directas |
| A2UI integración | Buscar `@google/a2ui` en npm | Renderer custom React/Tailwind ~200 líneas |
| OAuth en agentes | Tokens como parámetros de función | `ToolContext.state` (propagación automática) |
| Modelo | Verificar si `gemini-3.5-flash` existe | Confirmado y válido |
| `SkillToolset` | Por confirmar | Confirmado — `from google.adk.tools import skill_toolset` |
| Deploy Web Analyzer | Sin definir | Playwright Service en Cloud Run con Docker 2Gi |
| Deploy agentes | Agentes separados | Un solo deploy del Planner (importa sub-agentes como módulos) |
| OAuth storage | Firestore + Fernet | iron-session cookie — Firestore descartado |
| MCP integration | Sin definir | **Brave MCP Server propio en Cloud Run** (obligatorio Track 1) |
| Deadline hora | 11:59 PM PT (incorrecto) | **5:00 PM PT** (reglas oficiales) |
| Google Ads Agent | Incluido (agente 4 de 6) | **Eliminado** — carga > valor para el hackathon |
| Deploy tool | `agents-cli deploy` (planeado) | `adk deploy agent_engine` via `scripts/deploy-agents.ps1` — lo que funcionó en la práctica |
| Platform naming | "Vertex AI Agent Engine" | "Gemini Enterprise Agent Platform (Agent Runtime)" |
| Model ID | `gemini-3.5-flash` (era `-preview`) | `gemini-3.5-flash` — GA desde abril 2026 |
| Agents CLI skills | Sin instalar | **Instaladas en Claude Code** — 7 skills ADK (mayo 14, 2026) |
| Agent Studio | No considerado | Prototipado de instrucciones + mención en video |

---

### 19.8 OAuth on-the-fly — iron-session (decisión mayo 12, 2026)

**Decisión**: Para el demo del hackathon, los tokens OAuth se almacenan en cookie de sesión cifrada (`iron-session`) en lugar de Firestore. El usuario re-autentica cada sesión.

**Por qué**: Elimina ~4 días de desarrollo (Firestore token schema, Fernet encryption, refresh middleware). El resultado demo es más fuerte: los jueces ven el flujo OAuth real con los 5 scopes de Google. **Actualización junio 2026**: la decisión se volvió definitiva — Firestore quedó fuera del sistema (sección 8 se conserva solo como referencia de diseño).

**Impacto en el Planner Agent**: El `load_client_tokens` en Section 6 (que leía de Firestore) se reemplaza por una versión que recibe `access_token` y `refresh_token` como parámetros pasados desde el frontend via `initialState` del Agent Runtime session.

---

### 19.9 MCP Strategy — Track 1 Compliance (implementación final, junio 2026)

**Requisito**: Track 1 exige explícitamente MCP. Las reglas dicen: *"Show us how your agent uses the Model Context Protocol (MCP) to securely connect to external tools."*

**Cómo lo satisfacemos (implementado)**: Construimos y deployamos **nuestro propio MCP server de Brave Search** en Cloud Run (`brave_mcp_server/` — Streamable HTTP, autenticado con Google OIDC identity tokens). La tool `brave_web_search` del Planner ([agents/planner_agent/tools/brave_search.py](agents/planner_agent/tools/brave_search.py)) abre una `ClientSession` del SDK `mcp` por cada request y llama la tool remota; en desarrollo local sin MCP server, hace fallback HTTP directo a la Brave API con `BRAVE_API_KEY`.

> El plan original (skill `analytics-tracking` de MCP Market via `SkillToolset`) se **descartó** — el MCP server propio cubre el requisito con más mérito técnico.

**Cómo documentarlo en Devpost**: "We built and deployed our own MCP server (Brave Search over Streamable HTTP on Cloud Run, secured with Google OIDC identity tokens). The Planner Agent connects to it through the MCP Python client to research each client's business context before any diagnostic."

---

### 19.10 Demo Strategy — Mock Clients UI (decisión mayo 12, 2026)

**Decisión**: El frontend muestra una lista de clientes con datos quemados (mock) para dar contexto visual al demo. Una sola cuenta ("Grapez Studio") está conectada con OAuth real y ejecuta los agentes reales.

**Archivo**: `frontend/data/mock-clients.ts` — JSON estático con 3-4 clientes ficticios que tienen "conversaciones quemadas" mostrando diagnósticos previos con componentes A2UI renderizados.

**Por qué**: El demo del video es más convincente si el juez ve una lista de clientes existentes (simula uso real del producto) antes de entrar al chat en vivo con la cuenta real.

**Restricción**: Los datos mock deben ser claramente ficticios (Tienda Demo, Cliente Prueba, etc.) — no datos reales de clientes de Grapez Studio.

---

### 19.11 Nuevas herramientas — Agents CLI y Agent Studio (kickoff mayo 14, 2026)

> Anunciadas en Google Cloud Next '26 (abril 22, 2026). Adoptadas en este proyecto desde Semana 3.

#### Agents CLI

**Qué es**: CLI + paquete de skills para el ciclo completo de desarrollo de agentes ADK. Diseñado específicamente para funcionar con coding agents (Claude Code, Gemini CLI, Copilot).

**Instalación (ya hecho en Claude Code)**:
```bash
npx skills add google/agents-cli   # instala 7 skills en Claude Code
pip install google-agents-cli      # instala CLI en el sistema
```

**7 skills instaladas en Claude Code**:
| Skill | Qué cubre |
|---|---|
| `google-agents-cli-workflow` | Flujo de trabajo completo ADLC |
| `google-agents-cli-adk-code` | ADK Python API — código de agentes |
| `google-agents-cli-scaffold` | Scaffolding de proyectos ADK |
| `google-agents-cli-eval` | Evaluación de agentes |
| `google-agents-cli-deploy` | Deploy a Agent Runtime / Cloud Run / GKE |
| `google-agents-cli-publish` | Registro en Gemini Enterprise |
| `google-agents-cli-observability` | Cloud Trace, métricas, logs |

**Comandos clave**:
```bash
agents-cli create grapez-planner --prototype --yes  # scaffold
agents-cli install                                   # instalar deps
agents-cli run "diagnostica GA4 de TiendaDemo"      # test local
agents-cli eval run                                  # evaluación
agents-cli deploy                                    # deploy a Agent Runtime
agents-cli publish gemini-enterprise --display_name="Grapez Planner Agent"
```

**Impacto real en el proyecto**: Las 7 skills de Claude Code sí se usan como conocimiento ADK. El comando `agents-cli deploy`, en cambio, **no terminó usándose** — el deploy en producción se hace con `adk deploy agent_engine` via `scripts/deploy-agents.ps1` (ver 19.2 y sección 13).

#### Agent Studio

**Qué es**: UI visual low-code dentro de Gemini Enterprise Agent Platform para diseñar instrucciones del sistema, comparar configuraciones de agentes, y prototipado.

**Relación con ADK**: Complementario, no reemplaza. ADK es code-first; Agent Studio es para iterar instrucciones visualmente antes de hardcodearlas en Python.

**Uso recomendado en el proyecto**:
- Mauro usa Agent Studio para diseñar y refinar las instrucciones del Planner Agent visualmente
- Juan Camilo copia las instrucciones refinadas al código Python
- **Mostrar en el video demo**: "diseñamos las instrucciones del agente en Agent Studio" → suma en Innovation

**Cómo mencionar en Devpost**: "We prototyped agent instructions in Agent Studio (Gemini Enterprise Agent Platform) and implemented the final agents with ADK, deployed via Agents CLI to Agent Runtime."

---

## 20. Estrategia de Demo y Distribución de Trabajo

### UI mock + una cuenta real

```
Frontend (Next.js)
├── / — lista de clientes
│   ├── "Tienda Demo"      ← mock, conversación quemada con A2UI de diagnóstico
│   ├── "E-commerce Test"  ← mock, conversación quemada con A2UI de implementación
│   ├── "Retail Colombia"  ← mock, conversación quemada con summary card
│   └── "Grapez Studio"    ← REAL — conecta OAuth → chat en vivo con agentes reales
```

El cliente "Grapez Studio" es la cuenta real de la agencia con acceso a GA4/GTM/Ads configurados. Los jueces ven el flujo completo real en esa cuenta.

### División del trabajo

| Semana | Mauro (Infra + Frontend) | Juan Camilo (Agentes Python) |
|---|---|---|
| S2 (May 10-16) | GCP setup, OAuth iron-session, mock UI, tokens para JuanCa | Dev env, GA4 Agent, GTM Agent, MCP skill |
| S3 (May 17-23) | A2UIRenderer, Chat UI SSE, Planner skeleton en Agent Engine | Ads Agent, Web Analyzer local, Planner orquestador |
| S4 (May 24-30) | Playwright Service Cloud Run, deploy completo, end-to-end | Implementation Agent, confirmation flow, Firestore logs |
| S5 (May 31-Jun 4) | Diagrama arquitectura, README inglés, testing instructions | Bug fixes, golden path demo, video demo |

### Cómo trabajar sin bloqueos entre personas

**Juan Camilo no necesita el frontend para desarrollar agentes**:
- Usa `adk web agents/planner_agent` (UI local de ADK) para probar cualquier agente
- Usa `agents/dev_utils.py` para inyectar tokens desde `.env` sin OAuth
- Desarrolla y valida cada agente de forma independiente

**Mauro no necesita los agentes para desarrollar el frontend**:
- Usa respuestas mock del Agent Engine para testear A2UIRenderer
- El Chat UI funciona con SSE real en cuanto el Planner skeleton esté en Agent Engine (Semana 3)
- Puede hardcodear una respuesta A2UI en el chat para testear los componentes

### 19.12 Retry automático para 429 — patrón en todos los agentes (mayo 27, 2026)

Los agentes complejos hacen múltiples llamadas LLM en una sola sesión (Planner → GA4 → GTM). El rate limit del modelo puede generar errores 429 transitorios. Todos los agentes tienen retry configurado:

```python
from google.genai import types

root_agent = LlmAgent(
    model="gemini-2.5-flash",
    generate_content_config=types.GenerateContentConfig(
        http_options=types.HttpOptions(
            retry_options=types.HttpRetryOptions(
                initial_delay=30,  # espera 30s antes del primer reintento (error dice ~17s)
                attempts=3,        # hasta 3 reintentos automáticos
            ),
        ),
    ),
    ...
)
```

Con Vertex AI + billing habilitado los 429 son raros. Este retry es la red de seguridad para picos ocasionales. Si los 429 persisten, solicitar aumento de quota en GCP Console → APIs & Services → Quotas.

**Reintento ante respuestas vacías (junio 10, 2026)**: Gemini 2.5 a veces devuelve un turno
vacío (sin texto ni function calls, o solo "thoughts") después de un function response grande —
p. ej. tras el diagnóstico extenso de un AgentTool. ADK lo trata como respuesta final y la
conversación queda congelada esperando input. Los 4 agentes usan
`RetryingGemini` ([agents/shared/retrying_gemini.py](agents/shared/retrying_gemini.py)) en vez
del string del modelo: un subclass de `Gemini` que detecta el intento vacío y relanza la llamada
hasta 2 veces (las respuestas con contenido se streamean sin buffering, no afecta el SSE):

```python
from agents.shared.retrying_gemini import RetryingGemini

root_agent = LlmAgent(
    model=RetryingGemini(model="gemini-2.5-flash"),
    ...
)
```

---

### 19.13 Client Storage — iron-session cookie (junio 2, 2026; definitivo)

**Decisión**: Los clientes creados por el consultor (nombre, URL, industria) se almacenan en la **cookie de iron-session** (`session.createdClients: StoredClient[]`). No hay base de datos — Firestore quedó descartado del sistema (sección 8).

**Por qué**: Elimina la dependencia de base de datos por completo. El consultor puede crear 10-15 clientes en 24 horas (duración de la cookie).

**Limitaciones conocidas**:
- Cookie: ~4KB máx → ~10-15 clientes máx antes de overflow
- TTL: 24 horas → los clientes desaparecen al día siguiente
- No persiste entre sesiones largas ni entre usuarios distintos

**Estructura almacenada en cookie** (`frontend/lib/session.ts`):
```typescript
export interface StoredClient {
  id: string       // slug generado del nombre ("tienda-moda-colombia")
  name: string
  websiteUrl: string
  industry: string
  createdAt: string  // ISO timestamp
}

export interface SessionData {
  // ... auth fields
  createdClients?: StoredClient[]  // lista de clientes creados en esta sesión
}
```

**Endpoints** (`frontend/app/api/clients/route.ts`):
- `POST /api/clients` — valida campos, genera id slug, normaliza URL con `https://`, agrega a `session.createdClients`, retorna `{ id }`
- `DELETE /api/clients` — filtra el cliente por id y guarda la sesión actualizada

**Flujo desde "Nuevo análisis"**:
1. `GET /clients/new` → `NewClientForm` (nombre, URL, industria)
2. Submit → `POST /api/clients` → responde `{ id }`
3. Redirect a `/clients/${id}/chat?reset=true`
4. `chat/page.tsx` resuelve: `mockClients.find()` primero, luego `session.createdClients.find()`, si no → `notFound()`

**Migración a Firestore** (solo referencia — NO es trabajo planeado; aplicaría únicamente si el producto escala a multi-usuario persistente):

| Qué cambiar | Dónde | Detalle |
|---|---|---|
| Schema Firestore | Nueva colección | `consultants/{userId}/clients/{clientId}` con mismos campos de `StoredClient` |
| `POST /api/clients` | `api/clients/route.ts` | `db.collection('consultants').doc(userId).collection('clients').add(client)` en lugar de `session.createdClients.push()` |
| `DELETE /api/clients` | `api/clients/route.ts` | `db.collection(...).doc(clientId).delete()` |
| Home page | `app/page.tsx` | `db.collection('consultants').doc(userId).collection('clients').get()` en lugar de `session.createdClients` |
| Chat page | `app/clients/[id]/chat/page.tsx` | `db.collection(...).doc(id).get()` en lugar de `session.createdClients.find()` |
| Session | `lib/session.ts` | Eliminar `createdClients?: StoredClient[]` del tipo (ya no necesario en cookie) |

> **Nota crítica**: Los tokens OAuth (`accessToken`, `refreshToken`) siguen en iron-session siempre. Solo la lista de clientes se mueve a Firestore. No mezclar: tokens en cookie (TTL corto, seguro), datos de clientes en Firestore (persistente).

---

### Track del concurso y potencial Track 3

**Selección**: **Track 1** (Build — Net-New Agents) — es un sistema nuevo construido desde cero.

**Potencial Track 3 a mencionar en Devpost**: El sistema cumple todos los requisitos de Track 3 (B2B focus ✓, Cloud-Native Runtime ✓, Vertex-Powered Intelligence ✓, A2A Interoperability ✓). Mencionar esto en la descripción demuestra visión de escalamiento y puede sumar en Business Case + Innovation.
