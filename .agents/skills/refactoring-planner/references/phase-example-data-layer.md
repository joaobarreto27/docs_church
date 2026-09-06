# Plano de Refatoração - Fase 2: Camada de Dados — Repository Pattern e Strategy para Parsers

## 1. Objetivo da Fase

Desacoplar todo o acesso a dados (Prisma) e a lógica de parsing CSV da camada de server actions, aplicando **Repository Pattern** para acesso a dados e **Strategy Pattern** para parsers de bancos. O arquivo monolítico `actions.ts` (2.657 linhas, 27 functions) será decomposto em módulos de domínio com responsabilidades isoladas.

**Impacto esperado:**
- `actions.ts` monolítico → 6 arquivos de actions focados + 5 repositories + 2 parsers
- Acesso ao banco encapsulado em repositories reutilizáveis
- Parsers extensíveis: adicionar um novo banco (Itaú, Bradesco) requer apenas implementar a interface `BankParser`
- Server actions reduzidas a orquestradores finos (~15 linhas cada)

---

## 2. Escopo de Arquivos Afetados

### Arquivos que serão criados:
- `src/repositories/transaction.repository.ts` — CRUD de Transaction
- `src/repositories/category-mapping.repository.ts` — CRUD de CategoryMapping + backfill
- `src/repositories/support.repository.ts` — CRUD de SupportItem + seed de LINKED_CATEGORY
- `src/repositories/metadata.repository.ts` — SystemMetadata (config, last update, card closing)
- `src/repositories/unmapped.repository.ts` — UnmappedTransaction (sync, query)
- `src/repositories/index.ts` — Barrel export
- `src/parsers/bank-parser.interface.ts` — Interface `BankParser`
- `src/parsers/inter.parser.ts` — Parser do Inter
- `src/parsers/nubank.parser.ts` — Parser do Nubank
- `src/parsers/index.ts` — Factory `getParser(bank)`
- `src/app/actions/transaction.actions.ts` — `parseCSVAction`, `saveTransactionsAction`, `createManualTransactionAction`
- `src/app/actions/mapping.actions.ts` — `saveCategoryMappingAction`, `deleteCategoryMappingAction`, `getCategoryMappingsAction`
- `src/app/actions/support.actions.ts` — `getSupportItemsAction`, `saveSupportItemAction`, `deleteSupportItemAction`
- `src/app/actions/dashboard.actions.ts` — `getDashboardDataAction`, `getDebtorsAction`, `settleDebtorAction`, `getFutureCommitmentsAction`
- `src/app/actions/metadata.actions.ts` — `getMetadataAction`, `verifyPinAction`, `getMonthlyTransactionsAction`
- `src/app/actions/index.ts` — Re-export de todas as actions (compatibilidade com imports existentes)

### Arquivos que serão modificados:
- `src/app/actions.ts` — Será removido após migração completa para `src/app/actions/`
- `src/app/page.tsx` — Atualizar imports de `'./actions'` → `'./actions/index'` (ou compatível via barrel)

---

## 3. Padrões e Princípios Aplicados

- **Repository Pattern:** Encapsula todo acesso a dados (Prisma) por entidade. As actions chamam repositories, nunca `prisma.xxx` diretamente.
- **Strategy Pattern:** Interface `BankParser` com implementações para Inter e Nubank. Extensível para novos bancos.
- **Factory Pattern:** `getParser('Inter')` retorna a instância correta do parser via factory.
- **Single Responsibility Principle:** Cada repository tem uma entidade; cada arquivo de actions tem um domínio.
- **Dependency Inversion Principle:** Actions dependem de interfaces de repositório, não de implementações concretas do Prisma.

---

## 4. Passo a Passo Técnico de Implementação

### 4.1. Criar a interface `BankParser`

