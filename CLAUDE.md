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
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
│   OAuth Google → Firestore → Chat UI con A2UI client    │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP / SSE
                        ▼
┌─────────────────────────────────────────────────────────┐
│              PLANNER AGENT (Orchestrator)                │
│   Recibe objetivo → coordina sub-agentes → reporta A2UI │
└──────┬──────────┬──────────┬──────────┬────────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐
  │  GA4    │ │  GTM    │ │  ADS    │ │ WEB ANALYZER │
  │ AGENT   │ │ AGENT   │ │ AGENT   │ │    AGENT     │
  │ (diag)  │ │ (diag)  │ │ (diag)  │ │  (Playwright)│
  └────┬────┘ └────┬────┘ └────┬────┘ └──────┬───────┘
       │           │           │             │
       └─────────────────┬─────────────────┘
                         ▼
              ┌────────────────────┐
              │ IMPLEMENTATION     │
              │ AGENT              │
              │ (aplica cambios)   │
              └────────────────────┘
                         │
              GA4 Admin API + GTM API + Google Ads API
```

### Flujo completo
1. Consultor abre la app, crea cliente con nombre y URL del sitio
2. Conecta cuenta Google del cliente via OAuth (se guardan tokens en Firestore)
3. Abre chat → Planner Agent recibe el objetivo ("diagnostica el ecosistema")
4. Planner delega en paralelo a GA4 Agent, GTM Agent, Ads Agent, Web Analyzer
5. Cada agente usa Python code execution para llamar APIs directamente (read+write)
6. Web Analyzer usa Playwright para crawlear el sitio y detectar dataLayer, GA4, GTM
7. Agentes retornan hallazgos → Planner genera plan de acción
8. Implementation Agent ejecuta cada acción paso a paso con confirmación del consultor
9. A2UI renderiza UI dinámica en el chat (tablas de hallazgos, botones de confirmación, progress bars)
10. Al final: reporte completo de qué se diagnosticó y qué se implementó

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
**Rol**: Crawlear el sitio web del cliente con Playwright para detectar implementaciones existentes de GA4/GTM/Ads y eventos del dataLayer.

**Por qué Playwright y no una API**:
Las implementaciones de tracking están en el navegador (JavaScript). La única forma de verlas "como el usuario" es ejecutar un browser real. Playwright ejecuta Chrome headless y captura network requests, console logs, y dataLayer pushes.

**Herramientas**:
```python
# Playwright tools (code execution)
analyze_homepage(url) -> dict
  # Detecta: GTM container ID, GA4 measurement ID, Google Ads tag
  # Lee: window.dataLayer initial state
  # Captura: network requests a collect.google.com, gtm.js

crawl_key_pages(url, pages=["home", "product", "cart", "checkout", "confirmation"])
  # Navega cada página, captura dataLayer pushes
  # Detecta eventos: page_view, view_item, add_to_cart, purchase

simulate_conversion_funnel(url)
  # Simula el flujo completo de compra (si es ecommerce)
  # Detecta si el evento purchase se dispara correctamente

extract_datalayer_schema(url)
  # Lista todos los eventos únicos del dataLayer
  # Con sus parámetros y tipos de datos

check_consent_mode(url)
  # Verifica si Consent Mode v2 está implementado
  # Lee: gtag('consent', 'default', {...})

detect_tracking_errors(url)
  # Busca: tags duplicados, eventos sin parámetros requeridos
  # IDs incorrectos, requests fallidos
```

**Dependencias Python**:
```
playwright==1.44+
playwright install chromium  # necesario en setup
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

### Patrón base de un agente ADK
```python
# agents/ga4_agent/agent.py
from google.adk.agents import Agent
from google.adk.tools import SkillToolset
from google.adk.code_executors import UnsafeLocalCodeExecutor

# Cargar skills (buscar en MCP Market cuando llegues a este agente)
skills = load_skills_from_directory("./skills/")

# Herramientas propias del agente
from .tools.ga4_tools import (
    list_properties,
    get_property_details,
    list_conversions,
    # ... etc
)

description = """
Especialista en diagnóstico y configuración de Google Analytics 4.
Audita propiedades GA4, identifica problemas de implementación y aplica correcciones.
"""

instruction = """
Cuando diagnoses una propiedad GA4:
1. Lista todas las propiedades disponibles para el cliente
2. Para cada propiedad: verifica streams, eventos, conversiones, dimensiones
3. Identifica gaps comparando contra el checklist de mejores prácticas
4. Genera reporte estructurado con: ✅ correcto, ⚠️ mejorable, ❌ crítico
5. Propone acciones concretas ordenadas por impacto

Usa SIEMPRE el contexto del sitio web del cliente (URL, industria) para personalizar el diagnóstico.
Cuando implementes cambios, confirma el impacto antes de ejecutar.
"""

tools = [list_properties, get_property_details, list_conversions, ...]

skill_toolset = SkillToolset(
    skills=skills,
    code_executor=UnsafeLocalCodeExecutor(),
    additional_tools=tools,
)

root_agent = Agent(
    model="gemini-3-flash-preview",
    name="ga4_agent",
    description=description,
    instruction=instruction,
    tools=[skill_toolset],
)
```

