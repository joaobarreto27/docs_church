# Checklist SOLID + Clean Code

Checklist para validar qualidade de código durante análise e refatoração.

---

## Single Responsibility Principle (SRP)

- [ ] Cada função tem ≤ 20 linhas de lógica (sem contar types/imports)
- [ ] Cada componente React tem 1 responsabilidade visual clara
- [ ] Cada arquivo tem 1 domínio (não mistura UI com data access)
- [ ] Cada server action é um orquestrador fino (≤ 30 linhas de lógica)

**Sinais de violação:**
- Função com `if` que seleciona comportamento totalmente diferente
- Componente que renderiza 3+ seções visuais distintas
- Arquivo com 1000+ linhas

---

## Open/Closed Principle (OCP)

- [ ] Adicionar novo tipo/variante não exige alterar código existente
- [ ] Parsers usam Strategy Pattern (novo banco = novo arquivo)
- [ ] Validações são extensíveis sem alterar validador base

**Sinais de violação:**
- `if/else` ou `switch` que cresce a cada novo tipo
- Função que precisa de alteração toda vez que novo caso surge

---

## Dependency Inversion Principle (DIP)

- [ ] Actions dependem de interfaces de repository, não de Prisma direto
- [ ] Componentes dependem de types centralizados, não de tipos inline
- [ ] Utils são importados de barrels, não de caminhos internos

**Sinais de violação:**
- `import { prisma } from '@/lib/prisma'` em server actions
- Tipos definidos inline em cada componente
- Imports com caminhos profundos (`../../../lib/utils/billing`)

---

## DRY (Don't Repeat Yourself)

- [ ] Nenhuma função com lógica idêntica em 2+ arquivos
- [ ] Nenhuma interface definida em 2+ lugares
- [ ] Constants compartilhadas centralizadas (cores, listas, formatters)

**Como verificar:**
```bash
# Procurar funções duplicadas
grep -rn "function calculateBillingMonth" src/
grep -rn "function isValidDebtorsString" src/
grep -rn "function cleanTransactionTitle" src/
# Se aparecer em 2+ arquivos → violação DRY
```

---

## KISS (Keep It Simple, Stupid)

- [ ] Não há abstrações sem uso real (Repository para 1 query é over-engineering)
- [ ] Patterns aplicados resolvem problemas reais, não hipotéticos
- [ ] Código legível sem documentação extensa

**Sinais de violação:**
- Factory para 1 implementação
- useReducer para 1 boolean
- Barrel export para 1 arquivo
- Interface abstrata que nunca terá segunda implementação

---

## Clean Code

- [ ] Nomes descritivos (não `data`, `temp`, `x`, `handleClick2`)
- [ ] Sem comentários que explicam o óbvio
- [ ] Sem código comentado/morto (`// TODO: remover depois`)
- [ ] Sem `any` desnecessário (usar tipo específico quando possível)
- [ ] Sem `console.log` de debug em produção
- [ ] Sem magic numbers (usar constants nomeadas)

---

## React-Específico

- [ ] Props interfaces explícitas e tipadas (nunca `any` para props)
- [ ] useMemo/useCallback para cálculos pesados (não para tudo)
- [ ] useEffect com dependências corretas (sem array vazio quando depende de state)
- [ ] Sem state derivado (calculável via useMemo, não duplicado em useState)
- [ ] Keys estáveis em listas (não usar index como key se lista muda)
