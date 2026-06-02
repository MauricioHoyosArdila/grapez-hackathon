import os
import httpx
import uvicorn
from mcp.server.fastmcp import FastMCP

mcp = FastMCP(
    "brave-search-mcp",
    instructions=(
        "Brave Search MCP server for Grapez Analytics Agents. "
        "Use brave_web_search to research client businesses before GA4/GTM diagnostics."
    ),
)


@mcp.tool()
async def brave_web_search(query: str) -> dict:
    """
    Search the web using Brave Search API.
    Use it to research the client's business: what they sell, their industry,
    key conversions, and online presence before running the analytics diagnostic.

    Args:
        query: Search query (e.g. "mitienda.com what does it sell products services")

    Returns:
        dict with 'results' list, each item having 'title', 'url', 'description'
    """
    api_key = os.environ.get("BRAVE_API_KEY", "")
    if not api_key:
        return {
            "error": "BRAVE_API_KEY not configured in server environment.",
            "results": [],
        }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                "https://api.search.brave.com/res/v1/web/search",
                params={"q": query, "count": 5},
                headers={
                    "Accept": "application/json",
                    "Accept-Encoding": "gzip",
                    "X-Subscription-Token": api_key,
                },
            )
    except httpx.TimeoutException:
        return {"error": "Brave Search request timed out.", "results": []}
    except httpx.RequestError as exc:
        return {"error": f"Network error: {exc}", "results": []}

    if response.status_code == 429:
        return {
            "error": "Brave Search rate limit reached (2,000 req/month on free tier).",
            "results": [],
        }
    if response.status_code != 200:
        return {"error": f"Brave Search HTTP {response.status_code}.", "results": []}

    data = response.json()
    raw = data.get("web", {}).get("results", [])
    results = [
        {
            "title": r.get("title", ""),
            "url": r.get("url", ""),
            "description": r.get("description", ""),
        }
        for r in raw[:5]
    ]
    return {"query": query, "total_results": len(results), "results": results}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app = mcp.streamable_http_app()
    uvicorn.run(app, host="0.0.0.0", port=port)
