"""
Utilitários de varredura Git e leitura de arquivos fonte em memória.
"""

import subprocess
from pathlib import Path
from typing import List, Set, Dict
from . import REPO_ROOT, SRC_DIR, API_DIR

SUPPORTED_EXTENSIONS = [".ts", ".tsx", ".css", ".html", ".py"]


def get_changed_files(base_branch: str = "origin/main") -> List[Path]:
    """Obtém arquivos modificados ou adicionados no working tree ou no git diff."""
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
                if file_path.exists() and file_path.suffix in SUPPORTED_EXTENSIONS:
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
                    if p.exists() and p.suffix in SUPPORTED_EXTENSIONS:
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
