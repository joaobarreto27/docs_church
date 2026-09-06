---
name: design-patterns
description: >
  Guia de referência de Design Patterns com implementações concretas para projetos
  Next.js/TypeScript. 7 patterns documentados com quando usar, como implementar, e
  exemplos antes/depois reais. Trigger: /patterns, "qual pattern usar", "design pattern".
---

# Design Patterns — Guia de Referência

## Quando Usar

Acione esta skill quando:
- Precisar decidir qual pattern aplicar a um problema
- Estiver gerando código que envolve acesso a dados, lógica alternável, ou estado complexo
- Quiser referência rápida de como implementar um pattern neste projeto
- A skill `prompt-engineer` precisar injetar patterns em um prompt

**Triggers:** `/patterns`, "qual pattern usar", "design pattern para", "como organizar", "repository pattern", "strategy pattern"

---

## Índice de Patterns

| # | Pattern | Problema que resolve | Referência |
|---|---------|---------------------|------------|
| 1 | **Repository** | Acoplamento direto a Prisma/banco nas actions | `references/repository-pattern.md` |
| 2 | **Strategy + Factory** | if/else por tipo (parsers, gateways, cálculos) | `references/strategy-pattern.md` |
| 3 | **Reducer** | 3+ useState inter-relacionados na UI | `references/reducer-pattern.md` |
| 4 | **Composition** | Componentes monolíticos com múltiplas responsabilidades | `references/composition-pattern.md` |
| 5 | **Custom Hooks** | Data fetching + loading/error duplicado entre componentes | `references/custom-hooks-pattern.md` |
| 6 | **Barrel Export** | Imports caóticos em módulos com múltiplos arquivos | `references/barrel-exports.md` |

---

## Fluxograma Rápido de Decisão

```
Meu código precisa de...
│
├── Acessar banco/API/storage?
│   └── ✅ Repository Pattern
│
├── Lógica que varia por tipo? (if Inter... else Nubank...)
│   └── ✅ Strategy + Factory
│
├── 3+ useState que mudam juntos?
│   └── ✅ Reducer Pattern
│
├── Componente com 500+ linhas ou múltiplas seções visuais?
│   └── ✅ Composition (extrair sub-componentes)
│
├── useEffect + fetch + loading + error repetido?
│   └── ✅ Custom Hook
│
├── Criando novo arquivo em módulo existente?
│   └── ✅ Barrel Export (atualizar index.ts)
│
└── Nenhum dos acima?
    └── 🟢 KISS — não force um pattern
```

---

## Regras Gerais

1. **Patterns são ferramentas, não dogmas.** Não aplique Repository para um `prisma.findMany` chamado uma única vez.
2. **KISS primeiro.** Se a implementação direta é mais simples que o pattern, use a direta.
3. **Combinar patterns é comum:** Strategy + Factory + Repository é padrão para pipelines de dados.
4. **Barrel Exports são quase sempre bons:** A exceção é quando o módulo tem um único arquivo.

---

## Referências

Cada pattern tem um arquivo dedicado em `references/` com:
- **Problema:** O que o código problemático parece
- **Solução:** Interface/implementação completa
- **Antes vs. Depois:** Código real extraído do projeto
- **Quando NÃO usar:** Casos onde o pattern é over-engineering

Consulte `examples/pattern-decision-tree.md` para o fluxograma completo com exemplos.
