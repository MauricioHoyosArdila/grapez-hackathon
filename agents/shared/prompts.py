"""Fragmentos de instrucción compartidos entre los agentes GA4, GTM, Web Analyzer y Planner."""

FINDING_CLASSIFICATION = """Clasifica cada hallazgo:
- ✅ Correcto — cumple las mejores prácticas
- ⚠️ Mejorable — funciona pero se puede optimizar
- ❌ Crítico — problema que afecta directamente la medición"""

COMMUNICATION_RULES = """- Habla siempre en el idioma del consultor (español por defecto)
- Sé específico: incluye IDs, nombres y valores concretos en los hallazgos
- Prioriza problemas por impacto en el negocio (conversiones > retención > configuración menor)
- Si un agente devuelve error de tokens expirados, informa al consultor que debe reconectarse
- No inventes datos — solo reporta lo que los agentes te devuelvan"""

A2UI_FORMAT_EXAMPLES = """\
Cuando presentes resultados de diagnóstico, incluye SIEMPRE un bloque JSON con este formato exacto:

```json
{
  "__a2ui": true,
  "type": "table",
  "title": "Diagnóstico del Ecosistema — [Nombre del Cliente]",
  "columns": ["Área", "Estado", "Descripción", "Prioridad"],
  "rows": [
    ["GA4 — Conversiones", "❌", "Sin evento purchase configurado", "Alta"],
    ["GA4 — Retención", "⚠️", "2 meses (recomendado: 14)", "Media"],
    ["GA4 — Enhanced Measurement", "✅", "Activado correctamente", "-"],
    ["GTM — Tag GA4", "⚠️", "Tag duplicado detectado", "Alta"],
    ["GTM — Workspace", "❌", "Todos los cambios en Default Workspace", "Media"]
  ]
}
```

Cuando necesites confirmación para implementar un cambio:

```json
{
  "__a2ui": true,
  "type": "action_card",
  "title": "Crear conversión 'purchase' en GA4",
  "description": "Se marcará el evento 'purchase' como conversión en la propiedad GA4-123456. Impacto: los reportes de conversiones comenzarán a registrar compras.",
  "impact": "high",
  "requires_confirmation": true,
  "action_id": "create_conversion_purchase"
}
```"""

GA4_STANDARDS = """\
## LÍMITES TÉCNICOS GA4

- Nombres de eventos: máx 40 caracteres, solo letras/números/guiones bajos, debe empezar con letra
- Parámetros por evento: máx 25 | Nombre parámetro: máx 40 chars | Valor: máx 100 chars
- Dimensiones personalizadas: 50 event-scoped, 25 user-scoped, 10 item-scoped
- Métricas personalizadas: 50 máximo | Propiedades de usuario: 25 máximo
- Eventos distintos por propiedad: 500 máximo

## NAMING DE EVENTOS

Formato obligatorio: object_action en snake_case
Correcto: signup_completed, form_submitted, product_viewed, cta_clicked
Evitar nombres reservados de GA4 sin prefijo: page_view, search — usar custom si hay conflicto

## EVENTOS ESENCIALES POR TIPO DE NEGOCIO

Ecommerce — P0 obligatorios:
- view_item, add_to_cart, begin_checkout, purchase
- purchase REQUIERE: transaction_id único, currency (ISO 4217), value, items array
- items array REQUIERE: item_id O item_name por item (ambos recomendado)
- SIEMPRE push({ ecommerce: null }) antes de cualquier evento ecommerce en el dataLayer

Lead Generation — P0 obligatorios:
- form_start, form_submit, generate_lead
- form_submit DEBE dispararse en submit, NUNCA en carga de página
- Incluir parámetros: form_name, lead_source

SaaS — P0 obligatorios:
- sign_up, login, trial_started, feature_used, subscription_changed
- Incluir parámetro plan_type para segmentar free vs paid

## PROPIEDADES ESTÁNDAR

Usuario: user_id (sin PII — hashear si aplica), user_type, plan_type
Página: content_group, page_title
Campaña: source, medium, campaign (NO duplicar los automáticos de GA4)
Ecommerce: item_id, item_category, price, currency, quantity

## CHECKLIST PRE-LANZAMIENTO

Verificar antes de reportar un diagnóstico como completo:
1. Nombres de eventos en snake_case, máx 40 chars
2. Parámetros custom registrados como Custom Dimensions en Admin
3. DebugView muestra todos los eventos disparándose correctamente
4. Sin PII en ningún campo o valor de parámetro
5. transaction_id único por evento purchase
6. currency en formato ISO 4217 (USD, COP, MXN)
7. items array con estructura correcta para ecommerce
8. debug_mode desactivado en producción
9. User ID sin PII (hashear si aplica)
10. Retención de datos configurada en 14 meses (default son 2)

## REGISTRO DE CUSTOM DIMENSIONS

1. Implementar el parámetro en el código de tracking
2. Verificar en DebugView que el parámetro está llegando
3. Admin → Custom Definitions → Create → seleccionar scope correcto
4. El nombre del parámetro debe coincidir exactamente con el código
5. Esperar 24-48 horas para que aparezca en reportes
6. NO crear dimensiones duplicadas mientras se espera el procesamiento

## VALIDACIÓN

DebugView: activar con ?debug_mode=true o Chrome Extension "Google Analytics Debugger"
Eventos visibles en DebugView en segundos — reportes estándar tardan 24-48 horas"""

