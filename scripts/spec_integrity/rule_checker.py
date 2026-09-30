"""
Validação das Regras Invioláveis do AGENTS.md (Linhas, Segurança Neon, KitKat).
"""

import re
from pathlib import Path
from typing import List, Tuple
from . import REPO_ROOT

LEGACY_ALLOWLIST = {
    "src/components/common/InteractiveLineSheet.tsx",
    "api/room.ts"
}


def check_repository_rules(files_to_check: List[Path], is_full_scan: bool = False) -> Tuple[List[str], List[str]]:
    """Valida limites de linhas, fronteira serverless e compatibilidade KitKat."""
    errors: List[str] = []
    warnings: List[str] = []

    for p in files_to_check:
        path_str = str(p).replace("\\", "/")
        rel_path = str(p.relative_to(REPO_ROOT)).replace("\\", "/")

        try:
            content = p.read_text(encoding="utf-8")
        except Exception:
            continue

        num_lines = len(content.splitlines())

        # 1. Limite Estrito de Linhas (Regra 1 do AGENTS.md: .ts, .tsx, .py)
        if p.suffix in [".ts", ".tsx", ".py"]:
            if rel_path in LEGACY_ALLOWLIST:
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

        # 4. Proibição de Ícones Sparkles / Estrelas de IA (Zero Sparkles)
        if "src/" in path_str and re.search(r"\bSparkles\b", content):
            if "Proibição" not in content and "Zero Sparkles" not in content:
                errors.append(
                    f"Violação de Diretriz Litúrgica (Regra 5): Ícone proibido 'Sparkles' detectado em '{rel_path}'. "
                    f"Utilize ícones solenes e sóbrios alinhados à identidade eclesiástica da A.D. Utinga."
                )

    return errors, warnings
