# Demo Script — Video 1-2 minutos
## Google for Startups AI Agents Challenge

---

## Estructura del video (90 segundos)

### 0:00 – 0:15 — El problema (voz en off + pantalla de la app)
> "Configurar el ecosistema de medición de un cliente — GA4, GTM y Google Ads — toma de 1 a 3 días de trabajo manual. Los errores son frecuentes y se repiten en cada cliente."

*Mostrar: pantalla de la app con lista de clientes de Grapez*

---

### 0:15 – 0:30 — Conectar cuenta (demo en vivo)
> "Con Grapez Analytics Agents, el consultor conecta la cuenta Google del cliente en segundos."

*Mostrar: flujo OAuth — clic en "Conectar cuenta Google" → pantalla de permisos Google → regreso a la app con confirmación*

---

### 0:30 – 1:00 — Diagnóstico automático (el momento wow)
> "El agente analiza en paralelo GA4, GTM, Google Ads y el sitio web del cliente."

*Mostrar: chat con el agente — el consultor escribe "Diagnostica el ecosistema completo"*
*Mostrar: el agente trabajando — burbujas de actividad, A2UI renderizando resultados en tiempo real*
*Mostrar: tabla final de hallazgos — ✅ correcto, ⚠️ mejorable, ❌ crítico*

Hallazgos del demo (para TiendaDemo):
- ❌ No hay evento de conversión 'purchase' en GA4
- ❌ Tag de GA4 duplicado en GTM
- ⚠️ Retención de datos en 2 meses (debería ser 14)
- ⚠️ Google Ads no vinculado a GA4
- ❌ Auto-tagging desactivado en Google Ads

---

### 1:00 – 1:20 — Implementación con un clic
> "El agente no solo diagnostica: ejecuta las correcciones con confirmación humana."

*Mostrar: action card A2UI — "¿Crear conversión 'purchase' en GA4?" → clic en "Confirmar"*
*Mostrar: progress bar — "Implementando cambios en GTM: 3/7"*
*Mostrar: summary card final — "5 problemas resueltos"*

---

### 1:20 – 1:30 — Cierre
> "20 minutos. Un consultor. Un ecosistema completo configurado y funcionando."
> "Grapez Analytics Agents — para Grapez Studio, por Grapez Studio."

*Mostrar: logo + stack (Gemini · ADK · Google Cloud)*

---

## Notas de producción
- Grabar en pantalla completa 1920x1080
- Usar cuenta demo (TiendaDemo) — NO cuenta real de cliente
- Tener los errores plantados antes de grabar (ejecutar `demo/reset_demo.py`)
- Subtítulos en inglés (jurado puede ser internacional)
- Música de fondo suave, sin distracciones
- Subir a YouTube como "No listado" → pegar link en Devpost
