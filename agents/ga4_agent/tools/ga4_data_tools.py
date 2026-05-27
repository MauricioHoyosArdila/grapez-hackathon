import os

from google.adk.tools import ToolContext
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Metric,
    OrderBy,
    RunReportRequest,
)
from google.oauth2.credentials import Credentials
import google.auth.exceptions


def _build_credentials(tool_context: ToolContext) -> Credentials:
    return Credentials(
        token=tool_context.state.get("access_token"),
        refresh_token=tool_context.state.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ["GOOGLE_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
    )


def _data_client(tool_context: ToolContext) -> BetaAnalyticsDataClient:
    return BetaAnalyticsDataClient(credentials=_build_credentials(tool_context))


def get_events_last_30_days(property_id: str, tool_context: ToolContext) -> dict:
    """
    Obtiene los principales eventos registrados en los últimos 30 días, ordenados por volumen.
    Útil para verificar qué eventos están llegando a GA4 y detectar eventos faltantes.

    Args:
        property_id: ID numérico de la propiedad GA4 (sin el prefijo 'properties/')
    """
    try:
        client = _data_client(tool_context)
        response = client.run_report(
            request=RunReportRequest(
                property=f"properties/{property_id}",
                date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
                dimensions=[Dimension(name="eventName")],
                metrics=[Metric(name="eventCount")],
                order_bys=[
                    OrderBy(
                        metric=OrderBy.MetricOrderBy(metric_name="eventCount"),
                        desc=True,
                    )
                ],
                limit=50,
            )
        )
        events = [
            {
                "event_name": row.dimension_values[0].value,
                "count": int(row.metric_values[0].value),
            }
            for row in response.rows
        ]
        return {
            "events": events,
            "total_distinct_events": len(events),
            "date_range": "últimos 30 días",
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def get_conversion_report(property_id: str, tool_context: ToolContext) -> dict:
    """
    Obtiene el reporte de conversiones de los últimos 30 días.
    Muestra qué eventos de conversión se están registrando y cuántos.

    Args:
        property_id: ID numérico de la propiedad GA4
    """
    try:
        client = _data_client(tool_context)
        response = client.run_report(
            request=RunReportRequest(
                property=f"properties/{property_id}",
                date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
                dimensions=[Dimension(name="eventName")],
                metrics=[
                    Metric(name="conversions"),
                    Metric(name="sessions"),
                    Metric(name="totalUsers"),
                ],
                order_bys=[
                    OrderBy(
                        metric=OrderBy.MetricOrderBy(metric_name="conversions"),
                        desc=True,
                    )
                ],
                limit=20,
            )
        )
        rows = [
            {
                "event_name": row.dimension_values[0].value,
                "conversions": int(row.metric_values[0].value),
                "sessions": int(row.metric_values[1].value),
                "total_users": int(row.metric_values[2].value),
            }
            for row in response.rows
        ]
        total_conversions = sum(r["conversions"] for r in rows)
        return {
            "rows": rows,
            "total_conversions_30d": total_conversions,
            "has_conversion_data": total_conversions > 0,
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def check_data_freshness(property_id: str, tool_context: ToolContext) -> dict:
    """
    Verifica si GA4 está recibiendo datos actualmente.
    Detecta si hay datos en los últimos 7 días y cuándo fue el último dato recibido.

    Args:
        property_id: ID numérico de la propiedad GA4
    """
    try:
        client = _data_client(tool_context)
        response = client.run_report(
            request=RunReportRequest(
                property=f"properties/{property_id}",
                date_ranges=[DateRange(start_date="7daysAgo", end_date="today")],
                dimensions=[Dimension(name="date")],
                metrics=[Metric(name="sessions")],
                order_bys=[
                    OrderBy(
                        dimension=OrderBy.DimensionOrderBy(dimension_name="date"),
                        desc=True,
                    )
                ],
                limit=7,
            )
        )
        if not response.rows:
            return {
                "has_data": False,
                "last_data_date": None,
                "sessions_last_7_days": 0,
                "status": "Sin datos en los últimos 7 días. Verificar que el tag de GA4 esté instalado correctamente.",
            }

        total_sessions = sum(int(row.metric_values[0].value) for row in response.rows)
        last_date = response.rows[0].dimension_values[0].value
        return {
            "has_data": True,
            "last_data_date": last_date,
            "sessions_last_7_days": total_sessions,
            "status": "Datos frescos — GA4 está recibiendo tráfico.",
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}
