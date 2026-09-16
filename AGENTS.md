# Diretrizes Invioláveis de Arquitetura, Modularidade e Segurança — Painel do Culto (A.D. Utinga)

Este documento estabelece as regras arquiteturais, limites de complexidade e salvaguardas obrigatórias para qualquer engenheiro ou agente de IA trabalhando no repositório **Painel do Culto**.

---

## 0. Princípio Fundamental Inviolável: Preservação Integral de Regras de Negócio (Zero Regressão)

> ⛔ **LEI ZERO DA REFATORAÇÃO:**  
> A decomposição modular é **estritamente arquitetural e estrutural**. Nenhuma regra de negócio pode ser alterada, simplificada, afrouxada ou perdida. Qualquer modificação que altere o comportamento funcional visível ou invisível da aplicação constituirá **falha grave de conformidade**.

As seguintes regras de negócio do **Painel do Culto** são **IMUTÁVEIS E INVIOLÁVEIS**:
1. **Controle de Acesso e PIN:** Obreiro e Pastor entram imediatamente pelo código. O papel de Controlador **exige obrigatoriamente** validação de PIN de 4 dígitos e token de sessão assinado HMAC-SHA256 gerado no backend.
2. **Máscara e Código de Sala:** O código é estritamente de 6 caracteres alfanuméricos no formato `XXX-XXX`, convertidos em maiúsculas automaticamente.
3. **Resolução de Conflitos de Sala:** Ao tentar criar uma sala cujo código já exista, o sistema **deve** acionar o modal de conflito oferecendo exatamente as opções: *"Abrir Existente"* (validando PIN) ou *"Sobrescrever Culto"* (resetando blocos).
4. **Estrutura dos 5 Blocos Litúrgicos Oficiais:** O sistema opera com os 5 blocos padronizados da congregação: `visitors` (Visitantes), `prayers` (Oração Presencial), `prayers_youtube` (Oração YouTube), `opportunities` (Oportunidades/Louvores) e `choirs` (Checklist de Conjuntos).
5. **Fila Otimista e Resiliência Offline:** Inclusões e exclusões de itens devem ser aplicadas instantaneamente na tela e enfileiradas sequencialmente (`blockMutationQueueRef`). Em caso de falha ou ausência de Wi-Fi, os dados permanecem salvos em `localStorage` e são reenviados automaticamente com retry. **Nenhum dado digitado no templo pode ser perdido**.
6. **Rascunhos Locais Sem Requisições:** Campos de digitação em lote salvam rascunho em tempo real no `localStorage` sob `docs_church_draft_${domain}_${roomId}`. Nenhuma requisição HTTP ao banco Neon pode ser disparada durante a digitação de texto.
7. **Pedidos de Oração Urgentes:** Orações com flag `isUrgent` (UTI, cirurgias, estado grave) devem manter destaque visual em vermelho nobre (`#991B1B`) e prioridade de exibição.
8. **Transmissão de Alerta Pastoral em Tempo Real:** O alerta ativo no controlador reflete instantaneamente no topo do púlpito do pastor e pode ser cancelado pela mesa a qualquer momento.
9. **Zero Scroll Vertical no Púlpito (Paisagem):** A tela do pastor em modo paisagem opera estritamente como livro aberto (spread de 2 páginas), sem barra de rolagem vertical.
10. **Formatos de Exportação:** Formato Holyrics com quebras de slide corretas para projeção e formato WhatsApp com formatação de negrito e cabeçalho solene da igreja.

---

## 1. Limite Estrito de Linhas por Arquivo

- **Tamanho Máximo Permitido:** Nenhum novo arquivo `.tsx` ou `.ts` pode ultrapassar **200 linhas** (meta de excelência: **80 a 150 linhas** por componente/módulo).
- **Barreira de Complexidade:** Qualquer componente ou hook que se aproxime de **180 linhas** DEVE ser decomposto antes de receber novas funcionalidades ou refatorações adicionais.
- **Single Responsibility Principle (SRP):** Cada arquivo deve ter apenas um motivo para mudar:
  - Hooks gerenciam estado/efeitos.
  - Componentes de apresentação renderizam JSX e emitem eventos.
  - Utilitários executam funções puras e determinísticas.
  - Repositórios mediam transporte de dados com a API.

