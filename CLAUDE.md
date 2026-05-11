# CLAUDE.md — Grapez Analytics Agents
## Google for Startups AI Agents Challenge — Hackathon 2026

> **Deadline**: Junio 5, 2026 | **Estado detallado**: `STATE.md`

---

## 1. Qué es este proyecto

**Grapez Analytics Agents** es un sistema multi-agente que permite a consultores de Grapez Studio conectar la cuenta Google de un cliente y diagnosticar + configurar automáticamente su ecosistema completo de marketing analytics:

- **Google Analytics 4** — auditoría de configuración, eventos, conversiones, dimensiones
- **Google Tag Manager** — contenedores, tags, triggers, variables, dataLayer
- **Google Ads** — cuentas, conversiones, audiencias, atribución
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
**Deadline**: 5 de junio 2026, 11:59 PM PT
**Repositorio**: debe ser público en GitHub al momento del submit

### Requisitos técnicos obligatorios
- [ ] Usar **Gemini API** (directo o via Vertex AI) — NO opcional
- [ ] Usar **ADK** (Agent Development Kit) O LangChain O CrewAI
- [ ] Desplegar en **Google Cloud Platform**
- [ ] Proyecto **nuevo** (no adaptación de proyecto existente)

### Criterios de evaluación (total 100 pts)
| Criterio | Peso | Qué buscan |
|---|---|---|
| Technical Implementation | 30% | Multi-agent, herramientas reales, arquitectura sólida |
| Business Case | 30% | ROI real, problema real, usuarios reales |
| Innovation | 20% | Uso creativo de ADK/A2UI/Agent Engine |
| Demo | 20% | Video 1-2 min claro y convincente |

### Entregables requeridos
- [ ] Video demo 1-2 minutos (YouTube o Vimeo, link en Devpost)
- [ ] Repositorio GitHub público con código completo
- [ ] Diagrama de arquitectura (en `/architecture/`)
- [ ] Descripción en Devpost con business case

### Lo que maximiza el score
- A2UI para UI dinámica generada por el agente → Innovation +
- Agent Engine para deploy → Technical Implementation +
- Datos reales de clientes en demo → Business Case +
- Múltiples agentes especializados con skills → Technical Implementation +

---

## 3. Stack Técnico

### Backend — Agentes
| Tecnología | Versión / Detalles | Para qué |
|---|---|---|
| **Python** | 3.11+ | Lenguaje de todos los agentes |
| **Google ADK** | `google-adk` latest | Framework de agentes |
| **Gemini 3 Flash Preview** | `gemini-3-flash-preview` | Modelo de todos los agentes |
| **Agent Engine** | Google Cloud managed | Deploy y hosting de agentes |
| **Playwright (Python)** | `playwright` latest | Web Analyzer — crawl sitios |
| **google-analytics-admin** | latest | GA4 Admin API (read+write) |
| **google-analytics-data** | latest | GA4 Data API (read) |
| **google-auth** | latest | OAuth2 con refresh tokens |
| **Firestore** | via `google-cloud-firestore` | Base de datos (clientes, tokens) |

### Frontend
| Tecnología | Versión | Para qué |
|---|---|---|
| **Next.js** | 15+ App Router | Frontend principal |
| **TypeScript** | 5+ | Tipado |
| **Tailwind CSS** | 3+ | Estilos |
| **A2UI Client** | ver spec en sección 7 | Renderizar UI dinámica del agente |
| **Cloud Run** | Google Cloud | Hosting del frontend |

### APIs externas (Google)
| API | Scopes OAuth | Operaciones |
|---|---|---|
| GA4 Admin API | `analytics.edit` | Leer/crear propiedades, streams, eventos, conversiones |
| GA4 Data API | `analytics.readonly` | Leer reportes, dimensiones, métricas |
| GTM API | `tagmanager.edit.containers` | Leer/crear tags, triggers, variables, versiones |
| Google Ads API | `adwords` | Leer/crear conversiones, audiencias, atribución |

### Scopes OAuth consolidados (pedir todos juntos)
```
https://www.googleapis.com/auth/analytics.edit
https://www.googleapis.com/auth/analytics.readonly
https://www.googleapis.com/auth/tagmanager.edit.containers
https://www.googleapis.com/auth/tagmanager.publish
https://www.googleapis.com/auth/adwords
```

---

## 4. Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 15)                     │
│  OAuth Google → Firestore → Chat UI + A2UI Renderer custom   │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTP / SSE (Agent Engine endpoint)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│           PLANNER AGENT — Agent Engine (Vertex AI)            │
│    LlmAgent: coordina sub-agentes via AgentTool + ParallelAgent│
└──────┬──────────┬──────────┬────────────┬────────────────────┘
       │ AgentTool│ AgentTool│ AgentTool  │ HTTP call
       ▼          ▼          ▼            ▼
  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────────────────┐
  │  GA4    │ │  GTM    │ │  ADS    │ │  WEB ANALYZER AGENT   │
  │ AGENT   │ │ AGENT   │ │ AGENT   │ │  (Agent Engine)       │
  │ Agent   │ │ Agent   │ │ Agent   │ │  llama HTTP → Cloud   │
  │ Engine  │ │ Engine  │ │ Engine  │ │  Run Playwright svc   │
  └────┬────┘ └────┬────┘ └────┬────┘ └──────────┬────────────┘
       │           │           │                  │ HTTP POST /analyze
       │           │           │        ┌─────────▼────────────┐
       │           │           │        │  PLAYWRIGHT SERVICE   │
       │           │           │        │  Cloud Run + Docker   │
       │           │           │        │  chromium headless    │
       │           │           │        │  2Gi RAM, port 8080   │
       │           │           │        └──────────────────────┘
       └───────────────────┬───┘
                           ▼
              ┌────────────────────────┐
              │  IMPLEMENTATION AGENT  │
              │  Agent Engine          │
              │  GA4 + GTM + Ads write │
              └────────────────────────┘
                           │
         GA4 Admin API + GTM API v2 + Google Ads API
                (Python libs — tokens via ToolContext.state)