```typescript
// src/parsers/bank-parser.interface.ts
import { ParsedTransaction } from '@/types';

export interface BankParserConfig {
  dueDay: number;
  daysBefore: number;
}

export interface BankParser {
  readonly bankName: 'Inter' | 'Nubank';
  parseLine(columns: string[], config: BankParserConfig): {
    dateStr: string;
    rawTitle: string;
    amount: number;
    type: 'Crédito' | 'Débito';
    paymentMethod: 'À Vista' | 'Parcelado';
    installmentNumber: number | null;
    installmentTotal: number | null;
  } | null;
}
```

### 4.2. Criar `InterParser` e `NubankParser`

Extrair blocos condicionais `if (bank === 'Inter') { ... } else { ... }` de `parseCSVAction` (linhas 264-305 de `actions.ts`) para classes separadas que implementam `BankParser`.

**Inter — `src/parsers/inter.parser.ts`:** Extrair linhas 264-282 + lógica de `parseInterAmount`.
**Nubank — `src/parsers/nubank.parser.ts`:** Extrair linhas 283-305 + lógica de `parseNubankAmount`.

### 4.3. Criar a Factory de Parsers

```typescript
// src/parsers/index.ts
import { BankParser } from './bank-parser.interface';
import { InterParser } from './inter.parser';
import { NubankParser } from './nubank.parser';

const parsers: Record<string, BankParser> = {
  Inter: new InterParser(),
  Nubank: new NubankParser(),
};

export function getParser(bank: 'Inter' | 'Nubank'): BankParser {
  const parser = parsers[bank];
  if (!parser) throw new Error(`Parser não implementado para o banco: ${bank}`);
  return parser;
}

export type { BankParser, BankParserConfig } from './bank-parser.interface';
```

### 4.4. Criar `TransactionRepository`

Encapsular todas as operações de `prisma.transaction.*` usadas em `actions.ts`:

```typescript
// src/repositories/transaction.repository.ts
import { prisma } from '@/lib/prisma';

export const transactionRepository = {
  async findAllHashes(): Promise<Set<string>> { ... },
  async createMany(data: any[]): Promise<void> { ... },
  async create(data: any): Promise<any> { ... },
  async findById(id: string): Promise<any> { ... },
  async update(id: string, data: any): Promise<any> { ... },
  async delete(id: string): Promise<void> { ... },
  async deleteMany(ids: string[]): Promise<void> { ... },
  async findByMonth(month: string, year: string, viewMode: string): Promise<any[]> { ... },
  async findDistinctYears(): Promise<string[]> { ... },
  async getLastTxDatesByBank(): Promise<Record<string, string>> { ... },
  async findByRawTitle(rawTitle: string): Promise<any[]> { ... },
  async countNullBillingMonth(): Promise<number> { ... },
  async backfillBillingMonths(): Promise<void> { ... },
};
```

### 4.5. Criar `CategoryMappingRepository`

Encapsular de `actions.ts`:
- `getCategoryMappingsAction` (L1004-1008)
- `saveCategoryMappingAction` — operações de upsert/update/delete (L1039-1159)
- `deleteCategoryMappingAction` (L1162-1168)
- `backfillTransactionsForMapping` (L1010-1037)
- Matching engine: `findMatchingRule(normalizedText)` e `findBestDiceMatch(normalizedText)`

### 4.6. Criar `SupportRepository`

Encapsular de `actions.ts`:
- `getSupportItemsAction` — incluindo seed de `LINKED_CATEGORY` (L1170-1216)
- `saveSupportItemAction` (L1218-1258)
- `deleteSupportItemAction` (L1260-1265)

### 4.7. Criar `MetadataRepository`

Encapsular de `actions.ts`:
- `getCardClosingConfig` (L8-21)
- Leitura/gravação de `LAST_UPDATE_DATE`
- `saveCardClosingConfigAction` (L2612-2626)
- `getValues()` helper de metadata (L705-708)

### 4.8. Criar `UnmappedRepository`

Encapsular de `actions.ts`:
- `syncUnmappedTransactions` (L1267-1334) — lógica de agrupamento + deleteMany/createMany
- `getUnmappedTransactionsAction` (L1336-1357)
- `getMatchingTransactionsAction` (L1358-1384)

### 4.9. Decompor `actions.ts` em módulos de domínio

