# STATE.md — Grapez Analytics Agents

> Hackathon: Google for Startups AI Agents Challenge | Deadline: Junio 5, 2026

---

## Estado Actual

**Fase**: 1 — Arquitectura completa y verificada. Lista para construir.
**Última sesión**: 11 de mayo 2026
**Próximo paso**: Semana 2 — Setup ADK local + OAuth + Planner skeleton

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

### Semana 2 (May 10-16) — Diagnóstico GA4 + GTM
- [ ] GA4 Agent completo — todas las herramientas de diagnóstico
- [ ] Buscar + integrar skill analytics-tracking (borghei) desde MCP Market
- [ ] GTM Agent completo — todas las herramientas de diagnóstico
- [ ] Planner Agent coordina GA4 + GTM en paralelo (AgentTool pattern)
- [ ] A2UI renderer custom en frontend (DiagnosisTable, ActionCard, ProgressBar, SummaryCard)

### Semana 3 (May 17-23) — Ads + Web Analyzer
- [ ] Google Ads Agent — diagnóstico
- [ ] Playwright Service — Docker + FastAPI + Cloud Run
- [ ] Web Analyzer Agent — llama Playwright Service via HTTP
- [ ] Web Analyzer — crawl GTM ID, GA4 ID, dataLayer, errores
- [ ] Setup entorno demo (TiendaDemo GA4 + GTM + sitio Vercel)

### Semana 4 (May 24-30) — Implementation Agent + A2UI completo
- [ ] Implementation Agent — GA4 write operations
- [ ] Implementation Agent — GTM write operations (crear workspace, tags, publicar borrador)
- [ ] Flujo de confirmación via A2UI (action cards con botones)
- [ ] Log de acciones en Firestore

### Semana 5 (May 31 - Jun 4) — Polish + Video + Submit
- [ ] Bug fixes y edge cases
- [ ] Diagrama de arquitectura en /architecture/
- [ ] README público para GitHub
- [ ] Grabar video demo (1-2 min)
- [ ] Submit en Devpost

---

## Decisiones Técnicas Tomadas

| Decisión | Elegido | Razón |
|---|---|---|
| Framework de agentes | Google ADK 1.33.0 | Requerimiento hackathon + nativo con Gemini |
| Modelo | `gemini-3-flash-preview` | Confirmado válido en Vertex AI desde dic 2025 |
| ADK pattern orquestación | `AgentTool` (no `sub_agents`) | Control explícito sobre cuándo invocar cada agente |
| Code execution | NO se usa — @tool functions con APIs directas | `UnsafeLocalCodeExecutor` no funciona en Agent Engine |
| DB | Firestore | Nativo GCP, free tier generoso |
| OAuth en agentes | `ToolContext.state` | Propagación automática a sub-agentes, patrón oficial ADK |
| APIs Google | Llamadas directas via Python (no MCP) | MCPs disponibles son solo lectura; necesitamos writes |
| Web crawling | Playwright en Docker (Cloud Run) | Agent Engine no tiene Chromium; Cloud Run sí |
| UI dinámica | A2UI renderer custom React/Tailwind | No hay npm `@google/a2ui` para React; renderer custom ~200 líneas |
| Deploy Web Analyzer | Cloud Run 2Gi Docker | Chromium requiere mínimo 1GB RAM; Cloud Run escala a cero |
| Deploy agentes | Un deploy del Planner (importa sub-agentes como módulos) | Más simple que N deploys independientes |
| Deploy orden | Playwright Service → Agentes → Frontend | Los agentes necesitan la URL del servicio Playwright |
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

---

## Bloqueantes / Issues Abiertos

_Ninguno. Todas las preguntas de investigación resueltas el 11 de mayo 2026._

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
| Google Ads test account | ❌ Pendiente crear | Necesita developer token — Semana 3 |
| Sitio demo Vercel | ❌ Pendiente crear | tiendademo.grapez.co o similar — Semana 3 |
| Playwright Service (Cloud Run) | ❌ Pendiente crear | Docker build + deploy — Semana 3 |