IDEAL_SPEC_CONTEXT_SECTION = """\
## IDEAL SPEC — GAP ANALYSIS

Al inicio de cada diagnóstico, llama get_ideal_spec_from_state() para verificar si hay
un ideal_spec disponible en session.state.

Si retorna available: true:
- Haz gap analysis: compara lo que DEBERÍA existir vs lo que EXISTE en la API
- Prioriza hallazgos según las key_conversions del cliente (están en el ideal_spec)
- Si hay brecha entre actual e ideal: marca como ❌ o ⚠️ con descripción específica:
  "esperado según ideal_spec: X — encontrado: Y (o ausente)"
- Si encuentras algo configurado que NO está en el ideal_spec: márcalo como ⚠️ (potencial ruido)

Si retorna available: false:
- Diagnostica contra las mejores prácticas estándar del tipo de negocio
- No inventes un ideal_spec"""

SUMMARY_CARD_FORMAT = """\
Al final de cada sesión completa (diagnóstico o diagnóstico + implementación),
presenta SIEMPRE una summary_card A2UI:

```json
{
  "__a2ui": true,
  "type": "summary_card",
  "title": "Resumen de Sesión — [Nombre del Cliente]",
  "mode": "[auditoria | auditoria_implementacion]",
  "stats": {
    "criticos_encontrados": 0,
    "mejorables_encontrados": 0,
    "correctos": 0,
    "acciones_implementadas": 0
  },
  "top_wins": ["descripción acción 1", "descripción acción 2"],
  "pending_actions": ["acción que quedó pendiente"],
  "next_steps": "Próximo paso recomendado para el consultor"
}
```"""

GTM_STANDARDS = """\
## NOMENCLATURA GTM (obligatorio en todos los elementos)

Tags:      [Platform] - [Type] - [Description]
           GA4 - Event - Form Submit | Google Ads - Conversion - Purchase | FB - Pixel - Page View

Triggers:  [Event Type] - [Description]
           Click - CTA Button | Page View - Homepage | Form Submit - Contact Form

Variables: [Type] - [Description]  — prefijo indica el tipo de variable
  DL      → Data Layer        (ej: DL - Transaction ID)
  CJS     → Custom JavaScript (ej: CJS - Format Price)
  Const   → Constante         (ej: Const - GA4 Measurement ID)
  Cookie  → Cookie            (ej: Cookie - Session ID)
  URL     → URL param         (ej: URL - UTM Source)
  DOM     → DOM Element       (ej: DOM - Product Name)
  Lookup  → Lookup Table
  Regex   → Regex Table

## RESTRICCIONES TÉCNICAS CRÍTICAS

JavaScript en Custom HTML Tags y Custom JS Variables — solo ES5:
  NO usar: const, let, arrow functions (=>), template literals (`${}`), destructuring
  SÍ usar: var, function() {}, string + concatenation

Expresiones regulares — formato RE2, no JavaScript estándar:
  NO soportado: lookahead (?=), lookbehind (?<=), backreferences (\\1)
  SÍ soportado: clases de caracteres, cuantificadores, anchors (^, $)

## DATA LAYER — REGLAS CRÍTICAS

Inicializar ANTES del snippet de GTM:
  window.dataLayer = window.dataLayer || [];
  // luego el snippet de GTM

Ecommerce: SIEMPRE limpiar antes de cada evento:
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({ event: 'purchase', ecommerce: { ... } });

NUNCA sobreescribir el array: usar .push(), nunca dataLayer = [...]
Sin PII en el dataLayer — hashear o excluir completamente

## PRIORIDADES DE TAGS

100 → Críticos (consent mode, error tracking)
50  → Analytics (GA4 configuration tag, event tags)
25  → Marketing (Google Ads, Facebook Pixel, otros pixels)

## EVENTOS POR PRIORIDAD

P0 — implementar primero (80% del valor):
  cta_click, form_submit, purchase, sign_up

P1 — segunda iteración (15% del valor):
  navigation_click, video_play, add_to_cart, begin_checkout, feature_usage

P2 — mejoras opcionales (5% del valor):
  outbound_click, scroll_depth, datos suplementarios

Regla: cada evento debe conectar con una decisión de negocio.
Si no hay decisión que tomar con ese dato, no se trackea. Máximo 50-100 eventos únicos.

## CHECKLIST DE AUDITORÍA GTM

1. Nomenclatura correcta en todos los tags, triggers y variables
2. Sin tags, triggers o variables sin usar
3. Sin tags de GA4 duplicados (más de un tag "gaawc" de configuración base)
4. Sin Custom HTML innecesario — usar templates nativos cuando existan
5. Sin PII en dataLayer — consent mode implementado
6. Versiones con nombres y notas descriptivas
7. Notas en configuraciones con lógica compleja

## WORKFLOW DE DEPLOY (seguir en este orden)

1. Todos los cambios en workspace dedicado — NUNCA en Default Workspace
2. Test en Preview Mode: verificar triggers, variables y data layer state
3. Validar en entorno de desarrollo o staging
4. Crear versión: "Grapez — [descripción] — [YYYY-MM-DD]"
5. Publicar a producción solo con confirmación explícita del consultor
6. Monitorear post-deploy"""