INFRAESTRUCTURA GOOGLE CLOUD:
  Agent Engine (Vertex AI) ← todos los 5 agentes Python
  Cloud Run                ← frontend Next.js + Playwright service (docker)
  Firestore                ← clientes, tokens cifrados, logs
  Secret Manager           ← ENCRYPTION_KEY, GOOGLE_CLIENT_SECRET
```

### Decisión arquitectural clave: Web Analyzer en dos capas

Agent Engine **no tiene Chromium** — es un sandbox Python puro. La solución es:
- **Web Analyzer Agent** corre en Agent Engine como los demás agentes
- Tiene una tool `analyze_site(url)` que hace HTTP POST al **Playwright Service**
- **Playwright Service** es un microservicio FastAPI corriendo en Cloud Run con Docker + Chromium
- El agente orquesta la lógica; el servicio ejecuta el browser

Esto mantiene toda la infraestructura en Google Cloud y resuelve la limitación del sandbox.

### Flujo completo
1. Consultor crea cliente con nombre y URL del sitio → guardado en Firestore
2. Conecta cuenta Google del cliente via OAuth → tokens encriptados en Firestore
3. Abre chat → Planner Agent recibe el objetivo ("diagnostica el ecosistema")
4. Planner carga tokens de Firestore → los pone en `session.state`
5. Planner activa ParallelAgent: GA4 + GTM + Ads + Web Analyzer corren en paralelo
6. Web Analyzer Agent llama Playwright Service (Cloud Run) via HTTP → recibe dataLayer, IDs, errores
7. GA4/GTM/Ads Agents llaman APIs directamente con tokens del session.state
8. Planner consolida hallazgos → genera A2UI con tabla de diagnóstico
9. Consultor confirma → Implementation Agent ejecuta cambios paso a paso
10. Cada cambio: A2UI action_card → confirmación → ejecución → log en Firestore
11. Reporte final A2UI summary_card

---

## 5. Los 6 Agentes — Especificación Detallada

### 5.1 Planner Agent (Orchestrador)
**Archivo**: `agents/planner_agent/agent.py`
**Modelo**: `gemini-3-flash-preview`
**Rol**: Punto de entrada. Interpreta el objetivo del consultor, coordina el trabajo de los demás agentes, consolida resultados y genera el plan final.

**Herramientas**:
- `delegate_to_ga4_agent(client_id, tokens)` — invoca GA4 Agent
- `delegate_to_gtm_agent(client_id, tokens)` — invoca GTM Agent
- `delegate_to_ads_agent(client_id, tokens)` — invoca Ads Agent
- `delegate_to_web_analyzer(url)` — invoca Web Analyzer Agent
- `delegate_to_implementation(plan, client_id, tokens)` — invoca Implementation Agent
- `render_a2ui(component)` — envía componente A2UI al frontend
- `get_client_context(client_id)` — lee Firestore para obtener tokens + metadata

**Instrucción del sistema** (resumida):
> Eres el coordinador del ecosistema de medición de Grapez Studio. Cuando un consultor te da un objetivo, analizas qué agentes necesitas activar, los coordinas en el orden correcto, y presentas los resultados de forma clara usando componentes visuales. Nunca implementes cambios sin confirmación explícita del consultor.

---

### 5.2 GA4 Agent
**Archivo**: `agents/ga4_agent/agent.py`
**Rol**: Diagnóstico y configuración completa de Google Analytics 4.

**Herramientas (Python code execution via ADK)**:
```python
# Diagnóstico (GA4 Admin API)
list_accounts()
list_properties(account_id)
get_property_details(property_id)
list_data_streams(property_id)
list_custom_events(property_id)
list_conversions(property_id)
list_custom_dimensions(property_id)
list_custom_metrics(property_id)
list_audiences(property_id)
check_enhanced_measurement(stream_id)

# Reportes (GA4 Data API)
get_event_count_last_30_days(property_id)
get_conversion_report(property_id, date_range)
check_data_freshness(property_id)

# Implementación (GA4 Admin API — write)
create_conversion_event(property_id, event_name)
update_conversion_event(property_id, event_name, config)
create_custom_dimension(property_id, params)
create_audience(property_id, audience_config)
update_data_retention(property_id, months)
```

**Skills a buscar cuando se construya este agente**:
- Buscar en MCP Market: `analytics-tracking` (borghei, 101 stars) — tiene event taxonomy, GA4 config rules, audit checklist, scripts Python
- Buscar: cualquier skill sobre GA4 event schema, measurement protocol
- Leer los SKILL.md de cada skill antes de integrar

**Checklist de diagnóstico GA4**:
- [ ] Propiedad GA4 existe y tiene stream web configurado
- [ ] Enhanced measurement activado
- [ ] Eventos de conversión configurados (purchase, lead, etc.)
- [ ] Retención de datos = 14 meses (default es 2)
- [ ] Dimensiones personalizadas para datos del negocio
- [ ] Audiencias de remarketing configuradas
- [ ] BigQuery link (si aplica)
- [ ] Cross-domain tracking (si aplica)
- [ ] Consent Mode v2 activado
- [ ] Sin duplicación de hits (verificar con data API)

---

### 5.3 GTM Agent
**Archivo**: `agents/gtm_agent/agent.py`
**Rol**: Diagnóstico y configuración de Google Tag Manager.

**Herramientas**:
```python
# Diagnóstico (GTM API v2 — read)
list_accounts()
list_containers(account_id)
get_container(account_id, container_id)
list_workspaces(account_id, container_id)
list_tags(account_id, container_id, workspace_id)
list_triggers(account_id, container_id, workspace_id)
list_variables(account_id, container_id, workspace_id)
get_container_version(account_id, container_id, version_id)
list_versions(account_id, container_id)

