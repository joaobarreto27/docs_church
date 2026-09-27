#!/usr/bin/env python3
"""
Script de Integridade e Conformidade de Especificação (Spec Integrity Verifier)
Painel do Culto (A.D. Utinga) — Diretrizes Invioláveis de Arquitetura

Verificações determinísticas executadas:
1. Componentes Órfãos (arquivos .tsx criados/modificados sem consumo na árvore de renderização)
2. Blindagem de Regras Invioláveis do AGENTS.md:
   - Limite de linhas por arquivo (alerta > 180, erro > 200 linhas)
   - Fronteira rígida de segurança serverless (zero @neondatabase/serverless ou pg em src/)
   - Compatibilidade estrita com Android 4.4.4 KitKat (zero oklch() em arquivos de estilo/TSX)
3. Validação de TypeScript (npx tsc --noEmit)
4. Build de Produção e Varredura Anti-Vazamento no Bundle (npm run build && grep dist/)

Uso:
  python3 scripts/verify-spec-integrity.py            # Valida arquivos modificados/adicionados no git diff
  python3 scripts/verify-spec-integrity.py --all      # Varredura completa no projeto
  python3 scripts/verify-spec-integrity.py --skip-build # Pula npm run build (verificação rápida)
  python3 scripts/verify-spec-integrity.py --skip-tsc   # Pula npx tsc --noEmit
"""

import os
import sys
import re
import argparse
import subprocess
from pathlib import Path
from typing import List, Set, Dict, Tuple

# Cores ANSI para saída no terminal
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = REPO_ROOT / "src"
API_DIR = REPO_ROOT / "api"
DIST_DIR = REPO_ROOT / "dist"

def log_header(title: str):
    print(f"\n{BOLD}{CYAN}=== {title} ==={RESET}")

def log_success(msg: str):
    print(f"  {GREEN}✅ {msg}{RESET}")

def log_warning(msg: str):
    print(f"  {YELLOW}⚠️  {msg}{RESET}")

def log_error(msg: str):
    print(f"  {RED}❌ {msg}{RESET}")


def get_changed_files(base_branch: str = "origin/main") -> List[Path]:
    """Obtém arquivos modificados ou adicionados no working tree ou em relação à branch base."""
    changed: Set[Path] = set()

    # 1. Arquivos no working tree (staged e unstaged)
    try:
        res = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=True
        )
        for line in res.stdout.splitlines():
            line = line.strip()
            if not line:
                continue
            parts = line.split(maxsplit=1)
            if len(parts) == 2:
                file_path = REPO_ROOT / parts[1]
                if file_path.exists() and file_path.suffix in [".ts", ".tsx", ".css", ".html"]:
                    changed.add(file_path)
    except Exception:
        pass

    # 2. Arquivos alterados em relação à branch base
    for ref in [base_branch, "main", "dev", "HEAD~1"]:
        try:
            res = subprocess.run(
                ["git", "diff", "--name-only", f"{ref}...HEAD"],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True
            )
            if res.returncode == 0 and res.stdout.strip():
                for line in res.stdout.splitlines():
                    p = REPO_ROOT / line.strip()
                    if p.exists() and p.suffix in [".ts", ".tsx", ".css", ".html"]:
                        changed.add(p)
                break
        except Exception:
            continue

    return sorted(list(changed))


def get_all_source_files() -> Dict[Path, str]:
    """Lê todos os arquivos TypeScript/TSX/CSS em src/ e api/ para busca em memória."""
    sources: Dict[Path, str] = {}
    for search_dir in [SRC_DIR, API_DIR]:
        if not search_dir.exists():
            continue
        for p in search_dir.glob("**/*"):
            if p.is_file() and p.suffix in [".ts", ".tsx", ".css"]:
                try:
                    sources[p] = p.read_text(encoding="utf-8")
                except Exception:
                    pass
    return sources


