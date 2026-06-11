"""Modelo Gemini con reintento ante respuestas vacías.

Gemini 2.5 a veces devuelve una respuesta final sin texto ni function calls
(o solo con "thoughts" internos) justo después de un function response grande —
p. ej. cuando un AgentTool devuelve un diagnóstico extenso. ADK trata esa
respuesta vacía como fin de turno (is_final_response() == True) y la
conversación queda congelada esperando input del consultor.

Este wrapper detecta el intento vacío y reintenta la llamada al modelo hasta
_MAX_EMPTY_RETRIES veces. Las respuestas con contenido se streamean tal cual
(sin buffering), así que no afecta la latencia del SSE.
"""

import asyncio
import logging
from typing import AsyncGenerator

from google.adk.models.google_llm import Gemini
from google.adk.models.llm_request import LlmRequest
from google.adk.models.llm_response import LlmResponse
from google.genai import Client
from pydantic import PrivateAttr

logger = logging.getLogger(__name__)

_MAX_EMPTY_RETRIES = 2
_RETRY_DELAY_SECONDS = 3.0


def _has_substance(response: LlmResponse) -> bool:
    """True si la respuesta aporta algo al turno: texto visible, function call o error."""
    if response.error_code or response.error_message:
        return True  # los errores los maneja el flow de ADK — no reintentar aquí
    content = response.content
    if not content or not content.parts:
        return False
    for part in content.parts:
        if part.function_call:
            return True
        if part.text and not part.thought:
            return True
    return False


class RetryingGemini(Gemini):
    """Gemini que reintenta la llamada cuando el modelo devuelve un turno vacío."""

    # Clientes genai por event loop. Los agentes usan UNA instancia compartida de este
    # modelo (model=RetryingGemini(...)), pero Agent Engine corre cada query en un event
    # loop nuevo: el @cached_property api_client del Gemini base ata el cliente HTTP al
    # loop de la primera query y las siguientes mueren con "Event loop is closed".
    _clients_by_loop: dict = PrivateAttr(default_factory=dict)

    @property
    def api_client(self) -> Client:
        """Un cliente genai por event loop activo (reemplaza el cached_property del base)."""
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None
        client = self._clients_by_loop.get(loop)
        if client is None:
            # Purga clientes de loops ya cerrados antes de crear uno nuevo
            for dead in [l for l in self._clients_by_loop if l is not None and l.is_closed()]:
                del self._clients_by_loop[dead]
            client = Gemini.api_client.func(self)  # constructor original del Gemini base
            self._clients_by_loop[loop] = client
        return client

    async def generate_content_async(
        self, llm_request: LlmRequest, stream: bool = False
    ) -> AsyncGenerator[LlmResponse, None]:
        for attempt in range(_MAX_EMPTY_RETRIES + 1):
            produced_content = False
            # Respuestas sin contenido se retienen hasta saber si el intento
            # completo salió vacío (en ese caso se descartan y se reintenta).
            pending: list[LlmResponse] = []
            async for response in super().generate_content_async(llm_request, stream):
                if produced_content:
                    yield response
                    continue
                if _has_substance(response):
                    produced_content = True
                    for held in pending:
                        yield held
                    pending.clear()
                    yield response
                else:
                    pending.append(response)

            if produced_content:
                return
            if attempt < _MAX_EMPTY_RETRIES:
                logger.warning(
                    "Respuesta vacía del modelo (sin texto ni function calls). "
                    "Reintento %d/%d en %.0fs.",
                    attempt + 1,
                    _MAX_EMPTY_RETRIES,
                    _RETRY_DELAY_SECONDS,
                )
                await asyncio.sleep(_RETRY_DELAY_SECONDS)
            else:
                logger.error(
                    "Respuesta vacía tras %d reintentos — entregando la respuesta tal cual.",
                    _MAX_EMPTY_RETRIES,
                )
                for held in pending:
                    yield held
