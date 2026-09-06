# Exemplos de Prompts — Features de Frontend (UI)

Exemplos reais de prompts determinísticos para funcionalidades puramente de interface (sem alteração de backend).

---

## Exemplo 1: Detalhar Gastos por Banco (Tooltip/Modal)

```
Atue como um desenvolvedor Frontend especialista em React, TypeScript e Tailwind CSS.

CONTEXTO:
Tenho uma aplicação de controle financeiro desenvolvida em Next.js. No componente `MonthlyView` dentro do arquivo `page.tsx`, existe uma array chamada `filteredTransactions` que contém as transações do mês já filtradas na memória, e uma grid com 3 cards indicadores rápidos de KPI ("Total Gasto", "Total por Pessoa" e "Total a Receber").

OBJETIVO:
Modificar exclusivamente o componente `MonthlyView` para adicionar um botão/ícone no card "Total Gasto" que, ao ser clicado, abre um Tooltip/Modal compacto flutuante exibindo o resumo tabular de "Gastos por Banco" com base no período atual filtrado.

REQUISITOS DETERMINÍSTICOS PASSO A PASSO:

1. IMPORTAÇÃO DE ÍCONES:
   - Certifique-se de que os ícones `CreditCard` e `X` da biblioteca `lucide-react` estejam disponíveis.

2. CONTROLE DE ESTADO:
   - Declare: `const [showBankTooltip, setShowBankTooltip] = useState(false);`

3. PROCESSAMENTO DE DADOS (CÁLCULO DINÂMICO):
   - Crie `useMemo` chamado `bankSpendingSummary` com dependência `[filteredTransactions]`.
   - Agrupe transações por `tx.bank`.
   - Para cada banco: `total` = soma de `tx.amount`; `personal` = soma de `tx.totalPerPessoa ?? tx.amount`.
   - Ordene decrescente por `total`.

4. MODIFICAÇÃO DO CARD KPI ("Total Gasto"):
   - Substitua a label estática por flex: "Total Gasto" à esquerda + botão `CreditCard` + "Por Banco" à direita.
   - `onClick={() => setShowBankTooltip(true)}`.

5. RENDERIZAÇÃO DO POPUP:
   - Condicional: `showBankTooltip && (...)`.
   - Modal flutuante com cabeçalho (título + botão X), corpo (iteração sobre `bankSpendingSummary` com nome, valor BRL, barra proporcional), rodapé (somatório geral).

RESTRIÇÕES:
- NÃO faça chamadas à API. Use dados em memória (`filteredTransactions`, `totalGastoSum`).
- Mantenha classes Tailwind: `dark:bg-zinc-900`, `text-zinc-800`, `dark:text-zinc-100`.
- Tipagem TypeScript respeitada.
```

**Análise do pattern:** Frontend puro, sem acesso a dados → nenhum Design Pattern injetado. Apenas estado local (`useState`) e cálculo derivado (`useMemo`).

---

## Exemplo 2: Modal de Confirmação de Exclusão

```
Atue como um desenvolvedor Frontend especialista em React, TypeScript e Tailwind CSS.

CONTEXTO:
Na listagem de transações, o usuário clica em "Excluir" e a ação deleta imediatamente ou abre `confirm()` nativo. Quero um modal customizado.

OBJETIVO:
Interpor um Modal de Confirmação antes da deleção real. O usuário confirma explicitamente.

REQUISITOS DETERMINÍSTICOS PASSO A PASSO:

1. IMPORTAÇÃO DE ÍCONES:
   - `AlertTriangle` (ou `Trash2`) e `X` de `lucide-react`.

2. CONTROLE DE ESTADO:
   - `const [transactionToDelete, setTransactionToDelete] = useState<TransactionType | null>(null);`

3. INTERCEPTAÇÃO DO CLIQUE:
   - Botão "Excluir" original: `onClick={() => setTransactionToDelete(tx)}` (não chamar deleção direta).

4. RENDERIZAÇÃO DO MODAL:
   - Condicional: `{transactionToDelete && (...)}`.
   - Overlay: `fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4`.
   - Dialog: `bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl`.
   - Ícone de alerta centralizado, título "Excluir transação?", nome + valor da transação.

5. BOTÕES DE AÇÃO:
   - Grid 2 colunas: "Cancelar" (neutro) + "Sim, Excluir" (vermelho).
   - Cancelar: `setTransactionToDelete(null)`.
   - Excluir: chama função de deleção + reseta estado.

RESTRIÇÕES:
- Não execute deleção em background enquanto modal aberto.
- Fechamento: Cancelar, ícone X, ou overlay clicável.
- Dark mode: `dark:` em todos os estilos.
```

**Análise do pattern:** Interceptação de ação com estado → nenhum pattern complexo. `useState` para rastrear transação alvo.

---

## Exemplo 3: Ordenação Dinâmica na Tabela de Parcelados

```
Atue como um desenvolvedor Frontend especialista em React, TypeScript e Tailwind CSS.

CONTEXTO:
Na sub-aba "Parcelados" (`subTab === 'parcelados'`), renderizamos tabela de transações parceladas. Sem ordenação configurável.

OBJETIVO:
Permitir ordenação crescente/decrescente ao clicar nos cabeçalhos "Parcela" e "Progresso".

REQUISITOS DETERMINÍSTICOS PASSO A PASSO:

1. CONTROLE DE ESTADO:
   - `const [parceladosSortField, setParceladosSortField] = useState<'parcela' | 'progresso' | null>(null);`
   - `const [parceladosSortDirection, setParceladosSortDirection] = useState<'asc' | 'desc'>('asc');`

2. PROCESSAMENTO DE DADOS:
   - `useMemo` `sortedParceladosTransactions` com deps `[filteredTransactions, parceladosSortField, parceladosSortDirection]`.
   - Se `'parcela'`: ordenar por `tx.installmentNumber || 0`.
   - Se `'progresso'`: ordenar por `(tx.installmentNumber / tx.installmentTotal) * 100`.

3. CABEÇALHO INTERATIVO:
   - `<th>` clicáveis com `cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800`.
   - Indicador `▲`/`▼` na coluna ativa.
   - Click em coluna inativa: ativa com `'asc'`. Click na ativa: inverte direção.

4. CORPO DA TABELA:
   - Substituir `filteredTransactions.map(...)` por `sortedParceladosTransactions.map(...)`.

RESTRIÇÕES:
- Não altere a lógica de filtragem original.
- Dark mode consistente.
```

**Análise do pattern:** Estado de ordenação simples → `useState` duplo. Se fossem 4+ campos de ordenação, seria candidato a Reducer Pattern.
