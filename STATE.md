# STATE.md — Grapez Analytics Agents

> Hackathon: Google for Startups AI Agents Challenge | Deadline: Junio 5, 2026 — **5:00 PM PT**

---

## Estado Actual

**Fase**: 3 — Construcción activa. Semana 5 en curso (Jun 1-4).
**Última sesión**: 1 de junio 2026 (Sesión 8)
**Próximo paso**: Probar flujo completo con fix MALFORMED_FUNCTION_CALL + Juan Camilo agrega BRAVE_API_KEY y hace PR de `dev/juanca/ga4-agent`

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
| MCP integration | Brave Search MCP (`@modelcontextprotocol/server-brave-search`) | Track 1 satisfecho; investiga dominio del cliente antes del diagnóstico |
| APIs Google (reads + writes) | Llamadas directas via Python libs | MCP oficial GA4 es solo lectura; necesitamos writes; patrón directo más estable |
| Contexto compartido sub-agentes | Patrón pull desde `session.state` | Evita MALFORMED_FUNCTION_CALL al embeber JSONs grandes en parámetros de AgentTool |
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

### Sesión 9 — 2 de junio 2026

**Frontend — experiencia completa de demo + live session**

- **Fix iron-session callback**: La cookie no se guardaba al hacer OAuth porque `session.save()` usaba la API `cookies()` de Next.js pero `NextResponse.redirect()` crea un objeto de respuesta independiente que no hereda las cookies. Fix: pasar `req` + `response` directamente a `getIronSession`. Mismo fix aplicado al logout.

- **Home page rediseñada** (`frontend/app/page.tsx`):
  - CTA "Diagnosticar nuevo ecosistema" → `/clients/new`
  - Sección "Mis análisis" — clientes creados en la sesión (con "Continuar" + "Reiniciar")
  - Sección "Demos" — 3 clientes mock bloqueados con tag "Demo"

