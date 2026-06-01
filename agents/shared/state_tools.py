"""Tools para leer contexto compartido del session.state — usadas por GA4 y GTM Agents."""

from google.adk.tools import ToolContext


def get_ideal_spec_from_state(tool_context: ToolContext) -> dict:
    """
    Lee el ideal_spec del session.state generado por el Web Analyzer.
    Llama esta función al inicio del diagnóstico para obtener la configuración
    de tracking ideal sin necesitar recibirla embebida en el mensaje del Planner.
    """
    ideal_spec = tool_context.state.get("ideal_spec")
    return {
        "ideal_spec": ideal_spec,
        "available": ideal_spec is not None,
        "message": (
            "Ideal spec disponible — úsalo para el gap analysis."
            if ideal_spec
            else "No hay ideal_spec en sesión — diagnostica contra mejores prácticas estándar."
        ),
    }


def get_ga4_findings_from_state(tool_context: ToolContext) -> dict:
    """
    Lee los hallazgos del GA4 Agent guardados en session.state.
    Solo para el GTM Agent — úsalo para conectar los hallazgos de GA4
    con la configuración GTM en el gap analysis cruzado.
    """
    ga4_findings = tool_context.state.get("ga4_findings")
    return {
        "ga4_findings": ga4_findings,
        "available": ga4_findings is not None,
        "message": (
            "Hallazgos GA4 disponibles — úsalos para el gap analysis cruzado GA4-GTM."
            if ga4_findings
            else "No hay hallazgos GA4 en sesión — diagnostica GTM de forma independiente."
        ),
    }
