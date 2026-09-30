#!/usr/bin/env python3
"""
CLI de triagem de backlog do Painel do Culto no Notion.
Filtra automaticamente tarefas na coluna 'Backlog' (inbox de novas solicitações).
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from notion.service import query_backlog_tasks, update_task_fields

def main():
    items = query_backlog_tasks()
    print(json.dumps(items, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
