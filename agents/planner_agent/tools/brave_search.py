import os
import httpx
from google.adk.tools import ToolContext


def _get_identity_token(audience: str) -> str | None:
    """
    Obtiene un Google OIDC identity token para autenticar Cloud Run.
    Usa google-auth que funciona en Agent Runtime, Cloud Run y desarrollo local con ADC.
    """
    try:
        import google.auth.transport.requests
        import google.oauth2.id_token

        auth_req = google.auth.transport.requests.Request()
        return google.oauth2.id_token.fetch_id_token(auth_req, audience)
    except Exception:
        pass
    return None


async def _call_via_mcp(query: str, mcp_url: str) -> dict:
    """Abre una conexión MCP fresca por request via Streamable HTTP."""
    from mcp import ClientSession
    from mcp.client.streamable_http import streamablehttp_client

    # Audience = base URL sin el path /mcp
    audience = mcp_url.split("/mcp")[0].rstrip("/")
    token = _get_identity_token(audience)
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    async with streamablehttp_client(mcp_url, headers=headers) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool("brave_web_search", {"query": query})
            if result.content:
                import json as _json
                text = getattr(result.content[0], "text", str(result.content[0]))
                try:
                    return _json.loads(text)
                except Exception:
                    return {"results": [], "raw": text}
            return {"results": []}


def _call_direct(query: str) -> dict:
    """Fallback: HTTP directo a Brave API. Solo para desarrollo local sin MCP server."""
    api_key = os.environ.get("BRAVE_API_KEY", "")
    if not api_key:
        return {
            "error": "BRAVE_API_KEY no configurada.",
            "results": [],
            "fallback": "Pide al consultor que describa el negocio manualmente.",
        }
    try:
        response = httpx.get(
            "https://api.search.brave.com/res/v1/web/search",
            params={"q": query, "count": 5},
            headers={
                "Accept": "application/json",
                "Accept-Encoding": "gzip",
                "X-Subscription-Token": api_key,
            },
            timeout=10,
        )
    except httpx.TimeoutException:
        return {"error": "Timeout al conectar con Brave Search.", "results": []}
    except httpx.RequestError as exc:
        return {"error": f"Error de red: {exc}", "results": []}

    if response.status_code == 429:
        return {"error": "Límite de Brave Search alcanzado.", "results": []}
    if response.status_code != 200:
        return {"error": f"Brave Search HTTP {response.status_code}.", "results": []}

    raw = response.json().get("web", {}).get("results", [])
    return {
        "query": query,
        "results": [
            {"title": r.get("title", ""), "url": r.get("url", ""), "description": r.get("description", "")}
            for r in raw[:5]
        ],
    }


def _run_mcp_in_thread(query: str, mcp_url: str) -> dict:
    """
    Runs the async MCP call in a fresh event loop inside a thread pool worker.
    This isolates streamablehttp_client's anyio.TaskGroup from ADK's own event loop,
    avoiding the 'unhandled errors in a TaskGroup' conflict.
    """
    import asyncio
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(_call_via_mcp(query, mcp_url))
    finally:
        loop.close()


async def brave_web_search(query: str, tool_context: ToolContext) -> dict:
    """
    Busca información del negocio del cliente usando Brave Search.
    En producción (Agent Runtime) conecta via protocolo MCP con autenticación Google.
    En desarrollo local usa HTTP directo a Brave API como fallback.

    Úsala para investigar el dominio del cliente antes del diagnóstico:
    tipo de empresa, productos o servicios, sector, presencia online.

    Args:
        query: Consulta de búsqueda (ej: "mitienda.com qué vende productos servicios")
    """
    mcp_url = os.environ.get("BRAVE_MCP_URL", "")

    if mcp_url:
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, _run_mcp_in_thread, query, mcp_url)
            return result
        except Exception as exc:
            fallback = _call_direct(query)
            fallback["mcp_error"] = f"{type(exc).__name__}: {exc}"
            return fallback

    return _call_direct(query)
