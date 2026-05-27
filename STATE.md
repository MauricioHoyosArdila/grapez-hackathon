# STATE.md — Grapez Analytics Agents

> Hackathon: Google for Startups AI Agents Challenge | Deadline: Junio 5, 2026 — **5:00 PM PT**

---

## Estado Actual

**Fase**: 3 — Construcción activa. Semana 4 en curso (May 24-30).
**Última sesión**: 27 de mayo 2026 (Sesión 6)
**Próximo paso**: Probar `adk web agents/planner_agent` con cuenta real de Grapez Studio — flujo completo scope selection → diagnóstico GA4 + GTM

---

## Progreso por Semana

### Semana 1 (May 2-9) — Fundamentos ← ATRASADA
- [ ] Setup Python con ADK instalado y funcionando localmente
- [ ] Setup Next.js frontend
- [ ] OAuth Google — flujo completo (start → callback → guardar tokens Firestore)
- [ ] Firestore schema + encriptación tokens con Fernet
- [ ] Planner Agent skeleton — recibe mensaje, responde
- [ ] Deploy básico en Agent Engine (verificar que funciona)
- [ ] `.env.example` completo

> **Nota**: Semana 1 no se completó. Retomar desde aquí el 11 de mayo.

### Semana 2 (May 10-16) — Setup base + GA4 + GTM ← COMPLETADA

**Mauro**:
- [x] iron-session OAuth flow (start → callback → session cookie)
- [x] Mock clients UI — `frontend/lib/mock-clients.ts` con 3-4 clientes quemados
- [x] A2UIRenderer components: DiagnosisTable, ActionCard, ProgressBar, SummaryCard
- [x] Chat UI con SSE desde Agent Engine
- [x] `agents/dev_utils.py` — inject_local_tokens y get_test_credentials
- [ ] GCP project + APIs habilitadas + OAuth Client ID + Service Account (pendiente verificar)
- [ ] `scripts/generate_test_tokens.py` + compartir .env con Juan Camilo

**Juan Camilo**:
- [ ] Python env configurado localmente + `pip install -r requirements.txt`
- [x] GA4 Agent — tools de diagnóstico y escritura ← completado por Mauro el 26 mayo
- [x] GTM Agent — tools diagnóstico + escritura ← completado por Mauro el 26 mayo
- [x] Planner Agent — orquestador con AgentTool GA4+GTM ← completado por Mauro el 26 mayo
- [ ] Integrar skill `analytics-tracking` via MCP Market ← **satisface MCP obligatorio Track 1**
- [ ] Probar sistema completo con `adk web` + tokens reales

### Semana 3 (May 17-23) — Ads + Web Analyzer + Chat UI

**Mauro**: A2UIRenderer (~200 líneas), Chat UI SSE, Planner skeleton en Agent Engine, TiendaDemo setup
**Juan Camilo**: Ads Agent, Web Analyzer Agent (local Playwright), Planner orquestador paralelo

### Semana 4 (May 24-30) — Implementation + Integración end-to-end

**Mauro**: Playwright Service Cloud Run (2Gi), deploy completo, sitio Vercel TiendaDemo, flujo e2e
**Juan Camilo**: Implementation Agent (GA4+GTM writes), confirmation flow A2UI, Firestore logs

### Semana 5 (May 31 - Jun 4) — Polish + Submit

- [ ] Bug fixes golden path demo
- [ ] Diagrama de arquitectura PNG en `/architecture/` ← **requerido en texto Devpost**
- [ ] Repo GitHub **público** (cambiar visibilidad)
- [ ] README + descripción Devpost **en inglés**
- [ ] Video demo **en inglés o con subtítulos en inglés** (máx 2 min)
- [ ] Testing instructions en inglés con URL del demo
- [ ] Ambos (Mauro + Juan Camilo) en Devpost for Teams
- [ ] Submit antes del **5 de junio, 5:00 PM PT**

---

## Decisiones Técnicas Tomadas

