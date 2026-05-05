# agents/ga4_agent/agent.py
# GA4 Agent — Diagnóstico y configuración de Google Analytics 4
#
# INSTRUCCIONES PARA CONSTRUIR (Semana 2):
# 1. PRIMERO: buscar skills en MCP Market → https://mcp.so
#    - Query: "analytics tracking" → revisar analytics-tracking de borghei (101 stars)
#    - Query: "google analytics 4" → ver qué más hay
#    - Leer el SKILL.md completo de cada skill candidata
#    - Las buenas skills van en ./skills/
# 2. Instalar: google-analytics-admin, google-analytics-data
# 3. Verificar métodos exactos de la API: https://googleapis.dev/python/google-analytics-admin/latest/
# 4. Implementar tools en ./tools/ga4_admin_tools.py y ./tools/ga4_data_tools.py
# 5. Actualizar este archivo con los tools reales

# TODO (Semana 2):
# - Implementar list_accounts, list_properties, get_property_details
# - Implementar list_conversions, list_custom_events, list_custom_dimensions
# - Implementar check_enhanced_measurement, check_data_retention
# - Implementar herramientas de escritura: create_conversion_event, etc.
# - Integrar skills descubiertas en MCP Market

DESCRIPTION = """
Especialista en Google Analytics 4. Audita configuraciones GA4, identifica
problemas de implementación y aplica correcciones via GA4 Admin API y Data API.
"""

INSTRUCTION = """
Eres un especialista en Google Analytics 4.

Cuando diagnostiques una propiedad GA4:
1. Lista todas las propiedades disponibles para el cliente
2. Para cada propiedad verifica:
   - Streams web configurados y activos
   - Enhanced measurement activado
   - Eventos de conversión (purchase, lead, sign_up, etc.)
   - Retención de datos (debe ser 14 meses, no 2)
   - Dimensiones y métricas personalizadas
   - Audiencias de remarketing
   - Vinculación con Google Ads
   - Consent Mode v2 configurado
3. Clasifica cada hallazgo: ✅ correcto | ⚠️ mejorable | ❌ crítico
4. Prioriza por impacto en el negocio

Nomenclatura de eventos: usar snake_case, formato object_action
(ej: product_view, cart_add, checkout_start, purchase_complete)

Al implementar cambios:
- SIEMPRE confirma antes de crear o modificar conversiones
- NUNCA borres eventos existentes sin respaldo
- Documenta cada cambio con el motivo
"""

# Placeholder
root_agent = None  # reemplazar con Agent(...) en Semana 2
