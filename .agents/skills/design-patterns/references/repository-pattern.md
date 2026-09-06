# Repository Pattern

## Problema

Acesso direto ao Prisma (ou qualquer ORM/API) espalhado pelas server actions. Acoplamento forte dificulta testes, troca de banco, e gera duplicação de queries.

```typescript
// ❌ ANTES: prisma direto na action (27 actions com prisma.xxx)
'use server';
import { prisma } from '@/lib/prisma';

export async function parseCSVAction(csvText: string, bank: string) {
  // ... lógica de parsing ...
  const existingHashes = new Set(
    (await prisma.transaction.findMany({ select: { hash: true } })).map(t => t.hash)
  );
  // ... mais prisma.transaction.create, prisma.categoryMapping.findMany, etc. ...
}

export async function deleteTransactionAction(id: string) {
  await prisma.transaction.delete({ where: { id } });
}

export async function getMonthlyTransactionsAction(month: string, year: string) {
  const transactions = await prisma.transaction.findMany({
    where: { /* filtros complexos */ },
    orderBy: { date: 'desc' },
  });
  // ... processamento ...
}
```

## Solução

Encapsular TODAS as operações de dados em repositories por entidade. Actions viram orquestradores finos.

```typescript
// ✅ DEPOIS: Repository encapsula Prisma

// === src/repositories/transaction.repository.ts ===
import { prisma } from '@/lib/prisma';

export const transactionRepository = {
  async findAllHashes(): Promise<Set<string>> {
    const records = await prisma.transaction.findMany({ select: { hash: true } });
    return new Set(records.map(t => t.hash));
  },

  async createMany(data: any[]): Promise<void> {
    for (const item of data) {
      await prisma.transaction.create({ data: item });
    }
  },

  async create(data: any): Promise<any> {
    return prisma.transaction.create({ data });
  },

  async findById(id: string): Promise<any> {
    return prisma.transaction.findUnique({ where: { id } });
  },

  async update(id: string, data: any): Promise<any> {
    return prisma.transaction.update({ where: { id }, data });
  },

  async delete(id: string): Promise<void> {
    await prisma.transaction.delete({ where: { id } });
  },

  async findByMonth(month: string, year: string, viewMode: string): Promise<any[]> {
    // ... lógica de filtro por mês com billingMonth ou date range ...
    return prisma.transaction.findMany({ where: { /* ... */ }, orderBy: { date: 'desc' } });
  },

  async findDistinctYears(): Promise<string[]> {
    const records = await prisma.transaction.findMany({
      select: { date: true },
      distinct: ['date'],
    });
    return [...new Set(records.map(t => t.date.substring(0, 4)))].sort().reverse();
  },
};

// === src/repositories/index.ts (barrel export) ===
export { transactionRepository } from './transaction.repository';
export { categoryMappingRepository } from './category-mapping.repository';
export { supportRepository } from './support.repository';
export { metadataRepository } from './metadata.repository';

// === src/app/actions/transaction.actions.ts (orquestrador fino) ===
'use server';
import { transactionRepository } from '@/repositories';

export async function deleteTransactionAction(id: string) {
  await transactionRepository.delete(id);  // ✅ Sem prisma direto
}
```

## Quando Usar

- ✅ Múltiplas actions acessam a mesma tabela/entidade
- ✅ Queries complexas duplicadas entre actions
- ✅ Planejamento de migração de banco (SQLite → PostgreSQL)
- ✅ Necessidade de testes unitários (mock do repository)

## Quando NÃO Usar

- ❌ Acesso único a uma tabela em todo o projeto
- ❌ Script one-off de migração (usar prisma direto é OK)
- ❌ Prototype/MVP onde velocidade de desenvolvimento é prioridade

## Estrutura de Arquivos

```
src/repositories/
├── transaction.repository.ts      # CRUD de Transaction
├── category-mapping.repository.ts # CRUD + matching engine
├── support.repository.ts          # CRUD de SupportItem
├── metadata.repository.ts         # Config do sistema
├── unmapped.repository.ts         # Sync + query de unmapped
└── index.ts                       # Barrel export
```
