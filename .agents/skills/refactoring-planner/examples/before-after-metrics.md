# Métricas Reais — Antes vs. Depois

Métricas reais do planejamento de refatoração do smart_finance_tracker.

---

## Métricas de Arquivos

### Antes (Monolito)

| Arquivo | Linhas | Funções | Componentes |
|---------|--------|---------|-------------|
| `src/app/page.tsx` | 6.641 | ~30 | 7 |
| `src/app/actions.ts` | 2.657 | 27 | — |
| `src/components/DashboardView.tsx` | 1.821 | ~15 | 1 |
| **Total** | **11.119** | **~72** | **8** |

### Depois (Modular)

| Módulo | Arquivos | Linhas/arquivo (média) | Total |
|--------|----------|----------------------|-------|
| `src/types/` | 4 | ~80 | ~320 |
| `src/lib/utils/` | 6 | ~40 | ~240 |
| `src/repositories/` | 6 | ~80 | ~480 |
| `src/parsers/` | 4 | ~50 | ~200 |
| `src/hooks/` | 5 | ~60 | ~300 |
| `src/app/actions/` | 6 | ~50 | ~300 |
| `src/components/views/` | 5 | ~600 | ~3.000 |
| `src/components/modals/` | 3 | ~150 | ~450 |
| `src/components/layout/` | 4 | ~80 | ~320 |
| `src/components/dashboard/` | 8 | ~200 | ~1.600 |
| `src/app/page.tsx` | 1 | ~150 | ~150 |
| **Total** | **~52** | **~130** | **~7.360** |

### Ganhos

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Maior arquivo | 6.641 linhas | ~600 linhas | **-91%** |
| `page.tsx` | 6.641 linhas | ~150 linhas | **-98%** |
| `actions.ts` | 2.657 linhas | Removido (6 arquivos) | **-100%** |
| Funções duplicadas | 3 | 0 | **-100%** |
| Linhas duplicadas | ~200 | 0 | **-100%** |
| Componentes por arquivo | Até 7 | 1 | **Normalizado** |

---

## Métricas de Duplicação

### Funções Duplicadas Eliminadas

| Função | Ocorrências antes | Depois |
|--------|-------------------|--------|
| `calculateBillingMonth` | 2 (actions.ts + page.tsx) | 1 (`src/lib/utils/billing.ts`) |
| `isValidDebtorsString` | 2 (actions.ts + page.tsx) | 1 (`src/lib/utils/validation.ts`) |
| `cleanTransactionTitle` | 2 (actions.ts + page.tsx) | 1 (`src/lib/utils/text.ts`) |

### Interfaces Centralizadas

| Interface | Definições inline antes | Depois |
|-----------|------------------------|--------|
| `ParsedTransaction` | 1 (actions.ts) | `src/types/transaction.ts` |
| `ImportViewProps` | 1 (page.tsx inline) | `src/types/ui.ts` |
| `MonthlyViewProps` | 1 (page.tsx inline) | `src/types/ui.ts` |
| `DashboardViewProps` | 1 (DashboardView.tsx) | `src/types/ui.ts` |
| **7+ interfaces** | **Espalhadas** | **1 arquivo** |

---

## Métricas de Documentação

| Métrica | Fases 01-04 (iniciais) | Fases 05-10 (pré-revisão) | Fases 05-10 (pós-revisão) |
|---------|----------------------|-------------------------|--------------------------|
| Linhas/fase | 300-413 | 62-79 | 302-475 |
| Refs a código | 12-23 | 3-5 | 3-8 |
| Blocos de código | 3-6 | 1-2 | 3-5 |
| **Qualidade** | **Staff-level** | **Superficial** | **Staff-level** |
