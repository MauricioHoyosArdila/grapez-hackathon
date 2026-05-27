import os

from google.adk.tools import ToolContext
from google.analytics.admin import (
    AnalyticsAdminServiceClient,
    ConversionEvent,
    CustomDimension,
    DataRetentionSettings,
    ListPropertiesRequest,
)
from google.oauth2.credentials import Credentials
from google.protobuf import field_mask_pb2
import google.auth.exceptions


def _build_credentials(tool_context: ToolContext) -> Credentials:
    return Credentials(
        token=tool_context.state.get("access_token"),
        refresh_token=tool_context.state.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ["GOOGLE_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
    )


def _admin_client(tool_context: ToolContext) -> AnalyticsAdminServiceClient:
    return AnalyticsAdminServiceClient(credentials=_build_credentials(tool_context))


# ── DIAGNÓSTICO (read) ────────────────────────────────────────────────────────

def list_accounts(tool_context: ToolContext) -> dict:
    """Lista todas las cuentas de Google Analytics 4 accesibles con las credenciales del cliente."""
    try:
        client = _admin_client(tool_context)
        accounts = list(client.list_accounts())
        return {
            "accounts": [
                {
                    "id": a.name.split("/")[-1],
                    "display_name": a.display_name,
                    "resource_name": a.name,
                }
                for a in accounts
            ]
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def list_properties(account_id: str, tool_context: ToolContext) -> dict:
    """
    Lista todas las propiedades GA4 de una cuenta.

    Args:
        account_id: ID numérico de la cuenta GA4 (ej: "123456789")
    """
    try:
        client = _admin_client(tool_context)
        request = ListPropertiesRequest(filter=f"parent:accounts/{account_id}")
        properties = list(client.list_properties(request=request))
        return {
            "properties": [
                {
                    "id": p.name.split("/")[-1],
                    "display_name": p.display_name,
                    "resource_name": p.name,
                    "time_zone": p.time_zone,
                    "currency_code": p.currency_code,
                    "industry_category": str(p.industry_category).split(".")[-1],
                }
                for p in properties
            ]
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def get_property_details(property_id: str, tool_context: ToolContext) -> dict:
    """
    Obtiene los detalles completos de una propiedad GA4.

    Args:
        property_id: ID numérico de la propiedad (ej: "456789012")
    """
    try:
        client = _admin_client(tool_context)
        prop = client.get_property(name=f"properties/{property_id}")
        return {
            "id": property_id,
            "display_name": prop.display_name,
            "time_zone": prop.time_zone,
            "currency_code": prop.currency_code,
            "industry_category": str(prop.industry_category).split(".")[-1],
            "service_level": str(prop.service_level).split(".")[-1],
            "create_time": str(prop.create_time),
            "resource_name": prop.name,
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def list_data_streams(property_id: str, tool_context: ToolContext) -> dict:
    """
    Lista los streams de datos (web, iOS, Android) de una propiedad GA4.

    Args:
        property_id: ID numérico de la propiedad GA4
    """
    try:
        client = _admin_client(tool_context)
        streams = list(client.list_data_streams(parent=f"properties/{property_id}"))
        result = []
        for s in streams:
            stream_info = {
                "id": s.name.split("/")[-1],
                "display_name": s.display_name,
                "type": str(s.type_).split(".")[-1],
                "resource_name": s.name,
            }
            if s.web_stream_data and s.web_stream_data.measurement_id:
                stream_info["measurement_id"] = s.web_stream_data.measurement_id
                stream_info["default_uri"] = s.web_stream_data.default_uri
            result.append(stream_info)
        return {"streams": result}
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def check_enhanced_measurement(property_id: str, stream_id: str, tool_context: ToolContext) -> dict:
    """
    Verifica qué eventos de Enhanced Measurement están activos en un stream web.

    Args:
        property_id: ID numérico de la propiedad GA4
        stream_id: ID del stream web (obtenido con list_data_streams)
    """
    try:
        client = _admin_client(tool_context)
        settings = client.get_enhanced_measurement_settings(
            name=f"properties/{property_id}/dataStreams/{stream_id}/enhancedMeasurementSettings"
        )
        return {
            "stream_measurements_enabled": settings.stream_enabled,
            "page_changes_enabled": settings.page_changes_enabled,
            "scrolls_enabled": settings.scrolls_enabled,
            "outbound_clicks_enabled": settings.outbound_clicks_enabled,
            "site_search_enabled": settings.site_search_enabled,
            "video_engagement_enabled": settings.video_engagement_enabled,
            "file_downloads_enabled": settings.file_downloads_enabled,
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def list_conversions(property_id: str, tool_context: ToolContext) -> dict:
    """
    Lista todos los eventos marcados como conversión en una propiedad GA4.

    Args:
        property_id: ID numérico de la propiedad GA4
    """
    try:
        client = _admin_client(tool_context)
        conversions = list(client.list_conversion_events(parent=f"properties/{property_id}"))
        return {
            "conversions": [
                {
                    "event_name": c.event_name,
                    "resource_name": c.name,
                    "is_deletable": c.deletable,
                    "is_custom": c.custom,
                    "counting_method": str(c.counting_method).split(".")[-1],
                }
                for c in conversions
            ]
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def list_custom_dimensions(property_id: str, tool_context: ToolContext) -> dict:
    """
    Lista las dimensiones personalizadas definidas en una propiedad GA4.

    Args:
        property_id: ID numérico de la propiedad GA4
    """
    try:
        client = _admin_client(tool_context)
        dimensions = list(client.list_custom_dimensions(parent=f"properties/{property_id}"))
        return {
            "custom_dimensions": [
                {
                    "id": d.name.split("/")[-1],
                    "display_name": d.display_name,
                    "parameter_name": d.parameter_name,
                    "scope": str(d.scope).split(".")[-1],
                    "description": d.description,
                }
                for d in dimensions
            ]
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def list_custom_metrics(property_id: str, tool_context: ToolContext) -> dict:
    """
    Lista las métricas personalizadas definidas en una propiedad GA4.

    Args:
        property_id: ID numérico de la propiedad GA4
    """
    try:
        client = _admin_client(tool_context)
        metrics = list(client.list_custom_metrics(parent=f"properties/{property_id}"))
        return {
            "custom_metrics": [
                {
                    "id": m.name.split("/")[-1],
                    "display_name": m.display_name,
                    "parameter_name": m.parameter_name,
                    "scope": str(m.scope).split(".")[-1],
                    "description": m.description,
                    "measurement_unit": str(m.measurement_unit).split(".")[-1],
                }
                for m in metrics
            ]
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def list_audiences(property_id: str, tool_context: ToolContext) -> dict:
    """
    Lista las audiencias de remarketing configuradas en una propiedad GA4.

    Args:
        property_id: ID numérico de la propiedad GA4
    """
    try:
        client = _admin_client(tool_context)
        audiences = list(client.list_audiences(parent=f"properties/{property_id}"))
        return {
            "audiences": [
                {
                    "id": a.name.split("/")[-1],
                    "display_name": a.display_name,
                    "description": a.description,
                    "membership_duration_days": a.membership_duration_days,
                    "ads_personalization_enabled": a.ads_personalization_enabled,
                }
                for a in audiences
            ]
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def get_data_retention_settings(property_id: str, tool_context: ToolContext) -> dict:
    """
    Obtiene la configuración actual de retención de datos de una propiedad GA4.

    Args:
        property_id: ID numérico de la propiedad GA4
    """
    try:
        client = _admin_client(tool_context)
        settings = client.get_data_retention_settings(
            name=f"properties/{property_id}/dataRetentionSettings"
        )
        retention_str = str(settings.event_data_retention).split(".")[-1]
        months = 14 if "FOURTEEN" in retention_str else 2
        return {
            "event_data_retention": retention_str,
            "retention_months": months,
            "reset_user_data_on_new_activity": settings.reset_user_data_on_new_activity,
            "is_recommended": months == 14,
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


# ── IMPLEMENTACIÓN (write) ────────────────────────────────────────────────────

def create_conversion_event(property_id: str, event_name: str, tool_context: ToolContext) -> dict:
    """
    Marca un evento como conversión en una propiedad GA4.
    GUARDRAIL: Solo ejecutar después de confirmación explícita del consultor via confirm_action().

    Args:
        property_id: ID numérico de la propiedad GA4
        event_name: Nombre del evento a marcar como conversión (ej: "purchase", "lead_form_submit")
    """
    if not tool_context.state.get("implementation_confirmed"):
        return {
            "blocked": True,
            "reason": "Operación de escritura bloqueada — requiere confirmación previa del consultor.",
            "instruction": "El Planner debe llamar confirm_action() después de que el consultor apruebe esta acción.",
        }
    tool_context.state["implementation_confirmed"] = False
    try:
        client = _admin_client(tool_context)
        result = client.create_conversion_event(
            parent=f"properties/{property_id}",
            conversion_event=ConversionEvent(event_name=event_name),
        )
        return {
            "success": True,
            "event_name": result.event_name,
            "resource_name": result.name,
            "is_custom": result.custom,
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def create_custom_dimension(
    property_id: str,
    display_name: str,
    parameter_name: str,
    scope: str,
    description: str,
    tool_context: ToolContext,
) -> dict:
    """
    Crea una dimensión personalizada en una propiedad GA4.
    GUARDRAIL: Solo ejecutar después de confirmación explícita del consultor via confirm_action().

    Args:
        property_id: ID numérico de la propiedad GA4
        display_name: Nombre visible en reportes (ej: "ID de Usuario")
        parameter_name: Nombre del parámetro en el evento (ej: "user_id")
        scope: Alcance de la dimensión — "EVENT" o "USER"
        description: Descripción del uso de esta dimensión
    """
    if not tool_context.state.get("implementation_confirmed"):
        return {
            "blocked": True,
            "reason": "Operación de escritura bloqueada — requiere confirmación previa del consultor.",
            "instruction": "El Planner debe llamar confirm_action() después de que el consultor apruebe esta acción.",
        }
    tool_context.state["implementation_confirmed"] = False
    try:
        scope_enum = CustomDimension.DimensionScope[scope.upper()]
    except KeyError:
        return {"error": f"Scope inválido: '{scope}'. Usar 'EVENT' o 'USER'."}

    try:
        client = _admin_client(tool_context)
        result = client.create_custom_dimension(
            parent=f"properties/{property_id}",
            custom_dimension=CustomDimension(
                display_name=display_name,
                parameter_name=parameter_name,
                scope=scope_enum,
                description=description,
            ),
        )
        return {
            "success": True,
            "id": result.name.split("/")[-1],
            "display_name": result.display_name,
            "parameter_name": result.parameter_name,
            "scope": str(result.scope).split(".")[-1],
            "resource_name": result.name,
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def update_data_retention(property_id: str, months: int, tool_context: ToolContext) -> dict:
    """
    Actualiza el período de retención de datos de eventos en GA4.
    GUARDRAIL: Solo ejecutar después de confirmación explícita del consultor via confirm_action().

    Args:
        property_id: ID numérico de la propiedad GA4
        months: Meses de retención — 2 o 14 (Google Analytics recomienda 14)
    """
    if not tool_context.state.get("implementation_confirmed"):
        return {
            "blocked": True,
            "reason": "Operación de escritura bloqueada — requiere confirmación previa del consultor.",
            "instruction": "El Planner debe llamar confirm_action() después de que el consultor apruebe esta acción.",
        }
    tool_context.state["implementation_confirmed"] = False
    if months not in (2, 14):
        return {"error": "El período de retención debe ser 2 o 14 meses."}

    try:
        client = _admin_client(tool_context)
        retention_value = (
            DataRetentionSettings.RetentionDuration.TWO_MONTHS
            if months == 2
            else DataRetentionSettings.RetentionDuration.FOURTEEN_MONTHS
        )
        result = client.update_data_retention_settings(
            data_retention_settings=DataRetentionSettings(
                name=f"properties/{property_id}/dataRetentionSettings",
                event_data_retention=retention_value,
                reset_user_data_on_new_activity=True,
            ),
            update_mask=field_mask_pb2.FieldMask(
                paths=["event_data_retention", "reset_user_data_on_new_activity"]
            ),
        )
        return {
            "success": True,
            "retention_months": months,
            "resource_name": result.name,
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}
