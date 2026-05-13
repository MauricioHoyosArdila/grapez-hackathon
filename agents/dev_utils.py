"""
Utilidades de desarrollo local — NO usar en producción ni Agent Engine.
Permite probar agentes sin OAuth ni Firestore inyectando tokens desde .env.
"""
import os
from dotenv import load_dotenv
from google.adk.tools import ToolContext

load_dotenv()


def inject_local_tokens(tool_context: ToolContext) -> None:
    """Inyecta tokens de prueba desde .env en el estado de sesión del agente."""
    access_token = os.environ.get("TEST_ACCESS_TOKEN")
    refresh_token = os.environ.get("TEST_REFRESH_TOKEN")

    if not access_token or not refresh_token:
        raise ValueError(
            "TEST_ACCESS_TOKEN y TEST_REFRESH_TOKEN deben estar en .env. "
            "Pídele a Mauro que ejecute: python scripts/generate_test_tokens.py"
        )

    tool_context.state["access_token"] = access_token
    tool_context.state["refresh_token"] = refresh_token
    tool_context.state["client_id"] = "tiendademo"
    tool_context.state["dev_mode"] = True


def get_test_credentials():
    """Devuelve credenciales de prueba como objeto google.oauth2.credentials.Credentials."""
    from google.oauth2.credentials import Credentials

    load_dotenv()
    return Credentials(
        token=os.environ.get("TEST_ACCESS_TOKEN"),
        refresh_token=os.environ.get("TEST_REFRESH_TOKEN"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ.get("GOOGLE_CLIENT_ID"),
        client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
    )
