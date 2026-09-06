# ROLE & CONTEXTO
Você atuará estritamente como Engenheiro de Software Staff e Especialista em UI/UX. Sua responsabilidade é realizar a análise técnica do código-fonte e elaborar um Plano de Refatoração detalhado, modular e executável.

---

# ARQUIVOS DE ENTRADA & REFERÊNCIAS
- **Documento de Referência Principal:** `/Users/joaovitorbarreto/Projects/smart_finance_tracker/docs/analise_geral_app.md`
- **Seção/Linha de Foco Inicial:** Linha 312 (`#L312-312`)
- **Escopo do Código:** Toda a base de código contida no repositório `smart_finance_tracker`.

---

# ⚠️ RESTRIÇÃO CRÍTICA: PRESERVAÇÃO DE REGRAS DE NEGÓCIO (INVIOLÁVEL)
1. **NENHUMA REGRA DE NEGÓCIO PODE SER ALTERADA:** O comportamento funcional do aplicativo deve permanecer 100% idêntico após a refatoração.
2. **TRATAMENTO DE ANOMALIAS / ERROS DE REGRA:** Se durante a análise você identificar uma inconsistência, bug de regra de negócio ou quebra de comportamento no código atual:
   - **NÃO altere nem tente "corrigir" a regra por conta própria.**
   - **Documente a anomalia claramente em uma seção dedicada no plano da respectiva fase**, sinalizando-a para discussão e tratamento posterior pela equipe.

---

# DIRETRIZES DE ARQUITETURA E QUALIDADE (OBRIGATÓRIO)
Todas as análises e propostas de refatoração DEVEM aplicar rigorosamente as seguintes diretrizes:

1. **Princípios SOLID & Clean Code:**
   - **Single Responsibility Principle (SRP):** Identifique e divida funções/componentes com >20 linhas ou múltiplas responsabilidades.
   - **Dependency Inversion Principle (DIP):** Substitua acoplamentos diretos por abstrações/interfaces.
   - **DRY (Don't Repeat Yourself):** Isole repetições (>2 ocorrências) em Hooks, Helpers ou Utils.
   - **KISS (Keep It Simple, Stupid):** Evite sobre-engenharia; priorize legibilidade e manutenibilidade.

2. **Design Patterns Obrigatórios:**
   - **Strategy Pattern:** Para algoritmos/lógicas alternáveis em tempo de execução (ex: parsers, gateways, cálculos).
   - **Factory / Builder:** Para instanciação de objetos/módulos complexos com múltiplos parâmetros.
   - **Repository Pattern:** Para desacoplar acesso a dados (APIs, Banco de Dados, LocalStorage) da lógica de negócios.
   - **State / Reducer Pattern:** Para gerenciamento de estado complexo na UI.

---

# PASSO A PASSO DE EXECUÇÃO

1. **Leitura e Mapeamento:**
   - Leia o trecho especificado na linha 312 do arquivo `docs/analise_geral_app.md` para extrair os requisitos e diagnósticos iniciais.
   - Inspecione a estrutura geral do repositório para mapear os pontos críticos de refatoração alinhados com a análise.

2. **Divisão do Plano em Fases:**
   - Agrupe as tarefas de refatoração em **fases lógicas e sequenciais** (ex: `fase-01-arquitetura-e-dados.md`, `fase-02-componentes-ui.md`, etc.).
   - Garanta que cada fase seja autônoma e incremental, minimizando riscos de regressão.

3. **Geração dos Documentos de Saída:**
   - Crie a pasta `docs/refatoracao/` caso ela não exista.
   - Gere um arquivo Markdown para cada fase dentro do diretório `docs/refatoracao/`.

---

# FORMATO DA SAÍDA (ESTRUTURA DE CADA ARQUIVO DE FASE)

Cada arquivo salvo em `docs/refatoracao/fase-[NUMERO]-[NOME_DA_FASE].md` DEVE seguir obrigatoriamente este template em Markdown:

```markdown
# Plano de Refatoração - Fase [X]: [NOME DA FASE]

## 1. Objetivo da Fase
- [Descrição clara do objetivo principal e impacto esperado]

## 2. Escopo de Arquivos Afetados
- `caminho/do/arquivo1.ts`
- `caminho/do/arquivo2.tsx`

## 3. Padrões e Princípios Aplicados
- [Explicitar quais princípios SOLID ou Design Patterns serão aplicados nesta fase]

## 4. Passo a Passo Técnico de Implementação
1. **[Ação 1]:** [Instruções detalhadas de código/estruturação]
2. **[Ação 2]:** [Instruções detalhadas...]

## 5. Exemplo de Código (Antes vs. Depois)
### Antes:
\`\`\`typescript
// Código legado/problematizado
\`\`\`
### Depois:
\`\`\`typescript
// Código refatorado aplicando as diretrizes (preservando a regra de negócio)
\`\`\`

## 6. Apontamento de Anomalias em Regras de Negócio (Se houver)
> *Preencha esta seção apenas se identificar quebras, inconsistências ou bugs na regra de negócio atual.*
- **Arquivo / Trecho:** `caminho/do/arquivo.ts:linha`
- **Descrição do Problema:** [Descreva a inconformidade encontrada na regra]
- **Ação Recomendada para Tratamento Posterior:** [Indique o que deve ser decidido pela equipe]

## 7. Critérios de Aceite e Verificação
- [ ] [Critério 1: Comportamento funcional mantido 100% idêntico]
- [ ] [Critério 2: Testes unitários de regra de negócio passando sem alterações]
- [ ] [Critério 3: Componente X refatorado para <20 linhas]
```

---

# REGRAS DE SAÍDA E RESTRIÇÕES

- **Diretório de Destino:** Todos os arquivos gerados DEVEM ser salvos em `docs/refatoracao/`.
- **Nomenclatura dos Arquivos:** Use kebab-case estrito com identificador numérico: `fase-01-[nome].md`, `fase-02-[nome].md`, etc.
- **Tom de Voz:** Direto, técnico, prescritivo e orientado à arquitetura de software de nível Staff.
- **Sem Explicações Desnecessárias:** A resposta principal deve focar na criação e salvamento dos arquivos especificados.
