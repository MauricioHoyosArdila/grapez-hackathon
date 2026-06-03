from google.adk.tools import ToolContext
from googleapiclient.discovery import build
import google.auth.exceptions

from agents.shared.token_utils import build_credentials, sync_token


# ── DIAGNÓSTICO (read) ────────────────────────────────────────────────────────

def list_accounts(tool_context: ToolContext) -> dict:
    """Lista todas las cuentas de Google Tag Manager accesibles con las credenciales del cliente."""
    try:
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
        response = service.accounts().list().execute()
        sync_token(creds, tool_context)
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
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
        parent = f"accounts/{account_id}"
        response = service.accounts().containers().list(parent=parent).execute()
        sync_token(creds, tool_context)
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
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
        path = f"accounts/{account_id}/containers/{container_id}"
        c = service.accounts().containers().get(path=path).execute()
        sync_token(creds, tool_context)
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
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
        parent = f"accounts/{account_id}/containers/{container_id}"
        response = service.accounts().containers().workspaces().list(parent=parent).execute()
        sync_token(creds, tool_context)
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
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
        parent = f"accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}"
        response = service.accounts().containers().workspaces().tags().list(parent=parent).execute()
        sync_token(creds, tool_context)
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
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
        parent = f"accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}"
        response = (
            service.accounts().containers().workspaces().triggers().list(parent=parent).execute()
        )
        sync_token(creds, tool_context)
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
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
        parent = f"accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}"
        response = (
            service.accounts().containers().workspaces().variables().list(parent=parent).execute()
        )
        sync_token(creds, tool_context)
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
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
        parent = f"accounts/{account_id}/containers/{container_id}"
        response = (
            service.accounts()
            .containers()
            .version_headers()
            .list(parent=parent)
            .execute()
        )
        sync_token(creds, tool_context)
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
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
        path = f"accounts/{account_id}/containers/{container_id}/versions/{version_id}"
        v = service.accounts().containers().versions().get(path=path).execute()
        sync_token(creds, tool_context)
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
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
        path = f"accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}"
        status = (
            service.accounts().containers().workspaces().getStatus(path=path).execute()
        )
        sync_token(creds, tool_context)
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
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
        parent = f"accounts/{account_id}/containers/{container_id}"
        workspace = service.accounts().containers().workspaces().create(
            parent=parent,
            body={"name": name, "description": description},
        ).execute()
        sync_token(creds, tool_context)
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
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
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
        sync_token(creds, tool_context)
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
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
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
        sync_token(creds, tool_context)
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
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
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
        sync_token(creds, tool_context)
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
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
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
        sync_token(creds, tool_context)
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