# Implementación (GTM API v2 — write)
create_tag(account_id, container_id, workspace_id, tag_config)
create_trigger(account_id, container_id, workspace_id, trigger_config)
create_variable(account_id, container_id, workspace_id, variable_config)
create_workspace(account_id, container_id, workspace_name)
publish_version(account_id, container_id, workspace_id)
```

**Skills a buscar cuando se construya**:
- `stape-io/google-tag-manager-mcp-server` — revisar si tiene patterns útiles
- Skills sobre GTM architecture, dataLayer schema, tag templates

**Checklist de diagnóstico GTM**:
- [ ] Contenedor instalado en el sitio (verificar con Web Analyzer)
- [ ] Tag de GA4 Configuration presente
- [ ] Sin tags duplicados de GA4
- [ ] Trigger "All Pages" configurado correctamente
- [ ] Variables de capa de datos definidas para eventos clave
- [ ] Consent Mode implementado
- [ ] Sin tags con errores en versión publicada
- [ ] Versiones publicadas vs borradores huérfanos
- [ ] Nomenclatura consistente de tags/triggers/variables

---

### 5.4 Google Ads Agent
**Archivo**: `agents/ads_agent/agent.py`
**Rol**: Diagnóstico del ecosistema de Google Ads enfocado en medición y conversiones.

**Herramientas**:
```python
# Diagnóstico (Google Ads API — read)
get_customer_info(customer_id)
list_conversion_actions(customer_id)
get_conversion_attribution_model(customer_id)
list_remarketing_lists(customer_id)
check_google_ads_tag_installed(customer_id)
get_linked_ga4_properties(customer_id)
check_auto_tagging(customer_id)
list_campaign_goals(customer_id)

# Implementación (Google Ads API — write)
create_conversion_action(customer_id, conversion_config)
update_attribution_model(customer_id, model)
link_ga4_property(customer_id, ga4_property_id)
enable_auto_tagging(customer_id)
```

**Skills a buscar cuando se construya**:
- `google-marketing-solutions/google_ads_mcp` — revisar estructura de tools
- Skills sobre Google Ads conversion tracking, attribution models

**Checklist de diagnóstico Google Ads**:
- [ ] Auto-tagging activado (para que GA4 reciba datos de Ads)
- [ ] GA4 property vinculada a Google Ads
- [ ] Conversiones importadas desde GA4 (no tag duplicado)
- [ ] Modelo de atribución configurado (Data-Driven recomendado)
- [ ] Enhanced conversions activado
- [ ] Listas de remarketing conectadas a GA4 Audiences

---

### 5.5 Web Analyzer Agent
**Archivo**: `agents/web_analyzer_agent/agent.py`
**Rol**: Orquestar el análisis del sitio web del cliente. El agente corre en Agent Engine; el browser headless corre en el Playwright Service (Cloud Run separado).

**Por qué Playwright y no HTTP requests simples**:
Los sitios modernos renderizan con JavaScript (React, Angular, Next.js). Un HTTP request solo ve HTML estático — sin GA4, sin GTM, sin dataLayer. Se necesita un browser real porque:
- GTM se carga via `<script>` que ejecuta JavaScript
- El `window.dataLayer` se puebla en runtime del browser
- Los eventos de conversión (purchase, add_to_cart) se disparan en interacciones reales
- Consent Mode v2 se configura antes del primer tag — solo visible en browser

**Arquitectura en dos capas (DEFINITIVA)**:

```
Web Analyzer Agent (Agent Engine)
    ↓ tool call: analyze_site(url)
    ↓ HTTP POST https://playwright-service-xxxx.run.app/analyze
Playwright Service (Cloud Run + Docker + Chromium)
    → Lanza browser headless
    → Navega el sitio
    → Captura dataLayer, network requests, IDs
    → Devuelve JSON al agente
```

**Tools del agente** (llaman al Playwright Service via HTTP):
```python
@tool
def analyze_site(url: str) -> dict:
    """Analiza el sitio completo: GTM ID, GA4 ID, dataLayer, errores de tracking."""

@tool
def crawl_conversion_funnel(url: str, funnel_pages: list[str]) -> dict:
    """Navega el funnel de compra y detecta eventos en cada paso."""

@tool
def check_consent_mode(url: str) -> dict:
    """Verifica si Consent Mode v2 está implementado correctamente."""
```

**Playwright Service — `playwright_service/`**:
```
playwright_service/
├── Dockerfile           ← imagen base mcr.microsoft.com/playwright/python
├── app.py               ← FastAPI con endpoints /analyze, /crawl, /health
└── requirements.txt     ← fastapi, uvicorn, playwright
```

**Dockerfile**:
```dockerfile
FROM mcr.microsoft.com/playwright/python:v1.59.0-noble
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app.py .
EXPOSE 8080
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
```

**Deploy del Playwright Service**:
```bash
# Build y push a Container Registry
docker build -t gcr.io/grapez-hackathon/playwright-service ./playwright_service
docker push gcr.io/grapez-hackathon/playwright-service

# Deploy a Cloud Run — mínimo 2Gi RAM (Chromium lo requiere)
gcloud run deploy playwright-service \
  --image=gcr.io/grapez-hackathon/playwright-service \
  --region=us-central1 \
  --memory=2Gi \
  --timeout=120 \
  --allow-unauthenticated
# Guarda la URL en .env: PLAYWRIGHT_SERVICE_URL=https://playwright-service-xxxx.run.app
```

**Estructura de carpeta**:
```
agents/web_analyzer_agent/
├── agent.py                 ← LlmAgent con tools que llaman al servicio HTTP
└── tools/
    └── playwright_tools.py  ← @tool functions que hacen HTTP POST al servicio
