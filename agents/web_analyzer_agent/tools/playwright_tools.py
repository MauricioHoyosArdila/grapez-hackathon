import os
import httpx
from google.adk.tools import ToolContext

PLAYWRIGHT_SERVICE_URL = os.environ.get("PLAYWRIGHT_SERVICE_URL", "http://localhost:8080")


def screenshot_site(url: str, tool_context: ToolContext) -> dict:
    """Toma screenshot del sitio web y extrae todos los elementos interactivos (botones, forms, links).
    Usar cuando el consultor no conoce un CTA específico o quiere confirmar visualmente qué botones existen.
    Devuelve screenshot_url (URL pública de la imagen PNG) + interactive_elements (lista de botones/forms detectados).
    """
    try:
        resp = httpx.post(
            f"{PLAYWRIGHT_SERVICE_URL}/screenshot",
            json={"url": url},
            timeout=45.0,
        )
        resp.raise_for_status()
        return resp.json()
    except httpx.ConnectError:
        return {
            "error": "Playwright Service no disponible",
            "detail": f"No se pudo conectar a {PLAYWRIGHT_SERVICE_URL}. Verifica que el servicio esté desplegado.",
            "crawl_method": "error",
        }
    except Exception as e:
        return {
            "error": str(e),
            "crawl_method": "error",
        }


def crawl_site(url: str, tool_context: ToolContext) -> dict:
    """Navega el sitio web: home + páginas internas más relevantes (máx 6).
    Prioriza páginas con señales de conversión (formularios, CTAs, pricing, contacto).
    Devuelve site_map con título/URL/score/CTAs de cada página, y screenshots completos.
    Usar en la investigación previa (sub-paso 1a) para construir el mapa conceptual antes de hablar con el consultor.
    """
    try:
        resp = httpx.post(
            f"{PLAYWRIGHT_SERVICE_URL}/crawl_site",
            json={"url": url, "max_pages": 6},
            timeout=120.0,
        )
        resp.raise_for_status()
        return resp.json()
    except httpx.ConnectError:
        return {
            "error": "Playwright Service no disponible",
            "detail": f"No se pudo conectar a {PLAYWRIGHT_SERVICE_URL}.",
            "site_map": [],
            "pages": [],
            "crawl_method": "error",
        }
    except Exception as e:
        return {
            "error": str(e),
            "site_map": [],
            "pages": [],
            "crawl_method": "error",
        }


def analyze_site(url: str, business_type: str, key_conversions: str, tool_context: ToolContext) -> dict:
    """Analiza el sitio web completo: detecta GTM container ID, GA4 measurement ID, eventos del dataLayer, y errores de tracking.
    Usar para obtener el estado actual del tracking implementado en el sitio.
    Devuelve gtm_container_ids, ga4_measurement_ids, datalayer_events, crawl_method.
    """
    try:
        resp = httpx.post(
            f"{PLAYWRIGHT_SERVICE_URL}/analyze",
            json={"url": url, "business_type": business_type, "key_conversions": key_conversions},
            timeout=60.0,
        )
        resp.raise_for_status()
        return resp.json()
    except httpx.ConnectError:
        return {
            "error": "Playwright Service no disponible",
            "detail": f"No se pudo conectar a {PLAYWRIGHT_SERVICE_URL}. El Web Analyzer operará en modo inferencia.",
            "gtm_container_ids": [],
            "ga4_measurement_ids": [],
            "datalayer_events": [],
            "crawl_method": "error_fallback_inferido",
        }
    except Exception as e:
        return {
            "error": str(e),
            "gtm_container_ids": [],
            "ga4_measurement_ids": [],
            "datalayer_events": [],
            "crawl_method": "error_fallback_inferido",
        }
