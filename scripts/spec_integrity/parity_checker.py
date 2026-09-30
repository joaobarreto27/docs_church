"""
Checagem de Paridade Multi-dispositivo e Papéis Litúrgicos (Regra 5 do AGENTS.md).
"""

from pathlib import Path
from typing import List
from . import REPO_ROOT


def check_liturgical_device_parity(changed_files: List[Path]) -> List[str]:
    """
    Verifica se alterações estruturais em blocos ou fluxos litúrgicos
    mantêm paridade entre os papéis: Púlpito (Pastor), Obreiro (Mobile) e Controlador (Mesa).
    """
    warnings: List[str] = []
    pastor_touched = []
    obreiro_touched = []
    controlador_touched = []

    for p in changed_files:
        path_str = str(p.relative_to(REPO_ROOT)).replace("\\", "/")
        if "src/components/pastor/" in path_str:
            pastor_touched.append(path_str)
        elif "src/components/obreiro/" in path_str:
            obreiro_touched.append(path_str)
        elif "src/components/controlador/" in path_str:
            controlador_touched.append(path_str)

    # Se um bloco litúrgico ou hook de estado global foi alterado, alertar sobre impacto nos papéis
    blocks_or_context_touched = [
        str(p.relative_to(REPO_ROOT)).replace("\\", "/")
        for p in changed_files
        if "src/context/" in str(p) or "src/types/" in str(p)
    ]

    if blocks_or_context_touched and not (pastor_touched or obreiro_touched or controlador_touched):
        warnings.append(
            f"Alerta de Paridade Litúrgica: Houve alterações em contratos/contexto "
            f"({len(blocks_or_context_touched)} arquivos), mas nenhuma visão especializada "
            f"(pastor, obreiro, controlador) foi ajustada. Certifique-se de validar os 3 papéis."
        )

    return warnings
