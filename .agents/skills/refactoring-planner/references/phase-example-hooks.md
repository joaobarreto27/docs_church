# Fase 04 (Resumo): Decomposição do DashboardView — Hooks e Sub-Componentes

## 1. Objetivo da Fase

Decompor `DashboardView.tsx` (1.821 linhas) em sub-componentes coesos, custom hooks para data fetching, e `useReducer` para gerenciamento de filtros.

**Impacto esperado:**
- `DashboardView.tsx` de 1.821 → ~200 linhas (orquestrador)
- 30+ states individuais → 1 `useReducer` + 3 custom hooks
- KPI cards, filtros, charts, debtors em componentes isolados

---

## 3. Padrões e Princípios Aplicados

- **State/Reducer Pattern:** `useReducer` para 8 filtros + search query
- **Custom Hooks:** `useDashboardData`, `useDebtors`, `useFutureCommitments`, `useDashboardFilters`
- **SRP:** Cada sub-componente = 1 seção visual
- **DRY:** Constants centralizadas (`COLORS`, `monthsList`, formatters)
- **Composição:** `DashboardView` compõe sub-componentes via props

---

## 4. Estrutura dos Custom Hooks

### `useDashboardFilters` (Reducer)

```typescript
type FilterState = {
  category: string[]; expenseType: string[]; bank: string[];
  paymentMethod: string[]; status: string[]; division: string[];
  reserva: string[]; paymentType: string[]; searchQuery: string;
};

type FilterAction =
  | { type: 'SET_FILTER'; field: keyof Omit<FilterState, 'searchQuery'>; value: string[] }
  | { type: 'SET_SEARCH'; value: string }
  | { type: 'CLEAR_ALL' };

export function useDashboardFilters() {
  const [filters, dispatch] = useReducer(filterReducer, initialState);
  return { filters, dispatch };
}
```

### `useDashboardData` (Data Fetching)

```typescript
export function useDashboardData(filters: FilterState, viewMode: ViewMode) {
  // 20+ estados de dados encapsulados
  // fetchData com useCallback
  // useEffect para auto-fetch
  return { loading, kpis, monthlyData, categoryData, ..., refetch: fetchData };
}
```

### `useDebtors` e `useFutureCommitments`

Encapsulam fetch + ações específicas do domínio.

---

## Sub-Componentes Criados

```
src/components/dashboard/
├── DashboardFilters.tsx     # Seletores de mês/ano, perspectiva, filtros avançados
├── KPICards.tsx              # Cards de KPI mensal e anual
├── ChartGrid.tsx            # Grid de gráficos (Pie, Bar, Area, Line)
├── FutureCommitments.tsx    # Cronograma de compromissos futuros
├── DebtorsSection.tsx       # Seção de devedores com liquidação
├── DashboardPrintView.tsx   # Versão impressa completa
├── constants.ts             # COLORS HSL, monthsList, formatters
└── index.ts                 # Barrel export
```

---

## 7. Critérios de Aceite

- [ ] `DashboardView.tsx` reduzido para ≤ 200 linhas
- [ ] 0 `useState` de filtro no DashboardView (todos no reducer)
- [ ] Cada sub-componente em arquivo próprio
- [ ] Custom hooks encapsulam todo data fetching
- [ ] Build passa sem erros
- [ ] Comportamento funcional mantido 100%
