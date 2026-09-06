# Plano de Refatoração - Fase 3: Decomposição de Componentes UI — Views e Modais

## 1. Objetivo da Fase

Decompor o arquivo monolítico `page.tsx` (6.641 linhas, 7 componentes) em arquivos individuais por responsabilidade. Cada view, modal e elemento de layout será extraído para seu próprio arquivo. Ao final, `page.tsx` será reduzido a ~150 linhas — um orquestrador de tabs com state de autenticação e roteamento.

**Impacto esperado:**
- `page.tsx` de 6.641 → ~150 linhas
- 5 views extraídas para arquivos próprios
- 2 modais extraídos para arquivos próprios
- Sidebar e layout extraídos
- Nenhuma alteração de comportamento funcional

---

## 2. Escopo de Arquivos Afetados

### Arquivos que serão criados:

**Views:**
- `src/components/views/ImportView.tsx` — Importação de faturas CSV (linhas 1144-1933 de `page.tsx`, ~790 linhas)
- `src/components/views/ManualView.tsx` — Cadastro manual de gastos (linhas 1934-2739, ~806 linhas)
- `src/components/views/DeParaView.tsx` — Motor De-Para e apoio (linhas 2740-4067, ~1.328 linhas)
- `src/components/views/MonthlyView.tsx` — Edição e controle mensal (linhas 4068-6641, ~2.574 linhas)
- `src/components/views/index.ts` — Barrel export

**Modais:**
- `src/components/modals/QuickDeParaModal.tsx` — Modal atalho de criação De-Para (linhas 706-962, ~257 linhas)
- `src/components/modals/SplitTransactionModal.tsx` — Modal de divisão de transação (linhas 963-1143, ~181 linhas)
- `src/components/modals/index.ts` — Barrel export

**Layout:**
- `src/components/layout/Sidebar.tsx` — Sidebar glassmorphic com collapse (linhas 406-545 de `page.tsx`)
- `src/components/layout/PinScreen.tsx` — Tela de autenticação por PIN (linhas 290-399)
- `src/components/layout/Header.tsx` — Header com título da aba, última atualização e theme toggle (linhas 546-613)
- `src/components/layout/index.ts` — Barrel export

### Arquivos que serão modificados:
- `src/app/page.tsx` — Reduzido ao orquestrador (state, auth, routing)

### Nota: `DashboardView.tsx` permanece em `src/components/DashboardView.tsx` nesta fase.
A decomposição interna do DashboardView é tratada na Fase 4.

---

## 3. Padrões e Princípios Aplicados

- **Single Responsibility Principle (SRP):** Cada arquivo = 1 componente/view com responsabilidade única
- **KISS:** Extração mecânica — mover código sem alterar lógica, preservando props/state exatamente como estão
- **DRY:** Tipos de props compartilhados importados de `@/types` (criados na Fase 1)
- **Composição sobre herança:** O `AppContainer` orquestra views via composição com tabs

---

## 4. Passo a Passo Técnico de Implementação

### 4.1. Extrair `PinScreen` (linhas 290-399 de `page.tsx`)

Extrair toda a tela de autenticação (`isAuthenticated === false`) para componente isolado.

**Props necessárias:**
```typescript
interface PinScreenProps {
  onAuthenticated: () => void;
}
```

**Lógica interna:** `pinInput`, `pinError`, `handleVerifyPin`, `handleKeypadPress` — todo o state permanece local ao componente.

### 4.2. Extrair `Sidebar` (linhas 406-545 de `page.tsx`)

Extrair o `<aside>` glassmorphic com toggle de collapse e menu de abas.

**Props necessárias:**
```typescript
interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  unmappedCount: number;
  lastUpdateDate: string;
}
```

### 4.3. Extrair `Header` (linhas 546-613 de `page.tsx`)

Extrair o header com título dinâmico por aba, data de última atualização e `<ThemeToggle />`.

**Props necessárias:**
```typescript
interface HeaderProps {
  activeTab: Tab;
  lastUpdateDate: string;
  statusMessage: StatusMessage | null;
}
```

### 4.4. Extrair `QuickDeParaModal` (linhas 706-962)

O componente já está isolado como função interna. Apenas mover para arquivo próprio.

**Ação:** Copy-paste direto das linhas 706-962, incluindo a interface `QuickDeParaModalProps` (já mapeada na Fase 1 para `@/types`).

### 4.5. Extrair `SplitTransactionModal` (linhas 963-1143)

O componente já está isolado como função interna. Apenas mover para arquivo próprio.

