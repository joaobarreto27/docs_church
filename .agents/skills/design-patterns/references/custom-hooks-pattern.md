# Custom Hooks Pattern

## Problema

Lógica de data fetching + loading + error state duplicada entre componentes, ou `useEffect` + `useState` complexos poluindo o corpo do componente.

```typescript
// ❌ ANTES: fetch + 20 estados no corpo do DashboardView (linhas 83-175)
function DashboardView() {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [perspective, setPerspective] = useState<'month' | 'year'>('month');
  const [kpis, setKpis] = useState({ totalPeriod: 0, dailyAverage: 0, transactionCount: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [expenseTypeData, setExpenseTypeData] = useState([]);
  const [bankData, setBankData] = useState([]);
  // ... mais 10+ estados ...

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getDashboardDataAction(selectedMonth, selectedYear, viewMode);
        setKpis(data.kpis);
        setMonthlyData(data.monthlyData);
        setCategoryData(data.categoryData);
        // ... setar 10+ estados ...
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth, selectedYear, viewMode, /* 8 filtros */]);

  // ... 1800 linhas de JSX ...
}
```

## Solução

Encapsular fetch + state em hooks dedicados por domínio.

```typescript
// ✅ DEPOIS: Custom hooks encapsulam lógica

// === src/hooks/useDashboardData.ts ===
import { useState, useEffect, useCallback } from 'react';
import { getDashboardDataAction } from '@/app/actions';

export function useDashboardData(filters: FilterState, viewMode: ViewMode) {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [perspective, setPerspective] = useState<'month' | 'year'>('month');
  const [kpis, setKpis] = useState({ totalPeriod: 0, dailyAverage: 0, transactionCount: 0 });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  // ... todos os estados de dados ...

  const fetchData = useCallback(async (month?: string, year?: string) => {
    setLoading(true);
    try {
      const targetMonth = month || selectedMonth;
      const targetYear = year || selectedYear;
      const data = await getDashboardDataAction(targetMonth, targetYear, viewMode);
      setKpis(data.kpis);
      setMonthlyData(data.monthlyData);
      setCategoryData(data.categoryData);
      // ... setar dados ...
    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, viewMode, selectedMonth, selectedYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return {
    loading,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    perspective, setPerspective,
    kpis, monthlyData, categoryData,
    refetch: fetchData,
  };
}

// === src/hooks/useDebtors.ts ===
export function useDebtors(refetchDashboard: () => void) {
  const [debtors, setDebtors] = useState<any[]>([]);
  const [actionMessage, setActionMessage] = useState<{ type: string; text: string } | null>(null);

  const fetchDebtors = async () => {
    const data = await getDebtorsAction();
    setDebtors(data);
  };

  const handleSettle = async (name: string, ids: string[]) => {
    await settleDebtorAction(name, ids);
    setActionMessage({ type: 'success', text: `${name} quitado com sucesso` });
    await fetchDebtors();
    refetchDashboard();
  };

  return { debtors, actionMessage, fetchDebtors, handleSettle };
}

// === src/hooks/index.ts (barrel export) ===
export { useDashboardData } from './useDashboardData';
export { useDebtors } from './useDebtors';
export { useFutureCommitments } from './useFutureCommitments';
export { useDashboardFilters } from './useDashboardFilters';

// ✅ No componente — limpo e focado em UI:
function DashboardView() {
  const { filters, dispatch } = useDashboardFilters();
  const { loading, kpis, monthlyData, refetch, ... } = useDashboardData(filters, viewMode);
  const { debtors, handleSettle } = useDebtors(refetch);

  if (loading) return <Skeleton />;
  return (/* JSX limpo, sem lógica de fetch */);
}
```

## Convenção de Nomenclatura

| Hook | Responsabilidade |
|------|-----------------|
| `use[Domain]Data` | Fetch + state de um domínio de dados |
| `use[Domain]Filters` | Estado de filtros com reducer |
| `use[Action]` | Ação específica (ex: `useDebtors`, `usePdfExport`) |

## Quando Usar

- ✅ `useEffect` com fetch + 3+ `useState` relacionados
- ✅ Mesma lógica de fetch em 2+ componentes
- ✅ Componente com 30+ linhas de setup antes do JSX
- ✅ Necessidade de `refetch` ou invalidação de cache

## Quando NÃO Usar

- ❌ Fetch simples de 1 valor sem loading/error (use `useSWR` ou similar)
- ❌ Estado que nunca sai do componente (manter local)

## Estrutura de Arquivos

```
src/hooks/
├── useDashboardData.ts
├── useDashboardFilters.ts
├── useDebtors.ts
├── useFutureCommitments.ts
└── index.ts
```
