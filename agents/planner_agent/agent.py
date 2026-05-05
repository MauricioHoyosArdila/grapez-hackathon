# agents/planner_agent/agent.py
# Planner Agent — Orchestrador principal del sistema
#
# INSTRUCCIONES PARA CONSTRUIR:
# 1. Verificar versión actual de ADK: pip index versions google-adk
# 2. Leer docs oficiales: https://google.github.io/adk-docs/
# 3. Verificar que SkillToolset, UnsafeLocalCodeExecutor existen en la versión instalada
# 4. Ajustar imports según lo que encuentres en la documentación actual
#
# TODO (Semana 1):
# - Implementar tools de delegación a sub-agentes
# - Conectar con Firestore para leer tokens OAuth del cliente
# - Implementar render_a2ui para enviar componentes al frontend
#
# TODO (Semana 2+):
# - Activar delegación a GA4 Agent cuando esté construido
# - Activar delegación a GTM Agent cuando esté construido
# - Activar delegación a Ads + Web Analyzer cuando estén construidos

from google.adk.agents import Agent
# from google.adk.tools import SkillToolset          # descomentar cuando se confirmen imports
# from google.adk.code_executors import UnsafeLocalCodeExecutor  # verificar nombre exacto

DESCRIPTION = """
Orchestrador del sistema de análisis de ecosistema de medición de Grapez Studio.
Coordina agentes especializados en GA4, GTM, Google Ads y análisis web para diagnosticar
y configurar el ecosistema completo de marketing analytics de un cliente.
"""

INSTRUCTION = """
Eres el coordinador del ecosistema de medición de Grapez Studio.

Cuando un consultor te da un objetivo:
1. Analiza qué agentes necesitas activar según el objetivo
2. Actívalos en el orden correcto (diagnóstico primero, implementación después)
3. Consolida todos los resultados en un reporte claro y accionable
4. NUNCA implementes cambios sin confirmación explícita del consultor

Para un diagnóstico completo, el orden es:
1. Web Analyzer (detectar implementaciones existentes en el sitio)
2. GA4 Agent + GTM Agent + Ads Agent (en paralelo — diagnóstico de plataformas)
3. Consolidar hallazgos y generar plan de acción
4. Presentar plan al consultor y esperar confirmación
5. Implementation Agent (ejecutar acciones aprobadas, una por una)

Comunica siempre en el idioma del consultor.
Sé específico con los problemas encontrados — incluye IDs, nombres y valores concretos.
Prioriza los problemas por impacto en el negocio del cliente.
"""

# Placeholder — reemplazar con tools reales en Semana 1
# tools = [
#     get_client_tokens,
#     delegate_to_ga4_agent,
#     delegate_to_gtm_agent,
#     delegate_to_ads_agent,
#     delegate_to_web_analyzer,
#     delegate_to_implementation,
#     render_a2ui,
# ]

root_agent = Agent(
    model="gemini-3-flash-preview",
    name="planner_agent",
    description=DESCRIPTION,
    instruction=INSTRUCTION,
    tools=[],  # llenar en Semana 1
)