---

## 2. Quarentena dos Arquivos Monolíticos & Desativação Gradual

Os 6 arquivos monolíticos identificados no plano mestre [`docs/decomposicao/README.md`](docs/decomposicao/README.md) estão em quarentena temporária até sua respectiva decomposição:

1. `src/context/RoomContext.tsx` (1.031 linhas) → Mapeado nas **Subfases 1.1, 1.2 e 2.2** [✅ Concluído]
2. `src/services/neon.ts` (319 linhas) → Mapeado na **Subfase 1.3** [✅ Concluído]
3. `src/components/room/JoinRoomModal.tsx` (401 linhas) → Mapeado na **Subfase 2.1** [✅ Concluído]
4. `src/components/pastor/PulpitView.tsx` (1.535 linhas) → Mapeado nas **Subfases 3.1, 3.2 e 3.3** [✅ Concluído]
5. `src/components/obreiro/ObreiroEditor.tsx` (1.682 linhas) → Mapeado nas **Subfases 4.1, 4.2 e 4.3** [✅ Concluído]
6. `src/components/controlador/ControladorPanel.tsx` (932 linhas) → Mapeado nas **Subfases 5.1, 5.2, 5.3 e 5.4**

> ⚠️ **REGRA INVIOLÁVEL DE EXECUÇÃO DE SUBFASE:**  
> Ao concluir a refatoração de qualquer um dos arquivos acima conforme as especificações em `docs/decomposicao/`, o arquivo refatorado **NÃO PODE** exceder sua meta estipulada (máximo 150 linhas para orquestradores e 110 linhas para subcomponentes), saindo permanentemente da lista de quarentena.

---

## 3. Prevenção Contra Inchaço Incremental (Anti-Bloat)

1. **Zero Modais e Diálogos Inline:**
   - Nunca declare modais, popups de confirmação, gavetas retráteis ou diálogos complexos diretamente no JSX de orquestradores de tela.
   - Crie sempre um subcomponente isolado em pasta dedicada (`modals/`, `dialogs/`, `components/`) com interface de `Props` estrita (`isOpen`, `onClose`, callbacks de ação).

2. **Composition Pattern Obrigatório (`/design-patterns`):**
   - Quando um componente possuir mais de uma seção visual, extraia subcomponentes de apresentação coesos.
   - Orquestradores de tela (`PulpitView`, `ObreiroEditor`, `ControladorPanel`) devem apenas conectar o contexto aos subcomponentes especializados.

3. **Gerenciamento de Estado Complexo (Reducer & Custom Hooks):**
   - Componentes com **3 ou mais `useState` inter-relacionados** (ex: formulários com validação, rascunhos, filtros múltiplos ou controles de tela) DEVEM:
     - Utilizar `useReducer` com tipos `State` e `Action` bem definidos; OU
     - Ser encapsulados em um Custom Hook dedicado (`use...Flow.ts` ou `useDraftBatch.ts`).

4. **Barrel Exports Padronizados:**
   - Todo módulo ou pasta com múltiplos arquivos deve manter um `index.ts` centralizador para imports limpos e consistentes.

---

## 4. Salvaguardas de Segurança Serverless (`/secure-architecture`)

1. **Fronteira Rígida do Bundle (Zero Secrets in Frontend - Lei 1):**
   - O código do cliente (`src/`) **JAMAIS** pode importar drivers de banco de dados (`@neondatabase/serverless`, `pg`) ou credenciais de banco.
   - Drivers e variáveis sensíveis (`DATABASE_URL`, `SESSION_SECRET`) residem exclusivamente no backend serverless (`api/`).

2. **Zero Proxies SQL Abertos (Lei 2):**
   - Toda comunicação com o PostgreSQL Neon ocorre exclusivamente por meio de rotas fechadas de negócio (`/api/room`, `/api/block`, `/api/sync`) com *Prepared Statements* / parâmetros vinculados (`$1`, `$2`).

