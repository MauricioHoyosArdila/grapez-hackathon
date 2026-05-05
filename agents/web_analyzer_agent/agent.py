# agents/web_analyzer_agent/agent.py
# Web Analyzer Agent — Crawl del sitio con Playwright
#
# INSTRUCCIONES PARA CONSTRUIR (Semana 3):
# 1. Instalar: playwright → después ejecutar: playwright install chromium
# 2. Verificar que UnsafeLocalCodeExecutor permite ejecutar Playwright en el entorno
# 3. Buscar skills en MCP Market: "playwright tracking detection", "web scraping analytics"
# 4. El agente corre en Agent Engine — verificar si Chromium headless funciona ahí
#    Si no: considerar Cloud Run Job para el browser, Agent Engine para la lógica
# 5. Implementar tools en ./tools/playwright_tools.py

# CONSIDERACIÓN IMPORTANTE:
# Agent Engine puede no tener Chromium instalado. Opciones:
# A) Usar Cloud Run con Docker que tenga Playwright instalado
#    y exponerlo como tool HTTP que el agente llama
# B) Verificar si ADK soporta containers personalizados en Agent Engine
# C) Usar Browserless.io / BrowserBase como servicio externo
# → INVESTIGAR esto al llegar a la Semana 3

# TODO (Semana 3):
# - Resolver dónde corre Playwright (Agent Engine vs Cloud Run vs externo)
# - Implementar analyze_homepage
# - Implementar crawl_key_pages
# - Implementar extract_datalayer_schema
# - Implementar check_consent_mode
# - Implementar detect_tracking_errors

DESCRIPTION = """
Analiza sitios web usando Playwright para detectar implementaciones de GA4, GTM
y Google Ads. Extrae el schema del dataLayer y verifica el funnel de conversión.
"""

INSTRUCTION = """
Eres un especialista en detección de tracking en sitios web.

Cuando analices un sitio:
1. Detecta: GTM container ID, GA4 measurement ID, Google Ads tag
2. Lee el dataLayer inicial y pushes durante navegación
3. Navega páginas clave: home, producto, carrito, checkout, confirmación
4. Documenta todos los eventos del dataLayer con sus parámetros
5. Verifica si Consent Mode v2 está implementado
6. Detecta errores: tags duplicados, eventos faltantes, IDs incorrectos
7. Compara eventos detectados contra el estándar esperado para el tipo de negocio

Reporta con:
- Tags detectados (con IDs)
- Eventos del dataLayer (con frecuencia y parámetros)
- Gaps críticos (eventos esperados pero ausentes)
- Errores encontrados
"""

root_agent = None  # reemplazar con Agent(...) en Semana 3