playwright_service/          ← microservicio independiente (NO es un agente ADK)
├── Dockerfile
├── app.py
└── requirements.txt
```

---

### 5.6 Implementation Agent
**Archivo**: `agents/implementation_agent/agent.py`
**Rol**: Toma el plan generado por Planner Agent y ejecuta cada acción, paso a paso, con confirmación del consultor antes de cada cambio destructivo o irreversible.

**Principio fundamental**: NUNCA ejecuta cambios en GTM sin crear primero un nuevo workspace. NUNCA publica directamente — siempre crea versión de borrador para revisión humana.

**Herramientas**:
- Todas las herramientas `write` de GA4 Agent, GTM Agent, Ads Agent
- `request_confirmation(action_description, impact_level)` — pausa y pide OK al consultor via A2UI
- `create_rollback_snapshot(agent, client_id)` — guarda estado actual antes de implementar
- `log_action(action, result, client_id)` — persiste log en Firestore

**Flujo de implementación**:
1. Recibe lista de acciones ordenadas por prioridad
2. Por cada acción: muestra descripción + impacto via A2UI → espera confirmación
3. Ejecuta la acción via API
4. Verifica que se aplicó correctamente
5. Loguea resultado
6. Continúa con la siguiente acción

---

## 6. Arquitectura ADK — Cómo Construir los Agentes

### Imports verificados (google-adk v1.33.0 — mayo 2026)

```python
# Agentes
from google.adk.agents import LlmAgent, SequentialAgent, ParallelAgent, LoopAgent

# Tools
from google.adk.tools import agent_tool          # AgentTool — sub-agente como tool
from google.adk.tools import FunctionTool, ToolContext

# Skills
from google.adk.skills import load_skill_from_dir
from google.adk.tools import skill_toolset       # SkillToolset

# Auth
from google.adk.auth import AuthCredential, AuthCredentialTypes, OAuth2Auth
```

> **IMPORTANTE**: `UnsafeLocalCodeExecutor` existe pero es **solo para desarrollo local**.
> En Agent Engine no funciona — el sandbox no permite procesos externos.
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
    model="gemini-3-flash-preview",
    name="ga4_agent",
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

### Patrón de tool con FunctionTool (@tool decorator)

```python
# agents/ga4_agent/tools/ga4_admin_tools.py
from google.adk.tools import tool, ToolContext
from google.analytics.admin import AnalyticsAdminServiceClient
from google.oauth2.credentials import Credentials
import os

@tool
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

### Patrón del Planner Agent (orquestador con AgentTool + ParallelAgent)

```python
# agents/planner_agent/agent.py
from google.adk.agents import LlmAgent, SequentialAgent, ParallelAgent
from google.adk.tools import agent_tool, ToolContext
from google.cloud import firestore
from cryptography.fernet import Fernet
import os

# Importar los sub-agentes ya construidos
from agents.ga4_agent.agent import root_agent as ga4_agent
from agents.gtm_agent.agent import root_agent as gtm_agent
from agents.ads_agent.agent import root_agent as ads_agent
from agents.web_analyzer_agent.agent import root_agent as web_analyzer_agent
from agents.implementation_agent.agent import root_agent as impl_agent

# Envolver como AgentTools para llamada explícita y controlada
ga4_tool = agent_tool.AgentTool(agent=ga4_agent)
gtm_tool = agent_tool.AgentTool(agent=gtm_agent)
ads_tool = agent_tool.AgentTool(agent=ads_agent)
web_tool = agent_tool.AgentTool(agent=web_analyzer_agent)
impl_tool = agent_tool.AgentTool(agent=impl_agent)

@tool
def load_client_tokens(client_id: str, tool_context: ToolContext) -> dict:
    """Carga y descifra los tokens OAuth del cliente desde Firestore."""
    db = firestore.Client()
    doc = db.collection("clients").document(client_id).collection("google_tokens").document("current").get()
    if not doc.exists:
        return {"error": "Cliente no conectado. Solicita al consultor que conecte la cuenta Google."}

    fernet = Fernet(os.environ["ENCRYPTION_KEY"].encode())
    data = doc.to_dict()
    access_token = fernet.decrypt(data["access_token"].encode()).decode()
    refresh_token = fernet.decrypt(data["refresh_token"].encode()).decode()

    # Guardar en session.state para que todos los sub-agentes los lean via ToolContext
    tool_context.state["access_token"] = access_token
    tool_context.state["refresh_token"] = refresh_token
    tool_context.state["client_id"] = client_id
    return {"status": "tokens_loaded"}

root_agent = LlmAgent(
    model="gemini-3-flash-preview",
    name="planner_agent",
    description="Orquestador del ecosistema de medición de Grapez Studio.",
    instruction="""
Eres el coordinador del ecosistema de medición de Grapez Studio.

Al recibir un objetivo:
1. Llama load_client_tokens(client_id) para cargar credenciales en sesión
2. Activa diagnóstico en paralelo: ga4_tool, gtm_tool, ads_tool, web_tool
3. Consolida hallazgos y genera plan de acción con A2UI (tabla de diagnóstico)
4. Presenta plan al consultor y espera confirmación explícita
5. Solo después de confirmación: activa impl_tool para ejecutar cambios

NUNCA implementes cambios sin confirmación explícita del consultor.
""",
    tools=[load_client_tokens, ga4_tool, gtm_tool, ads_tool, web_tool, impl_tool],
)
```

### Por qué @tool functions en vez de code execution

Los MCP servers disponibles para GA4/GTM/Ads son **solo lectura** por defecto. Necesitamos escritura:
- GA4 Admin API con scope `analytics.edit` — crear conversiones, dimensiones, audiencias
- GTM API v2 con scope `tagmanager.edit.containers` — crear tags, triggers, publicar borradores
- Google Ads API con scope `adwords` — crear conversiones, vincular propiedades

