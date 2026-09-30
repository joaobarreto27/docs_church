#!/usr/bin/env python3
"""
Orquestrador CLI de Integridade e Conformidade de Especificação.
Painel do Culto (A.D. Utinga) — Diretrizes Invioláveis de Arquitetura.
"""

import sys
import argparse
from pathlib import Path
from typing import List

# Garante acesso ao pacote spec_integrity independente do diretório de chamada
sys.path.insert(0, str(Path(__file__).resolve().parent))

from spec_integrity import REPO_ROOT
from spec_integrity.colors import (
    GREEN, RED, YELLOW, CYAN, BOLD, RESET,
    log_header, log_success, log_error, log_warning
)
from spec_integrity.git_utils import get_changed_files, get_all_source_files
from spec_integrity.orphan_checker import check_orphan_components
from spec_integrity.parity_checker import check_liturgical_device_parity
from spec_integrity.rule_checker import check_repository_rules
from spec_integrity.runner import run_typescript_check, run_build_and_leak_check


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Verificador de Integridade e Conformidade da Especificação — Painel do Culto"
    )
    parser.add_argument("--all", action="store_true", help="Analisa todos os arquivos do projeto")
    parser.add_argument("--skip-build", action="store_true", help="Ignora a execução de build e varredura de bundle")
    parser.add_argument("--skip-tsc", action="store_true", help="Ignora a checagem de tipos do TypeScript")
    parser.add_argument("--branch", default="origin/main", help="Branch base para comparação de diff")
    return parser.parse_args()


def main():
    args = parse_arguments()
    print(f"\n{BOLD}{CYAN}🛡️  SPEC COMPLIANCE GUARDIAN — PAINEL DO CULTO (A.D. UTINGA){RESET}")
    print(f"Diretório raiz: {REPO_ROOT}\n")

    all_sources = get_all_source_files()

    if args.all:
        files_to_check = [p for p in all_sources.keys() if "src/components/" in str(p)]
        all_target_files = list(all_sources.keys())
        print(f"Modo: Varredura Completa ({len(all_target_files)} arquivos sob src/ e api/)")
    else:
        changed = get_changed_files(args.branch)
        if not changed:
            print("Nenhum arquivo modificado detectado no diff. Alternando para componentes ativos.")
            files_to_check = [p for p in all_sources.keys() if "src/components/" in str(p)]
            all_target_files = list(all_sources.keys())
        else:
            files_to_check = [p for p in changed if "src/components/" in str(p)]
            all_target_files = changed
            print(f"Modo: Análise de Branch/Diff ({len(all_target_files)} arquivos alterados)")

    total_errors: List[str] = []
    total_warnings: List[str] = []

    # 1. Componentes Órfãos
    log_header("1. Checagem de Componentes Órfãos (Unmounted Components)")
    orphan_errors = check_orphan_components(files_to_check, all_sources)
    for err in orphan_errors:
        log_error(err)
        total_errors.append(err)
    if not orphan_errors:
        log_success(f"Nenhum componente órfão detectado ({len(files_to_check)} componentes analisados).")

    # 2. Paridade Litúrgica e Multi-Dispositivo
    log_header("2. Checagem de Paridade Litúrgica & Multi-Dispositivo (Regra 5)")
    parity_warnings = check_liturgical_device_parity(all_target_files)
    for warn in parity_warnings:
        log_warning(warn)
        total_warnings.append(warn)
    if not parity_warnings:
        log_success("Paridade entre papéis (Pastor, Obreiro, Controlador) preservada.")

    # 3. Regras Invioláveis do AGENTS.md
    log_header("3. Checagem de Regras Invioláveis (Linhas, Segurança Neon, KitKat, Zero Sparkles)")
    rule_errors, rule_warnings = check_repository_rules(all_target_files, is_full_scan=args.all)
    for err in rule_errors:
        log_error(err)
        total_errors.append(err)
    for warn in rule_warnings:
        log_warning(warn)
        total_warnings.append(warn)
    if not rule_errors:
        log_success("Todas as diretrizes invioláveis de código foram estritamente respeitadas.")

    # 4. Tipagem TypeScript
    if not args.skip_tsc and not run_typescript_check():
        total_errors.append("Falha na checagem estrita de tipos TypeScript (npx tsc --noEmit).")

    # 5. Build e Varredura de Bundle
    if not args.skip_build and not run_build_and_leak_check():
        total_errors.append("Falha no build de produção ou vazamento detectado no bundle dist/.")

    # Resumo Final
    print(f"\n{BOLD}{CYAN}=== RESUMO DO QUALITY GATE ==={RESET}")
    if total_errors:
        print(f"\n{BOLD}{RED}❌ QUALITY GATE REPROVADO COM {len(total_errors)} ERRO(S) BLOQUEANTE(S):{RESET}")
        for idx, err in enumerate(total_errors, 1):
            print(f"  {idx}. {err}")
        print(f"\n{YELLOW}O agente DEVE corrigir os pontos acima autonomamente antes de concluir a tarefa.{RESET}\n")
        sys.exit(1)

    if total_warnings:
        print(f"{YELLOW}Avisos consultivos:{RESET}")
        for idx, warn in enumerate(total_warnings, 1):
            print(f"  {idx}. {warn}")
    print(f"\n{BOLD}{GREEN}✅ QUALITY GATE 100% APROVADO! Todos os critérios atendidos.{RESET}\n")
    sys.exit(0)


if __name__ == "__main__":
    main()
