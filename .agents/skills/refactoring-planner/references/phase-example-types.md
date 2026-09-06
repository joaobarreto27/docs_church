# Plano de Refatoração - Fase 1: Tipos, Interfaces e Utilitários Compartilhados

## 1. Objetivo da Fase

Extrair todas as definições de tipos, interfaces e funções utilitárias puras que estão espalhadas (e em muitos casos duplicadas) entre `page.tsx` e `actions.ts` para módulos centralizados. Isso elimina a duplicação de código, estabelece contratos tipados reutilizáveis e cria a fundação sobre a qual as fases subsequentes operam.

**Impacto esperado:**
- Eliminação de **3 funções duplicadas** entre client e server (`calculateBillingMonth`, `isValidDebtorsString`, `cleanTransactionTitle`)
- Centralização de **7+ interfaces de props** hoje definidas inline
- Redução de ~200 linhas duplicadas entre `page.tsx` e `actions.ts`
- Barrel exports que simplificam imports em todas as camadas

---

## 2. Escopo de Arquivos Afetados

### Arquivos que serão criados:
- `src/types/index.ts` — Barrel export
- `src/types/transaction.ts` — `ParsedTransaction`, tipos de banco, pagamento, status
- `src/types/ui.ts` — `Tab`, props de views, props de modais, `CardClosingConfig`
- `src/types/support.ts` — Tipos de support items e metadata
- `src/lib/utils/billing.ts` — `calculateBillingMonth`
- `src/lib/utils/text.ts` — `normalizeRawTitle`, `cleanTransactionTitle`, `getDiceCoefficient`
- `src/lib/utils/csv.ts` — `splitCSVLine`, `splitNormalCSVLine`, `parseInterAmount`, `parseNubankAmount`
- `src/lib/utils/validation.ts` — `isValidDebtorsString`
- `src/lib/utils/display.ts` — `getDisplayDivision`, `formatBRL`
- `src/lib/utils/index.ts` — Barrel export

### Arquivos que serão modificados (imports apenas):
- `src/app/page.tsx` — Remover definições locais, importar de `@/types` e `@/lib/utils`
- `src/app/actions.ts` — Remover definições locais, importar de `@/types` e `@/lib/utils`
- `src/components/DashboardView.tsx` — Importar tipos de `@/types`

---

## 3. Padrões e Princípios Aplicados

