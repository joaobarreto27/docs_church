# Fluxograma de Decisão de Design Patterns

## Decisão Rápida por Cenário

### Cenário: "Preciso acessar dados do banco"

```
Quantas actions acessam essa tabela?
├── 1 action apenas → prisma direto (KISS)
└── 2+ actions → Repository Pattern
    └── Os dados podem vir de fontes diferentes no futuro?
        ├── Sim → Repository com interface abstrata
        └── Não → Repository com implementação direta
```

### Cenário: "Tenho if/else por tipo"

```
Quantos ramos existem?
├── 2 ramos, < 10 linhas cada → if/else simples (KISS)
├── 2 ramos, > 20 linhas cada → Strategy Pattern
└── 3+ ramos → Strategy + Factory Pattern
    └── Novos tipos podem surgir?
        ├── Sim → Factory obrigatória (Open/Closed)
        └── Não → Strategy com switch ou map
```

### Cenário: "Muitos useState no componente"

```
Quantos useState inter-relacionados?
├── 1-2 independentes → useState (KISS)
├── 3-4 que mudam juntos → considerar useReducer
└── 5+ com ação "reset all" → useReducer obrigatório
    └── O estado envolve fetch de dados?
        ├── Sim → Custom Hook + useReducer interno
        └── Não → useReducer direto no componente
```

### Cenário: "Componente muito grande"

```
Quantas linhas tem o componente?
├── < 200 linhas → manter (KISS)
├── 200-500 linhas → considerar extração
└── 500+ linhas → Composition obrigatória
    └── Tem seções visuais distintas?
        ├── Sim → 1 componente por seção
        └── Não → extrair por responsabilidade lógica
    └── Tem lógica de fetch?
        ├── Sim → Custom Hook para cada domínio
        └── Não → props drilling do pai
```

### Cenário: "Criando novos arquivos"

```
O diretório já tem index.ts?
├── Sim → atualizar barrel export
└── Não → o diretório terá 3+ arquivos?
    ├── Sim → criar index.ts agora
    └── Não → import direto (KISS)
```

---

## Combinações Comuns

| Cenário | Patterns combinados |
|---------|-------------------|
| Novo parser de banco | Strategy + Factory + Repository + Barrel Export |
| Dashboard com filtros | Reducer + Custom Hooks + Composition |
| Extrair componente de monolito | Composition + Barrel Export |
| Nova server action com CRUD | Repository + Barrel Export |
| Formulário multi-step | Reducer + Composition |

---

## Anti-Patterns (O que NÃO fazer)

| Anti-pattern | Por quê é ruim |
|-------------|----------------|
| Repository para 1 query | Over-engineering — KISS prevalece |
| Strategy para 2 ramos de 3 linhas | Mais código que o if/else original |
| useReducer para 1 boolean | `useState` é mais simples e legível |
| Barrel export de 1 arquivo | Indireção sem benefício |
| Custom Hook que retorna 15+ valores | Hook faz demais — dividir em 2+ hooks |