| Decisión | Elegido | Razón |
|---|---|---|
| Framework de agentes | Google ADK 2.1.0 (lanzado 23 mayo 2026) | Requerimiento hackathon + nativo con Gemini — sin @tool decorator en 2.x |
| Modelo | `gemini-3.5-flash` | GA desde Google I/O 2026 (19 mayo 2026) |
| ADK pattern orquestación | `AgentTool` (no `sub_agents`) | Control explícito sobre cuándo invocar cada agente |
| Code execution | NO se usa — @tool functions con APIs directas | `UnsafeLocalCodeExecutor` no funciona en Agent Engine |
| DB | Firestore (solo para logs de implementación en el demo) | Nativo GCP, free tier generoso |
| OAuth tokens storage (demo) | iron-session cookie cifrada | Elimina ~4 días de dev; jueces ven OAuth real |
| OAuth tokens storage (prod) | Firestore + Fernet encryption | Documentado en sección 8, post-hackathon |
| OAuth en agentes | `ToolContext.state` | Propagación automática a sub-agentes, patrón oficial ADK |
| MCP integration | analytics-tracking skill (MCP Market) | Obligatorio Track 1; enriquece contexto GA4/GTM |
| APIs Google (writes) | Llamadas directas via Python libs | MCPs disponibles son solo lectura; necesitamos writes |
| Web crawling | Playwright en Docker (Cloud Run) | Agent Engine no tiene Chromium; Cloud Run sí |
| UI dinámica | A2UI renderer custom React/Tailwind | No hay npm `@google/a2ui` para React; renderer custom ~200 líneas |
| Deploy Web Analyzer | Cloud Run 2Gi Docker | Chromium requiere mínimo 1GB RAM; Cloud Run escala a cero |
| Deploy agentes | Un deploy del Planner (importa sub-agentes como módulos) | Más simple que N deploys independientes |
| Deploy orden | Playwright Service → Agentes → Frontend | Los agentes necesitan la URL del servicio Playwright |
| Alcance agentes | GA4 + GTM + Web Analyzer + Implementation (sin Ads) | Ads eliminado: carga de trabajo > valor aportado |
| Demo strategy | Mock clients UI + una cuenta real (Grapez Studio) | Demo más convincente, sin exponer datos de clientes |
| Track del concurso | Track 1 (Build — Net-New) | Proyecto nuevo; mencionar potencial Track 3 en Devpost |
| Deadline hora | 5:00 PM PT (reglas oficiales) | Corregido de 11:59 PM — ¡7 horas de diferencia! |
| Alcance inicial | Uso interno Grapez | Demo más fuerte con datos reales, go-to-market más rápido |

---

## Log de Sesiones

### Sesión 1 — 2 de mayo 2026
- Proyecto inicializado
- CLAUDE.md escrito con arquitectura completa
- Estructura de carpetas creada
- Pendiente: iniciar construcción Semana 1

### Sesión 2 — 11 de mayo 2026
- Investigación técnica completa de todos los pendientes arquitecturales
- CLAUDE.md actualizado con arquitectura definitiva (secciones 4, 5.5, 6, 7, 13, 15, 17, 19)
- Resuelto: Playwright en Agent Engine (imposible) → Playwright Service en Cloud Run
- Resuelto: A2UI npm para React (no existe) → renderer custom ~200 líneas
- Resuelto: ADK imports reales, patrón AgentTool, ToolContext.state para tokens
- Resuelto: Modelo gemini-3-flash-preview confirmado válido
- Resuelto: Deploy — orden y comandos verificados
- Todas las deudas técnicas eliminadas — arquitectura lista para construir

### Sesión 6 — 27 de mayo 2026

- **Configuración de entorno resuelta**:
  - Modelo `gemini-3.5-flash` no disponible en Vertex AI del proyecto → `gemini-2.5-flash` es el único disponible (verificado con prueba directa)
  - Auth local definitiva: `GOOGLE_GENAI_USE_VERTEXAI=true` + `gcloud auth application-default login`
  - Créditos del hackathon vinculados a la cuenta de facturación del proyecto GCP
  - Fix de imports: `google.analytics.admin.types` no existe → importar desde `google.analytics.admin` directo

- **Scope selection implementado**:
  - Planner Agent: PASO 0 obligatorio — lista cuentas/propiedades/contenedores primero, confirma cuál analizar, luego diagnostica
  - GA4 Agent: regla CRÍTICA de no analizar múltiples propiedades — se detiene y devuelve inventario si hay varias
  - GTM Agent: misma regla para contenedores

- **GTM: protocolo de mejora de elementos existentes**:
  - Cuando se mejora un elemento: crear nuevo + renombrar el viejo con prefijo `⚠️ MEJORADO —`
  - 4 herramientas nuevas: `rename_gtm_tag`, `rename_gtm_trigger`, `rename_gtm_variable`, `pause_gtm_tag`
  - Flujo: crear nuevo → renombrar viejo → preguntar si autoriza pausar tags obsoletos

- **Retry automático**: `HttpRetryOptions(initial_delay=30, attempts=3)` en los 3 agentes

