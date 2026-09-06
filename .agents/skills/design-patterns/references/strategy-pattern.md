# Strategy Pattern + Factory Pattern

## Problema

Blocos `if/else` ou `switch` que selecionam lógica diferente por tipo. Adicionar um novo tipo exige alterar a função existente (violação do Open/Closed Principle).

```typescript
// ❌ ANTES: if/else por banco dentro de parseCSVAction (260 linhas)
export async function parseCSVAction(csvText: string, bank: 'Inter' | 'Nubank') {
  // ...
  for (const line of dataLines) {
    const columns = splitCSVLine(line);

    // 40 linhas de if/else por banco
    if (bank === 'Inter') {
      const dateStr = columns[0];
      const rawTitle = columns[1];
      const tipoStr = columns[3] || 'Compra à vista';
      const amount = parseInterAmount(columns[4] || '0');
      // ... lógica específica do Inter (20 linhas) ...
    } else {
      // Nubank
      const dateStr = columns[0];
      const rawTitle = columns[2];
      const amount = parseNubankAmount(columns[3] || '0');
      // ... lógica específica do Nubank (20 linhas) ...
    }
    // ... 80 linhas de matching engine ...
  }
}
// ❌ Adicionar Itaú = mexer dentro dessa função de 260 linhas
```

## Solução

### 1. Interface (Strategy)

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

### 2. Implementações (Strategies)

```typescript
// src/parsers/inter.parser.ts
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

// src/parsers/nubank.parser.ts — estrutura idêntica, lógica específica do Nubank
```

### 3. Factory

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

### 4. Uso na Action (orquestrador fino)

```typescript
// ✅ DEPOIS: parseCSVAction usa Strategy
export async function parseCSVAction(csvText: string, bank: 'Inter' | 'Nubank') {
  const parser = getParser(bank);  // Factory seleciona o parser correto
  const config = await metadataRepository.getCardClosingConfig(bank);

  for (const line of dataLines) {
    const columns = splitCSVLine(line);
    const parsed = parser.parseLine(columns, config);  // Strategy executa
    if (!parsed) continue;
    // ... orquestração limpa (~50 linhas vs. 260 originais) ...
  }
}

// ✅ Adicionar Itaú = criar ItauParser + registrar na factory. ZERO alteração em parseCSVAction.
```

## Quando Usar

- ✅ Lógica que varia por tipo e o número de tipos pode crescer
- ✅ Blocos if/else com 20+ linhas por ramo
- ✅ Mesma interface de entrada/saída para todas as variantes

## Quando NÃO Usar

- ❌ 2 ramos com 3-5 linhas cada (if/else simples é KISS)
- ❌ A lógica é idêntica para todos os tipos (não há variação)
- ❌ Apenas 1 tipo existe e não há previsão de crescimento

## Estrutura de Arquivos

```
src/parsers/
├── bank-parser.interface.ts  # Interface + config type
├── inter.parser.ts           # Implementação Inter
├── nubank.parser.ts          # Implementação Nubank
└── index.ts                  # Factory getParser() + re-exports
```