def check_orphan_components(
    components_to_check: List[Path],
    all_sources: Dict[Path, str]
) -> List[str]:
    """
    Verifica se componentes TSX novos/modificados são consumidos em algum outro arquivo.
    Ignora átomos de UI compartilhados (ex: src/components/common/ ou ui/), App.tsx e main.tsx.
    """
    errors: List[str] = []

    for comp_path in components_to_check:
        path_str = str(comp_path).replace("\\", "/")
        if comp_path.suffix != ".tsx":
            continue
        if "src/components/" not in path_str:
            continue

        filename = comp_path.name
        if filename in ["App.tsx", "main.tsx"]:
            continue
        if "test" in comp_path.stem.lower() or "mock" in comp_path.stem.lower():
            continue

        stem = comp_path.stem
        if stem == "index":
            continue

        # Verifica se o arquivo ou componente é importado em algum outro arquivo ativo do projeto
        importing_files = []

        for src_path, content in all_sources.items():
            if src_path == comp_path:
                continue

            if stem in content:
                # Confirma se é um import explícito ou renderização JSX do componente
                has_import = (
                    re.search(r"from\s+[\x27\x22][^\x27\x22]*" + re.escape(stem) + r"[\x27\x22]", content) or
                    re.search(r"import\s+.*?\b" + re.escape(stem) + r"\b.*?from", content, re.DOTALL) or
                    re.search(r"export\s+.*?\b" + re.escape(stem) + r"\b.*?from", content, re.DOTALL) or
                    f"<{stem}" in content
                )
                if has_import:
                    importing_files.append(src_path)

        if not importing_files:
            rel_path = comp_path.relative_to(REPO_ROOT)
            errors.append(
                f"Componente Órfão Detectado: '{rel_path}' foi criado/modificado, "
                f"mas NÃO é importado ou renderizado em nenhum outro arquivo ativo!"
            )
        else:
            # Se for apenas reexportado em um index.ts, verificar se o barrel é consumido
            only_in_barrel = len(importing_files) == 1 and importing_files[0].name == "index.ts"
            if only_in_barrel:
                barrel_path = importing_files[0]
                is_consumed_from_barrel = False
                for other_src, other_content in all_sources.items():
                    if other_src in [comp_path, barrel_path]:
                        continue
                    if f"<{stem}" in other_content or re.search(r"\b" + re.escape(stem) + r"\b", other_content):
                        is_consumed_from_barrel = True
                        break
                if not is_consumed_from_barrel:
                    rel_path = comp_path.relative_to(REPO_ROOT)
                    errors.append(
                        f"Componente Sem Consumo Real: '{rel_path}' está no index.ts, "
                        f"mas nunca é renderizado em nenhuma tela, modal ou orquestrador!"
                    )

    return errors


