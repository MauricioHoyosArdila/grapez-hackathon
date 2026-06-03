import os
import time

from google.adk.tools import ToolContext
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials


def build_credentials(tool_context: ToolContext) -> Credentials:
    """Construye credenciales OAuth y refresca si el token expiró o no hay info de expiración.

    En producción, el frontend pasa token_expiry en state y el token siempre llega fresco,
    por lo que needs_refresh es False y no hay llamada extra a Google.
    En local dev (.env sin token_expiry), refresca una vez y guarda la nueva expiración,
    evitando refreshes redundantes en tools subsiguientes del mismo turno.
    """
    creds = Credentials(
        token=tool_context.state.get("access_token"),
        refresh_token=tool_context.state.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ["GOOGLE_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
    )

    token_expiry = tool_context.state.get("token_expiry")  # Unix seconds
    needs_refresh = token_expiry is None or time.time() >= token_expiry - 60

    if needs_refresh:
        creds.refresh(Request())
        tool_context.state["access_token"] = creds.token
        if creds.expiry:
            tool_context.state["token_expiry"] = creds.expiry.timestamp()

    return creds


def sync_token(creds: Credentials, tool_context: ToolContext) -> None:
    """Sincroniza al state el token si la librería lo refrescó durante una llamada API.

    Evita que tools subsiguientes en el mismo turno hagan un refresh redundante.
    """
    if creds.token and creds.token != tool_context.state.get("access_token"):
        tool_context.state["access_token"] = creds.token
        if creds.expiry:
            tool_context.state["token_expiry"] = creds.expiry.timestamp()
