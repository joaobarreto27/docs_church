# Barrel Exports

## Problema

Imports longos e frágeis que referenciam arquivos internos de módulos. Reorganizar a estrutura interna quebra imports em N arquivos consumidores.

```typescript
// ❌ ANTES: imports diretos a arquivos internos
import { ParsedTransaction } from '../types/transaction';
import { Tab, ImportViewProps } from '../types/ui';
import { SupportItemType } from '../types/support';

import { calculateBillingMonth } from '../lib/utils/billing';
import { isValidDebtorsString } from '../lib/utils/validation';
import { cleanTransactionTitle } from '../lib/utils/text';
import { formatBRL } from '../lib/utils/display';

// ❌ Renomear um arquivo interno (ex: billing.ts → billing-month.ts) quebra TODOS os imports
```

## Solução

Arquivo `index.ts` em cada módulo que re-exporta tudo. Consumidores importam do diretório, não de arquivos internos.

```typescript
// ✅ DEPOIS: barrel exports

// === src/types/index.ts ===
export * from './transaction';
export * from './ui';
export * from './support';

// === src/lib/utils/index.ts ===
export * from './billing';
export * from './text';
export * from './csv';
export * from './validation';
export * from './display';

// === src/repositories/index.ts ===
export { transactionRepository } from './transaction.repository';
export { categoryMappingRepository } from './category-mapping.repository';
export { supportRepository } from './support.repository';
export { metadataRepository } from './metadata.repository';
export { unmappedRepository } from './unmapped.repository';

// === src/components/views/index.ts ===
export { default as ImportView } from './ImportView';
export { default as ManualView } from './ManualView';
export { default as DeParaView } from './DeParaView';
export { default as MonthlyView } from './MonthlyView';

// ✅ Consumidores — imports limpos:
import { ParsedTransaction, Tab, ImportViewProps } from '@/types';
import { calculateBillingMonth, formatBRL, isValidDebtorsString } from '@/lib/utils';
import { transactionRepository, categoryMappingRepository } from '@/repositories';
import { ImportView, ManualView } from '@/components/views';

// ✅ Renomear billing.ts → billing-month.ts: alterar APENAS o index.ts
```

## Convenções

1. **`export *`** para módulos de tipos e utils (tudo é público)
2. **`export { named }`** para componentes e repositories (controle explícito)
3. **`export { default as Name }`** para componentes com export default
4. **Um `index.ts` por diretório** com 3+ arquivos
5. **Não fazer barrel de barrel:** `src/index.ts` re-exportando tudo é over-engineering

## Quando Usar

- ✅ Diretório com 3+ arquivos que são importados externamente
- ✅ Módulo que pode ter reorganização interna futura
- ✅ Tipos compartilhados usados em múltiplos consumidores

## Quando NÃO Usar

- ❌ Diretório com 1-2 arquivos (import direto é mais simples)
- ❌ Arquivos internos/privados que nunca são importados de fora
- ❌ Re-exportar TUDO do projeto num único `src/index.ts`
