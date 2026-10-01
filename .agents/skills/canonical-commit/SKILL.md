---
name: canonical-commit
description: Realiza commits seguindo Conventional Commits, faz o push para dev/feature branch, suporta criação de Pull Requests / Merge Requests (MR/PR) e merge para a branch main.
---

# Canonical Commit Flow

Esta skill automatiza o fluxo de versionamento, sincronização e integração contínua entre as branches de trabalho (`feat/*`, `fix/*`, `dev`) e a branch principal de produção (`main`/`master`). Ela garante commits atômicos, mensagens padronizadas e suporte completo a abertura de Pull Requests / Merge Requests (MR/PR).

---

## 1. Padrões Obrigatórios

### Conventional Commits
Todos os commits devem seguir a especificação [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0-beta.4/).
**Estrutura básica:**
`<tipo>[escopo opcional]: <descrição>`

**Tipos mais comuns:**
- `feat`: Uma nova funcionalidade
- `fix`: A correção de um bug
- `docs`: Apenas mudanças na documentação
- `style`: Mudanças de formatação/estilização sem alteração de lógica
- `refactor`: Refatoração de código sem alteração de comportamento externo
- `perf`: Melhoria de performance
- `test`: Adição ou correção de testes
- `chore`: Tarefas de build, CI, dependências ou configurações

*Nota: NUNCA utilize emojis nas mensagens de commit.*

### Conventional Branch
Branches de trabalho devem seguir o padrão [Conventional Branch](https://conventionalbranch.org/pt-br/):
`<tipo>/<escopo-opcional>-<descricao>`
Exemplos: `feat/dashboard-metrics`, `fix/login-auth-token`, `docs/readme-update`.

---

## 2. Passo a Passo do Fluxo de Execução

Quando invocada (via `/canonical-commit`, "commit canonico", "criar mr", "abrir pr", "commitar e subir", etc), execute estes passos:

### Passo 1: Inspecionar Alterações e Contextos
1. Rode `git status` e `git diff` para inspecionar os arquivos alterados e untracked.
2. Identifique os contextos lógicos das alterações (ex: infraestrutura, documentação, componentes de UI).

### Passo 2: Commits Atômicos por Contexto
1. **Evite `git add .` indiscriminado** quando houver mudanças heterogêneas.
2. Agrupe os arquivos por escopo lógico:
   ```bash
   git add <arquivos-contexto-1>
   git commit -m "tipo(escopo): descrição concisa"
   ```
3. Repita até que todos os arquivos relevantes estejam commitados.

### Passo 3: Escolher o Modo de Integração (MR/PR vs Merge Direto)

#### ➔ Modo A: Criação de Pull Request / Merge Request (Recomendado para CI/CD)
Use este modo quando estiver em uma feature branch (`feat/*`, `fix/*`, `refactor/*`) e precisar abrir um MR/PR para a `dev` ou `main`:

1. **Subir a branch para o remoto:**
   ```bash
   git push -u origin <branch-atual>
   ```
2. **Criar o MR/PR:**
   - **Se `gh` (GitHub CLI) estiver disponível:**
     ```bash
     gh pr create --base dev --head <branch-atual> --title "<tipo>(<escopo>): <título>" --body "<descrição detalhada com contexto e checklist>"
     ```
   - **Fallback Web (Sem CLI):**
     Gere e apresente ao usuário o link direto de criação com parâmetros preenchidos:
     `https://github.com/<owner>/<repo>/compare/dev...<branch-atual>?expand=1`
3. **Atualização no Notion (`Em Validação`):**
   Ao abrir o PR, mova a tarefa para **`Em Validação`** e anexe o link do PR no corpo:
   ```bash
   python3 scripts/notion-sync.py --update-task PDC-X --status "Em Validação" --append-body "### 🔗 Pull Request Criado\n- **PR:** [link]\n- **Branch:** \`<branch>\`"
   ```
4. **Merge Pós-Aprovação (se solicitado pelo usuário):**
   ```bash
   git checkout dev
   git pull origin dev
   git merge <branch-atual>
   git push origin dev
   ```

#### ➔ Modo B: Merge Direto Automatizado (`dev` ➔ `main`)
Use este modo para commits corriqueiros e sincronização rápida:

1. Garanta que está na branch `dev`: `git checkout dev`
2. Suba `dev`: `git push origin dev`
3. Mude para `main`: `git checkout main`
4. Puxe atualizações: `git pull origin main`
5. Faça o merge: `git merge dev`
6. Suba `main`: `git push origin main`
7. Retorne para `dev`: `git checkout dev`
8. Atualize o status da tarefa para **`Concluído`**:
   ```bash
   python3 scripts/notion-sync.py --update-status PDC-X "Concluído"
   ```

---

## 3. Template de Descrição para MR / Pull Request

Sempre que abrir ou sugerir um MR/PR, formate o corpo da seguinte forma:

```markdown
## Objetivo
Breve resumo do que foi implementado e qual fase/requisito litúrgico atende.

## O que foi feito
- Item 1
- Item 2
- Item 3

## Como foi verificado
- [x] python3 scripts/verify-spec-integrity.py (Quality Gate 100% Aprovado)
- [x] npx tsc --noEmit (0 erros de tipagem)
- [x] npm run build (Bundle moderno e legado KitKat gerados com sucesso)

## Checklist
- [x] Commits seguem Conventional Commits
- [x] Branch segue Conventional Branch
- [x] Paridade litúrgica e multi-dispositivo preservada
```

---

## 4. Vínculo Opcional com o Notion (`PDC-X`)

Se o usuário mencionar uma tarefa do Notion (ex: `PDC-4`) ou a branch atual contiver o prefixo (ex: `feat/PDC-4-alerta-pastoral`):

1. **Commit com rastreabilidade:**
   Adicione o identificador no título do commit:
   ```bash
   git commit -m "feat(pastor): [PDC-4] implementar alerta pastoral em tempo real"
   ```
2. **Atualização Automática no Notion:**
   - Ao abrir PR: move para **`Em Validação`**.
   - Ao efetuar o merge: fecha a tarefa com **`Concluído`**.
*(Nota: Se o usuário NÃO passar nenhum ID do Notion, ignore essa etapa e siga o fluxo padrão sem atrito).*

---

## 5. Tratamento de Conflitos
Se encontrar conflitos durante o rebase ou merge:
1. **PARE imediatamente.**
2. Reporte os arquivos conflitantes ao desenvolvedor.
3. Não tente resolver suposições de regras de negócio automaticamente sem confirmação explícita.