Usando `@tool` functions normales de ADK, los agentes llaman las librerías Python oficiales de Google con los tokens del cliente desde `ToolContext.state`. No se necesita `UnsafeLocalCodeExecutor` ni code execution.

---

## 7. A2UI — Interfaz Dinámica del Agente

### Qué es A2UI (estado verificado a mayo 2026)

A2UI es un **protocolo open-source real de Google** (repo: `github.com/google/A2UI`, licencia Apache 2.0, sitio: `a2ui.org`). Anunciado en Google Next 2025. El agente devuelve JSON estructurado → el frontend lo renderiza como componentes visuales.

**Lo que NO existe**: Paquete npm `@google/a2ui` para React. El renderer oficial de React está en roadmap pero no publicado. El renderer disponible es para Lit (Web Components) y Flutter.

**Decisión para este proyecto**: Implementar un **renderer custom en React/Next.js** que siga el contrato JSON de A2UI. Es ~200 líneas de código total para los 4 componentes que necesitamos. No dependemos de un paquete externo que puede cambiar.

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

### Implementación: renderer custom en Next.js + Tailwind

```
frontend/components/a2ui/
├── A2UIRenderer.tsx     ← dispatcher: lee "type" y renderiza el componente correcto
├── DiagnosisTable.tsx   ← type: "table"
├── ActionCard.tsx       ← type: "action_card" con botón Confirmar/Cancelar
├── ProgressBar.tsx      ← type: "progress"
└── SummaryCard.tsx      ← type: "summary_card"
```

**A2UIRenderer.tsx** (dispatcher principal):
```tsx
// frontend/components/a2ui/A2UIRenderer.tsx
import { DiagnosisTable } from "./DiagnosisTable";
import { ActionCard } from "./ActionCard";
import { ProgressBar } from "./ProgressBar";
import { SummaryCard } from "./SummaryCard";

interface A2UIProps {
  component: Record<string, unknown>;
  onAction?: (actionId: string) => void;
}

export function A2UIRenderer({ component, onAction }: A2UIProps) {
  switch (component.type) {
    case "table":       return <DiagnosisTable data={component} />;
    case "action_card": return <ActionCard data={component} onAction={onAction} />;
    case "progress":    return <ProgressBar data={component} />;
    case "summary_card": return <SummaryCard data={component} />;
    default:            return null;
  }
}
```

**Cómo el frontend detecta mensajes A2UI**:
```tsx
// En ChatClient.tsx — al recibir un mensaje del agente
function parseAgentMessage(text: string): { text?: string; a2ui?: object } {
  // El agente envuelve el JSON en un bloque: ```json ... ```
  const match = text.match(/```json\n([\s\S]*?)\n```/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.__a2ui) return { a2ui: parsed };
    } catch {}
  }
  return { text };
}
```

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

## 8. Base de Datos — Firestore

### Colecciones
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

### Encriptación de tokens
Los tokens OAuth DEBEN estar encriptados en Firestore. Usar `google-cloud-kms` o `cryptography` (Fernet) con key almacenada en Secret Manager.

**Al construir**: investigar el patrón de encriptación de secrets en Google Cloud para tokens OAuth.

---

## 9. OAuth Google — Flujo Completo

### Scopes (todos juntos en una sola autorización)
```python
SCOPES = [
    "https://www.googleapis.com/auth/analytics.edit",
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/tagmanager.edit.containers",
    "https://www.googleapis.com/auth/tagmanager.publish",
    "https://www.googleapis.com/auth/adwords",
    "openid",
    "email",
    "profile",
]
```

### Flujo
1. `/api/oauth/google/start` → redirect a Google OAuth con scopes completos
2. `/api/oauth/google/callback` → recibe code → intercambia por tokens
3. Encriptar tokens → guardar en Firestore bajo `clients/{id}/google_tokens`
4. Al llamar agentes: leer tokens de Firestore → descifrar → pasar al agente

### Refresh automático
Los access tokens expiran en 1 hora. Implementar middleware que detecte `401` de APIs de Google y ejecute refresh automáticamente usando el refresh_token.

---

## 10. Skills ADK — Proceso de Descubrimiento

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

### Google Ads Test Account
- Crear cuenta de prueba con developer token en modo test
- https://developers.google.com/google-ads/api/docs/first-call/dev-token
- Configurar con: conversiones sin vincular a GA4, auto-tagging desactivado
- El agente detecta + vincula + activa

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

```bash
# .env (gitignored — copiar de .env.example)

# Google Cloud
GOOGLE_CLOUD_PROJECT=grapez-hackathon
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

# Google OAuth (para conectar cuentas de clientes)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback

# Google Ads API
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=  # MCC account ID

# Agent Engine
AGENT_ENGINE_REGION=us-central1
AGENT_ENGINE_PROJECT=grapez-hackathon

# Gemini
GOOGLE_GEMINI_API_KEY=  # si se usa directo (no Vertex)

# Firestore
FIRESTORE_DATABASE=(default)

# Encryption (para tokens OAuth)
ENCRYPTION_KEY=  # Fernet key, generar con: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Frontend
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 13. Deploy en Google Cloud

### Servicios GCP usados
| Servicio | Para qué | Costo estimado |
|---|---|---|
| Agent Engine (Vertex AI) | Hosting de los 5 agentes Python | Incluido en $500 crédito hackathon |
| Cloud Run | Frontend Next.js + Playwright Service | ~$5/mes |
| Firestore | Base de datos (clientes, tokens, logs) | Free tier generoso |
| Secret Manager | ENCRYPTION_KEY, GOOGLE_CLIENT_SECRET | ~$0.06/secret/mes |
| Container Registry | Imagen Docker del Playwright Service | ~$0.10/GB/mes |

### APIs a habilitar en GCP
```bash
gcloud services enable aiplatform.googleapis.com
gcloud services enable analyticsadmin.googleapis.com
gcloud services enable tagmanager.googleapis.com
gcloud services enable googleads.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
```

### 1. Deploy Playwright Service (primero — los agentes dependen de su URL)
```bash
# Build y push imagen Docker
docker build -t gcr.io/grapez-hackathon/playwright-service ./playwright_service
docker push gcr.io/grapez-hackathon/playwright-service

