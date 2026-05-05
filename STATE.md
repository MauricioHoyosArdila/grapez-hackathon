# STATE.md — Grapez Analytics Agents

> Hackathon: Google for Startups AI Agents Challenge | Deadline: Junio 5, 2026

---

## Estado Actual

**Fase**: 0 — Proyecto recién inicializado  
**Última sesión**: 2 de mayo 2026  
**Próximo paso**: Iniciar Semana 1 — Setup ADK + OAuth + Planner Agent skeleton

---

## Progreso por Semana

### Semana 1 (May 2-9) — Fundamentos
- [ ] Setup Python con ADK instalado y funcionando localmente
- [ ] Setup Next.js frontend
- [ ] OAuth Google — flujo completo (start → callback → guardar tokens Firestore)
- [ ] Firestore schema + encriptación tokens con Fernet
- [ ] Planner Agent skeleton — recibe mensaje, responde
- [ ] Deploy básico en Agent Engine (verificar que funciona)
- [ ] `.env.example` completo

### Semana 2 (May 10-16) — Diagnóstico GA4 + GTM
- [ ] GA4 Agent completo — todas las herramientas de diagnóstico
- [ ] Buscar + integrar skill analytics-tracking (borghei) desde MCP Market
- [ ] GTM Agent completo — todas las herramientas de diagnóstico
- [ ] Planner Agent coordina GA4 + GTM en paralelo
- [ ] A2UI básico en frontend — renderizar tabla de hallazgos

### Semana 3 (May 17-23) — Ads + Web Analyzer
- [ ] Google Ads Agent — diagnóstico
- [ ] Web Analyzer Agent — Playwright crawl básico
- [ ] Web Analyzer — simulación funnel de conversión
- [ ] Setup entorno demo (TiendaDemo GA4 + GTM + sitio Vercel)

### Semana 4 (May 24-30) — Implementation Agent + A2UI completo
- [ ] Implementation Agent — GA4 write operations
- [ ] Implementation Agent — GTM write operations (crear workspace, tags, publicar borrador)
- [ ] Flujo de confirmación via A2UI (action cards con botones)
- [ ] A2UI completo: tablas, progress bars, summary cards
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
| Framework de agentes | Google ADK | Requerimiento hackathon + nativo con Gemini |
| Modelo | gemini-3-flash-preview | Último disponible, óptimo para tareas de análisis |
| DB | Firestore | Nativo GCP, free tier generoso |
| APIs Google | Llamadas directas via Python (no MCP) | MCPs disponibles son solo lectura; necesitamos writes |
| Web crawling | Playwright Python | Único modo de detectar tracking en browser real |
| UI dinámica | A2UI | Google's own protocol, maximiza puntuación Innovation |
| Deploy | Agent Engine + Cloud Run | Requisitos del hackathon + crédito $500 GCP |
| Alcance inicial | Uso interno Grapez | Demo más fuerte con datos reales, go-to-market más rápido |

---

## Log de Sesiones

### Sesión 1 — 2 de mayo 2026
- Proyecto inicializado
- CLAUDE.md escrito con arquitectura completa
- Estructura de carpetas creada
- Pendiente: iniciar construcción Semana 1

---

## Bloqueantes / Issues Abiertos

_Ninguno por ahora_

---

## Skills Identificadas (pendiente de instalar)

| Skill | Fuente | Para qué agente | Estado |
|---|---|---|---|
| analytics-tracking | MCP Market — borghei | GA4 Agent + GTM Agent | Pendiente buscar al construir esos agentes |

---

## Entorno Demo

| Recurso | Estado | Notas |
|---|---|---|
| GA4 "TiendaDemo" property | ❌ Pendiente crear | En cuenta Google de Grapez |
| GTM "TiendaDemo" container | ❌ Pendiente crear | Con errores plantados |
| Google Ads test account | ❌ Pendiente crear | Necesita developer token |
| Sitio demo Vercel | ❌ Pendiente crear | tiendademo.grapez.co o similar |
