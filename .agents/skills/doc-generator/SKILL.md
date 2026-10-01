---
name: doc-generator
description: >
  Gera documentação técnica Staff-level em dois modos: PRD (Product Requirements Document)
  para projetos/features complexas, e Phase (documento de fase de implementação) com 7
  seções padronizadas. Trigger: /doc, "criar PRD", "documentar fase".
---

# Doc Generator — Documentação Técnica Staff-Level

## Quando Usar

Acione esta skill quando o usuário pedir para:
- Criar um PRD para um projeto ou feature complexa
- Documentar uma fase de implementação
- Gerar documento técnico com padrão de qualidade consistente

**Triggers:** `/doc`, "criar PRD", "gerar PRD", "documentar fase", "criar documento técnico", "template de fase"

---

## Modo 1: PRD (Product Requirements Document)

Use para projetos que requerem múltiplas fases de implementação, análise profunda, ou coordenação entre equipes.

### Workflow

1. **Coletar contexto:** Stack, repositório, arquivos de referência, escopo
2. **Gerar PRD** seguindo o template em `references/prd-template.md`
3. **Salvar** em `docs/[feature]/prd.md` ou path indicado pelo usuário

### Seções Obrigatórias do PRD

```markdown
# ROLE & CONTEXTO
# ARQUIVOS DE ENTRADA & REFERÊNCIAS
# ⚠️ RESTRIÇÃO CRÍTICA (INVIOLÁVEL)
# DIRETRIZES DE ARQUITETURA E QUALIDADE (OBRIGATÓRIO)
# PASSO A PASSO DE EXECUÇÃO
# FORMATO DA SAÍDA
# REGRAS DE SAÍDA E RESTRIÇÕES
```

### Referência Completa
Consulte `references/prd-template.md` para o template completo com exemplos.
Consulte `references/prd-example.md` para um exemplo real de PRD aplicado.

---

## Modo 2: Phase (Documento de Fase)

Use para documentar uma fase individual de implementação com nível de detalhe Staff-level.

### Workflow

1. **Investigar o codebase:** Identificar arquivos afetados, contar linhas, mapear dependências
2. **Identificar patterns:** Quais princípios SOLID e Design Patterns se aplicam
3. **Gerar documento** seguindo o template em `references/phase-template.md`
4. **Salvar** em `docs/[feature]/fases/fase-[NUM]-[nome].md`

### Seções Obrigatórias (8 seções)

```markdown
## 1. Objetivo da Fase
## 2. Escopo de Arquivos Afetados
## 3. Padrões e Princípios Aplicados
## 4. Passo a Passo Técnico de Implementação
## 5. Exemplo de Código (Antes vs. Depois)
## 6. Apontamento de Anomalias em Regras de Negócio (Se houver)
## 7. Critérios de Aceite e Verificação
## 8. Verificação de Integridade e Rastreabilidade RTM (spec-compliance-guardian)
```

### Benchmarks de Qualidade

| Critério | Mínimo | Ideal |
|----------|--------|-------|
| Linhas do documento | 200 | 300-475 |
| Referências a linhas de código | 5+ | 15+ |
| Blocos de código (antes/depois) | 1 par | 2-3 pares |
| Critérios de aceite | 3 | 5-7 |
| Interfaces TypeScript completas | 1 | Todas as novas |

### Referência Completa
Consulte `references/phase-template.md` para o template com instruções detalhadas.
Consulte `references/phase-example.md` para um exemplo real de fase implementada.

---

## Modo 3: Fluxo Econômico de PRD & Fases (Draft Local ➔ Aprovação ➔ Notion)

Para maximizar a **economia de tokens** e a **velocidade de iteração**, a documentação de temas, fases e subfases segue um protocolo de quatro etapas:

### 1. Etapa 1: Elaboração Local (Zero Consumo de API)
* O PRD, a decomposição ou os documentos de fase são criados e refinados primeiramente em arquivos locais dentro de `docs/` (ex: `docs/decomposicao/README.md`, `docs/fase-1/...`).
* Se houver uma tarefa-origem no Notion (`PDC-X`), o agente lê o contexto inicial uma única vez:
  ```bash
  python3 scripts/notion-sync.py --get-task PDC-X
  ```
* O usuário e o agente refinam o conteúdo livremente no Markdown local sem gastar chamadas nem tokens repetidos da API do Notion.

### 2. Etapa 2: Gate de Aprovação do Usuário
* O agente apresenta o resumo do plano elaborado e aguarda a aprovação explícita do usuário:
  > *"O plano técnico da fase foi estruturado em `docs/...`. Posso sincronizar com o Notion?"*

### 3. Etapa 3: Publicação em Lote & Criação de Tarefas-Filhas
Após a aprovação, o agente publica atomicamente o documento completo no Notion:
* **Publicar Documento como Tarefa ou Subtarefa:**
  ```bash
  python3 scripts/notion-sync.py --sync-doc docs/meu-plano.md --parent PDC-X --tipo "Feature" --prioridade "Alta" --modulo "Liturgia & Blocos"
  ```
  O script cria o card no Notion, vincula a relação pai-filho e injeta todo o Markdown no corpo da página.

### 4. Etapa 4: Edições e Atualizações no Notion
Se for necessário atualizar propriedades ou complementar o corpo de uma tarefa existente no Notion:
* **Atualizar propriedades:**
  ```bash
  python3 scripts/notion-sync.py --update-task PDC-4 --title "Novo Título" --prioridade "Alta" --status "Em Progresso"
  ```
* **Anexar conteúdo Markdown no corpo do card:**
  ```bash
  python3 scripts/notion-sync.py --update-task PDC-4 --append-body "### 📝 Atualização Litúrgica..."
  ```
*(Nota: Se o usuário NÃO desejar sincronizar com o Notion, o doc-generator preserva apenas o arquivo em docs/ normalmente).*

---

## Regras Gerais (ambos os modos)

1. **Nomes reais, nunca placeholders:** Referencie arquivos, funções, e linhas reais
2. **Kebab-case** para nomes de arquivos: `fase-01-tipos-e-utilitarios.md`
3. **Tom de voz:** Direto, técnico, prescritivo, orientado à arquitetura
4. **Preservação de regras:** Se encontrar anomalias, documentar sem corrigir
5. **Sem explicações desnecessárias:** Foco em ação e decisão

---

## Referências

- `references/prd-template.md` — Template completo do PRD
- `references/phase-template.md` — Template das 7 seções de fase
- `references/prd-example.md` — Exemplo real: PRD da refatoração
- `references/phase-example.md` — Exemplo real: Fase 01 (tipos e utilitários)
- `examples/quality-benchmarks.md` — Métricas de qualidade dos documentos