# Deploy a Cloud Run — 2Gi RAM mínimo para Chromium
gcloud run deploy playwright-service \
  --image=gcr.io/grapez-hackathon/playwright-service \
  --region=us-central1 \
  --memory=2Gi \
  --timeout=120 \
  --allow-unauthenticated

# Copiar la URL al .env:
# PLAYWRIGHT_SERVICE_URL=https://playwright-service-xxxx-uc.a.run.app
```

### 2. Deploy agentes a Agent Engine
```bash
# Habilitar APIs de Vertex AI necesarias
gcloud services enable aiplatform.googleapis.com cloudresourcemanager.googleapis.com

# Deploy cada agente (el Planner importa los sub-agentes como módulos Python,
# no como endpoints separados — se despliegan juntos en el mismo paquete)
adk deploy agent_engine \
  --project=grapez-hackathon \
  --region=us-central1 \
  --display_name="Grapez Planner Agent" \
  agents/planner_agent

# Guardar el Agent Engine ID en .env:
# PLANNER_AGENT_ENGINE_ID=projects/.../locations/us-central1/reasoningEngines/...
```

### 3. Deploy frontend
```bash
# Desde /frontend — Cloud Run con source deploy (sin Dockerfile manual)
gcloud run deploy grapez-hackathon-frontend \
  --source . \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_APP_URL=https://grapez-hackathon-frontend-xxxx-uc.a.run.app"
```

### Orden de deploy (importante)
1. Playwright Service → obtener URL
2. Actualizar `.env` con `PLAYWRIGHT_SERVICE_URL`
3. Deploy Planner Agent (incluye todos los sub-agentes) → obtener Agent Engine ID
4. Actualizar `.env` con `PLANNER_AGENT_ENGINE_ID`
5. Deploy Frontend (ya conoce el Agent Engine ID)

---

## 14. Plan de Construcción — Semana a Semana

**Hoy**: 2 de mayo 2026 | **Deadline**: 5 de junio 2026 | **Tiempo disponible**: ~5 semanas

### Semana 1 (May 2-9): Fundamentos
- [ ] Setup del proyecto Python con ADK
- [ ] Setup Next.js frontend
- [ ] OAuth Google — flujo completo (start → callback → guardar tokens Firestore)
- [ ] Firestore schema + encriptación tokens
- [ ] Planner Agent skeleton — recibe mensaje, responde
- [ ] Deploy básico en Agent Engine (verificar que funciona)
- [ ] `.env.example` completo

**Entregable**: OAuth funcional end-to-end, un agente básico respondiendo desde Agent Engine

### Semana 2 (May 10-16): Diagnóstico GA4 + GTM
- [ ] GA4 Agent completo — todas las herramientas de diagnóstico
- [ ] Buscar + integrar skill `analytics-tracking` (borghei)
- [ ] GTM Agent completo — todas las herramientas de diagnóstico
- [ ] Planner Agent coordina GA4 + GTM en paralelo
- [ ] A2UI básico en frontend — renderizar tabla de hallazgos

**Entregable**: Diagnóstico GA4 + GTM funcionando end-to-end, resultados visibles en UI

### Semana 3 (May 17-23): Ads + Web Analyzer
- [ ] Google Ads Agent — diagnóstico de conversiones y vinculación GA4
- [ ] Web Analyzer Agent — Playwright crawl básico (GTM ID, GA4 ID, dataLayer)
- [ ] Web Analyzer — simulación funnel de conversión
- [ ] Integrar Web Analyzer al flujo del Planner
- [ ] Setup entorno demo (TiendaDemo GA4 + GTM + sitio Vercel)

**Entregable**: Los 4 agentes de diagnóstico funcionando, entorno demo listo

### Semana 4 (May 24-30): Implementation Agent + A2UI completo
- [ ] Implementation Agent — GA4 write operations (conversiones, dimensiones)
- [ ] Implementation Agent — GTM write operations (tags, triggers, workspace, versión)
- [ ] Flujo de confirmación via A2UI (action cards con botones)
- [ ] A2UI completo: tablas, progress bars, summary cards, action cards
- [ ] Rollback snapshot antes de implementar
- [ ] Log de acciones en Firestore

**Entregable**: Sistema completo funcionando de punta a punta con demo data

### Semana 5 (May 31 - Jun 4): Polish, Video, Submit
- [ ] Bug fixes y edge cases
- [ ] Diagrama de arquitectura (en `/architecture/`)
- [ ] README público para GitHub
- [ ] Script del video demo (ver `/docs/demo-script.md`)
- [ ] Grabar video demo (1-2 minutos, en español o inglés)
- [ ] Descripción Devpost con business case
- [ ] Submit en Devpost antes del deadline

**Deadline final**: Junio 5, 2026, 11:59 PM PT

---

## 15. Estructura de Archivos del Proyecto

```
grapez-hackathon/
├── CLAUDE.md                        ← este archivo
├── STATE.md                         ← log de sesiones y progreso
├── README.md                        ← público, para el hackathon
├── .env                             ← gitignored
├── .env.example                     ← template público
├── .gitignore
├── requirements.txt                 ← deps Python de todos los agentes
│
├── architecture/
│   └── diagram.png                  ← requerido por hackathon
│
├── agents/
│   ├── planner_agent/
│   │   ├── agent.py                 ← LlmAgent con AgentTool de todos los sub-agentes
│   │   └── tools/
│   │       └── client_tools.py      ← load_client_tokens (Firestore → ToolContext.state)
│   ├── ga4_agent/
│   │   ├── agent.py                 ← LlmAgent con @tool functions de GA4 APIs
│   │   └── tools/
│   │       ├── ga4_admin_tools.py   ← read + write via google-analytics-admin
│   │       └── ga4_data_tools.py    ← read via google-analytics-data
│   ├── gtm_agent/
│   │   ├── agent.py
│   │   └── tools/
│   │       └── gtm_tools.py         ← GTM API v2 via google-api-python-client
│   ├── ads_agent/
│   │   ├── agent.py
│   │   └── tools/
│   │       └── ads_tools.py         ← Google Ads API via google-ads
│   ├── web_analyzer_agent/
│   │   ├── agent.py                 ← LlmAgent: tools llaman Playwright Service HTTP
│   │   └── tools/
│   │       └── playwright_tools.py  ← @tool functions que HTTP POST → Cloud Run
│   └── implementation_agent/
│       ├── agent.py
│       └── tools/
│           ├── confirmation_tools.py ← request_confirmation via A2UI action_card
│           └── rollback_tools.py     ← snapshot Firestore antes de implementar
│
├── playwright_service/              ← microservicio independiente (NO agente ADK)
│   ├── Dockerfile                   ← FROM mcr.microsoft.com/playwright/python
│   ├── app.py                       ← FastAPI: /analyze, /crawl, /health
│   └── requirements.txt             ← fastapi, uvicorn, playwright
│
├── frontend/                        ← Next.js 15 App Router
│   ├── app/
│   │   ├── page.tsx                 ← lista de clientes
│   │   ├── clients/
│   │   │   ├── new/page.tsx         ← crear cliente
│   │   │   └── [id]/
│   │   │       └── chat/
│   │   │           ├── page.tsx
│   │   │           └── ChatClient.tsx ← UI del chat con A2UI
│   │   └── api/
│   │       ├── clients/route.ts
│   │       ├── chat/route.ts        ← conecta con Agent Engine
│   │       └── oauth/
│   │           └── google/
│   │               ├── start/route.ts
│   │               └── callback/route.ts
│   ├── components/
│   │   └── a2ui/
│   │       ├── A2UIRenderer.tsx     ← renderiza componentes A2UI
│   │       ├── TableComponent.tsx
│   │       ├── ActionCard.tsx
│   │       └── ProgressBar.tsx
│   ├── lib/
│   │   ├── firestore.ts             ← cliente Firestore
│   │   ├── agent-engine.ts          ← cliente Agent Engine
│   │   └── types.ts
│   ├── package.json
│   └── tailwind.config.ts
│
├── skills/                          ← skills ADK descubiertas en MCP Market
│   └── (vacío — poblar durante construcción de cada agente)
│
├── demo/
│   ├── setup_tiendademo_ga4.py      ← crea/configura propiedad demo
│   ├── setup_tiendademo_gtm.py      ← crea contenedor con errores plantados
│   ├── setup_tiendademo_ads.py      ← configura cuenta ads de prueba
│   └── reset_demo.py                ← resetea todo al estado "con errores"
│
├── docs/
│   ├── demo-script.md               ← guión del video demo
│   └── business-case.md             ← para descripción en Devpost
│
└── scripts/
    ├── deploy-agents.sh
    └── deploy-frontend.sh
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
4. Instala: `pip install google-adk==1.33.0` — usar versión fija

