# Formato PRD para Features Complexas / Multi-Fase

Para funcionalidades que são grandes demais para um único prompt (ex: refatoração completa, nova feature com frontend + backend + migração), use o formato PRD (Product Requirements Document).

---

## Template PRD

```markdown
# ROLE & CONTEXTO
[Persona técnica e responsabilidade. Ex: "Engenheiro de Software Staff e Especialista em UI/UX.
Sua responsabilidade é realizar a análise técnica e elaborar um Plano de Implementação detalhado."]

---

# ARQUIVOS DE ENTRADA & REFERÊNCIAS
- **Documento de Referência Principal:** `[caminho do doc]`
- **Escopo do Código:** [repositório ou diretório alvo]

---

# ⚠️ RESTRIÇÃO CRÍTICA (INVIOLÁVEL)
1. **[Regra inviolável 1]:** [ex: "NENHUMA REGRA DE NEGÓCIO PODE SER ALTERADA"]
2. **TRATAMENTO DE ANOMALIAS:** Se identificar inconsistência:
   - NÃO altere por conta própria.
   - Documente em seção dedicada para discussão posterior.

---

# DIRETRIZES DE ARQUITETURA E QUALIDADE (OBRIGATÓRIO)
1. **Princípios SOLID & Clean Code:**
   - SRP: Funções/componentes com >20 linhas ou múltiplas responsabilidades → dividir.
   - DIP: Substituir acoplamentos diretos por abstrações/interfaces.
   - DRY: Isolar repetições (>2 ocorrências) em Hooks, Helpers ou Utils.
   - KISS: Evitar sobre-engenharia.

2. **Design Patterns Obrigatórios:**
   - Strategy Pattern: Para algoritmos alteráveis em runtime.
   - Factory / Builder: Para instanciação complexa.
   - Repository Pattern: Para desacoplar acesso a dados.
   - State / Reducer Pattern: Para estado complexo na UI.

---

# PASSO A PASSO DE EXECUÇÃO
1. **Leitura e Mapeamento:** Ler referências, inspecionar repositório.
2. **Divisão em Fases:** Agrupar em fases lógicas e sequenciais.
3. **Geração dos Documentos:** Criar arquivo Markdown para cada fase.

---

# FORMATO DA SAÍDA
Cada arquivo em `docs/[feature]/fase-[NUM]-[nome].md` DEVE seguir:

## 1. Objetivo da Fase
## 2. Escopo de Arquivos Afetados
## 3. Padrões e Princípios Aplicados
## 4. Passo a Passo Técnico de Implementação
## 5. Exemplo de Código (Antes vs. Depois)
## 6. Apontamento de Anomalias em Regras de Negócio (Se houver)
## 7. Critérios de Aceite e Verificação

---

# REGRAS DE SAÍDA E RESTRIÇÕES
- **Nomenclatura:** kebab-case: `fase-01-[nome].md`
- **Tom de Voz:** Direto, técnico, prescritivo
- **Sem explicações desnecessárias:** Foco na criação dos arquivos
```

---

## Quando Usar PRD vs. Prompt Simples

| Critério | Prompt Simples | PRD |
|----------|---------------|-----|
| Escopo | 1 componente/arquivo | Múltiplos arquivos/camadas |
| Duração | 1 sessão de chat | Múltiplas sessões/dias |
| Alterações | < 200 linhas | > 200 linhas |
| Fases | Nenhuma | 2+ fases sequenciais |
| Exemplo | "Adicionar botão de filtro" | "Refatorar page.tsx de 6641 linhas" |
