---
name: notion-backlog-triage
description: Triagem, enriquecimento e organização automática do backlog de novas demandas e bugs do Painel do Culto (A.D. Utinga) no Notion. Padroniza títulos executivos, classifica Tipo, Módulo Litúrgico/Técnico, Prioridade, atribui ícones e estrutura especificações com critérios de aceite e suporte a imagens anexadas.
---

# Notion Backlog Triage Skill — Painel do Culto (A.D. Utinga)

Esta skill automatiza a triagem, o refinamento técnico e a esteira ágil de demandas, melhorias litúrgicas e bugs do **Painel do Culto** no Notion.

---

## Ciclo de Vida e Fluxo de Estados

```
[ Novo card no Celular ]
          │
          ▼
   📥 1. BACKLOG (Inbox de Novas Solicitações)
          │  - Usuário apenas cria com título rápido e texto livre + prints
          │  - Zero esforço de preenchimento manual
          │
          ▼  [ Disparo da Skill /triage ou /backlog ]
   🟡 2. A FAZER (Ready for Dev)
          │  - Agente varre EXCLUSIVAMENTE a coluna 'Backlog'
          │  - Inspeciona prints anexados e texto bruto
          │  - Refina título para padrão executivo
          │  - Preenche Tipo, Módulo Litúrgico/Técnico, Prioridade e Ícone
          │  - Move automaticamente o Status para 'A Fazer'
          │
          ▼  [ Sessão de Desenvolvimento ]
   🔵 3. EM PROGRESSO
          │  - Tarefa sendo codificada e testada
          │
          ▼  [ Validação & Quality Gate ]
   🟢 4. CONCLUÍDO
```

---

## Quando Utilizar
- **Triggers:** `/triage`, `/backlog`, "organizar backlog", "triar demandas", "revisar tarefas no notion", "organizar novas implementações".
- Sempre que você adicionar novos cards na coluna **Backlog** pelo celular e quiser prepará-los para virarem código.

---

## Estrutura do Banco no Notion
- **Página Principal:** [Painel Culto](https://app.notion.com/p/Painel-Culto-3eb6be234d6b80b5a5bcd581493ffef3)
- **Database:** `Backlog & Implementações` (`d0c6be23-4d6b-833a-a997-81d04492c78c`)
- **Propriedades Padronizadas:**
  - `Identificador`: ID Único automático com prefixo `PDC-X`
  - `Nome`: Título técnico executivo
  - `Status`: `Backlog`, `A Fazer`, `Em Progresso`, `Concluído`
  - `Tipo`: `Feature` (🚀), `Bug` (🐛), `Melhoria` (⚡), `Débito Técnico` (🛠️)
  - `Prioridade`: `Alta`, `Média`, `Baixa`
  - `Módulo`: 
    - `Púlpito (Pastor)`
    - `Obreiro / Recepção`
    - `Mesa / Controlador`
    - `Liturgia & Blocos`
    - `Sincronização & Offline (Neon)`
    - `UI / KitKat (Tablet)`
  - `Tarefa Pai` e `Subtarefas`: Auto-relação hierárquica (Épico ➔ Fases ➔ Subtarefas)
  - `Descrição`: Resumo textual curto da demanda
  - `Origem`: `Manual`, `Mobile`

---

## Fluxo "Zero Docs / Notion-First" com Rascunho Local Opcional

Para planejar grandes épicos ou temas complexos (ex: decomposições litúrgicas):
1. **Rascunho Local em `docs/`:** O agente elabora a especificação localmente sem consumir chamadas da API do Notion.
2. **Aprovação do Desenvolvedor:** O usuário revisa o rascunho e dá o comando para sincronizar.
3. **Publicação Atômica no Notion:**
   - O documento é publicado direto no corpo do card Notion (`--sync-doc`).
   - As fases são criadas automaticamente como subtarefas aninhadas (`--create-subtask`).

---

## Padrão de Especificação do Card

Ao triar um card, o agente estrutura o corpo da página no Notion com:

```markdown
### 📋 Contexto & Necessidade
[Descrição clara do problema ou necessidade litúrgica/técnica]

### 🎯 Comportamento Esperado
[O que deve acontecer na aplicação após a implementação]

### 🛡️ Regras de Negócio & Salvaguardas
- Preservação da Lei Zero da Refatoração (Zero Regressão)
- Compatibilidade Android KitKat (se envolver UI)
- Blindagem /secure-architecture (se envolver backend/Neon)

### ✅ Critérios de Aceite
- [ ] Critério 1
- [ ] Critério 2
- [ ] Quality Gate 100% Aprovado (python3 scripts/verify-spec-integrity.py)
```

---

## Execução via Scripts de Automação

1. **Triagem de Backlog (Inbox):**
   ```bash
   python3 scripts/triage-notion-backlog.py
   ```
2. **Sincronização e Operações de Tarefas (`notion-sync.py`):**
   - Buscar detalhes: `python3 scripts/notion-sync.py --get-task PDC-X`
   - Atualizar status: `python3 scripts/notion-sync.py --update-status PDC-X "Concluído"`
   - Criar subtarefa: `python3 scripts/notion-sync.py --create-subtask PDC-X "Título" "Feature" "Alta" "Módulo" "Descrição"`
   - Sincronizar documento: `python3 scripts/notion-sync.py --sync-doc docs/meu-doc.md --parent PDC-X`