### Al construir herramientas de API (@tool functions)
1. Los tokens van en `ToolContext.state` — NUNCA como parámetros en el método
2. Siempre usar `Credentials` de `google.oauth2.credentials` con access + refresh token
3. Manejar `google.auth.exceptions.RefreshError` — devolver mensaje claro al consultor
4. Los nombres exactos de métodos de las APIs están en la sección de cada agente

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
- Tokens siempre encriptados con Fernet — NUNCA en texto plano en Firestore
- Logs de todas las acciones de implementación en Firestore bajo `clients/{id}/sessions/{id}/actions`
- Manejo de errores explícito — el agente comunica errores en lenguaje natural al consultor
- Tests mínimos para las tools de escritura (create_conversion_event, create_tag, etc.)

### Restricciones absolutas (nunca sin aprobación)
- No cambiar la arquitectura de 6 agentes
- No usar modelo distinto a `gemini-3-flash-preview`
- No guardar tokens OAuth sin encriptación Fernet
- No publicar versiones de GTM directamente — siempre crear borrador primero
- No escribir en GA4 Demo Account (solo lectura)

---

## 18. Links de Referencia

| Recurso | URL |
|---|---|
| Google ADK Docs | https://google.github.io/adk-docs/ |
| ADK Multi-agents | https://adk.dev/agents/multi-agents/ |
| ADK Skills | https://adk.dev/skills/ |
| ADK Auth | https://adk.dev/tools-custom/authentication/ |
| Agent Engine Deploy | https://adk.dev/deploy/agent-engine/ |
| Agent Engine — Use ADK | https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/use/adk |
| A2UI Repo | https://github.com/google/A2UI |
| A2UI Blog | https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/ |
| Playwright Docker Images | https://mcr.microsoft.com/en-us/product/playwright/python/about |
| Playwright en Cloud Run | https://playwright.dev/python/docs/docker |
| GA4 Admin API (Python) | https://googleapis.dev/python/google-analytics-admin/latest/ |
| GTM API v2 | https://developers.google.com/tag-manager/api/v2 |
| Google Ads API Python | https://github.com/googleads/google-ads-python |
| Hackathon Devpost | https://googleforstartups-aiagents.devpost.com |
| MCP Market | https://mcp.so |
| analytics-tracking skill | https://mcp.so/server/analytics-tracking |

---

## 19. Decisiones Técnicas Verificadas

> **Esta sección resuelve todas las deudas técnicas.** Investigación realizada el 11 de mayo 2026.
> No hay pendientes de investigación — todas las decisiones están tomadas y justificadas.

