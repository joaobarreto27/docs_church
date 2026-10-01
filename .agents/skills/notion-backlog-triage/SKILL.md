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
          ▼  [ PR Aberto / Teste Local Concluído ]
   🟣 4. EM VALIDAÇÃO (ou Em Teste)
          │  - PR submetido, aguardando aprovação final ou homologação visual
          │
          ▼  [ Merge & Deploy ]
   🟢 5. CONCLUÍDO
```

---

## Quando Utilizar
- **Triggers:** `/triage`, `/backlog`, "organizar backlog", "triar demandas", "revisar tarefas no notion", "organizar novas implementações".
- Sempre que você adicionar novos cards na coluna **Backlog** pelo celular e quiser prepará-los para virarem código.

---

## Hierarquia de Tarefas: Épico, Pai e Filho

Nem toda demanda deve ser tratada com a mesma profundidade. A hierarquia organiza o nível de esforço e onde os artefatos são salvos:

| Nível | Quando Usar | Onde Salvar Artefatos (Docs, Prompts, Mockups) | Estrutura no Notion |
|---|---|---|---|
| **1. Card Simples** (Quick Task / Bug) | Correções rápidas (< 1h), ajustes visuais, bugs pontuais ou pequenas melhorias. | Tudo direto no corpo do card (Contexto, Critérios de Aceite e link do PR). | Card individual sem subtarefas. |
| **2. Tarefa Pai + Filhos** (Feature Modular) | Demandas litúrgicas completas que envolvem 2 ou mais frentes (ex: backend API + tela púlpito + mobile obreiro). | Prompt inicial e critérios gerais no card Pai; fatias de entrega atômicas nos cards Filhos. | Card Pai com relação `Subtarefas` vinculando cada etapa filha. |
| **3. Épico / Tema Master** (Grande Refatoração / Novo Módulo) | Projetos complexos de múltiplas fases (ex: decomposição de monolito como em `docs/decomposicao`, refatoração offline Neon). | **Econômico em `docs/`:** PRD, matriz RTM, prompts e planos de fase no Git (`docs/[tema]/`). O Notion recebe o Épico Master e as fases aprovadas via `--sync-doc`. | Card Master com subtarefas para cada Fase (`Fase 1`, `Fase 2`...). |

### Onde Guardar Cada Artefato:
- **Prompts de IA e Planos de Fase:** Se forem extensos (> 50 linhas), guarde em `docs/[tema]/` no Git para versionamento e economia de contexto/tokens. Anexe o link ou resumo executivo no card do Notion.
- **Mockups e Evidências:** Screenshots de celular vão anexados no card do Notion. Mockups gerados via script headless vão na pasta do projeto e são referenciados no PR.
- **Pull Requests:** Sempre vinculados ao corpo do card via `notion-sync.py --update-task PDC-X --append-body` após o push.

---

## Estrutura do Banco no Notion
- **Página Principal:** [Painel Culto](https://app.notion.com/p/Painel-Culto-3eb6be234d6b80b5a5bcd581493ffef3)
- **Database:** `Backlog & Implementações` (`d0c6be23-4d6b-833a-a997-81d04492c78c`)
- **Propriedades Padronizadas:**
  - `Identificador`: ID Único automático com prefixo `PDC-X`
  - `Nome`: Título técnico executivo
  - `Status`: `Backlog`, `A Fazer`, `Em Progresso`, `Em Validação`, `Concluído`
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