**Ação:** Copy-paste direto das linhas 951-1143 (incluindo interfaces `SplitPart` e `SplitTransactionModalProps`).

### 4.6. Extrair `ImportView` (linhas 1144-1933)

**Props existentes (inline, a serem importadas de `@/types`):**
- `categories`, `expenseTypes`, `expenseTypesWithCategories`, `reservas`
- `triggerStatus`, `loadMetadata`, `refreshMonthly`
- `lastTxDates`, `nubankClosing`, `interClosing`

**Dependências internas:**
- Usa `QuickDeParaModal` e `SplitTransactionModal` → importar de `@/components/modals`
- Usa `ParsedTransaction` → importar de `@/types`
- Usa `isValidDebtorsString`, `calculateBillingMonth` → importar de `@/lib/utils`
- Usa `SearchableSelect` → importar de `@/components/SearchableSelect`
- Usa server actions `parseCSVAction`, `saveTransactionsAction`, etc. → importar de `@/app/actions`

### 4.7. Extrair `ManualView` (linhas 1934-2739)

**Props existentes:**
- Todos os props de `ImportView` + `bancos`, `formasPagamento`, `tiposPagamento`, `statuses`, `responsaveis`

**Dependências internas:**
- Usa `formatBRL` → importar de `@/lib/utils`
- Usa `isValidDebtorsString`, `calculateBillingMonth` → importar de `@/lib/utils`
- Usa `createManualTransactionAction` → importar de `@/app/actions`
- Usa `SearchableSelect` → importar de `@/components/SearchableSelect`

### 4.8. Extrair `DeParaView` (linhas 2740-4067)

**Props existentes:**
- `categories`, `expenseTypes`, `expenseTypesWithCategories`, `reservas`
- `triggerStatus`, `loadMetadata`, `nubankClosing`, `interClosing`

**Dependências internas:**
- Usa `getCategoryMappingsAction`, `saveCategoryMappingAction`, `deleteCategoryMappingAction`
- Usa `getSupportItemsAction`, `saveSupportItemAction`, `deleteSupportItemAction`
- Usa `getUnmappedTransactionsAction`, `saveNewMappingAndUpdateTransactionsAction`, `getMatchingTransactionsAction`
- Usa `SearchableSelect` → importar de `@/components/SearchableSelect`
- Interface local `Mapping` (linha 2740) → mover para `@/types`

### 4.9. Extrair `MonthlyView` (linhas 4068-6641)

**Props existentes (inline):**
- Todos os props de `ManualView` + `yearsList`, `refreshMonthly`, `viewMode`, `setViewMode`, `nubankClosing`, `interClosing`

**Dependências internas:**
- Usa `QuickDeParaModal` e `SplitTransactionModal` → importar de `@/components/modals`
- Usa `getMonthlyTransactionsAction`, `updateTransactionAction`, `deleteTransactionAction`, `deleteTransactionsAction`, `settleDebtorAction`, `checkTransactionLinksAction`
- Usa `calculateBillingMonth`, `isValidDebtorsString`, `cleanTransactionTitle`, `getDisplayDivision` → importar de `@/lib/utils`
- Usa `SearchableSelect` → importar de `@/components/SearchableSelect`
- Usa ícones de `lucide-react`

### 4.10. Reescrever `page.tsx` como orquestrador

O `page.tsx` final conterá apenas:
1. `'use client'` directive
2. Imports de componentes de layout, views e DashboardView
3. State de autenticação, tab ativa, metadata, sidebar collapse
4. `loadMetadata()` e `refreshMonthlyTransactions()`
5. Render condicional: `PinScreen` se não autenticado, caso contrário `Sidebar` + `Header` + view ativa

### 4.11. Criar barrel exports

```typescript
// src/components/views/index.ts
export { default as ImportView } from './ImportView';
export { default as ManualView } from './ManualView';
export { default as DeParaView } from './DeParaView';
export { default as MonthlyView } from './MonthlyView';

// src/components/modals/index.ts
export { QuickDeParaModal } from './QuickDeParaModal';
export { SplitTransactionModal } from './SplitTransactionModal';

// src/components/layout/index.ts
export { Sidebar } from './Sidebar';
export { PinScreen } from './PinScreen';
export { Header } from './Header';
```

---

## 5. Exemplo de Código (Antes vs. Depois)

### Antes:

```typescript
// === page.tsx (6.641 linhas) ===
'use client';

import React, { useState, useEffect, useMemo } from 'react';
// ... 30+ imports ...

function calculateBillingMonth(...) { ... }  // duplicada
function isValidDebtorsString(...) { ... }   // duplicada
function cleanTransactionTitle(...) { ... }  // duplicada
function getDisplayDivision(...) { ... }

type Tab = 'import' | 'manual' | 'depara' | 'dashboard' | 'monthly';

export default function AppContainer() {
  // ... 150 linhas de state + auth + layout ...
  
  return (
    <div>
      {/* Sidebar: 140 linhas inline */}
      <aside> ... </aside>
      
      {/* Header: 70 linhas inline */}
      <header> ... </header>
      
      {/* 5 views inline, cada uma com centenas de linhas */}
      {activeTab === 'import' && <ImportView ... />}
      {activeTab === 'manual' && <ManualView ... />}
      ...
    </div>
  );
}

// ❌ Tudo abaixo definido no MESMO arquivo:
function QuickDeParaModal({ ... }) { ... }     // 257 linhas
function SplitTransactionModal({ ... }) { ... } // 181 linhas
function ImportView({ ... }) { ... }            // 790 linhas
function ManualView({ ... }) { ... }            // 806 linhas
function DeParaView({ ... }) { ... }            // 1.328 linhas
function MonthlyView({ ... }) { ... }           // 2.574 linhas
```

### Depois:

```typescript
// === page.tsx (~150 linhas) ===
'use client';

import React, { useState, useEffect } from 'react';
import { Tab, StatusMessage, CardClosingConfig, ExpenseTypeWithCategory } from '@/types';
import { getMetadataAction, getUnmappedTransactionsAction, getMonthlyTransactionsAction } from './actions';
import { PinScreen, Sidebar, Header } from '@/components/layout';
import { ImportView, ManualView, DeParaView, MonthlyView } from '@/components/views';
import DashboardView from '@/components/DashboardView';

export default function AppContainer() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [lastUpdateDate, setLastUpdateDate] = useState('N/A');
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [unmappedCount, setUnmappedCount] = useState(0);

  // Metadata state
  const [categories, setCategories] = useState<string[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<string[]>([]);
  // ... restante do state de metadata ...

  const loadMetadata = async () => { /* ... */ };
  const refreshMonthlyTransactions = async (month?: string, year?: string) => { /* ... */ };
  const triggerStatus = (type: 'success' | 'error' | 'info', text: string) => { /* ... */ };

  useEffect(() => { loadMetadata(); /* auth check */ }, []);

  if (isAuthenticated === null) return <LoadingSpinner />;
  if (isAuthenticated === false) return <PinScreen onAuthenticated={() => setIsAuthenticated(true)} />;

  return (
    <div className="flex min-h-screen ...">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        unmappedCount={unmappedCount}
        lastUpdateDate={lastUpdateDate}
      />
      <main className="flex-1 ...">
        <Header activeTab={activeTab} lastUpdateDate={lastUpdateDate} statusMessage={statusMessage} />
        {activeTab === 'import' && <ImportView ... />}
        {activeTab === 'manual' && <ManualView ... />}
        {activeTab === 'depara' && <DeParaView ... />}
        {activeTab === 'dashboard' && <DashboardView ... />}
        {activeTab === 'monthly' && <MonthlyView ... />}
      </main>
    </div>
  );
}
```

---

## 6. Apontamento de Anomalias em Regras de Negócio (Se houver)

> Nenhuma anomalia de regra de negócio identificada nesta fase. A decomposição é puramente estrutural — code move sem alteração de lógica.

**Observação de qualidade (não é anomalia de regra):** A `MonthlyView` com 2.574 linhas contém sub-views internas (`lancamentos`, `cobranca`, `parcelados`, `recorrentes`) que poderiam ser extraídas individualmente. Porém, isso é considerado polimento e fica como melhoria futura após esta fase. O objetivo aqui é a extração de primeiro nível — cada view em seu arquivo.

---

## 7. Critérios de Aceite e Verificação

- [ ] `page.tsx` reduzido para ≤ 200 linhas (orquestração + state + routing)
- [ ] Cada view/modal/layout em arquivo próprio sob `src/components/{views,modals,layout}/`
- [ ] Zero funções ou interfaces definidas inline em `page.tsx` (tudo importado de `@/types`, `@/lib/utils`, ou componentes)
- [ ] Nenhum componente tem mais de 2.600 linhas (maior será MonthlyView, que será decomposta internamente em fase futura se necessário)
- [ ] Build do Next.js (`npm run build`) passa sem erros
- [ ] Comportamento funcional do app permanece 100% idêntico (navegação entre abas, PIN, sidebar, modais)
- [ ] Hot reload funcional em dev: editar um componente não força recompilação de todos os outros