### 19.1 Google ADK — Versión y Imports

**Versión**: `google-adk==1.33.0` (lanzada 8 mayo 2026)

**Imports verificados**:
```python
from google.adk.agents import LlmAgent, SequentialAgent, ParallelAgent, LoopAgent
from google.adk.tools import agent_tool          # AgentTool
from google.adk.tools import FunctionTool, ToolContext
from google.adk.skills import load_skill_from_dir
from google.adk.tools import skill_toolset       # SkillToolset
from google.adk.auth import AuthCredential, AuthCredentialTypes, OAuth2Auth
```

**Patrón de orquestación elegido**: `AgentTool` (no `sub_agents`)
- **Por qué**: El Planner necesita control explícito sobre cuándo y qué agente invocar. `sub_agents` deja la decisión al LLM de forma implícita. Con `AgentTool`, el Planner invoca cada agente como si fuera una function call controlada.
- **ParallelAgent**: Disponible para el diagnóstico paralelo (GA4 + GTM + Ads + Web simultáneamente). Reduce el tiempo total a ~el tiempo del agente más lento en vez de la suma.

**`UnsafeLocalCodeExecutor`**: Existe pero SOLO para desarrollo local. No funciona en Agent Engine. **No se usa en este proyecto** — se reemplaza con `@tool` functions normales que llaman las APIs de Google.

---

### 19.2 Agent Engine — Deploy y Streaming

**Qué es**: Runtime managed de Vertex AI para agentes ADK. Antes llamado "Reasoning Engine". Endpoint regional en `us-central1-aiplatform.googleapis.com`.

**Comando de deploy verificado**:
```bash
adk deploy agent_engine \
  --project=grapez-hackathon \
  --region=us-central1 \
  --display_name="Grapez Planner Agent" \
  agents/planner_agent
```

**SSE confirmado**: Soporta streaming nativo via `streamQuery?alt=sse`. El frontend consume el stream directamente.

**Limitación crítica**: Code executors NO se combinan con otras tools en el mismo agente. Irrelevante para este proyecto porque no usamos code execution.

**Estructura del deploy**: Todos los agentes se despliegan como un paquete Python. El Planner importa los sub-agentes como módulos Python — no son endpoints separados. Un solo deploy del Planner incluye todos los agentes.

---

### 19.3 Modelo Gemini

**ID confirmado**: `gemini-3-flash-preview` — válido en Vertex AI desde diciembre 2025.

**Otros modelos disponibles**:
| ID | Estado | Usar si... |
|---|---|---|
| `gemini-3-flash-preview` | Public Preview | ← **el que usamos** |
| `gemini-2.5-flash` | Stable | Se necesita estabilidad en producción |
| `gemini-2.0-flash` | **DESCONTINUADO** | ❌ NO usar — apagado junio 1, 2026 |

**Acceso**: Via Vertex AI con Application Default Credentials (service account). No se necesita API key separada si `GOOGLE_APPLICATION_CREDENTIALS` está configurado.

---

### 19.4 Web Analyzer — Playwright en Google Cloud

**Problema**: Agent Engine no puede correr Playwright/Chromium — es un sandbox Python puro sin procesos de navegador ni Chromium instalado.

**Solución elegida**: Playwright Service como microservicio independiente en Cloud Run con Docker.

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

**Decisión**: Renderer custom en React/Next.js + Tailwind. ~200 líneas de código para 4 componentes (table, action_card, progress, summary_card). El contrato JSON de A2UI sí está especificado en el repo oficial — nuestro renderer lo implementa directamente.

**Cómo mencionar A2UI en el hackathon**: "Implementamos el protocolo A2UI de Google para generar UI dinámica desde el agente." Esto es preciso y técnicamente correcto aunque el renderer sea custom.

---

### 19.6 OAuth y Tokens — Flujo en los Agentes

**Patrón elegido**: `ToolContext.state`

```python
# Planner Agent carga tokens al inicio de sesión:
tool_context.state["access_token"] = descifrar(token_de_firestore)
tool_context.state["refresh_token"] = descifrar(refresh_de_firestore)

# Cada sub-agente los lee en sus tools:
access_token = tool_context.state.get("access_token")
```

**Por qué este patrón**: Es el más directo para el flujo de este proyecto. El OAuth ya ocurre en el frontend Next.js — los tokens llegan cifrados a Firestore. El Planner los carga al inicio de la sesión del agente y los propaga via `session.state` a todos los sub-agentes automáticamente.

**Cifrado de tokens**: Fernet (librería `cryptography`). La `ENCRYPTION_KEY` se guarda en Secret Manager en producción. Para desarrollo local, en `.env` (gitignored).

---

### 19.7 Resumen de Cambios vs CLAUDE.md Original

| Qué cambió | Antes | Ahora |
|---|---|---|
| Diagrama de arquitectura | Web Analyzer en Agent Engine | Web Analyzer Agent + Playwright Service (Cloud Run) |
| ADK pattern principal | `Agent` + `SkillToolset` | `LlmAgent` + `AgentTool` + `@tool` functions |
| Code execution | `UnsafeLocalCodeExecutor` en producción | NO se usa — @tool functions con APIs directas |
| A2UI integración | Buscar `@google/a2ui` en npm | Renderer custom React/Tailwind ~200 líneas |
| OAuth en agentes | Tokens como parámetros de función | `ToolContext.state` (propagación automática) |
| Modelo | Verificar si `gemini-3-flash-preview` existe | Confirmado y válido |
| `SkillToolset` | Por confirmar | Confirmado — `from google.adk.tools import skill_toolset` |
| Deploy Web Analyzer | Sin definir | Playwright Service en Cloud Run con Docker 2Gi |
| Deploy agentes | Agentes separados | Un solo deploy del Planner (importa sub-agentes como módulos) |