Dividir as 27 server actions exportadas em arquivos por domínio:

| Arquivo | Actions |
|---------|---------|
| `transaction.actions.ts` | `parseCSVAction`, `saveTransactionsAction`, `createManualTransactionAction`, `updateTransactionAction`, `deleteTransactionAction`, `deleteTransactionsAction`, `checkTransactionLinksAction`, `backfillBillingMonthsForBankAction` |
| `mapping.actions.ts` | `getCategoryMappingsAction`, `saveCategoryMappingAction`, `deleteCategoryMappingAction`, `saveNewMappingAndUpdateTransactionsAction` |
| `support.actions.ts` | `getSupportItemsAction`, `saveSupportItemAction`, `deleteSupportItemAction` |
| `dashboard.actions.ts` | `getDashboardDataAction`, `getDebtorsAction`, `settleDebtorAction`, `getFutureCommitmentsAction` |
| `metadata.actions.ts` | `getMetadataAction`, `verifyPinAction`, `getMonthlyTransactionsAction`, `saveCardClosingConfigAction`, `getUnmappedTransactionsAction`, `getMatchingTransactionsAction` |

Cada arquivo terá `'use server'` no topo e será um orquestrador fino que chama repositories.

### 4.10. Criar barrel export compatível

```typescript
// src/app/actions/index.ts
export * from './transaction.actions';
export * from './mapping.actions';
export * from './support.actions';
export * from './dashboard.actions';
export * from './metadata.actions';
```

Isso garante que `import { ... } from './actions'` no `page.tsx` continue funcionando sem alterações de import.

### 4.11. Remover `actions.ts` original

Após validação completa, remover `src/app/actions.ts`.

---

## 5. Exemplo de Código (Antes vs. Depois)

### Antes:

```typescript
// === actions.ts (L213-470) — parseCSVAction monolítica com 260 linhas ===
'use server';
import { prisma } from '@/lib/prisma';

export async function parseCSVAction(csvText: string, bank: 'Inter' | 'Nubank'): Promise<ParsedTransaction[]> {
  const cleanCsvText = csvText.replace(/^\uFEFF/, '');
  const lines = cleanCsvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  // ... loading mappings, support items, existing hashes direto do prisma ...
  
  for (const line of dataLines) {
    const columns = splitCSVLine(line);
    // ... 40 linhas de if (bank === 'Inter') { ... } else { ... } ...
    // ... 80 linhas de matching engine (busca direta + Dice coefficient) ...
    // ... hash, billing month, push to list ...
  }
  return parsedList;
}
```

### Depois:

