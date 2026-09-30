"""
Cliente HTTP e resolução de credenciais para a API do Notion.
Conforme /secure-architecture: Zero credenciais no código.
"""

import json
import os
import sys
import urllib.request
import urllib.error

def load_env_file(filepath):
    if not os.path.exists(filepath):
        return {}
    env_vars = {}
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            env_vars[key.strip()] = val.strip().strip('"').strip("'")
    return env_vars

def resolve_credentials():
    token = os.environ.get("NOTION_TOKEN")
    db_id = os.environ.get("NOTION_BACKLOG_DB_ID")

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    env_local = load_env_file(os.path.join(base_dir, ".env.local"))
    token = token or env_local.get("NOTION_TOKEN")
    db_id = db_id or env_local.get("NOTION_BACKLOG_DB_ID")

    if not token or not db_id:
        env_main = load_env_file(os.path.join(base_dir, ".env"))
        token = token or env_main.get("NOTION_TOKEN")
        db_id = db_id or env_main.get("NOTION_BACKLOG_DB_ID")

    if not token:
        mcp_cfg = os.path.expanduser("~/.gemini/config/mcp_config.json")
        if os.path.exists(mcp_cfg):
            try:
                with open(mcp_cfg, "r", encoding="utf-8") as mf:
                    token = json.load(mf).get("mcpServers", {}).get("notion", {}).get("env", {}).get("NOTION_TOKEN")
            except Exception:
                pass

    if not token or not db_id:
        print("ERRO: NOTION_TOKEN ou NOTION_BACKLOG_DB_ID não encontrados.", file=sys.stderr)
        sys.exit(1)

    return token, db_id

NOTION_TOKEN, DATABASE_ID = resolve_credentials()

HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

def notion_request(endpoint, method="GET", payload=None):
    url = f"https://api.notion.com/v1/{endpoint}"
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        print(f"Erro na requisição Notion [{method} {endpoint}]: {e.code} - {err_msg}", file=sys.stderr)
        return None