- **CLAUDE.md actualizado**: sección 19.3 (modelo), 17 (auth setup), 5.3 (GTM tools), nueva 19.12 (retry)

### Sesión 5 — 26 de mayo 2026

- GTM Agent construido completo:
  - `agents/gtm_agent/tools/gtm_tools.py` — 16 tools: 10 diagnóstico + 6 escritura (create_workspace, create_tag, create_trigger, create_variable, create_version, publish_version)
  - `agents/gtm_agent/agent.py` — LlmAgent con gemini-3.5-flash y los 16 tools
- Planner Agent reescrito completo (reemplaza placeholder):
  - `agents/planner_agent/tools/client_tools.py` — 4 tools: get_session_info, load_client_tokens, confirm_action, set_business_context
  - `agents/planner_agent/agent.py` — LlmAgent orquestador con AgentTool para GA4+GTM, flujo de confirmación Grapez
- `agent.py` creado en la raíz del proyecto — punto de entrada para `adk web`
- `agents/__init__.py` + `agents/planner_agent/__init__.py` + demás `__init__.py` creados
- **Arquitectura de guardrails Grapez implementada**:
  - Capa 3 (state check Python) aplicada a los 8 write tools de GA4 y GTM
  - `confirm_action()` como única llave para habilitar escrituras — un solo uso por confirmación
  - `set_business_context()` para calibrar diagnóstico por tipo de negocio del cliente
- CLAUDE.md sección 17 actualizada con documentación completa de la metodología Grapez para Juan Camilo
- requirements.txt pinneado a `google-adk==2.1.0`

### Sesión 4 — 26 de mayo 2026
- Revisado estado del repositorio: Juan Camilo tiene rama `dev/juanca/ga4-agent` con commit vacío
- GA4 Agent construido completo (Mauro):
  - `agents/ga4_agent/tools/ga4_admin_tools.py` — 13 tools: list_accounts, list_properties, get_property_details, list_data_streams, check_enhanced_measurement, list_conversions, list_custom_dimensions, list_custom_metrics, list_audiences, get_data_retention_settings, create_conversion_event, create_custom_dimension, update_data_retention
  - `agents/ga4_agent/tools/ga4_data_tools.py` — 3 tools: get_events_last_30_days, get_conversion_report, check_data_freshness
  - `agents/ga4_agent/agent.py` — LlmAgent con gemini-3-flash y los 16 tools
  - `agents/ga4_agent/__init__.py` y `agents/ga4_agent/tools/__init__.py` creados
- STATE.md actualizado al estado real (semana 4, no semana 2)
- Próximo: GTM Agent

### Sesión 3 — 12 de mayo 2026
- Leídas reglas oficiales del concurso (PDF) — identificadas 6 correcciones críticas
- Corregido deadline: **5:00 PM PT** (no 11:59 PM PT como estaba documentado)
- Identificado requisito MCP obligatorio en Track 1 → satisfecho con analytics-tracking skill
- Identificado requisito de inglés: video + descripción Devpost + testing instructions
- Estrategia OAuth simplificada: iron-session cookie (no Firestore para tokens en el demo)
- Estrategia demo decidida: mock clients UI + una cuenta real (Grapez Studio)
- Plan de trabajo paralelo finalizado: Mauro (Infra) / Juan Camilo (Agentes) — Semanas 2-5
- Colombia no aplica para Regional Winners (APAC/EMEA) — objetivo: Best Track 1 + Grand Prize
- CLAUDE.md y STATE.md actualizados con todas estas decisiones

---

## Bloqueantes / Issues Abiertos

_Ninguno. Todas las preguntas de investigación y estrategia resueltas al 12 de mayo 2026._

---

## Skills Identificadas (pendiente de instalar al construir cada agente)

| Skill | Fuente | Para qué agente | Estado |
|---|---|---|---|
| analytics-tracking | MCP Market — borghei | GA4 Agent + GTM Agent | Pendiente buscar al construir esos agentes |

---

## Entorno Demo

| Recurso | Estado | Notas |
|---|---|---|
| GA4 "TiendaDemo" property | ❌ Pendiente crear | En cuenta Google de Grapez — Semana 3 |
| GTM "TiendaDemo" container | ❌ Pendiente crear | Con errores plantados — Semana 3 |
| Google Ads test account | ~~Eliminado~~ | Agente de Ads removido del alcance |
| Sitio demo Vercel | ❌ Pendiente crear | tiendademo.grapez.co o similar — Semana 3 |
| Playwright Service (Cloud Run) | ❌ Pendiente crear | Docker build + deploy — Semana 3 |
