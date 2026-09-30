#!/usr/bin/env python3
"""
CLI de sincronização do Notion para o Painel do Culto (A.D. Utinga).
Camada fina de apresentação CLI conectada a scripts.notion.service.
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from notion.service import (
    get_task_details,
    update_task_fields,
    create_task_or_subtask,
    sync_doc_file
)

def main():
    parser = argparse.ArgumentParser(description="Notion Sync Utility for Painel do Culto")
    parser.add_argument("--get-task", type=str, help="Busca detalhes da tarefa por PDC-X")
    parser.add_argument("--update-status", nargs=2, metavar=("PDC-X", "STATUS"), help="Atualiza status de uma tarefa")
    parser.add_argument("--update-task", type=str, metavar="PDC-X", help="Identificador da tarefa a ser atualizada")
    parser.add_argument("--title", type=str, help="Novo título")
    parser.add_argument("--desc", type=str, help="Nova descrição")
    parser.add_argument("--tipo", type=str, help="Novo tipo (Feature, Bug, Melhoria, Débito Técnico)")
    parser.add_argument("--modulo", type=str, help="Novo módulo litúrgico/técnico")
    parser.add_argument("--prioridade", type=str, help="Nova prioridade (Alta, Média, Baixa)")
    parser.add_argument("--status", type=str, help="Novo status")
    parser.add_argument("--append-body", type=str, help="Texto ou Markdown para anexar no corpo da página")
    parser.add_argument("--create-subtask", nargs=6, metavar=("PARENT_PDC", "TITLE", "TIPO", "PRIORIDADE", "MODULO", "DESC"), help="Cria subtarefa rápida")
    parser.add_argument("--sync-doc", type=str, help="Caminho do arquivo .md local a ser publicado no Notion")
    parser.add_argument("--parent", type=str, help="Identificador do pai (PDC-X) para --sync-doc")

    args = parser.parse_args()

    if args.get_task:
        res = get_task_details(args.get_task)
        print(json.dumps(res, indent=2, ensure_ascii=False))
        return

    if args.update_status:
        ident, status = args.update_status
        res = update_task_fields(ident, status=status)
        print(json.dumps(res, indent=2, ensure_ascii=False))
        return

    if args.update_task:
        res = update_task_fields(
            args.update_task,
            title=args.title,
            status=args.status,
            tipo=args.tipo,
            modulo=args.modulo,
            prioridade=args.prioridade,
            desc=args.desc,
            append_body=args.append_body
        )
        print(json.dumps(res, indent=2, ensure_ascii=False))
        return

    if args.create_subtask:
        parent, title, tipo, prioridade, modulo, desc = args.create_subtask
        res = create_task_or_subtask(
            title=title,
            tipo=tipo,
            prioridade=prioridade,
            modulo=modulo,
            desc=desc,
            parent_ident=parent
        )
        print(json.dumps(res, indent=2, ensure_ascii=False))
        return

    if args.sync_doc:
        res = sync_doc_file(args.sync_doc, parent_ident=args.parent)
        print(json.dumps(res, indent=2, ensure_ascii=False))
        return

    parser.print_help()

if __name__ == "__main__":
    main()