- **Formulario de nuevo cliente** (`frontend/app/clients/new/`):
  - Server Component shell + Client Component form (`NewClientForm.tsx`)
  - Campos: nombre empresa, sitio web (https:// auto-agregado), modelo de negocio (10 opciones)
  - Submite a `POST /api/clients` → guarda en iron-session → redirige al chat

- **Almacenamiento de clientes creados — iron-session (DEMO)**:
  - `frontend/lib/session.ts`: agregado `StoredClient` interface + `createdClients?: StoredClient[]` a `SessionData`
  - `maxAge` aumentado de 1h a 24h para que los clientes persistan durante el día de demo
  - `POST /api/clients`: crea cliente y guarda en cookie
  - `DELETE /api/clients?id=`: elimina cliente de la sesión
  - **LÍMITE**: cookie cifrada ≤ ~3KB útil — soporta ~10-15 clientes antes de empezar a fallar
  - **Para producción** → migrar a Firestore (ver sección abajo)

- **Demo clients con conversaciones falsas** (`frontend/lib/mock-clients.ts`):
  - 3 demos con conversaciones completas hardcodeadas (choice_card, table, action_card, progress, summary_card)
  - Demo 1: Tienda Demo — ciclo completo auditoría + implementación
  - Demo 2: Retail Colombia — auditoría GTM, bug de camelCase detectado
  - Demo 3: E-commerce Test — pending de confirmación
  - `Client` type actualizado con `isDemo?: boolean` + `demoConversation?: ChatMessage[]`

- **Chat en modo demo** (`frontend/app/clients/[id]/chat/`):
  - `ChatClient.tsx`: prop `readOnly` — bloquea `submitMessage`, oculta input, oculta botón "Reiniciar sesión"
  - Footer demo: solo muestra icono de candado + "Conversación de ejemplo — solo lectura"
  - `chat/page.tsx`: resuelve clientes en mockClients primero, luego en `session.createdClients`
  - `chat/page.tsx`: `?reset=true` → borra sesión ADK antes de cargar (`DELETE /apps/{APP_NAME}/users/{userId}/sessions/{sessionId}`)

- **Reset de sesión ADK** (`frontend/app/api/session/[clientId]/route.ts`):
  - `DELETE /api/session/{clientId}` — llama al ADK dev server para borrar la sesión

---

### ⚠️ PENDIENTE MAURO — Migración Firestore para clientes creados

Actualmente los clientes creados por el consultor se guardan en la **cookie de sesión iron-session**. Esto funciona para el demo pero tiene límites:

| Limitación | Detalle |
|---|---|
| Tamaño | Cookie cifrada ≤ ~4KB total — ~10-15 clientes máx antes de overflow silencioso |
| Persistencia | Se borran al cerrar sesión (logout) o expirar la cookie (24h) |
| Multi-dispositivo | No sincroniza entre dispositivos |
| Producción | Inaceptable para uso real |

**Migración a Firestore** (cuando haya tiempo post-hackathon o antes del deploy):

```
Firestore schema:
consultants/
  {userId}/              ← derived from session.userEmail (slugified)
    clients/
      {clientId}/        ← el id generado en slugify()
        name: string
        websiteUrl: string
        industry: string
        createdAt: timestamp
        lastChatAt: timestamp (opcional)
```

**Archivos a modificar para la migración**:

1. `frontend/app/api/clients/route.ts`
   - POST: cambiar `session.createdClients.push()` → `db.collection('consultants').doc(userId).collection('clients').doc(id).set(...)`
   - DELETE: cambiar filtro de session → `db.doc(...).delete()`

2. `frontend/app/page.tsx`
   - Cambiar `session.createdClients ?? []` → query Firestore `consultants/{userId}/clients`

3. `frontend/app/clients/[id]/chat/page.tsx`
   - Cambiar `session.createdClients?.find(...)` → `db.doc('consultants/{userId}/clients/{id}').get()`

4. `frontend/lib/session.ts`
   - Eliminar `createdClients` de `SessionData` (ya no se guarda en cookie)
   - Eliminar `StoredClient` interface (reemplazar con el tipo de Firestore)

**Dependencias necesarias** (ya en `requirements.txt` el server, pero para el frontend):
```bash
# En /frontend
npm install firebase  # o usar google-cloud-firestore via API route
```

El modelo de autenticación para Firestore desde el frontend en producción:
- Las API routes (`/api/clients`) usan el Service Account desde `GOOGLE_APPLICATION_CREDENTIALS`
- El `userId` se deriva de `session.userEmail` (slugificado como hace el chat route)

---

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

### Sesión 8 — 1 de junio 2026

- **Limpieza rama `dev/juanca/ga4-agent`**:
  - Creado backup `backup/juanca-ga4-agent-pre-rebase`
  - Rebase limpio sobre master: eliminados 2 commits vacíos + 4 commits duplicados
  - Rama quedó con 2 commits de trabajo real encima de master — force push ejecutado

- **Fix crítico MALFORMED_FUNCTION_CALL**:
  - Causa: Planner embebía ideal_spec JSON completo + respuesta GA4 (~15K chars) en el parámetro `request` del AgentTool call a gtm_tool
  - Solución — patrón pull de session.state:
    - `agents/shared/state_tools.py` (nuevo): `get_ideal_spec_from_state()` y `get_ga4_findings_from_state()`
    - `save_ga4_findings()` agregado a `client_tools.py`
    - Planner: Paso 5 reescrito — mensajes a sub-agentes ahora son 3-4 líneas
    - GA4 Agent: agrega `get_ideal_spec_from_state` a su tools list
    - GTM Agent: agrega ambas tools de estado + instrucción actualizada
    - `shared/prompts.py`: `IDEAL_SPEC_CONTEXT_SECTION` actualizado para usar tools en vez de bloque embebido
  - Dependencia nueva: `mcp>=1.27.2` agregada a `requirements.txt`

- **Integración Brave Search MCP** (satisface Track 1):
  - `MCPToolset` con `@modelcontextprotocol/server-brave-search` agregado al Planner
  - Paso 2 rediseñado: investiga dominio automáticamente → presenta hallazgos para confirmar
  - Fallback si Brave no encuentra info: solicita datos al consultor manualmente
  - `BRAVE_API_KEY` agregada a `.env.example` (key gratuita — 2,000 req/mes)
  - Decisión: mantener APIs directas para GA4/GTM — MCP oficial GA4 es solo lectura

- **Pendiente Juan Camilo**: agregar `BRAVE_API_KEY` al `.env` local

### Sesión 7 — 29 de mayo 2026

- **Web Analyzer Agent construido** (`agents/web_analyzer_agent/agent.py`):
  - Estructura dual: `current_state` (qué hay) + `ideal_spec` (qué debería haber)
  - Respuesta JSON estructurada con `ambiguities` para preguntas al consultor
  - Maneja caso sin Playwright: infiere del contexto del negocio con marcador "[INFERIDO]"
  - `agents/web_analyzer_agent/tools/` creado (vacío — Playwright tools pendientes Semana 4)

- **Módulo compartido de prompts** (`agents/shared/prompts.py`):
  - `GA4_STANDARDS` — límites técnicos, naming de eventos, P0 por tipo de negocio, checklist pre-lanzamiento
  - `GTM_STANDARDS` — nomenclatura obligatoria, restricciones JS (ES5 solo), reglas dataLayer, workflow deploy
  - `IDEAL_SPEC_CONTEXT_SECTION` — instrucción para GA4/GTM de usar el ideal_spec del Web Analyzer en gap analysis
  - `A2UI_FORMAT_EXAMPLES`, `SUMMARY_CARD_FORMAT`, `FINDING_CLASSIFICATION`, `COMMUNICATION_RULES`

- **Planner Agent actualizado**:
  - Integra `web_analyzer_tool` como AgentTool (junto a ga4_tool, gtm_tool)
  - Dos nuevas tools: `set_audit_mode` (auditoria | auditoria_implementacion) y `save_ideal_spec`
  - Flujo: Web Analyzer genera ideal_spec → Planner lo guarda en state → GA4/GTM lo usan para gap analysis

- **client_tools.py actualizado**:
  - `set_audit_mode()` — registra modo de trabajo elegido al inicio
  - `save_ideal_spec()` — propaga ideal_spec del Web Analyzer a GA4/GTM via session.state

- **Cambios sin commitear**: 5 archivos modificados + `agents/shared/` + `agents/web_analyzer_agent/__init__.py` + `agents/web_analyzer_agent/tools/`

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
