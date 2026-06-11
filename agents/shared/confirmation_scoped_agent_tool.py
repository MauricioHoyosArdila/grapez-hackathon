"""AgentTool que consume la confirmación del consultor al terminar la invocación.

El diseño original consumía el flag implementation_confirmed en la PRIMERA write tool
ejecutada, pero una acción real de GTM/GA4 necesita varias escrituras encadenadas
(workspace → variables → triggers → tags → versión). Resultado: la primera escritura
pasaba y las siguientes salían bloqueadas dentro de la misma acción confirmada.

Con este wrapper, la confirmación cubre UNA invocación completa del sub-agente:
- Todas las escrituras de la acción confirmada pasan con una sola confirmación.
- El flag se consume SIEMPRE al terminar la invocación (haya escrito o no), así que
  la siguiente invocación requiere una confirmación nueva del Planner.

El guardrail de Python en cada write tool (verificar el flag antes de ejecutar) se
mantiene intacto — solo cambia QUIÉN consume el flag y CUÁNDO.
"""

from typing import Any

from google.adk.tools.agent_tool import AgentTool
from google.adk.tools.tool_context import ToolContext


class ConfirmationScopedAgentTool(AgentTool):
    """Una confirmación del consultor = una invocación completa del sub-agente."""

    async def run_async(self, *, args: dict[str, Any], tool_context: ToolContext) -> Any:
        try:
            return await super().run_async(args=args, tool_context=tool_context)
        finally:
            if tool_context.state.get("implementation_confirmed"):
                tool_context.state["implementation_confirmed"] = False
