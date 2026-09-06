# Regras de Injeção de Design Patterns nos Prompts

Este arquivo define QUANDO e COMO injetar cada Design Pattern na seção "DIRETRIZES DE ARQUITETURA" do prompt gerado.

---

## Mapa de Decisão

### Repository Pattern
**Injetar quando:** A demanda envolve criar, ler, atualizar ou deletar dados persistidos (banco de dados, API externa, localStorage).

**Sinais no input:**
- "salvar no banco", "buscar transações", "CRUD", "Prisma", "server action que acessa dados"
- Qualquer menção a `prisma.xxx.create/findMany/update/delete`

**O que injetar no prompt:**
```
DIRETRIZES DE ARQUITETURA:
- **Repository Pattern:** Encapsule operações de dados em um repository dedicado
  (ex: `src/repositories/[entidade].repository.ts`). As server actions devem chamar
  métodos do repository, nunca `prisma.xxx` diretamente. Isso permite trocar a
  implementação (SQLite → PostgreSQL) sem alterar actions.
```

---

### Strategy Pattern + Factory
**Injetar quando:** A lógica varia conforme um tipo/categoria e pode crescer no futuro.

**Sinais no input:**
- "parser de banco", "depende do tipo", "se for Inter faz X, se for Nubank faz Y"
- Qualquer `if/else` ou `switch` que seleciona algoritmo por tipo

**O que injetar no prompt:**
```
DIRETRIZES DE ARQUITETURA:
- **Strategy Pattern:** Defina uma interface (ex: `BankParser`) com método(s) que cada
  implementação deve ter. Crie uma classe/objeto por variante (ex: `InterParser`,
  `NubankParser`).
- **Factory Pattern:** Crie uma função factory `getParser(type)` que retorna a
  implementação correta. Novas variantes = novo arquivo, sem alterar código existente.
```

---

### Reducer Pattern (State/Reducer)
**Injetar quando:** O componente gerencia 3+ estados inter-relacionados (filtros, formulários complexos, wizards multi-step).

**Sinais no input:**
- "múltiplos filtros", "8 estados", "formulário com muitos campos"
- "limpar todos os filtros", "resetar estado"
- 3+ `useState` que mudam juntos ou têm dependências

**O que injetar no prompt:**
```
DIRETRIZES DE ARQUITETURA:
- **Reducer Pattern:** Substitua os múltiplos `useState` por um `useReducer` com:
  - `type State = { field1: ...; field2: ...; ... };`
  - `type Action = { type: 'SET_X'; value: ... } | { type: 'CLEAR_ALL' };`
  - Reducer function pura que retorna novo state
  Isso centraliza as transições de estado e facilita ações como "limpar tudo".
```

---

### Composition Pattern
**Injetar quando:** Um componente grande está sendo decomposto ou um novo componente precisa ser criado com responsabilidade única.

**Sinais no input:**
- "extrair componente", "decompor", "criar componente separado"
- "componente muito grande", "muitas linhas"

**O que injetar no prompt:**
```
DIRETRIZES DE ARQUITETURA:
- **Composition:** Extraia o componente para arquivo próprio em
  `src/components/[domínio]/[ComponentName].tsx`. Defina uma interface de Props
  explícita. O componente pai orquestra via composição, passando dados como props.
```

---

### Custom Hooks
**Injetar quando:** A demanda envolve data fetching + estado de loading/error, ou lógica reutilizável entre componentes.

**Sinais no input:**
- "buscar dados", "loading state", "useEffect com fetch"
- "reutilizar lógica entre componentes"

**O que injetar no prompt:**
```
DIRETRIZES DE ARQUITETURA:
- **Custom Hook:** Encapsule o data fetching em um hook dedicado
  `src/hooks/use[DomainName].ts` que retorna `{ data, loading, error, refetch }`.
  O componente consome o hook sem saber detalhes da implementação do fetch.
```

---

### Barrel Export
**Injetar quando:** Novos arquivos são criados em um módulo que já possui `index.ts`, ou quando um módulo com 3+ arquivos não tem barrel export.

**Sinais no input:**
- "criar novo arquivo em `src/types/`", "adicionar repository"
- Qualquer criação de arquivo em diretório com `index.ts`

**O que injetar no prompt:**
```
RESTRIÇÕES (adicionar ao final):
- Atualize o barrel export (`index.ts`) do diretório para incluir o novo módulo.
```

---

## Regras Gerais

1. **Múltiplos patterns podem ser injetados no mesmo prompt.** Ex: Strategy + Factory + Repository para um novo parser de banco que acessa dados.

2. **Se nenhum pattern se aplica, omita a seção DIRETRIZES DE ARQUITETURA.** Não force patterns em features simples (KISS).

3. **Barrel Export é quase sempre aplicável** quando novos arquivos são criados — injete como restrição, não como diretriz.

4. **Validar contra KISS:** Se o prompt ficaria mais complexo que a implementação direta, remova o pattern. Ex: não injetar Reducer para 2 `useState`.
