"""
Executores de validação do TypeScript, build de produção e varredura de bundle.
"""

import subprocess
from . import REPO_ROOT, DIST_DIR
from .colors import log_header, log_success, log_error


def run_typescript_check() -> bool:
    """Executa checagem de tipos estritos com TypeScript."""
    log_header("Validação de Tipos TypeScript (npx tsc --noEmit)")
    res = subprocess.run(["npx", "tsc", "--noEmit"], cwd=REPO_ROOT)
    if res.returncode != 0:
        log_error("Falha no TypeScript ('npx tsc --noEmit')! Corrija os erros de tipagem.")
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