def check_repository_rules(files_to_check: List[Path], is_full_scan: bool = False) -> Tuple[List[str], List[str]]:
    """Valida limites de linhas, fronteira serverless e compatibilidade KitKat."""
    errors: List[str] = []
    warnings: List[str] = []

    # Lista de arquivos legados tolerados temporariamente na varredura global
    LEGACY_ALLOWLIST = {
        "src/components/common/InteractiveLineSheet.tsx",
        "api/room.ts"
    }

    for p in files_to_check:
        path_str = str(p).replace("\\", "/")
        rel_path = str(p.relative_to(REPO_ROOT)).replace("\\", "/")

        try:
            content = p.read_text(encoding="utf-8")
        except Exception:
            continue

        lines = content.splitlines()
        num_lines = len(lines)

        # 1. Limite Estrito de Linhas (Regra 1 do AGENTS.md)
        if p.suffix in [".ts", ".tsx"]:
            # Trata allowlist legado apenas em full scan
            if is_full_scan and rel_path in LEGACY_ALLOWLIST:
                warnings.append(
                    f"Débito Técnico Legado: '{rel_path}' possui {num_lines} linhas (deve ser decomposto conforme Regra 1)."
                )
            else:
                if num_lines > 200:
                    errors.append(
                        f"Bloqueio de Linhas (Regra 1): '{rel_path}' possui {num_lines} linhas "
                        f"(limite máximo absoluto é 200 linhas)!"
                    )
                elif num_lines > 180:
                    warnings.append(
                        f"Barreira de Complexidade (Regra 1): '{rel_path}' possui {num_lines} linhas "
                        f"(meta de excelência é 80-150 linhas; decomponha antes que ultrapasse 200)."
                    )

        # 2. Fronteira Serverless — Zero Secrets & Drivers no Client (Regra 4 do AGENTS.md)
        if "src/" in path_str and p.suffix in [".ts", ".tsx"]:
            if "@neondatabase/serverless" in content or re.search(r"from\s+[\x27\x22]pg[\x27\x22]", content):
                errors.append(
                    f"Violação de Segurança Severa (Regra 4): Driver de banco importado no Client em '{rel_path}'. "
                    f"Drivers e credenciais residem exclusivamente sob 'api/'."
                )

        # 3. Compatibilidade Android 4.4.4 KitKat (Regra 5 do AGENTS.md)
        if "src/" in path_str and p.suffix in [".ts", ".tsx", ".css", ".html"]:
            if "oklch(" in content:
                errors.append(
                    f"Incompatibilidade KitKat (Regra 5): Função CSS moderna 'oklch()' detectada em '{rel_path}'. "
                    f"O WebView clássico do tablet não suporta cores oklch. Use Hexadecimal ou RGB."
                )

    return errors, warnings


def run_typescript_check() -> bool:
    """Executa checagem de tipos estritos com TypeScript."""
    log_header("Validação de Tipos TypeScript (npx tsc --noEmit)")
    res = subprocess.run(["npx", "tsc", "--noEmit"], cwd=REPO_ROOT)
    if res.returncode != 0:
        log_error("Falha no TypeScript ('npx tsc --noEmit')! Corrija os erros de tipagem acima.")
        return False
    log_success("TypeScript compilou com sucesso (0 erros).")
    return True


def run_build_and_leak_check() -> bool:
    """Executa build de produção e varredura de credenciais no bundle."""
    log_header("Build de Produção e Varredura Anti-Vazamento no Bundle")
    print("  -> Executando 'npm run build'...")
    res = subprocess.run(["npm", "run", "build"], cwd=REPO_ROOT)
    if res.returncode != 0:
        log_error("Falha na compilação do bundle ('npm run build')!")
        return False
    log_success("Build de produção gerado com sucesso (dist/).")

    # Varredura anti-vazamento no bundle público dist/
    if DIST_DIR.exists():
        print("  -> Varrendo dist/ contra vazamento de credenciais e connection strings...")
        leak_errors = []
        for p in DIST_DIR.glob("**/*"):
            if p.is_file() and p.suffix in [".js", ".html"]:
                try:
                    c = p.read_text(encoding="utf-8", errors="ignore")
                    if "postgresql://" in c:
                        leak_errors.append(f"Vazamento detectado: 'postgresql://' encontrado em {p.name}")
                    if "npg_" in c:
                        leak_errors.append(f"Vazamento detectado: token 'npg_' encontrado em {p.name}")
                except Exception:
                    pass

        if leak_errors:
            for lerr in leak_errors:
                log_error(lerr)
            return False
        log_success("Bundle público 100% limpo (zero credenciais ou connection strings vazadas).")

    return True