def rename_gtm_tag(
    account_id: str,
    container_id: str,
    workspace_id: str,
    tag_id: str,
    new_name: str,
    tool_context: ToolContext,
) -> dict:
    """
    Renombra un tag existente en un workspace GTM.
    Usar para marcar elementos mejorados con el prefijo '⚠️ MEJORADO — '.
    GUARDRAIL: Solo ejecutar después de confirmación explícita del consultor via confirm_action().

    Args:
        account_id: ID numérico de la cuenta GTM
        container_id: ID numérico del contenedor
        workspace_id: ID numérico del workspace
        tag_id: ID numérico del tag a renombrar
        new_name: Nuevo nombre (ej: "⚠️ MEJORADO — GA4 Configuración Base")
    """
    if not tool_context.state.get("implementation_confirmed"):
        return {
            "blocked": True,
            "reason": "Operación de escritura bloqueada — requiere confirmación previa del consultor.",
            "instruction": "El Planner debe llamar confirm_action() después de que el consultor apruebe esta acción.",
        }
    tool_context.state["implementation_confirmed"] = False
    try:
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
        path = f"accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}/tags/{tag_id}"
        tag = service.accounts().containers().workspaces().tags().get(path=path).execute()
        tag["name"] = new_name
        updated = service.accounts().containers().workspaces().tags().update(
            path=path, body=tag
        ).execute()
        sync_token(creds, tool_context)
        return {"success": True, "tag_id": tag_id, "new_name": updated["name"]}
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def rename_gtm_trigger(
    account_id: str,
    container_id: str,
    workspace_id: str,
    trigger_id: str,
    new_name: str,
    tool_context: ToolContext,
) -> dict:
    """
    Renombra un trigger existente en un workspace GTM.
    Usar para marcar triggers obsoletos con el prefijo '⚠️ MEJORADO — '.
    GUARDRAIL: Solo ejecutar después de confirmación explícita del consultor via confirm_action().

    Args:
        account_id: ID numérico de la cuenta GTM
        container_id: ID numérico del contenedor
        workspace_id: ID numérico del workspace
        trigger_id: ID numérico del trigger a renombrar
        new_name: Nuevo nombre (ej: "⚠️ MEJORADO — Click Botón Comprar")
    """
    if not tool_context.state.get("implementation_confirmed"):
        return {
            "blocked": True,
            "reason": "Operación de escritura bloqueada — requiere confirmación previa del consultor.",
            "instruction": "El Planner debe llamar confirm_action() después de que el consultor apruebe esta acción.",
        }
    tool_context.state["implementation_confirmed"] = False
    try:
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
        path = f"accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}/triggers/{trigger_id}"
        trigger = service.accounts().containers().workspaces().triggers().get(path=path).execute()
        trigger["name"] = new_name
        updated = service.accounts().containers().workspaces().triggers().update(
            path=path, body=trigger
        ).execute()
        sync_token(creds, tool_context)
        return {"success": True, "trigger_id": trigger_id, "new_name": updated["name"]}
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def rename_gtm_variable(
    account_id: str,
    container_id: str,
    workspace_id: str,
    variable_id: str,
    new_name: str,
    tool_context: ToolContext,
) -> dict:
    """
    Renombra una variable existente en un workspace GTM.
    Usar para marcar variables obsoletas con el prefijo '⚠️ MEJORADO — '.
    GUARDRAIL: Solo ejecutar después de confirmación explícita del consultor via confirm_action().

    Args:
        account_id: ID numérico de la cuenta GTM
        container_id: ID numérico del contenedor
        workspace_id: ID numérico del workspace
        variable_id: ID numérico de la variable a renombrar
        new_name: Nuevo nombre (ej: "⚠️ MEJORADO — DL transaction_id")
    """
    if not tool_context.state.get("implementation_confirmed"):
        return {
            "blocked": True,
            "reason": "Operación de escritura bloqueada — requiere confirmación previa del consultor.",
            "instruction": "El Planner debe llamar confirm_action() después de que el consultor apruebe esta acción.",
        }
    tool_context.state["implementation_confirmed"] = False
    try:
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
        path = f"accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}/variables/{variable_id}"
        variable = service.accounts().containers().workspaces().variables().get(path=path).execute()
        variable["name"] = new_name
        updated = service.accounts().containers().workspaces().variables().update(
            path=path, body=variable
        ).execute()
        sync_token(creds, tool_context)
        return {"success": True, "variable_id": variable_id, "new_name": updated["name"]}
    except google.auth.exceptions.RefreshError:
        return {"error": "Tokens OAuth expirados. El cliente debe reconectar su cuenta Google."}
    except Exception as e:
        return {"error": str(e)}


def pause_gtm_tag(
    account_id: str,
    container_id: str,
    workspace_id: str,
    tag_id: str,
    tool_context: ToolContext,
) -> dict:
    """
    Pausa un tag en un workspace GTM para que deje de dispararse.
    Usar para desactivar tags marcados como '⚠️ MEJORADO' después de que el consultor lo autorice.
    GUARDRAIL: Solo ejecutar después de confirmación explícita del consultor via confirm_action().

    Args:
        account_id: ID numérico de la cuenta GTM
        container_id: ID numérico del contenedor
        workspace_id: ID numérico del workspace
        tag_id: ID numérico del tag a pausar
    """
    if not tool_context.state.get("implementation_confirmed"):
        return {
            "blocked": True,
            "reason": "Operación de escritura bloqueada — requiere confirmación previa del consultor.",
            "instruction": "El Planner debe llamar confirm_action() después de que el consultor apruebe esta acción.",
        }
    tool_context.state["implementation_confirmed"] = False
    try:
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
        path = f"accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}/tags/{tag_id}"
        tag = service.accounts().containers().workspaces().tags().get(path=path).execute()
        tag["paused"] = True
        updated = service.accounts().containers().workspaces().tags().update(
            path=path, body=tag
        ).execute()
        sync_token(creds, tool_context)
        return {
            "success": True,
            "tag_id": tag_id,
            "name": updated["name"],
            "paused": updated.get("paused", True),
            "message": "Tag pausado. Dejará de dispararse al publicar esta versión.",
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
        creds = build_credentials(tool_context)
        service = build("tagmanager", "v2", credentials=creds)
        path = f"accounts/{account_id}/containers/{container_id}/versions/{version_id}"
        result = service.accounts().containers().versions().publish(path=path).execute()
        sync_token(creds, tool_context)
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