### Patrón de tool con code execution (APIs directamente)
```python
# agents/ga4_agent/tools/ga4_tools.py
from google.adk.tools import tool
from google.analytics.admin import AnalyticsAdminServiceClient
from google.oauth2.credentials import Credentials

@tool
def list_properties(account_id: str, access_token: str, refresh_token: str) -> dict:
    """
    Lista todas las propiedades GA4 de una cuenta.
    
    Args:
        account_id: ID de la cuenta de GA4 (ej: "123456789")
        access_token: Token OAuth del cliente
        refresh_token: Refresh token OAuth del cliente
    
    Returns:
        dict con lista de propiedades y sus detalles básicos
    """
    credentials = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
    )
    client = AnalyticsAdminServiceClient(credentials=credentials)
    properties = client.list_properties(filter=f"parent:accounts/{account_id}")
    return {"properties": [{"id": p.name, "display_name": p.display_name} for p in properties]}
```

### Por qué code execution en vez de MCP
Los MCP servers disponibles (google-ads-mcp, gtm-mcp) son **solo lectura** en su configuración por defecto. Para implementar cambios necesitamos:
- GA4 Admin API con scope `analytics.edit` — crear conversiones, dimensiones, audiencias
- GTM API con scope `tagmanager.edit.containers` — crear tags, triggers, publicar
- Google Ads API con scope `adwords` — crear conversiones, vincular propiedades

Usando `UnsafeLocalCodeExecutor` en ADK, el agente puede ejecutar Python directamente con las librerías oficiales de Google que tienen acceso completo de lectura y escritura.

---

## 7. A2UI — Interfaz Dinámica del Agente

### Qué es A2UI
Protocolo open-source de Google para que los agentes generen componentes UI declarativamente. El agente devuelve JSON con estructura de UI, el frontend lo renderiza. Framework-agnostic, security-first.

### Componentes que usaremos
```json
// Tabla de hallazgos del diagnóstico
{
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
  "type": "action_card",
  "title": "Crear conversión 'purchase'",
  "description": "Se creará el evento de conversión 'purchase' en la propiedad GA4-123456",
  "impact": "high",
  "requires_confirmation": true,
  "action_id": "create_conversion_purchase"
}

// Progress bar durante implementación
{
  "type": "progress",
  "title": "Implementando cambios GTM",
  "current": 3,
  "total": 8,
  "current_step": "Creando variable dataLayer 'transaction_id'"
}

// Reporte final
{
  "type": "summary_card",
  "title": "Ecosistema configurado exitosamente",
  "sections": [
    {"label": "GA4", "items_fixed": 4, "status": "complete"},
    {"label": "GTM", "items_fixed": 7, "status": "complete"},
    {"label": "Google Ads", "items_fixed": 2, "status": "complete"}
  ]
}
```

### Cómo integrar A2UI en el frontend
1. Instalar el cliente A2UI de Google (buscar en npm: `@google/a2ui` o similar — **investigar el paquete exacto al construir**)
2. En el componente de chat, detectar mensajes tipo A2UI (tienen `__a2ui` flag)
3. Renderizar con el componente `<A2UIRenderer component={msg.a2ui} onAction={handleAction} />`
4. `handleAction` envía confirmaciones de vuelta al agente

**IMPORTANTE**: Al construir el frontend, investigar la documentación oficial de A2UI:
- Repo: buscar `google/a2ui` en GitHub
- Spec: https://google.github.io/a2ui (verificar URL exacta)
- Keynote Next '26: https://github.com/GoogleCloudPlatform/next-26-keynotes (demo de referencia)

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
| Agent Engine | Hosting de los 6 agentes Python | Incluido en $500 crédito hackathon |
| Cloud Run | Hosting del frontend Next.js | ~$5/mes |
| Firestore | Base de datos | Free tier generoso |
| Secret Manager | API keys y encryption keys | ~$0.06/secret/mes |
| Cloud KMS | Encriptación tokens OAuth | Opcional, usar Fernet local si presupuesto limita |

### Deploy de agentes
```bash
# Deploy Planner Agent (orchestrador principal)
adk deploy agent_engine \
  --env_file .env \
  --region=us-central1 \
  agents/planner_agent

# Deploy agentes especializados (cada uno por separado o como sub-agentes)
adk deploy agent_engine \
  --env_file .env \
  --region=us-central1 \
  agents/ga4_agent
```