- **DRY (Don't Repeat Yourself):** Eliminação de 3 funções idênticas duplicadas entre client e server side
- **Single Responsibility Principle (SRP):** Cada módulo de utils tem uma responsabilidade clara (billing, text, csv, validation, display)
- **KISS:** Barrel exports simples via `index.ts` sem sobre-engenharia de abstrações
- **Dependency Inversion (preparação):** Tipos centralizados permitem que fases futuras usem interfaces ao invés de implementações concretas

---

## 4. Passo a Passo Técnico de Implementação

### 4.1. Criar `src/types/transaction.ts`

Extrair de `actions.ts` (linhas 70-95):
- Interface `ParsedTransaction`
- Type aliases: `BankType`, `PaymentType`, `PaymentMethod`, `TransactionStatus`
- Interface `CardClosingConfig` (reusada em múltiplos componentes como tipo inline `{ dueDay: number; daysBefore: number }`)

### 4.2. Criar `src/types/ui.ts`

Extrair de `page.tsx`:
- `Tab` type (linha 147)
- `ImportViewProps` (linhas 1155-1165)
- `ManualViewProps` (linhas 1934-1965)
- `DeParaViewProps` (linhas 2751-2770)
- `MonthlyViewProps` (linhas 4086-4107)
- `QuickDeParaModalProps` (linhas 709-733)
- `SplitTransactionModalProps` (linhas 963+)
- `DashboardViewProps` (de `DashboardView.tsx`, linhas 40-52)
- Tipo compartilhado `StatusMessage` (`{ type: 'success' | 'error' | 'info'; text: string }`)
- Tipo compartilhado `ExpenseTypeWithCategory` (`{ value: string; category: string; reserva: string | null }`)
- Tipo `TriggerStatusFn` (`(type: 'success' | 'error' | 'info', text: string) => void`)
- Tipo `ViewMode` (`'fatura' | 'calendario'`)

### 4.3. Criar `src/types/support.ts`

Definir tipos para dados de apoio:
- `SupportItemType` — union type dos tipos de support (`'CATEGORY' | 'RESERVA' | 'BANK' | ...`)
- `MetadataResponse` — tipo de retorno de `getMetadataAction()`

### 4.4. Criar `src/types/index.ts`

Barrel export de todos os módulos de tipos:
```typescript
export * from './transaction';
export * from './ui';
export * from './support';
```

### 4.5. Criar `src/lib/utils/billing.ts`

Extrair `calculateBillingMonth` (duplicada em `actions.ts:23-67` e `page.tsx:31-75`).
Manter a implementação idêntica — única fonte de verdade.

### 4.6. Criar `src/lib/utils/text.ts`

Extrair de `actions.ts`:
- `normalizeRawTitle` (linhas 164-174)
- `cleanTransactionTitle` (linhas 176-182, duplicada em `page.tsx:88-94`)
- `getDiceCoefficient` (linhas 185-210)

### 4.7. Criar `src/lib/utils/csv.ts`

Extrair de `actions.ts`:
- `splitNormalCSVLine` (linhas 110-127)
- `splitCSVLine` (linhas 129-145)
- `parseInterAmount` (linhas 148-153)
- `parseNubankAmount` (linhas 156-161)

### 4.8. Criar `src/lib/utils/validation.ts`

Extrair `isValidDebtorsString` (duplicada em `actions.ts:97-106` e `page.tsx:77-86`).

### 4.9. Criar `src/lib/utils/display.ts`

Extrair de `page.tsx`:
- `getDisplayDivision` (linhas 96-114)
- `formatBRL` (linha 2181+)

### 4.10. Criar `src/lib/utils/index.ts`

```typescript
export * from './billing';
export * from './text';
export * from './csv';
export * from './validation';
export * from './display';
```

### 4.11. Atualizar imports em `actions.ts`

Remover as definições locais de:
- `calculateBillingMonth` (linhas 23-67)
- `isValidDebtorsString` (linhas 97-106)
- `cleanTransactionTitle` (linhas 176-182)
- `normalizeRawTitle` (linhas 164-174)
- `splitCSVLine`, `splitNormalCSVLine` (linhas 110-145)
- `parseInterAmount`, `parseNubankAmount` (linhas 148-161)
- `getDiceCoefficient` (linhas 185-210)
- `ParsedTransaction` interface (linhas 70-95)

Substituir por:
```typescript
import { ParsedTransaction } from '@/types';
import { 
  calculateBillingMonth, 
  isValidDebtorsString, 
  cleanTransactionTitle,
  normalizeRawTitle,
  splitCSVLine,
  parseInterAmount,
  parseNubankAmount,
  getDiceCoefficient
} from '@/lib/utils';
```

### 4.12. Atualizar imports em `page.tsx`

Remover as definições locais de:
- `calculateBillingMonth` (linhas 31-75)
- `isValidDebtorsString` (linhas 77-86)
- `cleanTransactionTitle` (linhas 88-94)
- `getDisplayDivision` (linhas 96-114)
- Todas as interfaces inline de props dos views

Substituir por:
```typescript
import { ParsedTransaction, Tab, ImportViewProps, ManualViewProps, /* etc */ } from '@/types';
import { calculateBillingMonth, isValidDebtorsString, cleanTransactionTitle, getDisplayDivision, formatBRL } from '@/lib/utils';
```

### 4.13. Atualizar imports em `DashboardView.tsx`

Importar `DashboardViewProps` de `@/types` ao invés de definir localmente.

---

## 5. Exemplo de Código (Antes vs. Depois)

### Antes:

```typescript
// === actions.ts (linha 23-67) ===
function calculateBillingMonth(txDate: Date, dueDay: number, daysBefore: number = 7): string {
  const Y = txDate.getUTCFullYear();
  const M = txDate.getUTCMonth() + 1;
  if (dueDay >= 31) { return `${Y}-${String(M).padStart(2, '0')}`; }
  // ... 40+ linhas idênticas ...
}

// === page.tsx (linha 31-75) — CÓPIA EXATA ===
function calculateBillingMonth(txDate: Date, dueDay: number, daysBefore: number = 7): string {
  const Y = txDate.getUTCFullYear();
  const M = txDate.getUTCMonth() + 1;
  if (dueDay >= 31) { return `${Y}-${String(M).padStart(2, '0')}`; }
  // ... 40+ linhas idênticas ...
}

// === actions.ts (linha 97-106) ===
function isValidDebtorsString(dividedByStr: string | null | undefined): boolean {
  // ... lógica duplicada em page.tsx:77-86 ...
}

// === actions.ts (linha 70-95) ===
export interface ParsedTransaction {
  id?: string;
  date: string;
  o_que_gastei: string;
  // ... definido inline, sem reuso tipado ...
}
```

### Depois:

```typescript
// === src/types/transaction.ts ===
export type BankType = 'Inter' | 'Nubank' | 'Manual';
export type PaymentMethod = 'À Vista' | 'Parcelado';
export type TransactionStatus = 'A pagar' | 'Pago';

export interface CardClosingConfig {
  dueDay: number;
  daysBefore: number;
}

export interface ParsedTransaction {
  id?: string;
  date: string;
  o_que_gastei: string;
  onde: string;
  category: string;
  expenseType?: string | null;
  amount: number;
  bank: BankType;
  type: 'Crédito' | 'Débito';
  paymentMethod: PaymentMethod;
  installmentNumber?: number | null;
  installmentTotal?: number | null;
  status: TransactionStatus;
  dividedBy?: string;
  totalPerPessoa?: number;
  hash: string;
  rawTitle: string;
  reserva?: string | null;
  paymentType?: string | null;
  isSuggested?: boolean;
  userPercentage?: number | null;
  customDivision?: boolean;
  customValues?: Record<string, string | number> | null;
  billingMonth?: string | null;
}

// === src/lib/utils/billing.ts — ÚNICA FONTE DE VERDADE ===
export function calculateBillingMonth(txDate: Date, dueDay: number, daysBefore: number = 7): string {
  const Y = txDate.getUTCFullYear();
  const M = txDate.getUTCMonth() + 1;

  if (dueDay >= 31) {
    return `${Y}-${String(M).padStart(2, '0')}`;
  }

  const getClosingDate = (year: number, month: number) => {
    const dueDate = new Date(Date.UTC(year, month - 1, dueDay, 12, 0, 0));
    dueDate.setUTCDate(dueDate.getUTCDate() - daysBefore);
    return dueDate;
  };

  const candidateMonths = [
    { y: M === 1 ? Y - 1 : Y, m: M === 1 ? 12 : M - 1 },
    { y: Y, m: M },
    { y: M === 12 ? Y + 1 : Y, m: M === 12 ? 1 : M + 1 },
    { y: M >= 11 ? Y + 1 : Y, m: M >= 11 ? (M + 2 - 12) : M + 2 }
  ];

  let invoiceYear = Y;
  let invoiceMonth = M;

  for (const cand of candidateMonths) {
    const closingDate = getClosingDate(cand.y, cand.m);
    if (txDate.getTime() < closingDate.getTime()) {
      invoiceYear = cand.y;
      invoiceMonth = cand.m;
      break;
    }
  }

  const finalDate = new Date(Date.UTC(invoiceYear, invoiceMonth - 2, 1, 12, 0, 0));
  const finalY = finalDate.getUTCFullYear();
  const finalM = finalDate.getUTCMonth() + 1;

  return `${finalY}-${String(finalM).padStart(2, '0')}`;
}

// === src/lib/utils/validation.ts — ÚNICA FONTE DE VERDADE ===
export function isValidDebtorsString(dividedByStr: string | null | undefined): boolean {
  if (!dividedByStr) return false;
  const trimmed = dividedByStr.trim();
  if (trimmed.startsWith('100% ')) return true;
  if (trimmed.startsWith('Divisão (')) return false;
  if (/^\d+$/.test(trimmed)) return false;
  const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return false;
  return parts.every(part => !/^\d+$/.test(part) && !part.toLowerCase().includes('divisao'));
}

// === actions.ts (refatorado) ===
import { ParsedTransaction } from '@/types';
import { calculateBillingMonth, isValidDebtorsString, cleanTransactionTitle } from '@/lib/utils';
// Nenhuma duplicação — usa os módulos centralizados

// === page.tsx (refatorado) ===
import { ParsedTransaction, Tab } from '@/types';
import { calculateBillingMonth, isValidDebtorsString, cleanTransactionTitle, getDisplayDivision } from '@/lib/utils';
// Nenhuma duplicação — usa os módulos centralizados
```

---

## 6. Apontamento de Anomalias em Regras de Negócio (Se houver)

> Nenhuma anomalia de regra de negócio identificada nesta fase. As funções extraídas são utilitárias puras e as interfaces refletem os contratos existentes sem alteração.

**Observação de qualidade (não é anomalia de regra):** A função `calculateBillingMonth` existe em duas versões *idênticas* (server e client). Ao centralizar em `src/lib/utils/billing.ts`, a função pode ser importada em ambos os lados (`'use server'` actions e `'use client'` components) porque é uma função pura sem dependências de runtime. Isso é seguro e não altera comportamento.

---

## 7. Critérios de Aceite e Verificação

- [ ] Nenhuma função duplicada entre `page.tsx` e `actions.ts` (grep por nomes das 3 funções retorna apenas imports)
- [ ] `ParsedTransaction` é importado de `@/types` em todos os arquivos que o utilizam
- [ ] `calculateBillingMonth`, `isValidDebtorsString`, `cleanTransactionTitle` são importados de `@/lib/utils` em todos os pontos de uso (actions.ts: 4 chamadas de billing, 3 de debtors, 3 de cleanTitle; page.tsx: 2 de billing, 14 de debtors, 5 de cleanTitle)
- [ ] Build do Next.js (`npm run build`) passa sem erros de tipo
- [ ] Comportamento funcional do app permanece 100% idêntico (nenhuma lógica de negócio alterada)
- [ ] Barrel exports funcionam corretamente (`import { X } from '@/types'` e `import { Y } from '@/lib/utils'`)
