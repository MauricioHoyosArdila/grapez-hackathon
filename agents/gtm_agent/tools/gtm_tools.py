import os

from google.adk.tools import ToolContext
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import google.auth.exceptions


def _build_credentials(tool_context: ToolContext) -> Credentials:
    return Credentials(
        token=tool_context.state.get("access_token"),
        refresh_token=tool_context.state.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ["GOOGLE_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
    )


def _gtm_client(tool_context: ToolContext):
    return build("tagmanager", "v2", credentials=_build_credentials(tool_context))


# ── DIAGNÓSTICO (read) ────────────────────────────────────────────────────────

def list_accounts(tool_context: ToolContext) -> dict:
    """Lista todas las cuentas de Google Tag Manager accesibles con las credenciales del cliente."""
    try:
        service = _gtm_client(tool_context)
        response = service.accounts().list().execute()
        accounts = response.get("account", [])
        return {
            "accounts": [
                {
                    "id": a["accountId"],
                    "name": a["name"],
                    "resource_path": a["path"],
                }
                for a in accounts
            ]
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def list_containers(account_id: str, tool_context: ToolContext) -> dict:
    """
    Lista todos los contenedores GTM de una cuenta.

    Args:
        account_id: ID numérico de la cuenta GTM (ej: "123456")
    """
    try:
        service = _gtm_client(tool_context)
        parent = f"accounts/{account_id}"
        response = service.accounts().containers().list(parent=parent).execute()
        containers = response.get("container", [])
        return {
            "containers": [
                {
                    "id": c["containerId"],
                    "name": c["name"],
                    "public_id": c.get("publicId", ""),
                    "usage_context": c.get("usageContext", []),
                    "domain_name": c.get("domainName", []),
                    "resource_path": c["path"],
                }
                for c in containers
            ]
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def get_container(account_id: str, container_id: str, tool_context: ToolContext) -> dict:
    """
    Obtiene los detalles de un contenedor GTM específico.

    Args:
        account_id: ID numérico de la cuenta GTM
        container_id: ID numérico del contenedor
    """
    try:
        service = _gtm_client(tool_context)
        path = f"accounts/{account_id}/containers/{container_id}"
        c = service.accounts().containers().get(path=path).execute()
        return {
            "id": c["containerId"],
            "name": c["name"],
            "public_id": c.get("publicId", ""),
            "usage_context": c.get("usageContext", []),
            "domain_name": c.get("domainName", []),
            "fingerprint": c.get("fingerprint", ""),
            "resource_path": c["path"],
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def list_workspaces(account_id: str, container_id: str, tool_context: ToolContext) -> dict:
    """
    Lista todos los workspaces de un contenedor GTM.

    Args:
        account_id: ID numérico de la cuenta GTM
        container_id: ID numérico del contenedor
    """
    try:
        service = _gtm_client(tool_context)
        parent = f"accounts/{account_id}/containers/{container_id}"
        response = service.accounts().containers().workspaces().list(parent=parent).execute()
        workspaces = response.get("workspace", [])
        return {
            "workspaces": [
                {
                    "id": w["workspaceId"],
                    "name": w["name"],
                    "description": w.get("description", ""),
                    "fingerprint": w.get("fingerprint", ""),
                    "resource_path": w["path"],
                }
                for w in workspaces
            ]
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def list_tags(
    account_id: str, container_id: str, workspace_id: str, tool_context: ToolContext
) -> dict:
    """
    Lista todos los tags de un workspace GTM.

    Args:
        account_id: ID numérico de la cuenta GTM
        container_id: ID numérico del contenedor
        workspace_id: ID numérico del workspace
    """
    try:
        service = _gtm_client(tool_context)
        parent = f"accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}"
        response = service.accounts().containers().workspaces().tags().list(parent=parent).execute()
        tags = response.get("tag", [])
        return {
            "tags": [
                {
                    "id": t["tagId"],
                    "name": t["name"],
                    "type": t.get("type", ""),
                    "firing_trigger_ids": t.get("firingTriggerId", []),
                    "blocking_trigger_ids": t.get("blockingTriggerId", []),
                    "paused": t.get("paused", False),
                    "resource_path": t["path"],
                }
                for t in tags
            ],
            "total": len(tags),
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def list_triggers(
    account_id: str, container_id: str, workspace_id: str, tool_context: ToolContext
) -> dict:
    """
    Lista todos los triggers de un workspace GTM.

    Args:
        account_id: ID numérico de la cuenta GTM
        container_id: ID numérico del contenedor
        workspace_id: ID numérico del workspace
    """
    try:
        service = _gtm_client(tool_context)
        parent = f"accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}"
        response = (
            service.accounts().containers().workspaces().triggers().list(parent=parent).execute()
        )
        triggers = response.get("trigger", [])
        return {
            "triggers": [
                {
                    "id": t["triggerId"],
                    "name": t["name"],
                    "type": t.get("type", ""),
                    "resource_path": t["path"],
                }
                for t in triggers
            ],
            "total": len(triggers),
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def list_variables(
    account_id: str, container_id: str, workspace_id: str, tool_context: ToolContext
) -> dict:
    """
    Lista todas las variables de un workspace GTM.

    Args:
        account_id: ID numérico de la cuenta GTM
        container_id: ID numérico del contenedor
        workspace_id: ID numérico del workspace
    """
    try:
        service = _gtm_client(tool_context)
        parent = f"accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}"
        response = (
            service.accounts().containers().workspaces().variables().list(parent=parent).execute()
        )
        variables = response.get("variable", [])
        return {
            "variables": [
                {
                    "id": v["variableId"],
                    "name": v["name"],
                    "type": v.get("type", ""),
                    "resource_path": v["path"],
                }
                for v in variables
            ],
            "total": len(variables),
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def list_versions(account_id: str, container_id: str, tool_context: ToolContext) -> dict:
    """
    Lista los resúmenes de versiones publicadas de un contenedor GTM.

    Args:
        account_id: ID numérico de la cuenta GTM
        container_id: ID numérico del contenedor
    """
    try:
        service = _gtm_client(tool_context)
        parent = f"accounts/{account_id}/containers/{container_id}"
        response = (
            service.accounts()
            .containers()
            .version_headers()
            .list(parent=parent)
            .execute()
        )
        versions = response.get("containerVersionHeader", [])
        return {
            "versions": [
                {
                    "version_id": v["containerVersionId"],
                    "name": v.get("name", ""),
                    "deleted": v.get("deleted", False),
                    "num_tags": v.get("numTags", "0"),
                    "num_triggers": v.get("numTriggers", "0"),
                    "num_variables": v.get("numVariables", "0"),
                }
                for v in versions
            ],
            "total": len(versions),
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def get_container_version(
    account_id: str, container_id: str, version_id: str, tool_context: ToolContext
) -> dict:
    """
    Obtiene el detalle completo de una versión específica del contenedor.

    Args:
        account_id: ID numérico de la cuenta GTM
        container_id: ID numérico del contenedor
        version_id: ID numérico de la versión (o "live" para la versión publicada actual)
    """
    try:
        service = _gtm_client(tool_context)
        path = f"accounts/{account_id}/containers/{container_id}/versions/{version_id}"
        v = service.accounts().containers().versions().get(path=path).execute()
        return {
            "version_id": v.get("containerVersionId", ""),
            "name": v.get("name", ""),
            "description": v.get("description", ""),
            "deleted": v.get("deleted", False),
            "tag_count": len(v.get("tag", [])),
            "trigger_count": len(v.get("trigger", [])),
            "variable_count": len(v.get("variable", [])),
            "tags": [{"id": t["tagId"], "name": t["name"], "type": t.get("type", "")} for t in v.get("tag", [])],
            "triggers": [{"id": t["triggerId"], "name": t["name"], "type": t.get("type", "")} for t in v.get("trigger", [])],
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def get_workspace_status(
    account_id: str, container_id: str, workspace_id: str, tool_context: ToolContext
) -> dict:
    """
    Obtiene el estado del workspace: cambios pendientes vs la versión publicada.

    Args:
        account_id: ID numérico de la cuenta GTM
        container_id: ID numérico del contenedor
        workspace_id: ID numérico del workspace
    """
    try:
        service = _gtm_client(tool_context)
        path = f"accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}"
        status = (
            service.accounts().containers().workspaces().getStatus(path=path).execute()
        )
        changes = status.get("containerChange", [])
        return {
            "pending_changes": len(changes),
            "changes": [
                {
                    "entity_type": c.get("tag", c.get("trigger", c.get("variable", {}))).get("name", "unknown"),
                    "change_status": c.get("changeStatus", ""),
                }
                for c in changes
            ],
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


# ── IMPLEMENTACIÓN (write) ────────────────────────────────────────────────────

def create_workspace(
    account_id: str, container_id: str, name: str, description: str, tool_context: ToolContext
) -> dict:
    """
    Crea un nuevo workspace en un contenedor GTM.
    SIEMPRE crear un workspace nuevo antes de hacer cualquier cambio — nunca modificar Default Workspace.
    GUARDRAIL: Solo ejecutar después de confirmación explícita del consultor via confirm_action().

    Args:
        account_id: ID numérico de la cuenta GTM
        container_id: ID numérico del contenedor
        name: Nombre del workspace (ej: "Grapez — Configuración inicial")
        description: Descripción del propósito del workspace
    """
    if not tool_context.state.get("implementation_confirmed"):
        return {
            "blocked": True,
            "reason": "Operación de escritura bloqueada — requiere confirmación previa del consultor.",
            "instruction": "El Planner debe llamar confirm_action() después de que el consultor apruebe esta acción.",
        }
    tool_context.state["implementation_confirmed"] = False
    try:
        service = _gtm_client(tool_context)
        parent = f"accounts/{account_id}/containers/{container_id}"
        workspace = service.accounts().containers().workspaces().create(
            parent=parent,
            body={"name": name, "description": description},
        ).execute()
        return {
            "success": True,
            "workspace_id": workspace["workspaceId"],
            "name": workspace["name"],
            "resource_path": workspace["path"],
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def create_tag(
    account_id: str,
    container_id: str,
    workspace_id: str,
    name: str,
    tag_type: str,
    parameters: list,
    firing_trigger_ids: list,
    tool_context: ToolContext,
) -> dict:
    """
    Crea un tag en un workspace GTM.
    GUARDRAIL: Solo ejecutar después de confirmación explícita del consultor via confirm_action().

    Args:
        account_id: ID numérico de la cuenta GTM
        container_id: ID numérico del contenedor
        workspace_id: ID numérico del workspace (debe ser uno recién creado, no Default)
        name: Nombre del tag (ej: "GA4 — Configuración Base")
        tag_type: Tipo de tag GTM (ej: "gaawc" para GA4 Config, "gaawe" para GA4 Event)
        parameters: Lista de dicts con "type", "key", "value" para cada parámetro del tag
        firing_trigger_ids: Lista de IDs de triggers que disparan este tag
    """
    if not tool_context.state.get("implementation_confirmed"):
        return {
            "blocked": True,
            "reason": "Operación de escritura bloqueada — requiere confirmación previa del consultor.",
            "instruction": "El Planner debe llamar confirm_action() después de que el consultor apruebe esta acción.",
        }
    tool_context.state["implementation_confirmed"] = False
    try:
        service = _gtm_client(tool_context)
        parent = f"accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}"
        tag_body = {
            "name": name,
            "type": tag_type,
            "parameter": parameters,
            "firingTriggerId": firing_trigger_ids,
        }
        tag = (
            service.accounts()
            .containers()
            .workspaces()
            .tags()
            .create(parent=parent, body=tag_body)
            .execute()
        )
        return {
            "success": True,
            "tag_id": tag["tagId"],
            "name": tag["name"],
            "type": tag.get("type", ""),
            "resource_path": tag["path"],
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def create_trigger(
    account_id: str,
    container_id: str,
    workspace_id: str,
    name: str,
    trigger_type: str,
    filters: list,
    tool_context: ToolContext,
) -> dict:
    """
    Crea un trigger en un workspace GTM.
    GUARDRAIL: Solo ejecutar después de confirmación explícita del consultor via confirm_action().

    Args:
        account_id: ID numérico de la cuenta GTM
        container_id: ID numérico del contenedor
        workspace_id: ID numérico del workspace
        name: Nombre del trigger (ej: "Click — Botón Comprar")
        trigger_type: Tipo de trigger (ej: "CLICK", "PAGEVIEW", "CUSTOM_EVENT", "FORM_SUBMISSION")
        filters: Lista de condiciones. Cada condición es un dict con "type", "parameter":
                 [{"type": "CONTAINS", "parameter": [{"type": "TEMPLATE", "key": "{{Click Text}}", "value": "Comprar"}]}]
    """
    if not tool_context.state.get("implementation_confirmed"):
        return {
            "blocked": True,
            "reason": "Operación de escritura bloqueada — requiere confirmación previa del consultor.",
            "instruction": "El Planner debe llamar confirm_action() después de que el consultor apruebe esta acción.",
        }
    tool_context.state["implementation_confirmed"] = False
    try:
        service = _gtm_client(tool_context)
        parent = f"accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}"
        trigger_body = {
            "name": name,
            "type": trigger_type,
            "filter": filters,
        }
        trigger = (
            service.accounts()
            .containers()
            .workspaces()
            .triggers()
            .create(parent=parent, body=trigger_body)
            .execute()
        )
        return {
            "success": True,
            "trigger_id": trigger["triggerId"],
            "name": trigger["name"],
            "type": trigger.get("type", ""),
            "resource_path": trigger["path"],
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def create_variable(
    account_id: str,
    container_id: str,
    workspace_id: str,
    name: str,
    variable_type: str,
    parameters: list,
    tool_context: ToolContext,
) -> dict:
    """
    Crea una variable en un workspace GTM.
    GUARDRAIL: Solo ejecutar después de confirmación explícita del consultor via confirm_action().

    Args:
        account_id: ID numérico de la cuenta GTM
        container_id: ID numérico del contenedor
        workspace_id: ID numérico del workspace
        name: Nombre de la variable (ej: "DL — transaction_id")
        variable_type: Tipo de variable GTM (ej: "v" para Data Layer Variable, "c" para Constant)
        parameters: Lista de dicts "type"/"key"/"value".
                    Para DL variable: [{"type": "INTEGER", "key": "dataLayerVersion", "value": "2"},
                                       {"type": "TEMPLATE", "key": "name", "value": "ecommerce.transaction_id"}]
    """
    if not tool_context.state.get("implementation_confirmed"):
        return {
            "blocked": True,
            "reason": "Operación de escritura bloqueada — requiere confirmación previa del consultor.",
            "instruction": "El Planner debe llamar confirm_action() después de que el consultor apruebe esta acción.",
        }
    tool_context.state["implementation_confirmed"] = False
    try:
        service = _gtm_client(tool_context)
        parent = f"accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}"
        variable_body = {
            "name": name,
            "type": variable_type,
            "parameter": parameters,
        }
        variable = (
            service.accounts()
            .containers()
            .workspaces()
            .variables()
            .create(parent=parent, body=variable_body)
            .execute()
        )
        return {
            "success": True,
            "variable_id": variable["variableId"],
            "name": variable["name"],
            "type": variable.get("type", ""),
            "resource_path": variable["path"],
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def create_version(
    account_id: str,
    container_id: str,
    workspace_id: str,
    version_name: str,
    version_notes: str,
    tool_context: ToolContext,
) -> dict:
    """
    Crea una versión de borrador del workspace GTM para revisión.
    NUNCA usar publish_version directamente — siempre crear versión primero y esperar aprobación.
    GUARDRAIL: Solo ejecutar después de confirmación explícita del consultor via confirm_action().

    Args:
        account_id: ID numérico de la cuenta GTM
        container_id: ID numérico del contenedor
        workspace_id: ID numérico del workspace con los cambios
        version_name: Nombre descriptivo (ej: "Grapez — GA4 Config + Conversiones 2026-05-26")
        version_notes: Notas sobre los cambios incluidos en esta versión
    """
    if not tool_context.state.get("implementation_confirmed"):
        return {
            "blocked": True,
            "reason": "Operación de escritura bloqueada — requiere confirmación previa del consultor.",
            "instruction": "El Planner debe llamar confirm_action() después de que el consultor apruebe esta acción.",
        }
    tool_context.state["implementation_confirmed"] = False
    try:
        service = _gtm_client(tool_context)
        path = f"accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}"
        result = (
            service.accounts()
            .containers()
            .workspaces()
            .create_version(
                path=path,
                body={"name": version_name, "notes": version_notes},
            )
            .execute()
        )
        version = result.get("containerVersion", {})
        return {
            "success": True,
            "version_id": version.get("containerVersionId", ""),
            "name": version.get("name", ""),
            "tag_count": len(version.get("tag", [])),
            "trigger_count": len(version.get("trigger", [])),
            "variable_count": len(version.get("variable", [])),
            "sync_status": result.get("syncStatus", {}),
            "message": "Versión creada como borrador. Revisar antes de publicar.",
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def publish_version(
    account_id: str,
    container_id: str,
    version_id: str,
    tool_context: ToolContext,
) -> dict:
    """
    Publica una versión de borrador del contenedor GTM en producción.
    SOLO usar después de que el consultor haya revisado la versión en la UI de GTM y aprobado explícitamente.
    GUARDRAIL: Solo ejecutar después de confirmación explícita del consultor via confirm_action().
    ADVERTENCIA: Esta acción es inmediata y afecta el sitio en producción.

    Args:
        account_id: ID numérico de la cuenta GTM
        container_id: ID numérico del contenedor
        version_id: ID de la versión a publicar (obtenida con create_version)
    """
    if not tool_context.state.get("implementation_confirmed"):
        return {
            "blocked": True,
            "reason": "Publicación bloqueada — requiere confirmación explícita del consultor.",
            "instruction": "El Planner debe llamar confirm_action() después de que el consultor confirme que revisó la versión en la UI de GTM y aprueba publicarla en producción.",
        }
    tool_context.state["implementation_confirmed"] = False
    try:
        service = _gtm_client(tool_context)
        path = f"accounts/{account_id}/containers/{container_id}/versions/{version_id}"
        result = service.accounts().containers().versions().publish(path=path).execute()
        version = result.get("containerVersion", {})
        return {
            "success": True,
            "published_version_id": version.get("containerVersionId", ""),
            "name": version.get("name", ""),
            "compile_error": result.get("compileError", False),
            "message": f"Versión {version_id} publicada exitosamente en el contenedor.",
        }
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}
