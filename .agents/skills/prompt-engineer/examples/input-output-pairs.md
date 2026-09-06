# Input → Output — Exemplos de Transformação

Demonstra como inputs informais do usuário se transformam em prompts determinísticos completos.

---

## Par 1: Feature Simples de UI

**Input do usuário:**
> "quero poder ver o total gasto por banco quando clico no card de Total Gasto"

**Prompt gerado:**

```
Atue como um desenvolvedor Frontend especialista em React, TypeScript e Tailwind CSS.

CONTEXTO:
Na aplicação Next.js, o componente `MonthlyView` em `src/app/page.tsx` possui uma grid
de KPI cards. O primeiro card exibe "Total Gasto" calculado a partir de `filteredTransactions`.
Os dados de banco estão disponíveis em `tx.bank` para cada transação.

OBJETIVO:
Adicionar um botão no card "Total Gasto" que abre um tooltip/modal compacto exibindo o
breakdown de gastos por banco, permitindo ao usuário conferir valores contra a fatura física.

REQUISITOS DETERMINÍSTICOS PASSO A PASSO:

1. CONTROLE DE ESTADO:
   - `const [showBankTooltip, setShowBankTooltip] = useState(false);`

2. PROCESSAMENTO DE DADOS:
   - `useMemo` `bankSpendingSummary` agrupando `filteredTransactions` por `tx.bank`.
   - Para cada banco: `total` (soma amount) e `personal` (soma totalPerPessoa ?? amount).
   - Ordenar decrescente por total.

3. MODIFICAÇÃO DO CARD:
   - Flex header: "Total Gasto" + botão CreditCard "Por Banco".
   - onClick → setShowBankTooltip(true).

4. POPUP:
   - Modal flutuante condicional com tabela: banco, total BRL, minha parte, barra proporcional.

RESTRIÇÕES:
- Sem chamadas à API. Dados em memória apenas.
- Tailwind CSS com dark mode.
- TypeScript respeitado.
```

---

## Par 2: Feature Fullstack com Pattern Injection

**Input do usuário:**
> "preciso implementar divisão de gastos personalizada, tipo 70/30, e salvar separado no banco"

**Prompt gerado (note a seção DIRETRIZES DE ARQUITETURA injetada automaticamente):**

```
Atue como um desenvolvedor Fullstack com experiência em Next.js (React, TypeScript),
Tailwind CSS e Prisma ORM (SQLite).

CONTEXTO:
O sistema possui divisão de despesas via campo `dividedBy`. Atualmente assume 50/50.
As actions `saveTransactionsAction`, `createManualTransactionAction` e
`updateTransactionAction` em `src/app/actions.ts` processam as transações.

OBJETIVO:
Implementar divisões personalizadas por porcentagem. Quando não for 50/50, dividir
fisicamente a transação no banco em 2+ linhas.

DIRETRIZES DE ARQUITETURA:
- **Repository Pattern:** Operações de criação das linhas divididas via
  `transactionRepository.createMany()`, não `prisma.transaction.create()` direto.
- **Barrel Export:** Novos utilitários de cálculo em `src/lib/utils/`, exportados via index.ts.

REQUISITOS DETERMINÍSTICOS PASSO A PASSO:
[... passos detalhados ...]

RESTRIÇÕES:
- Hashes com sufixos `_user`/`_debtor_[Nome]` para evitar conflito @unique.
- Acessar banco via Repository Pattern.
- Não alterar sincronização ou regras de de-para.
```

---

## Par 3: Bugfix

**Input do usuário:**
> "o build tá quebrando, type error na linha 562 do page.tsx, acho que é por causa do refreshMonthly que adicionei"

**Prompt gerado:**

```
O build do Next.js está falhando com Type Error na linha 562 de `src/app/page.tsx`.
A causa provável é o desalinhamento de props após a adição de `refreshMonthlyTransactions`.

1. LOCALIZAR: Componente filho instanciado na linha ~560 que recebe `refreshMonthly`.

2. ATUALIZAR INTERFACE: No componente filho, adicionar à interface de Props:
   ```typescript
   refreshMonthly: (month?: string, year?: string) => Promise<{ transactions: any[]; selectedYear: string }>;
   ```

3. DESESTRUTURAR: Adicionar `refreshMonthly` na desestruturação dos args do componente.

RESTRIÇÕES:
- Apenas sincronizar tipagens. Não alterar lógica de negócios.
```

---

## Observações

- **Par 1:** Nenhum pattern injetado — feature de UI simples com estado local.
- **Par 2:** Repository + Barrel Export injetados — feature fullstack com persistência.
- **Par 3:** Sem role, sem patterns — bugfix direto e cirúrgico.
