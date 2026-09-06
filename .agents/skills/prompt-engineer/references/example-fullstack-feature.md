# Exemplos de Prompts — Features Fullstack (Backend + Frontend)

Exemplos reais de prompts determinísticos para funcionalidades que envolvem modificações no banco de dados e na interface.

---

## Exemplo 1: Divisão Personalizada de Gastos com Split no Banco

```
Atue como um desenvolvedor Fullstack com experiência em Next.js (React, TypeScript), Tailwind CSS e Prisma ORM (SQLite).

CONTEXTO:
O sistema possui divisão de despesas (ex: "Bruno, Claudia"). Atualmente assume rateio igual (50/50). O usuário precisa de divisões desiguais (ex: 70/30). Se não for 50/50, o banco deve salvar em duas linhas separadas.

OBJETIVO:
Implementar divisões personalizadas por porcentagem no Cadastro Manual, Importação de Faturas e Edição de Gastos, dividindo fisicamente a transação no SQLite em duas ou mais linhas quando a proporção não for 50/50.

DIRETRIZES DE ARQUITETURA:
- **Repository Pattern:** As operações de criação das linhas divididas devem ser feitas via `transactionRepository.createMany()`, não via `prisma.transaction.create()` direto nas actions.
- **Barrel Export:** Se criar novos utilitários de cálculo de divisão, exportar via `src/lib/utils/index.ts`.

REQUISITOS DETERMINÍSTICOS PASSO A PASSO:

1. INTERFACE DO USUÁRIO (FRONTEND):
   - Cadastro Manual e Edição: ao preencher `dividedBy`, exibir controle de "Minha Parte (%)" (0-100).
   - Importação: coluna "Minha Parte (%)" editável. Default: 50%.
   - Enviar `userPercentage` junto com dados da transação.

2. LÓGICA DE DIVISÃO NO BANCO (BACKEND):
   - Modificar `saveTransactionsAction`, `createManualTransactionAction`, `updateTransactionAction`.
   - Se `dividedBy` preenchido e `userPercentage !== 50` e `!== 100`:
     - `userAmount = totalAmount * (userPercentage / 100)`
     - `debtorAmount = totalAmount - userAmount`
   - Gerar 2+ linhas:
     - Linha 1 (Usuário): `amount = userAmount`, `dividedBy = null`, `hash = [original]_user`
     - Linha 2 (Devedor): `amount = debtorAmount`, `dividedBy = "100% [Nome]"`, `hash = [original]_debtor_[Nome]`
   - Se 50/50: manter comportamento original.

3. PRESERVAÇÃO DE PARCELADOS:
   - Ambas as linhas preservam `installmentNumber`, `installmentTotal`, `paymentMethod = 'Parcelado'`.

RESTRIÇÕES:
- Hashes com sufixos para evitar conflito de `@unique`.
- Não alterar sincronização ou regras automáticas de de-para.
- Acessar banco via Repository Pattern.
```

**Análise do pattern:** Múltiplas actions de backend + UI → Repository Pattern para encapsular criação em lote. Strategy poderia aplicar se houvesse múltiplas estratégias de divisão.

---

## Exemplo 2: Desmembramento (Split) de Transações na Importação

```
Atue como um desenvolvedor Fullstack com experiência em Next.js (React, TypeScript), Tailwind CSS.

CONTEXTO:
Na importação de faturas em lote, algumas transações contêm compras de itens diferentes consolidados. O usuário precisa dividir uma transação em múltiplos lançamentos durante a prévia.

OBJETIVO:
Implementar split de transação na tabela de prévia, substituindo a linha original por 2+ linhas com valores que totalizam o original.

REQUISITOS DETERMINÍSTICOS PASSO A PASSO:

1. BOTÃO DE AÇÃO NA TABELA:
   - Nova coluna "Ações" com ícone `Scissors` (lucide-react).
   - Click define `splitTransactionTarget` com índice + objeto.

2. MODAL DE DESMEMBRAMENTO (`SplitTransactionModal`):
   - Exibe info do lançamento original e valor total.
   - Lista de partes dinâmicas (default: 2, dividindo valor igualmente).
   - Cada parte: descrição editável + valor editável.
   - Botão "+ Adicionar Nova Parte" e lixeira para remover (mín. 2).
   - Soma das partes em tempo real vs. total original.
   - Desabilitar "Confirmar" se soma ≠ total.

3. PROCESSAMENTO E SUBSTITUIÇÃO:
   - `handleSplitConfirm`: remove transação do `previewList` no índice, insere novas partes.
   - Cada parte: metadados originais + nova descrição + novo valor + hash `[original]_split_[i]`.

RESTRIÇÕES:
- Dark mode + Tailwind CSS.
- Não alterar salvamento ou mapeamentos De-Para.
```

---

## Exemplo 3: Validação de Soma na Divisão Desigual

```
Atue como um desenvolvedor Fullstack com experiência em Next.js (React, TypeScript) e Tailwind CSS.

CONTEXTO:
Na "Divisão Personalizada", a soma dos valores pode divergir do total. No Cadastro Manual, a soma redefine o total. Na Importação e Edição, o total é fixo (vem do arquivo/banco).

OBJETIVO:
Garantir que na Importação e Edição, a soma da divisão seja validada contra o total original. Cadastro Manual mantém regra atual.

REQUISITOS DETERMINÍSTICOS PASSO A PASSO:

1. EDIÇÃO — CONTROLE DE ESTADO:
   - Em `handleEditCustomValueChange`: remover lógica que altera `amount: sum.toString()`. O `amount` permanece fixo.

2. EDIÇÃO — VALIDAÇÃO NO SALVAMENTO:
   - Em `saveEdit`: se `editForm.customDivision`, validar soma vs. `parsedTotalAmount`. Se diferente, `triggerStatus('error', "A soma das partes deve ser exatamente igual ao total gasto")`.

3. IMPORTAÇÃO — VALIDAÇÃO:
   - Em `handleConfirm`: para cada tx com `customDivision`, validar soma vs. `tx.amount`. Se divergente, bloquear com `triggerStatus('error', ...)`.

4. CADASTRO MANUAL — PRESERVAR:
   - `handleCustomValueChange` continua recalculando `amount` a partir da soma. Não alterar.

RESTRIÇÕES:
- Não alterar regra do Cadastro Manual.
- Indicadores visuais de erro em tempo real.
- TypeScript sem erros de build.
```

**Análise do pattern:** Validação condicional por contexto (manual vs. importação vs. edição) → Strategy Pattern seria candidato se as regras de validação fossem mais complexas. Neste caso, condicional simples é suficiente (KISS).
