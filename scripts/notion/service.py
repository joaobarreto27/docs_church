"""
Camada de serviços e regras de negócio para automação do Notion.
"""

import os
import re
from .client import DATABASE_ID, notion_request
from .markdown import markdown_to_blocks

ICONS_BY_TYPE = {"Feature": "🚀", "Bug": "🐛", "Melhoria": "⚡", "Débito Técnico": "🛠️"}

def find_task_by_identifier(ident_str):
    """Localiza uma tarefa pelo identificador PDC-X."""
    num_str = ident_str.upper().strip().replace("PDC-", "").replace("PDC", "")
    try:
        number = int(num_str)
    except ValueError:
        return None

    payload = {"filter": {"property": "Identificador", "unique_id": {"equals": number}}}
    res = notion_request(f"databases/{DATABASE_ID}/query", method="POST", payload=payload)
    results = res.get("results", []) if res else []
    return results[0] if results else None

def get_task_details(ident_str):
    page = find_task_by_identifier(ident_str)
    if not page:
        return {"error": f"Tarefa {ident_str} não encontrada no Notion."}

    props = page.get("properties", {})
    t_list = props.get("Nome", {}).get("title", [])
    title = t_list[0]["text"]["content"] if t_list else "Sem título"
    d_list = props.get("Descrição", {}).get("rich_text", [])
    desc = d_list[0]["text"]["content"] if d_list else ""
    status = props.get("Status", {}).get("status", {}).get("name", "Backlog")
    tipo = props.get("Tipo", {}).get("select", {}).get("name") if props.get("Tipo", {}).get("select") else None
    modulo = props.get("Módulo", {}).get("select", {}).get("name") if props.get("Módulo", {}).get("select") else None
    prioridade = props.get("Prioridade", {}).get("select", {}).get("name") if props.get("Prioridade", {}).get("select") else None

    res_blocks = notion_request(f"blocks/{page['id']}/children?page_size=100")
    blocks = res_blocks.get("results", []) if res_blocks else []
    images, text_content = [], []

    for b in blocks:
        b_type = b.get("type")
        if b_type == "image":
            img = b.get("image", {})
            url = img.get("file", {}).get("url") or img.get("external", {}).get("url")
            if url:
                images.append(url)
        elif b_type in ["paragraph", "heading_1", "heading_2", "heading_3", "to_do", "bulleted_list_item"]:
            for t in b.get(b_type, {}).get("rich_text", []):
                text_content.append(t.get("text", {}).get("content", ""))

    return {
        "id": page["id"], "ident": ident_str, "title": title, "status": status,
        "tipo": tipo, "modulo": modulo, "prioridade": prioridade, "desc": desc,
        "spec_body": "\n".join(text_content).strip(), "images": images, "url": page.get("url")
    }

def update_task_fields(ident_str, title=None, status=None, tipo=None, modulo=None, prioridade=None, desc=None, append_body=None):
    page = find_task_by_identifier(ident_str)
    if not page:
        return {"error": f"Tarefa {ident_str} não encontrada."}

    properties = {}
    if title: properties["Nome"] = {"title": [{"text": {"content": title}}]}
    if status: properties["Status"] = {"status": {"name": status}}
    if tipo: properties["Tipo"] = {"select": {"name": tipo}}
    if modulo: properties["Módulo"] = {"select": {"name": modulo}}
    if prioridade: properties["Prioridade"] = {"select": {"name": prioridade}}
    if desc: properties["Descrição"] = {"rich_text": [{"text": {"content": desc}}]}

    payload = {"properties": properties}
    if tipo and tipo in ICONS_BY_TYPE:
        payload["icon"] = {"type": "emoji", "emoji": ICONS_BY_TYPE[tipo]}

    notion_request(f"pages/{page['id']}", method="PATCH", payload=payload)
    if append_body:
        blocks = markdown_to_blocks(append_body)
        if blocks:
            notion_request(f"blocks/{page['id']}/children", method="PATCH", payload={"children": blocks})

    return {"success": True, "id": page["id"], "ident": ident_str}

def create_task_or_subtask(title, tipo="Feature", prioridade="Média", modulo="Púlpito (Pastor)", desc="", parent_ident=None, body_md=None):
    parent_id = None
    if parent_ident:
        p_page = find_task_by_identifier(parent_ident)
        if p_page: parent_id = p_page["id"]

    properties = {
        "Nome": {"title": [{"text": {"content": title}}]},
        "Status": {"status": {"name": "A Fazer" if parent_id else "Backlog"}},
        "Tipo": {"select": {"name": tipo}},
        "Prioridade": {"select": {"name": prioridade}},
        "Módulo": {"select": {"name": modulo}},
        "Origem": {"select": {"name": "Manual"}}
    }
    if desc: properties["Descrição"] = {"rich_text": [{"text": {"content": desc}}]}
    if parent_id: properties["Tarefa Pai"] = {"relation": [{"id": parent_id}]}

    payload = {
        "parent": {"database_id": DATABASE_ID},
        "icon": {"type": "emoji", "emoji": ICONS_BY_TYPE.get(tipo, "📋")},
        "properties": properties
    }
    if body_md: payload["children"] = markdown_to_blocks(body_md)

    res = notion_request("pages", method="POST", payload=payload)
    if res and "id" in res:
        ident_obj = res.get("properties", {}).get("Identificador", {}).get("unique_id", {})
        ident = f"{ident_obj.get('prefix', 'PDC')}-{ident_obj.get('number', '?')}"
        return {"success": True, "id": res["id"], "ident": ident, "title": title}
    return {"error": "Falha ao criar tarefa."}

def sync_doc_file(file_path, parent_ident=None):
    if not os.path.exists(file_path):
        return {"error": f"Arquivo {file_path} não encontrado."}
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    title = os.path.basename(file_path).replace(".md", "")
    for line in content.splitlines():
        if line.startswith("# "):
            title = line.replace("# ", "").strip()
            break

    match = re.search(r"PDC-\d+", title)
    target_ident = match.group(0) if match else None

    if target_ident:
        return update_task_fields(target_ident, title=title, append_body=content)
    return create_task_or_subtask(
        title=title, tipo="Melhoria", prioridade="Média", modulo="Púlpito (Pastor)",
        desc=f"Documento sincronizado de {file_path}", parent_ident=parent_ident, body_md=content
    )

def query_backlog_tasks():
    payload = {"filter": {"property": "Status", "status": {"equals": "Backlog"}}}
    res = notion_request(f"databases/{DATABASE_ID}/query", method="POST", payload=payload)
    results = res.get("results", []) if res else []
    items = []
    for p in results:
        t_list = p.get("properties", {}).get("Nome", {}).get("title", [])
        title = t_list[0]["text"]["content"] if t_list else "Sem título"
        ident = p.get("properties", {}).get("Identificador", {}).get("unique_id", {})
        items.append({"id": p["id"], "ident": f"{ident.get('prefix', 'PDC')}-{ident.get('number', '?')}", "title": title})
    return items
