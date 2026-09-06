---
name: canonical-commit
description: Realiza um commit seguindo Conventional Commits, faz o push para a branch dev, o merge para a branch main, e sobe tudo para o remoto.
---

# Canonical Commit Flow

Esta skill automatiza o fluxo de versionamento e sincronização entre as branches de desenvolvimento (`dev`) e produção (`main`/`master`), garantindo que o histórico de commits e os nomes de novas branches sigam os padrões.

## 1. Padrões Obrigatórios

### Conventional Commits
Todos os commits devem seguir a especificação [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0-beta.4/).
**Estrutura básica:**
`<tipo>[escopo opcional]: <descrição>`

**Tipos mais comuns:**
- `feat`: Uma nova funcionalidade
- `fix`: A correção de um bug
- `docs`: Apenas mudanças na documentação
- `style`: Mudanças que não alteram o comportamento (formatação, etc)
- `refactor`: Uma mudança no código que não corrige um bug nem adiciona uma feature
- `perf`: Uma mudança no código que melhora a performance
- `test`: Adiciona ou corrige testes
- `chore`: Outras mudanças (configurações, dependências, etc)

*Nota: NÃO utilize emojis nas mensagens de commit.*

### Conventional Branch
Se a tarefa exigir a criação de uma nova branch, siga o padrão [Conventional Branch](https://conventionalbranch.org/pt-br/):
`<tipo>/<escopo-opcional>-<descricao>`
Exemplos: `feat/dashboard-metrics`, `fix/login-auth-token`, `docs/readme-update`.

## 2. Passo a Passo do Fluxo de Execução

Quando invocada (via `/canonical-commit`, "commit canonico", "commit e merge padrão", etc), você (o agente) deve seguir EXATAMENTE estes passos via terminal:

1. **Verificar Status e Alterações:**
   - Rode `git status` e `git diff` para entender quais arquivos mudaram para inferir o tipo e a descrição do commit.
2. **Realizar Commits Atômicos por Contexto:**
   - Evite realizar um único `git add .` global quando houver mudanças em múltiplos arquivos ou diretórios distintos. Agrupe as mudanças por contexto lógico (por exemplo, por pasta ou módulo).
   - Adicione os arquivos específicos de cada contexto (`git add <caminho-1> <caminho-2>`).
   - Formule a mensagem do commit seguindo o **Conventional Commits** (NÃO utilize emojis).
   - Rode o commit: `git commit -m "tipo(escopo): breve descrição"`
   - Repita o processo de "add" e "commit" até que todos os contextos e arquivos relevantes tenham sido comitados separadamente.
3. **Fazer o Push para `dev`:**
   - Garanta que está na branch `dev` (ou na branch que originou o trabalho, fazendo push dela se necessário).
   - Execute: `git push origin dev`
4. **Merge com a Branch Principal (`main` ou `master`):**
   - Identifique a branch principal do repositório (ex: `git branch -a` para confirmar se é `main` ou `master`).
   - Mude para a branch principal: `git checkout main` (ou `master`).
   - Faça o merge da branch dev: `git merge dev`
   - Suba as alterações da main para o remoto: `git push origin main`
5. **Retornar para a Branch de Trabalho:**
   - Volte imediatamente para a branch `dev`: `git checkout dev`

---
## Referências Complementares
Essas referências guiam as convenções exigidas pelo projeto:
- [Conventional Commits Oficial](https://www.conventionalcommits.org/pt-br/v1.0.0-beta.4/)
- [Conventional Branch Oficial](https://conventionalbranch.org/pt-br/)
- [Cheat-sheet Naming Conventions for Git Branches (Medium)](https://medium.com/@abhay.pixolo/naming-conventions-for-git-branches-a-cheatsheet-8549feca2534)
- [Padrões de Commits - Commit Patterns (Dev.to)](https://dev.to/renatoadorno/padroes-de-commits-commit-patterns-41co)

---
**Dica para o Agente:** Se encontrar conflitos no merge, pare o fluxo, reporte ao usuário e peça instruções para resolver. Não tente sobrescrever conflitos automaticamente sem a revisão do desenvolvedor.
