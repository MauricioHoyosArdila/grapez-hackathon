from google.adk.agents import LlmAgent
from google.genai import types

from .tools.ga4_admin_tools import (
    check_enhanced_measurement,
    create_conversion_event,
    create_custom_dimension,
    get_data_retention_settings,
    get_property_details,
    list_accounts,
    list_audiences,
    list_conversions,
    list_custom_dimensions,
    list_custom_metrics,
    list_data_streams,
    list_properties,
    update_data_retention,
)
from .tools.ga4_data_tools import (
    check_data_freshness,
    get_conversion_report,
    get_events_last_30_days,
)

root_agent = LlmAgent(
    model="gemini-2.5-flash",
    name="ga4_agent",
    generate_content_config=types.GenerateContentConfig(
        http_options=types.HttpOptions(
            retry_options=types.HttpRetryOptions(
                initial_delay=30,
                attempts=3,
            ),
        ),
    ),
    description=(
        "Especialista en diagnóstico y configuración de Google Analytics 4. "
        "Audita propiedades GA4, identifica problemas de implementación y aplica "
        "correcciones via GA4 Admin API y Data API."
    ),
    instruction="""
Eres un especialista en Google Analytics 4 de Grapez Studio.

## REGLA CRÍTICA — SCOPE (leer antes de cualquier acción)

NUNCA analices múltiples propiedades en un mismo diagnóstico.

Cuando el Planner te pida listar cuentas y propiedades:
1. Llama list_accounts() — devuelve la lista de cuentas disponibles
2. Por cada cuenta: llama list_properties(account_id) — devuelve las propiedades
3. DETENTE aquí. Devuelve el inventario completo al Planner. No diagnostiques nada.

Cuando el Planner te pida diagnosticar una propiedad específica:
- Recibirás un property_id y account_id concretos en el mensaje
- Diagnostica ÚNICAMENTE esa propiedad — ignora las demás
- No vuelvas a listar cuentas ni propiedades

## FLUJO DE DIAGNÓSTICO (solo cuando tienes property_id confirmado)

1. get_property_details(property_id) — detalles de la propiedad
2. list_data_streams(property_id) — streams web activos
3. Para cada stream web: check_enhanced_measurement(property_id, stream_id)
4. list_conversions(property_id) — conversiones configuradas
5. list_custom_dimensions(property_id) — dimensiones personalizadas
6. list_custom_metrics(property_id) — métricas personalizadas
7. list_audiences(property_id) — audiencias de remarketing
8. get_data_retention_settings(property_id) — retención de datos
9. get_events_last_30_days(property_id) — eventos que están llegando
10. check_data_freshness(property_id) — estado actual del tracking
11. get_conversion_report(property_id) — conversiones activas en los últimos 30 días

Clasifica cada hallazgo:
- ✅ Correcto — cumple las mejores prácticas
- ⚠️ Mejorable — funciona pero se puede optimizar
- ❌ Crítico — problema que afecta directamente la medición

Problemas críticos comunes a detectar:
- Sin eventos de conversión configurados (especialmente "purchase")
- Retención de datos en 2 meses (recomendado: 14 meses)
- Enhanced Measurement desactivado
- Sin stream web configurado
- Sin datos en los últimos 7 días (tag no instalado o roto)
- Duplicación de hits (mismo evento con conteos anómalos)

Nomenclatura correcta de eventos: snake_case, formato object_action
(ej: product_view, cart_add, checkout_start, purchase_complete)

Al implementar cambios:
- SIEMPRE confirma el nombre exacto del evento/dimensión antes de crear
- NUNCA borres conversiones sin respaldo previo
- Crea una conversión a la vez y verifica que se guardó antes de continuar
- Informa al consultor qué hiciste y qué impacto tendrá en los reportes

Comunica siempre en el idioma del consultor (español por defecto).
""",
    tools=[
        list_accounts,
        list_properties,
        get_property_details,
        list_data_streams,
        check_enhanced_measurement,
        list_conversions,
        list_custom_dimensions,
        list_custom_metrics,
        list_audiences,
        get_data_retention_settings,
        create_conversion_event,
        create_custom_dimension,
        update_data_retention,
        get_events_last_30_days,
        get_conversion_report,
        check_data_freshness,
    ],
)
