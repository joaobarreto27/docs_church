# Reducer Pattern (State/Reducer)

## Problema

Múltiplos `useState` inter-relacionados que representam um estado lógico único. Ações como "limpar tudo" exigem chamar N setters. O `useEffect` de dependência fica com 10+ itens.

```typescript
// ❌ ANTES: 8 useState avulsos para filtros do Dashboard
const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
const [expenseTypeFilter, setExpenseTypeFilter] = useState<string[]>([]);
const [bankFilter, setBankFilter] = useState<string[]>([]);
const [paymentMethodFilter, setPaymentMethodFilter] = useState<string[]>([]);
const [statusFilter, setStatusFilter] = useState<string[]>([]);
const [divisionFilter, setDivisionFilter] = useState<string[]>([]);
const [reservaFilter, setReservaFilter] = useState<string[]>([]);
const [paymentTypeFilter, setPaymentTypeFilter] = useState<string[]>([]);
const [searchQuery, setSearchQuery] = useState('');

// ❌ "Limpar filtros" exige 9 chamadas:
const clearFilters = () => {
  setCategoryFilter([]);
  setExpenseTypeFilter([]);
  setBankFilter([]);
  setPaymentMethodFilter([]);
  setStatusFilter([]);
  setDivisionFilter([]);
  setReservaFilter([]);
  setPaymentTypeFilter([]);
  setSearchQuery('');
};

// ❌ useEffect com 9 dependências:
useEffect(() => { fetchData(); },
  [categoryFilter, expenseTypeFilter, bankFilter, paymentMethodFilter,
   statusFilter, divisionFilter, reservaFilter, paymentTypeFilter, searchQuery]);
```

## Solução

```typescript
// ✅ DEPOIS: useReducer centraliza estado e transições

// src/hooks/useDashboardFilters.ts
type FilterState = {
  category: string[];
  expenseType: string[];
  bank: string[];
  paymentMethod: string[];
  status: string[];
  division: string[];
  reserva: string[];
  paymentType: string[];
  searchQuery: string;
};

type FilterAction =
  | { type: 'SET_FILTER'; field: keyof Omit<FilterState, 'searchQuery'>; value: string[] }
  | { type: 'SET_SEARCH'; value: string }
  | { type: 'CLEAR_ALL' };

const initialState: FilterState = {
  category: [], expenseType: [], bank: [], paymentMethod: [],
  status: [], division: [], reserva: [], paymentType: [],
  searchQuery: '',
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, [action.field]: action.value };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.value };
    case 'CLEAR_ALL':
      return initialState;  // ✅ Uma linha limpa TUDO
    default:
      return state;
  }
}

export function useDashboardFilters() {
  const [filters, dispatch] = useReducer(filterReducer, initialState);
  return { filters, dispatch };
}

// ✅ No componente:
const { filters, dispatch } = useDashboardFilters();
dispatch({ type: 'SET_FILTER', field: 'bank', value: ['Inter'] });
dispatch({ type: 'CLEAR_ALL' });  // ✅ Uma chamada limpa tudo

// ✅ useEffect com 1 dependência:
useEffect(() => { fetchData(); }, [filters]);
```

## Quando Usar

- ✅ 3+ `useState` que representam um estado lógico único
- ✅ Ações que alteram múltiplos estados de uma vez ("limpar tudo", "resetar", "carregar preset")
- ✅ `useEffect` com 5+ dependências de estado
- ✅ Formulários multi-step / wizard

## Quando NÃO Usar

- ❌ 1-2 `useState` independentes (ex: `isOpen` + `selectedItem`)
- ❌ Estados que nunca mudam juntos
- ❌ Estado simples sem ações complexas

## Regra Prática

> **3 ou menos `useState`** que não interagem → manter `useState`.
> **4+ `useState`** que mudam juntos ou têm ação de "reset" → `useReducer`.