3. **Fim da Autorização Visual (Tokens HMAC-SHA256 - Lei 3):**
   - Papéis administrativos (Controlador) exigem autenticação no servidor via `SESSION_SECRET` e geração de token assinado.
   - Mutações sensíveis (alterar código, renomear culto, resetar liturgia) devem recusar requisições com `401 Unauthorized` ou `403 Forbidden` se o token for inválido.

4. **Projeção Mínima e Prevenção Estrita de IDOR (Lei 4):**
   - Proibido o uso de `SELECT *` em tabelas que contenham credenciais ou `controller_pin`.
   - Todas as mutações e exclusões em recursos subordinados devem exigir o vínculo duplo estrito:
     ```sql
     UPDATE liturgical_blocks SET content = $1 WHERE id = $blockId AND room_id = $roomId
     ```

5. **Consciência de WAF e Proteção contra Força Bruta (Lei 6):**
   - Rate limiting ativo por IP em tentativas de PIN de 4 dígitos.
   - Polling adaptativo: zero requisições durante a digitação de textos (uso obrigatório de rascunho em `localStorage`) e intervalo estendido (15s a 30s) quando a aba estiver em segundo plano.

---

## 5. Diretrizes Litúrgicas e Ergonomia Visual A.D. Utinga (`/frontend-design` & `/prd`)

1. **Compatibilidade Estrita com Android 4.4.4 KitKat:**
   - O tablet do púlpito roda WebViews antigas (Chrome 30-55).
   - O build de produção DEVE gerar pacotes legados com polyfills (`@vitejs/plugin-legacy`).
   - É **proibido** o uso de recursos CSS sem suporte clássico (`subgrid`, `container queries` sem fallback) e funções modernas como `oklch()`.
   - Todas as cores devem ser declaradas em **Hexadecimal** ou **RGB**.

2. **Princípio "Púlpito Zen" (Anti-Poluição Visual):**
   - No púlpito, o foco é 100% na legibilidade da ministração.
   - Proibido o uso de gradientes pesados, sombras volumosas ou animações distrativas na visão do pastor.
   - Paleta solene oficial:
     - Dourado da Igreja: `#C59B4B` / Glow: `#D4AF37`
     - Folha Papel Puro: `#FFFFFF` / Fundo Pergaminho: `#FAF8F5`
     - Bordas Areia: `#EAE5DF` / Texto Carvão de Leitura: `#1C1917`
     - Alerta Urgente: Fundo `#FEF2F2`, Borda `#F87171`, Texto `#991B1B`

3. **Zero Scroll Vertical no Púlpito (Modo Paisagem):**
   - Em tablets ou celulares na horizontal, a leitura do pastor opera estritamente no estilo **livro aberto (spread de duas páginas lado a lado)**.
   - O conteúdo nunca deve ter barra de rolagem vertical. O avanço ocorre por toque suave de paginação lateral.

4. **Resiliência Offline e Cold Start do Neon:**
   - Todo o estado recebido deve ser salvo imediatamente no `localStorage`.
   - Se o Wi-Fi da igreja oscilar durante o culto, a tela do pastor NUNCA deve piscar em branco ou travar.
   - Ao despertar o banco Neon de repouso, exibir com clareza: *"Conectando à igreja... Por favor aguarde uns segundos"*.

---

## 6. Checklist Obrigatório Pré-Commit

Antes de finalizar qualquer tarefa ou enviar alterações para o repositório, execute:

- [ ] **1. Verificação Estrita de Tipagem:**
  ```bash
  npx tsc --noEmit
  ```
  *(Resultado esperado: 0 erros de compilação).*

- [ ] **2. Compilação e Build de Produção:**
  ```bash
  npm run build
  ```
  *(Resultado esperado: bundle moderno e legado gerados com sucesso).*

- [ ] **3. Varredura Anti-Vazamento no Bundle Público:**
  ```bash
  grep -rn "postgresql://" dist/ && grep -rn "npg_" dist/
  ```
  *(Resultado esperado: 0 ocorrências).*

- [ ] **4. Auditoria de Limite de Linhas:**
  - Garantir que nenhum novo arquivo criado ultrapasse 200 linhas (meta: 80 a 150 linhas).
