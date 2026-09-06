# Template PRD — Product Requirements Document

## Estrutura Completa

```markdown
# ROLE & CONTEXTO
[Persona técnica e responsabilidade.]
Exemplo: "Você atuará estritamente como Engenheiro de Software Staff e Especialista em UI/UX.
Sua responsabilidade é realizar a análise técnica do código-fonte e elaborar um Plano de
Refatoração detalhado, modular e executável."

---

# ARQUIVOS DE ENTRADA & REFERÊNCIAS
- **Documento de Referência Principal:** `[caminho/doc.md]`
- **Seção/Linha de Foco Inicial:** Linha X (`#LX-X`)
- **Escopo do Código:** Toda a base de código contida no repositório `[nome]`.

---

# ⚠️ RESTRIÇÃO CRÍTICA: [NOME DA RESTRIÇÃO] (INVIOLÁVEL)
1. **[REGRA 1]:** [Descrição clara. Ex: "O comportamento funcional deve permanecer 100% idêntico."]
2. **TRATAMENTO DE ANOMALIAS / ERROS:** Se durante a análise identificar inconsistência:
   - **NÃO altere nem tente "corrigir" por conta própria.**
   - **Documente a anomalia claramente em seção dedicada no plano da respectiva fase.**

---

# DIRETRIZES DE ARQUITETURA E QUALIDADE (OBRIGATÓRIO)
1. **Princípios SOLID & Clean Code:**
   - **SRP:** Dividir funções/componentes com >20 linhas ou múltiplas responsabilidades.
   - **DIP:** Substituir acoplamentos diretos por abstrações/interfaces.
   - **DRY:** Isolar repetições (>2 ocorrências) em Hooks, Helpers ou Utils.
   - **KISS:** Evitar sobre-engenharia; priorizar legibilidade.

2. **Design Patterns Obrigatórios:**
   - **Strategy Pattern:** Para algoritmos alteráveis em runtime.
   - **Factory / Builder:** Para instanciação complexa.
   - **Repository Pattern:** Para desacoplar acesso a dados.
   - **State / Reducer Pattern:** Para estado complexo na UI.

---

# PASSO A PASSO DE EXECUÇÃO
1. **Leitura e Mapeamento:**
   - Ler referências e extrair requisitos/diagnósticos.
   - Inspecionar estrutura do repositório para mapear pontos críticos.

2. **Divisão do Plano em Fases:**
   - Agrupar tarefas em fases lógicas e sequenciais.
   - Garantir que cada fase seja autônoma e incremental.

3. **Geração dos Documentos de Saída:**
   - Criar pasta de saída se não existir.
   - Gerar arquivo Markdown para cada fase.

---

# FORMATO DA SAÍDA (ESTRUTURA DE CADA ARQUIVO DE FASE)
Cada arquivo em `[diretório]/fase-[NUM]-[nome].md` DEVE seguir:

## 1. Objetivo da Fase
## 2. Escopo de Arquivos Afetados
## 3. Padrões e Princípios Aplicados
## 4. Passo a Passo Técnico de Implementação
## 5. Exemplo de Código (Antes vs. Depois)
## 6. Apontamento de Anomalias em Regras de Negócio (Se houver)
## 7. Critérios de Aceite e Verificação

---

# REGRAS DE SAÍDA E RESTRIÇÕES
- **Diretório de Destino:** `[caminho]`
- **Nomenclatura:** kebab-case com identificador numérico: `fase-01-[nome].md`
- **Tom de Voz:** Direto, técnico, prescritivo
- **Sem Explicações Desnecessárias:** Foco na criação dos arquivos
```

---

## Checklist de Validação do PRD

- [ ] Tem ROLE & CONTEXTO claramente definidos
- [ ] Tem pelo menos 1 RESTRIÇÃO CRÍTICA inviolável
- [ ] Diretrizes de arquitetura especificam patterns obrigatórios
- [ ] Passo a passo é sequencial e executável
- [ ] Formato de saída define template claro para entregáveis
- [ ] Nomenclatura e diretório de destino são explícitos