```typescript
// === src/parsers/inter.parser.ts ===
import { BankParser, BankParserConfig } from './bank-parser.interface';
import { parseInterAmount } from '@/lib/utils';

export class InterParser implements BankParser {
  readonly bankName = 'Inter' as const;

  parseLine(columns: string[], _config: BankParserConfig) {
    if (columns.length < 5) return null;
    const dateStr = columns[0];
    const rawTitle = columns[1];
    const tipoStr = columns[3] || 'Compra à vista';
    const amount = parseInterAmount(columns[4] || '0');

    let paymentMethod: 'À Vista' | 'Parcelado' = 'À Vista';
    let installmentNumber: number | null = null;
    let installmentTotal: number | null = null;

    if (tipoStr.includes('Parcela')) {
      paymentMethod = 'Parcelado';
      const match = tipoStr.match(/Parcela\s+(\d+)\/(\d+)/i);
      if (match) {
        installmentNumber = parseInt(match[1]);
        installmentTotal = parseInt(match[2]);
      }
    }

    return {
      dateStr, rawTitle, amount,
      type: 'Crédito' as const,
      paymentMethod, installmentNumber, installmentTotal,
    };
  }
}

// === src/repositories/category-mapping.repository.ts ===
import { prisma } from '@/lib/prisma';
import { normalizeRawTitle, getDiceCoefficient } from '@/lib/utils';

const MIN_PATTERN_LENGTH = 6;

export const categoryMappingRepository = {
  async findAll() {
    return prisma.categoryMapping.findMany({ orderBy: { rawPattern: 'asc' } });
  },

  findMatchingRule(normalizedText: string, mappings: any[]) {
    return mappings.find(m =>
      normalizedText.includes(m.rawPattern) ||
      (normalizedText.length >= MIN_PATTERN_LENGTH && m.rawPattern.includes(normalizedText))
    ) || null;
  },

  findBestDiceMatch(normalizedText: string, mappings: any[], threshold = 0.35) {
    let bestMatch: any | null = null;
    let highestScore = 0;
    for (const mapping of mappings) {
      const score = getDiceCoefficient(normalizedText, normalizeRawTitle(mapping.rawPattern));
      if (score > highestScore) { highestScore = score; bestMatch = mapping; }
    }
    return highestScore >= threshold ? { match: bestMatch, score: highestScore } : null;
  },
  // ...
};

// === src/app/actions/transaction.actions.ts — orquestrador fino ===
'use server';
import { getParser } from '@/parsers';
import { transactionRepository } from '@/repositories';
import { categoryMappingRepository } from '@/repositories';
import { metadataRepository } from '@/repositories';
import { ParsedTransaction } from '@/types';
import { normalizeRawTitle, calculateBillingMonth } from '@/lib/utils';

export async function parseCSVAction(csvText: string, bank: 'Inter' | 'Nubank'): Promise<ParsedTransaction[]> {
  const parser = getParser(bank);
  const config = await metadataRepository.getCardClosingConfig(bank);
  const mappings = await categoryMappingRepository.findAll();
  const existingHashes = await transactionRepository.findAllHashes();
  // ... lógica de orquestração limpa (~50 linhas) ...
}
```

---

## 6. Apontamento de Anomalias em Regras de Negócio (Se houver)

- **Arquivo / Trecho:** `src/app/actions.ts:1318-1319`
- **Descrição do Problema:** O filtro `.filter(item => item.count >= 2)` na função `syncUnmappedTransactions` oculta transações com ocorrência única (count === 1) da fila de parametrização. Isso significa que gastos significativos pontuais nunca aparecem para o usuário mapear.
- **Ação Recomendada para Tratamento Posterior:** Conforme documentado na análise geral (linha 83-96 de `analise_geral_app.md`), mover esse filtro para a camada de apresentação (front-end) e armazenar todas as transações sem mapeamento no banco. O repository deve persistir todos os itens; a view pode oferecer filtros "Recorrentes (2+)" e "Todos".

---

- **Arquivo / Trecho:** `src/app/actions.ts:259` (dentro de `parseCSVAction`)
- **Descrição do Problema:** O campo `type` é inicializado como `'Crédito'` para todos os bancos e nunca é derivado da coluna `Tipo` do CSV do Inter. Compras no débito ficam marcadas como crédito.
- **Ação Recomendada para Tratamento Posterior:** Conforme documentado na análise geral (linhas 59-79 de `analise_geral_app.md`), criar um método no `InterParser` que mapeia a coluna `Tipo` do CSV para `'Crédito' | 'Débito'`. Sinalizado para discussão pela equipe.

---

## 7. Critérios de Aceite e Verificação

- [ ] Arquivo `actions.ts` original removido; nenhuma referência direta a `prisma.xxx` em server actions
- [ ] Todas as 27 server actions exportadas continuam acessíveis via `import { ... } from './actions'` (barrel export)
- [ ] `parseCSVAction` usa Strategy Pattern: `getParser(bank)` instancia o parser correto
- [ ] Adicionar parser para um novo banco requer apenas criar um arquivo que implementa `BankParser` (sem alterar `parseCSVAction`)
- [ ] Repositories encapsulam 100% do acesso ao Prisma
- [ ] Build do Next.js (`npm run build`) passa sem erros
- [ ] Comportamento funcional do app permanece 100% idêntico
- [ ] Matching engine (substring + Dice) preservada integralmente no repository sem alteração de thresholds ou lógica