### Deploy frontend
```bash
# Desde /frontend
gcloud run deploy grapez-hackathon-frontend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

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
│   │   ├── agent.py
│   │   ├── prompts/
│   │   │   └── system_prompt.md
│   │   └── tools/
│   │       └── delegation_tools.py
│   ├── ga4_agent/
│   │   ├── agent.py
│   │   ├── tools/
│   │   │   ├── ga4_admin_tools.py   ← read + write via Admin API
│   │   │   └── ga4_data_tools.py    ← read via Data API
│   │   └── skills/                  ← poblar cuando se construya
│   ├── gtm_agent/
│   │   ├── agent.py
│   │   ├── tools/
│   │   │   └── gtm_tools.py
│   │   └── skills/
│   ├── ads_agent/
│   │   ├── agent.py
│   │   ├── tools/
│   │   │   └── ads_tools.py
│   │   └── skills/
│   ├── web_analyzer_agent/
│   │   ├── agent.py
│   │   ├── tools/
│   │   │   └── playwright_tools.py
│   │   └── skills/
│   └── implementation_agent/
│       ├── agent.py
│       └── tools/
│           ├── confirmation_tools.py
│           └── rollback_tools.py
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

Si eres Claude Code leyendo este archivo: bienvenido. Aquí están las reglas para construir este proyecto:

### Antes de construir cualquier agente
1. **Lee** la sección completa del agente en este CLAUDE.md
2. **Investiga** la documentación oficial del ADK de Google: buscar en web `google adk python getting started 2026`
3. **Busca skills** en MCP Market (https://mcp.so) para el agente específico antes de codear las herramientas
4. **Lee** el README del repositorio de referencia: https://github.com/GoogleCloudPlatform/next-26-keynotes
5. **Verifica** la versión actual del ADK: `pip index versions google-adk`

### Al construir herramientas de API
1. Busca la documentación oficial de la librería Python de Google (ej: `google-analytics-admin`)
2. Verifica los nombres exactos de los métodos y parámetros — cambian entre versiones
3. Siempre maneja errores de quota, auth expirado y permisos insuficientes
4. Los tokens OAuth del cliente se pasan como parámetros (no como variables globales)

### Al construir el frontend
1. Aplicar `vercel-react-best-practices` — sin waterfalls, sin re-renders innecesarios
2. Investigar A2UI: buscar `google a2ui protocol` y `@google/a2ui npm`
3. El chat debe hacer polling SSE al Agent Engine (o WebSocket si ADK lo soporta)
4. Diseño visual: usar `frontend-design` skill para guía estética

### Al construir el deploy
1. Verificar con `gcloud --version` que gcloud CLI está instalado
2. Verificar que `adk` CLI está instalado: `adk --version`
3. Siempre deploy a `us-central1` (menor latencia desde Colombia)
4. Habilitar las APIs necesarias en GCP antes de deployar:
   ```
   gcloud services enable analyticsadmin.googleapis.com
   gcloud services enable tagmanager.googleapis.com
   gcloud services enable googleads.googleapis.com
   gcloud services enable firestore.googleapis.com
   gcloud services enable run.googleapis.com
   ```

### Principios de código
- Python para agentes (ADK es Python)
- TypeScript strict para frontend
- No guardar tokens en texto plano — siempre encriptados
- Logs de todas las acciones de implementación en Firestore
- Manejo de errores explícito — el agente debe comunicar errores al consultor en lenguaje natural
- Tests mínimos para herramientas críticas (las que escriben en APIs de Google)

### Preguntas frecuentes que debes investigar
- ¿Cómo funciona exactamente `SkillToolset` en la versión actual del ADK?
- ¿Cuál es la sintaxis exacta de `adk deploy agent_engine`?
- ¿Cómo se configuran sub-agentes en ADK (agent delegation)?
- ¿El A2UI protocolo tiene un cliente npm oficial o hay que implementarlo desde la spec?
- ¿Agent Engine soporta SSE nativo o hay que implementar polling?

### Lo que NO debes hacer sin preguntar primero
- Cambiar la arquitectura de 6 agentes
- Usar un modelo distinto a `gemini-3-flash-preview` sin justificación
- Guardar tokens OAuth sin encriptación
- Publicar versiones de GTM automáticamente (siempre crear borrador)
- Usar la GA4 Demo Account para pruebas de escritura (es solo lectura)

---

## 18. Links de Referencia

| Recurso | URL |
|---|---|
| Google ADK Docs | https://google.github.io/adk-docs/ |
| Agent Engine Docs | https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/overview |
| A2UI Protocol | Buscar: `google/a2ui` en GitHub |
| Next '26 Keynote Repo | https://github.com/GoogleCloudPlatform/next-26-keynotes |
| GA4 Admin API (Python) | https://googleapis.dev/python/google-analytics-admin/latest/ |
| GTM API v2 | https://developers.google.com/tag-manager/api/v2 |
| Google Ads API Python | https://github.com/googleads/google-ads-python |
| ADK Skills Codelab | https://codelabs.developers.google.com/next26/dev-keynote |
| Hackathon Devpost | https://googleforstartups-aiagents.devpost.com |
| MCP Market | https://mcp.so |
| analytics-tracking skill | https://mcp.so/server/analytics-tracking |
