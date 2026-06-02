import os
import sys

# Agent Runtime ejecuta este archivo desde un subdirectorio dentro de /code/.
# Agregar el directorio de este archivo a sys.path para que `agents/` sea encontrado.
_here = os.path.dirname(os.path.abspath(__file__))
if _here not in sys.path:
    sys.path.insert(0, _here)

from agents.planner_agent.agent import root_agent
