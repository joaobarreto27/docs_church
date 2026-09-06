# Workflow de Decomposição de Monolitos

Passo a passo para decompor um arquivo monolítico em módulos menores, preservando 100% do comportamento.

---

## Fase 1: Análise

### 1.1. Métricas do Arquivo

```bash
# Contar linhas total
wc -l [arquivo]

# Listar todas as funções/componentes
grep -n "function\|const.*=.*=>\|export default\|export function" [arquivo]

# Contar exports
grep -c "export" [arquivo]

# Listar interfaces/tipos
grep -n "interface\|type.*=" [arquivo]
```

### 1.2. Mapear Componentes

Para cada componente/função no arquivo, documentar:

| Componente | Linhas | Início | Fim | Dependências internas | Exportado? |
|-----------|--------|--------|-----|----------------------|-----------|
| `AppContainer` | 150 | 200 | 350 | todos os states | sim (default) |
| `ImportView` | 790 | 1144 | 1933 | QuickDeParaModal, SplitModal | não (inline) |
| `MonthlyView` | 2574 | 4068 | 6641 | QuickDeParaModal, ícones | não (inline) |

### 1.3. Mapear Dependências Cruzadas

Para cada componente, listar:
- Props que recebe do pai
- Hooks/state que usa do escopo do pai
- Server actions que importa
- Componentes irmãos que referencia
- Utils/types que precisa

---

## Fase 2: Planejar Extração

### 2.1. Ordem de Extração

Extrair de baixo para cima (dependências primeiro):

1. **Tipos e interfaces** → `src/types/`
2. **Utilitários puros** → `src/lib/utils/`
3. **Componentes leaf** (sem dependências de irmãos) → `src/components/[domínio]/`
4. **Componentes compostos** (usam leaf) → `src/components/[domínio]/`
5. **Orquestrador** (o que sobra no arquivo original)

### 2.2. Definir Props para Cada Extração

Para cada componente que será extraído:

```typescript
// 1. Listar TUDO que o componente acessa do escopo externo
// 2. Transformar em interface de Props explícita
// 3. Registrar o tipo em @/types

interface ImportViewProps {
  categories: string[];
  expenseTypes: string[];
  triggerStatus: TriggerStatusFn;
  loadMetadata: () => Promise<void>;
  // ... cada acesso externo vira uma prop
}
```

### 2.3. Garantir Compatibilidade via Barrel Export

```typescript
// src/components/views/index.ts
export { default as ImportView } from './ImportView';
export { default as ManualView } from './ManualView';
// ... cada componente extraído

// O arquivo original importa do barrel:
import { ImportView, ManualView } from '@/components/views';
```

---

## Fase 3: Executar Extração

### Para cada componente:

1. **Criar arquivo novo:** `src/components/[domínio]/[Nome].tsx`
2. **Copiar código:** Linhas X-Y do arquivo original
3. **Adicionar imports:** Types de `@/types`, utils de `@/lib/utils`, actions de `@/app/actions`
4. **Definir Props interface** (importar de `@/types` se já centralizado)
5. **Adicionar ao barrel export** (`index.ts`)
6. **No arquivo original:** Remover o componente inline, substituir por import
7. **Testar:** `npm run build` após cada extração

### Regra de Ouro

> **Uma extração por vez. Build entre cada extração.**
> Não extraia 5 componentes de uma vez — extraia 1, valide, próximo.

---

## Fase 4: Verificação

### Checklist Pós-Decomposição

- [ ] Arquivo original reduzido para ≤ [meta] linhas
- [ ] Cada componente em arquivo próprio com Props tipadas
- [ ] Zero definições inline no arquivo original (tudo importado)
- [ ] Barrel exports funcionam (`import { X } from '@/components/views'`)
- [ ] Build do Next.js passa sem erros de tipo
- [ ] Hot reload funcional (editar um componente não recompila todos)
- [ ] Comportamento funcional 100% idêntico

---

## Exemplo Real: Métricas

### Decomposição de page.tsx (smart_finance_tracker)

| Componente | Linhas | Destino |
|-----------|--------|---------|
| PinScreen | 110 | `src/components/layout/PinScreen.tsx` |
| Sidebar | 140 | `src/components/layout/Sidebar.tsx` |
| Header | 70 | `src/components/layout/Header.tsx` |
| QuickDeParaModal | 257 | `src/components/modals/QuickDeParaModal.tsx` |
| SplitTransactionModal | 181 | `src/components/modals/SplitTransactionModal.tsx` |
| ImportView | 790 | `src/components/views/ImportView.tsx` |
| ManualView | 806 | `src/components/views/ManualView.tsx` |
| DeParaView | 1328 | `src/components/views/DeParaView.tsx` |
| MonthlyView | 2574 | `src/components/views/MonthlyView.tsx` |
| **AppContainer (restante)** | **~150** | `src/app/page.tsx` |
| **Total** | **6641** | **10 arquivos** |
