# Composition Pattern

## Problema

Componente monolítico com milhares de linhas e múltiplas responsabilidades. Difícil de manter, testar, e causa recompilação completa a cada edição.

```typescript
// ❌ ANTES: page.tsx com 6.641 linhas e 7 componentes inline
'use client';
export default function AppContainer() {
  // ... 150 linhas de state + auth + layout ...
  return (
    <div>
      {/* Sidebar: 140 linhas inline */}
      <aside> ... </aside>

      {/* Header: 70 linhas inline */}
      <header> ... </header>

      {/* 5 views inline */}
      {activeTab === 'import' && <ImportView ... />}
      {activeTab === 'monthly' && <MonthlyView ... />}
    </div>
  );
}

// ❌ Tudo no MESMO arquivo:
function QuickDeParaModal({ ... }) { ... }     // 257 linhas
function SplitTransactionModal({ ... }) { ... } // 181 linhas
function ImportView({ ... }) { ... }            // 790 linhas
function ManualView({ ... }) { ... }            // 806 linhas
function DeParaView({ ... }) { ... }            // 1.328 linhas
function MonthlyView({ ... }) { ... }           // 2.574 linhas
```

## Solução

Extrair cada componente para arquivo próprio com interface de Props explícita. O componente pai orquestra via composição.

```typescript
// ✅ DEPOIS: page.tsx com ~150 linhas (orquestrador)

// === src/app/page.tsx ===
'use client';
import { PinScreen, Sidebar, Header } from '@/components/layout';
import { ImportView, ManualView, DeParaView, MonthlyView } from '@/components/views';
import DashboardView from '@/components/DashboardView';

export default function AppContainer() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  // ... state essencial de orquestração ...

  if (!isAuthenticated) return <PinScreen onAuthenticated={() => setIsAuthenticated(true)} />;

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} ... />
      <main>
        <Header activeTab={activeTab} ... />
        {activeTab === 'import' && <ImportView ... />}
        {activeTab === 'manual' && <ManualView ... />}
        {activeTab === 'depara' && <DeParaView ... />}
        {activeTab === 'dashboard' && <DashboardView ... />}
        {activeTab === 'monthly' && <MonthlyView ... />}
      </main>
    </div>
  );
}

// === src/components/views/ImportView.tsx (arquivo próprio) ===
import { ImportViewProps } from '@/types';

export default function ImportView({
  categories, expenseTypes, triggerStatus, loadMetadata, ...
}: ImportViewProps) {
  // ... 790 linhas, mas em arquivo isolado
}
```

## Workflow de Extração

1. **Identificar bloco:** Localizar o componente inline (linhas X-Y)
2. **Definir Props interface:** Listar todas as props que o componente recebe do pai
3. **Copiar para arquivo próprio:** `src/components/[domínio]/[ComponentName].tsx`
4. **Importar tipos de `@/types`:** Usar interfaces centralizadas (não inline)
5. **Importar no pai:** Substituir componente inline por import
6. **Atualizar barrel export:** Adicionar ao `index.ts` do diretório

## Quando Usar

- ✅ Componente com 200+ linhas
- ✅ Arquivo com 2+ componentes definidos
- ✅ Componente com responsabilidades visuais distintas (sidebar, header, content)
- ✅ Hot reload lento (editar 1 componente recompila todos)

## Quando NÃO Usar

- ❌ Componente pequeno (< 50 linhas) usado apenas uma vez
- ❌ Componente fortemente acoplado ao state do pai sem interface clara de Props

## Estrutura de Arquivos

```
src/components/
├── views/
│   ├── ImportView.tsx
│   ├── ManualView.tsx
│   ├── DeParaView.tsx
│   ├── MonthlyView.tsx
│   └── index.ts
├── modals/
│   ├── QuickDeParaModal.tsx
│   ├── SplitTransactionModal.tsx
│   └── index.ts
├── layout/
│   ├── Sidebar.tsx
│   ├── PinScreen.tsx
│   ├── Header.tsx
│   └── index.ts
└── dashboard/
    ├── DashboardFilters.tsx
    ├── KPICards.tsx
    ├── ChartGrid.tsx
    └── index.ts
```

---

## Parte 2: Compound Components & React 19 Composition (Vercel Standards)

> **Referência Completa**: `.agents/skills/vercel-composition-patterns/AGENTS.md`

### 1. Evitar Proliferação de Boolean Props

Componentes não devem acumular dezenas de props booleanas para controlar comportamento e renderização (`isEditing`, `isSplit`, `hasHeader`, `showFooter`, `readOnly`). Cada booleano duplica os estados possíveis e cria um código frágil.

```tsx
// ❌ ANTES: Componente canivete-suíço com flags booleanas
function TransactionModal({
  isOpen,
  isEditing,
  isSplit,
  readOnly,
  onSave,
  onSplit,
}: Props) {
  return (
    <Modal isOpen={isOpen}>
      <Header />
      {isSplit ? <SplitForm /> : <StandardForm readOnly={readOnly} />}
      {isEditing ? <EditActions onSave={onSave} /> : <CreateActions />}
    </Modal>
  );
}

// ✅ DEPOIS: Compound Components explícitos
const TransactionModal = {
  Provider: TransactionModalProvider,
  Frame: TransactionModalFrame,
  Header: TransactionModalHeader,
  StandardForm: TransactionStandardForm,
  SplitForm: TransactionSplitForm,
  Actions: TransactionModalActions,
};

// Uso limpo e auto-documentado:
<TransactionModal.Provider state={state} actions={actions} meta={meta}>
  <TransactionModal.Frame>
    <TransactionModal.Header title="Editar Despesa" />
    <TransactionModal.StandardForm />
    <TransactionModal.Actions />
  </TransactionModal.Frame>
</TransactionModal.Provider>
```

### 2. Desacoplamento de Estado (Generic Context Interface)

O Provider é o único local que sabe de onde o estado vem (se é `useState`, `Zustand` ou Server Actions). A UI visual depende apenas da interface de contexto:

```tsx
// Interface genérica para Dependency Injection
interface TransactionContextValue {
  state: {
    transaction: Transaction;
    isSubmitting: boolean;
  };
  actions: {
    updateField: (field: string, value: any) => void;
    submit: () => Promise<void>;
  };
  meta: {
    initialCategory?: string;
  };
}

const TransactionContext = createContext<TransactionContextValue | null>(null);

// Componentes visuais consomem a interface via React 19 use()
function TransactionModalActions() {
  const { actions, state } = use(TransactionContext)!;
  return (
    <button onClick={actions.submit} disabled={state.isSubmitting}>
      Salvar
    </button>
  );
}
```

### 3. Padrões de React 19

Neste projeto (**Next.js 16 / React 19.2**):
1. **Zero `forwardRef`**: Passe `ref` diretamente como uma prop normal na tipagem do componente:
   ```tsx
   function CustomInput({ ref, ...props }: Props & { ref?: React.Ref<HTMLInputElement> }) {
     return <input ref={ref} {...props} />;
   }
   ```
2. **`use()` em vez de `useContext()`**:
   ```tsx
   import { use } from 'react';
   const context = use(MyContext);
   ```
3. **Provider sem `.Provider`**:
   ```tsx
   <MyContext value={value}>{children}</MyContext>
   ```

