from google.adk.tools import ToolContext


def load_client_tokens(access_token: str, refresh_token: str, tool_context: ToolContext) -> dict:
    """
    Carga los tokens OAuth del cliente en el estado de sesión.
    En producción los tokens ya llegan via initialState del frontend — no es necesario llamar esta función.
    Úsala en desarrollo local cuando pasas los tokens manualmente en el chat.

    Args:
        access_token: Token de acceso OAuth2 de Google del cliente
        refresh_token: Token de refresco OAuth2 de Google del cliente
    """
    tool_context.state["access_token"] = access_token
    tool_context.state["refresh_token"] = refresh_token
    return {
        "status": "tokens_loaded",
        "message": "Tokens OAuth cargados. Listo para diagnosticar.",
    }


def get_session_info(tool_context: ToolContext) -> dict:
    """
    Verifica el estado de la sesión: si los tokens OAuth están presentes y la sesión está lista.
    Úsala al inicio para confirmar que el cliente está autenticado antes de llamar sub-agentes.
    """
    has_access = bool(tool_context.state.get("access_token"))
    has_refresh = bool(tool_context.state.get("refresh_token"))
    return {
        "access_token_present": has_access,
        "refresh_token_present": has_refresh,
        "ready_to_diagnose": has_access and has_refresh,
        "message": (
            "Sesión lista — tokens cargados correctamente."
            if (has_access and has_refresh)
            else "Tokens no encontrados. El cliente debe autenticarse o proveer los tokens."
        ),
    }


def confirm_action(action_description: str, tool_context: ToolContext) -> dict:
    """
    Registra la confirmación del consultor para ejecutar una acción de implementación.
    Llama esta función SOLO después de que el consultor haya respondido afirmativamente
    a un action_card A2UI. La confirmación es de un solo uso — se consume después de
    la primera operación de escritura que la use.

    Args:
        action_description: Descripción breve de la acción que el consultor aprobó
                            (ej: "Crear conversión 'purchase' en GA4-123456")
    """
    tool_context.state["implementation_confirmed"] = True
    tool_context.state["confirmed_action"] = action_description
    return {
        "confirmed": True,
        "action": action_description,
        "message": "Confirmación registrada. Procediendo con la implementación.",
    }


def set_business_context(business_type: str, tool_context: ToolContext) -> dict:
    """
    Guarda el contexto del tipo de negocio del cliente en la sesión.
    Úsala al inicio del diagnóstico para que los agentes prioricen los hallazgos
    correctos según el modelo de negocio.

    Args:
        business_type: Tipo de negocio del cliente.
                       Valores válidos: "ecommerce", "lead_generation", "saas",
                       "marketplace", "media", "otro"
    """
    valid_types = {"ecommerce", "lead_generation", "saas", "marketplace", "media", "otro"}
    if business_type.lower() not in valid_types:
        return {
            "error": f"Tipo de negocio inválido: '{business_type}'.",
            "valid_options": sorted(valid_types),
        }
    tool_context.state["business_type"] = business_type.lower()
    return {
        "business_type": business_type.lower(),
        "message": f"Contexto guardado: cliente de tipo '{business_type}'. Los agentes priorizarán los hallazgos relevantes para este modelo de negocio.",
    }
