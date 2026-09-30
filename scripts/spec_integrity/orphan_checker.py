"""
Verificação de componentes órfãos (arquivos .tsx criados sem consumo na árvore de renderização).
"""

import re
from pathlib import Path
from typing import List, Dict
from . import REPO_ROOT


def check_orphan_components(
    components_to_check: List[Path],
    all_sources: Dict[Path, str]
) -> List[str]:
    """
    Verifica se componentes TSX novos/modificados são consumidos em algum outro arquivo.
    Ignora átomos de UI compartilhados, App.tsx e main.tsx.
    """
    errors: List[str] = []

    for comp_path in components_to_check:
        path_str = str(comp_path).replace("\\", "/")
        if comp_path.suffix != ".tsx" or "src/components/" not in path_str:
            continue

        filename = comp_path.name
        if filename in ["App.tsx", "main.tsx"]:
            continue
        if "test" in comp_path.stem.lower() or "mock" in comp_path.stem.lower() or comp_path.stem == "index":
            continue

        stem = comp_path.stem
        importing_files = []

        for src_path, content in all_sources.items():
            if src_path == comp_path:
                continue

            if stem in content:
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
        elif len(importing_files) == 1 and importing_files[0].name == "index.ts":
            barrel_path = importing_files[0]
            is_consumed_from_barrel = any(
                f"<{stem}" in other_content or re.search(r"\b" + re.escape(stem) + r"\b", other_content)
                for other_src, other_content in all_sources.items()
                if other_src not in [comp_path, barrel_path]
            )
            if not is_consumed_from_barrel:
                rel_path = comp_path.relative_to(REPO_ROOT)
                errors.append(
                    f"Componente Sem Consumo Real: '{rel_path}' está no index.ts, "
                    f"mas nunca é renderizado em nenhuma tela, modal ou orquestrador!"
                )

    return errors
