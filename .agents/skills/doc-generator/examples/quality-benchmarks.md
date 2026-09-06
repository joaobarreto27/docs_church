# Benchmarks de Qualidade — Documentação Técnica

## Métricas Reais (das 10 fases da refatoração smart_finance_tracker)

| Fase | Linhas | Refs a linhas de código | Blocos de código | Critérios de aceite |
|------|--------|------------------------|------------------|-------------------|
| Fase 01 (Tipos/Utils) | 330 | 23 | 4 pares | 6 |
| Fase 02 (Camada de Dados) | 332 | 18 | 3 pares | 7 |
| Fase 03 (Decomposição UI) | 314 | 15 | 1 par | 7 |
| Fase 04 (Dashboard) | 413 | 12 | 6 blocos | 7 |
| Fase 05 (Tema) | 302 | 8 | 3 pares | 12 |
| Fase 06 (Segurança) | 331 | 6 | 3 blocos | — |
| Fase 07 (Cloud) | 406 | 5 | 4 blocos | — |
| Fase 08 (PDF) | 353 | 4 | 3 blocos | — |
| Fase 09 (Auth) | 475 | 8 | 5 blocos | — |
| Fase 10 (Docker) | 434 | 3 | 4 blocos | — |

### Médias

| Métrica | Mínimo | Média | Máximo |
|---------|--------|-------|--------|
| **Linhas** | 302 | 369 | 475 |
| **Refs a código** | 3 | 10 | 23 |
| **Blocos de código** | 1 | 3.6 | 6 |
| **Critérios de aceite** | 6 | 7.8 | 12 |

---

## Checklist de Qualidade Staff-Level

### Documento de Fase
- [ ] **300+ linhas** (documentos menores tendem a ser superficiais)
- [ ] **5+ referências a linhas** do código real (ex: "linhas 23-67 de actions.ts")
- [ ] **2+ pares Antes/Depois** com código real (não pseudo-código)
- [ ] **5+ critérios de aceite** específicos da fase
- [ ] **Interfaces TypeScript completas** para todos os novos tipos criados
- [ ] **Seção de anomalias** preenchida (mesmo que vazia com justificativa)
- [ ] **Impacto quantificado** na seção de Objetivo (linhas reduzidas, duplicações eliminadas)

### PRD
- [ ] **ROLE claramente definida** (persona + responsabilidade)
- [ ] **Restrição Crítica explícita** (regra inviolável)
- [ ] **Patterns obrigatórios listados** com contexto de quando aplicar
- [ ] **Passo a passo sequencial** (não ambíguo)
- [ ] **Template de saída definido** (o que cada entregável deve conter)

---

## Evolução de Qualidade (Lição Aprendida)

As fases 01-04 foram criadas com 300-413 linhas e alto nível de detalhe.
As fases 05-10 inicialmente tinham apenas 62-79 linhas (superficiais).
Após revisão e aprofundamento, todas alcançaram 300-475 linhas.

**Lição:** Sempre validar contra o benchmark de 300 linhas mínimas.
Se o documento ficou menor, provavelmente faltam:
- Referências a linhas específicas do código
- Interfaces TypeScript completas
- Blocos de código Antes/Depois detalhados
- Critérios de aceite específicos
