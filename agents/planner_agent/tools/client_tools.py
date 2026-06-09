from google.adk.tools import ToolContext


def load_client_tokens(
    access_token: str,
    refresh_token: str,
    tool_context: ToolContext,
    token_expiry: float = 0.0,
) -> dict:
    """
    Carga los tokens OAuth del cliente en el estado de sesión.
    En producción los tokens ya llegan via initialState del frontend — no es necesario llamar esta función.
    Úsala en desarrollo local cuando pasas los tokens manualmente en el chat.

    Args:
        access_token: Token de acceso OAuth2 de Google del cliente
        refresh_token: Token de refresco OAuth2 de Google del cliente
        token_expiry: Timestamp Unix (segundos) de expiración del access_token.
                      El frontend lo calcula como (expires_in - 300) segundos desde ahora.
                      Si es 0, build_credentials() refrescará proactivamente en la primera tool call.
    """
    tool_context.state["access_token"] = access_token
    tool_context.state["refresh_token"] = refresh_token
    if token_expiry > 0:
        tool_context.state["token_expiry"] = token_expiry
    return {
        "status": "tokens_loaded",
        "message": "Conexión con la cuenta de Google lista. Puedes empezar a revisar las cuentas del cliente.",
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
            "Conexión con Google activa — todo listo para empezar."
            if (has_access and has_refresh)
            else "No hay conexión con la cuenta de Google. Pide al consultor reconectar su cuenta antes de continuar."
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
        "message": f"Aprobación registrada para: {action_description}. Aplica solo este cambio y reporta el resultado en lenguaje de negocio.",
    }


def set_business_context(
    business_type: str,
    website_url: str,
    key_conversions: list | str,
    tool_context: ToolContext,
) -> dict:
    """
    Guarda el contexto del negocio del cliente en la sesión.
    Llama después de recopilar los datos del consultor en el Paso 2.
    Todos los agentes usarán estos datos para adaptar su análisis.

    Args:
        business_type: Tipo de negocio. Valores válidos: "ecommerce", "lead_generation",
                       "saas", "marketplace", "media", "otro"
        website_url:   URL del sitio web del cliente (ej: "https://mitienda.com").
                       Requerida para que el Web Analyzer pueda crawlear el sitio.
        key_conversions: Lista de 2-3 acciones clave que el consultor quiere trackear
                 (ej: ["compra completada", "registro de usuario"]).
                 Si llega como string (ej: desde un LLM), se normaliza a list[str].
    """
    valid_types = {"ecommerce", "lead_generation", "saas", "marketplace", "media", "otro"}
    if business_type.lower() not in valid_types:
        return {
            "error": f"Tipo de negocio inválido: '{business_type}'.",
            "valid_options": sorted(valid_types),
        }
    if not website_url or not website_url.startswith("http"):
        return {
            "error": "website_url inválida. Debe comenzar con 'http://' o 'https://'.",
        }
    # Normaliza key_conversions a list[str] y valida su estructura.
    if isinstance(key_conversions, str):
        normalized_conversions = [item.strip() for item in key_conversions.split(",") if item.strip()]
    elif isinstance(key_conversions, list):
        normalized_conversions = []
        for item in key_conversions:
            if not isinstance(item, str):
                return {
                    "error": "key_conversions debe contener solo strings.",
                }
            cleaned = item.strip()
            if cleaned:
                normalized_conversions.append(cleaned)
    else:
        return {
            "error": "key_conversions inválido. Debe ser list[str] o string separado por comas.",
        }

    if not normalized_conversions:
        return {
            "error": "key_conversions no puede estar vacío. Pide al consultor al menos 1 conversión clave.",
        }
    tool_context.state["business_type"] = business_type.lower()
    tool_context.state["website_url"] = website_url
    tool_context.state["key_conversions"] = normalized_conversions
    return {
        "business_type": business_type.lower(),
        "website_url": website_url,
        "key_conversions": normalized_conversions,
        "message": "Contexto del negocio guardado. Continúa con el siguiente paso de la conversación.",
    }


def set_audit_mode(mode: str, tool_context: ToolContext) -> dict:
    """
    Registra el modo de trabajo elegido por el consultor al inicio de la sesión.

    Args:
        mode: "auditoria" (solo diagnóstico, sin cambios) o
              "auditoria_implementacion" (diagnóstico + aplicar cambios confirmados)
    """
    valid_modes = {"auditoria", "auditoria_implementacion"}
    if mode.lower() not in valid_modes:
        return {
            "error": f"Modo inválido: '{mode}'. Opciones: 'auditoria' o 'auditoria_implementacion'.",
        }
    tool_context.state["audit_mode"] = mode.lower()
    label = "Solo auditoría" if mode.lower() == "auditoria" else "Auditoría + implementación"
    return {
        "audit_mode": mode.lower(),
        "message": f"Modo '{label}' registrado. Cierra este paso y anuncia el siguiente al consultor.",
    }


def save_ga4_findings(findings: str, tool_context: ToolContext) -> dict:
    """
    Guarda los hallazgos del GA4 Agent en session.state para que el GTM Agent
    los use en el gap analysis cruzado. Llama inmediatamente después de que
    ga4_tool devuelva su diagnóstico, antes de llamar gtm_tool.

    Args:
        findings: Respuesta completa del GA4 Agent con el diagnóstico de la propiedad
    """
    tool_context.state["ga4_findings"] = findings
    return {
        "saved": True,
        "message": "Hallazgos de Analytics guardados para el cruce con Tag Manager. Continúa con el diagnóstico GTM — no menciones este paso interno al consultor.",
    }


def save_ideal_spec(ideal_spec: dict, tool_context: ToolContext) -> dict:
    """
    Guarda el ideal_spec generado por web_analyzer_tool en el estado de sesión.
    Los agentes GA4 y GTM lo usarán como referencia para el gap analysis.

    Args:
        ideal_spec: Campo "ideal_spec" del JSON devuelto por web_analyzer_tool
    """
    tool_context.state["ideal_spec"] = ideal_spec
    return {
        "saved": True,
        "message": "Configuración ideal guardada. Continúa con el diagnóstico — no menciones este paso interno al consultor.",
    }