def main():
    parser = argparse.ArgumentParser(description="Verificador de Integridade e Conformidade da Especificação — Painel do Culto")
    parser.add_argument("--all", action="store_true", help="Analisa todos os arquivos do projeto sob src/ e api/")
    parser.add_argument("--skip-build", action="store_true", help="Ignora a execução de build e varredura de bundle")
    parser.add_argument("--skip-tsc", action="store_true", help="Ignora a checagem de tipos do TypeScript")
    parser.add_argument("--branch", default="origin/main", help="Branch base para comparação de diff (padrão: origin/main)")
    args = parser.parse_args()

    print(f"\n{BOLD}{CYAN}🛡️  SPEC COMPLIANCE GUARDIAN — PAINEL DO CULTO (A.D. UTINGA){RESET}")
    print(f"Diretório raiz: {REPO_ROOT}\n")

    # 1. Coleta arquivos
    all_sources = get_all_source_files()

    if args.all:
        files_to_check = [p for p in all_sources.keys() if "src/components/" in str(p)]
        all_target_files = list(all_sources.keys())
        print(f"Modo: Varredura Completa ({len(all_target_files)} arquivos sob src/ e api/)")
    else:
        changed = get_changed_files(args.branch)
        if not changed:
            print("Nenhum arquivo modificado detectado no git diff. Alternando para varredura de componentes ativos.")
            files_to_check = [p for p in all_sources.keys() if "src/components/" in str(p)]
            all_target_files = list(all_sources.keys())
        else:
            files_to_check = [p for p in changed if "src/components/" in str(p)]
            all_target_files = changed
            print(f"Modo: Análise de Branch/Diff ({len(all_target_files)} arquivos alterados)")

    total_errors: List[str] = []
    total_warnings: List[str] = []

    # 2. Checagem de Componentes Órfãos
    log_header("1. Checagem de Componentes Órfãos (Unmounted Components)")
    orphan_errors = check_orphan_components(files_to_check, all_sources)
    if orphan_errors:
        for err in orphan_errors:
            log_error(err)
            total_errors.append(err)
    else:
        log_success(f"Nenhum componente órfão detectado ({len(files_to_check)} componentes analisados).")

    # 3. Checagem das Regras Invioláveis do AGENTS.md
    log_header("2. Checagem de Regras Invioláveis (Linhas, Segurança Neon, KitKat)")
    rule_errors, rule_warnings = check_repository_rules(all_target_files, is_full_scan=args.all)
    for err in rule_errors:
        log_error(err)
        total_errors.append(err)
    for warn in rule_warnings:
        log_warning(warn)
        total_warnings.append(warn)

    if not rule_errors:
        log_success("Todas as diretrizes invioláveis de código foram estritamente respeitadas.")

    # 4. Checagem de Tipos TypeScript
    if not args.skip_tsc:
        tsc_ok = run_typescript_check()
        if not tsc_ok:
            total_errors.append("Falha na checagem estrita de tipos TypeScript (npx tsc --noEmit).")

    # 5. Build e Varredura de Bundle
    if not args.skip_build:
        build_ok = run_build_and_leak_check()
        if not build_ok:
            total_errors.append("Falha no build de produção ou vazamento detectado no bundle dist/.")

    # Resumo Final
    print(f"\n{BOLD}{CYAN}=== RESUMO DO QUALITY GATE ==={RESET}")
    if total_errors:
        print(f"\n{BOLD}{RED}❌ QUALITY GATE REPROVADO COM {len(total_errors)} ERRO(S) BLOQUEANTE(S):{RESET}")
        for idx, err in enumerate(total_errors, 1):
            print(f"  {idx}. {err}")
        print(f"\n{YELLOW}O agente DEVE corrigir os pontos acima autonomamente no mesmo turno antes de concluir a tarefa.{RESET}\n")
        sys.exit(1)
    else:
        if total_warnings:
            print(f"{YELLOW}Avisos consultivos:{RESET}")
            for idx, warn in enumerate(total_warnings, 1):
                print(f"  {idx}. {warn}")
        print(f"\n{BOLD}{GREEN}✅ QUALITY GATE 100% APROVADO! Todos os critérios de conformidade atendidos.{RESET}\n")
        sys.exit(0)

if __name__ == "__main__":
    main()
