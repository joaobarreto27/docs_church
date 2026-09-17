# ROLE & CONTEXTO
Você atuará estritamente como Engenheiro de Software Staff e Especialista em UI/UX para sistemas de missão crítica em tempo real. Sua responsabilidade é especificar e direcionar a implementação da **Integração Holyrics (Telão) no Painel do Culto (A.D. Utinga)**, conectando a projeção de louvores e versículos bíblicos ao tablet do púlpito do pastor e à mesa do controlador.

A integração opera através de um modelo de **Renderização Nativa e Push Contínuo**:
1. **Controle Centralizado (Controlador):** O operador da mesa de som/transmissão configura e testa a URL do Holyrics/ngrok protegida por PIN de 4 dígitos, sendo persistida na sala do banco Neon e herdada nos próximos cultos.
2. **Visão do Pastor (Púlpito Zen):** O tablet no púlpito (incluindo dispositivos legados com **Android 4.4.4 KitKat**) detecta o slide ativo e exibe a projeção em **Tela Cheia (Opção Escura Solene)**, permitindo que o pastor minimize a qualquer momento para ler o roteiro de orações e retorne ao louvor em andamento através de um botão flutuante discreto.

---

# ARQUIVOS DE ENTRADA & REFERÊNCIAS
- **Manual do Usuário & PDF:** `Conhecendo o Software Holyrics.pdf` (Transcrição técnica de setup do ngrok e endpoints HTTP/WebSocket).
- **Visão do Pastor:** `src/components/pastor/PulpitView.tsx` (Tela de leitura do púlpito com spread de folhas e controle de zoom).
- **Painel de Controle:** `src/components/controlador/ControladorPanel.tsx` (Mesa de direção de culto com autenticação via PIN).
- **Backend Serverless:** `api/room.ts` (Mutações e consultas de sala protegidas por HMAC-SHA256).
- **Tipos Litúrgicos:** `src/types/liturgy.ts` (Modelos de dados de sala e blocos).
- **Diretrizes Invioláveis:** `AGENTS.md` (Limite de 200 linhas por arquivo, compatibilidade KitKat e zero vazamentos).

---

# ⚠️ RESTRIÇÕES CRÍTICAS (INVIOLÁVEIS)

1. **BLINDAGEM CONTRA O ERRO 99 DO WAF (TRANSPORTE ANTI-BLOQUEIO):**
   - **Proibido** o uso de polling HTTP agressivo de curto intervalo (1s a 2s) no Android 4.4.4. O User-Agent antigo do KitKat dispara os alertas anti-DDoS e desafios antibot da Cloudflare/Vercel/ngrok, gerando bloqueio irreversível por **Erro 99**.
   - O transporte primário DEVE utilizar **WebSocket nativo** do Holyrics (`ws://` ou `wss://`), abrindo uma única conexão persistente onde o servidor empurra o slide no instante do clique.
   - Caso haja fallback para polling HTTP, este DEVE ser espaçado (mínimo 3.5s a 5s), pausado quando inativo e com cabeçalho `ngrok-skip-browser-warning: true`.

2. **COMPATIBILIDADE ESTREITA COM ANDROID 4.4.4 KITKAT (SAMSUNG GALAXY TAB E):**
   - **Proibido** o uso de `<iframe>` para renderizar o Holyrics no tablet do pastor (risco de falta de memória OOM e congelamento do WebView legado Chromium 30-39).
   - O texto deve ser renderizado **nativamente em React** com estilos clássicos já suportados pelo `@vitejs/plugin-legacy`.
   - **Zero Secrets no Frontend:** Nenhuma chave mestra ou segredo de túnel deve ser embutido no código do cliente.

3. **ZERO SCROLL VERTICAL NO PÚLPITO & AUTO-AJUSTE PARA TEXTOS GIGANTES (ESTER 8:9):**
   - A tela cheia da projeção **NÃO PODE ter barra de rolagem vertical**.
   - O componente deve calcular a densidade do texto e aplicar **auto-escala tipográfica dinâmica**:
     - *Textos Curtos (< 120 caracteres):* Fonte grande (~36px a 44px).
     - *Textos Médios (120 a 300 caracteres - Estrofes clássicas):* Fonte normal (~26px a 30px).
     - *Textos Extensos (300 a 600 caracteres - ex: Ester 8:9 com 520 caracteres):* Fonte de leitura otimizada (~18px a 20px) com entrelinhas solene (`leading-relaxed`), garantindo 100% de visibilidade sem cortes.
     - *Textos Extremos (> 600 caracteres):* Divisão automática em 2 colunas bíblicas balanceadas.

4. **SOBERANIA PASTORAL & CONTINUIDADE LITÚRGICA:**
   - O pastor nunca pode ficar "preso" na letra da música caso precise ler pedidos urgentes de UTI ou orações.
   - O botão `[✕ Minimizar]` deve recolher a tela cheia instantaneamente.
   - Enquanto a projeção estiver ativa, um **Pill Flutuante** (`[ 🎵 Telão Ativo: Nome do Hino • ⛶ Voltar para o Telão ]`) permanece no rodapé.
   - Ao clicar em voltar, o pastor retorna **ao slide exato que está sendo projetado no momento atual**, sem desfasagem temporal.
   - Ao limpar a projeção no Holyrics (F5), a tela fecha sozinha e o pill desaparece.

5. **LIMITE DE LINHAS POR ARQUIVO (REGRA DOS AGENTS):**
   - Nenhum novo arquivo pode ultrapassar **200 linhas** (meta de excelência: **80 a 150 linhas**).
   - Componentes visuais, hooks e modais devem ser decompostos em submódulos coesos.

---

# DIRETRIZES DE ARQUITETURA E QUALIDADE (OBRIGATÓRIO)

### 1. Paleta Visual Oficial: Opção Escura Solene (Frontend Director)
- **Fundo da Tela Cheia:** `#0B0D13` (Preto profundo anti-reflexo cênico).
- **Texto Principal da Projeção:** `#FFFFFF` (Branco puro de alto contraste).
- **Destaques e Títulos:** `#C59B4B` (Dourado Oficial da Igreja) e `#D4AF37` (Glow solene).
- **Superfícies de Apoio e Botões:** `#1C202B` com bordas sutis em `#282E3E` e feedback tátil `active:scale-95`.
- **Pill Flutuante no Roteiro:** Fundo `#111319`, borda dourada fina `#C59B4B`, ponto verde pulsante `#10B981` e texto `#FAF8F5`.

### 2. Segurança e Persistência Serverless (Secure Architecture)
- A tabela `rooms` no PostgreSQL Neon recebe a coluna `holyrics_url text DEFAULT NULL`.
- Apenas usuários autenticados com o **PIN do Controlador** (via token HMAC-SHA256) podem invocar a ação `update-holyrics-url`.
- Ao executar `reset-service` (preparar próximo culto), o valor de `holyrics_url` **é preservado**, garantindo que a igreja não precise redigitar a URL todo domingo.

### 3. Padrões de Engenharia React
- **Custom Hook Desacoplado (`useHolyricsSync`):** Gerencia o ciclo de vida do WebSocket, fallback de erro com `AbortController` e reconexão silenciosa com backoff exponencial.
- **Compound Presentation (`HolyricsOverlay`):** Subcomponentes dedicados para `Header`, `SlideContent` e `Footer`.

---

# DIVISÃO EM FASES EXECUTÁVEIS

```text
[ Fase 1: Backend & Schema Neon ] 
       │ 
       ▼
[ Fase 2: Hook useHolyricsSync & Tipagens ]
       │ 
       ▼
[ Fase 3: Componentes Visuais do Púlpito (Tela Cheia Escura & Pill Flutuante) ]
       │ 
       ▼
[ Fase 4: Modal de Configuração no Painel do Controlador ]
       │ 
       ▼
[ Fase 5: Integração no PulpitView, Testes KitKat & Validação de Build ]
```

---

# ESPECIFICAÇÃO TÉCNICA DAS FASES

### Fase 1: Backend & Schema Neon (`api/room.ts` & `src/types/liturgy.ts`)
- Adicionar `holyrics_url?: string | null` na interface `Room` em `src/types/liturgy.ts`.
- Em `api/room.ts`:
  - Adicionar a coluna `holyrics_url TEXT` na criação/migração da tabela `rooms` (caso inexistente).
  - Incluir `holyrics_url` nas projeções explícitas de `SELECT` da sala.
  - Implementar o handler da ação `update-holyrics-url`, validando o token do controlador e sanitizando a URL (máximo 255 caracteres, prefixos `http://` ou `https://`).
  - Garantir que `reset-service` preserve o campo `holyrics_url`.

### Fase 2: Hook `useHolyricsSync` (`src/hooks/useHolyricsSync.ts`)
- Gerenciar o estado: `{ slide: HolyricsSlide | null, isConnected: boolean, isProjecting: boolean }`.
- Conectar via WebSocket nativo (`ws://` ou `wss://`) no endereço fornecido pela sala (`room.holyrics_url`).
- Tratar eventos de mensagem com parsing seguro do JSON do Holyrics.
- Implementar reconexão inteligente com temporizador em backoff (3s, 6s, 12s).
- Tratamento de erro 100% silencioso: se a conexão cair, `isProjecting` assume `false` sem lançar exceções não tratadas na interface.

### Fase 3: Componentes Visuais do Púlpito (`src/components/holyrics/`)
- `HolyricsOverlay.tsx`: Camada em tela cheia com fundo `#0B0D13`, botão `[✕ Minimizar]`, header solene com nome do hino/versículo e auto-ajuste dinâmico de fonte (testado com textos curtos e Ester 8:9).
- `HolyricsReturnPill.tsx`: Botão flutuante no rodapé das folhas de oração quando minimizado, exibindo o slide ativo e botão `[⛶ Voltar para o Telão]`.

### Fase 4: Interface do Controlador (`src/components/controlador/modals/`)
- `ControladorHolyricsModal.tsx`: Modal administrativo aberto pelo botão no painel do controlador.
- Campo de texto para URL (`https://...ngrok-free.app` ou `http://192.168...`).
- Botão "Testar Conexão": dispara requisição pontual de 2 segundos para validar se o Holyrics responde na porta 8081.
- Botão "Salvar na Sala": invoca `api/room` com o token HMAC do controlador.

### Fase 5: Integração no Púlpito & Validação Final
- Conectar o hook e os componentes dentro de `src/components/pastor/PulpitView.tsx`.
- Executar `npx tsc --noEmit` para validação de tipagem rigorosa.
- Executar `npm run build` para certificar geração de chunks legados para Android 4.4.4 KitKat.
- Executar varredura anti-vazamento no diretório `dist/`.

---

# PROMPT DETERMINÍSTICO PARA IMPLEMENTAÇÃO (PROMPT-ENGINEER)

```markdown
Atue como Engenheiro Staff Fullstack e Especialista em UI/UX para sistemas de missão crítica.

CONTEXTO:
O repositório docs_church possui uma arquitetura React 18 + Vite com suporte a Android 4.4.4 KitKat (@vitejs/plugin-legacy), backend serverless no Vercel (api/room.ts) e banco Neon. O PulpitView exibe as folhas do culto para o pastor. O ControladorPanel gerencia as configurações da sala com PIN de 4 dígitos e token HMAC-SHA256.

OBJETIVO:
Implementar a integração completa do software Holyrics para exibição nativa da projeção de louvores e versículos no Púlpito (Opção Escura Solene), com controle de minimizar/restaurar e configuração centralizada na tela do Controlador.

DIRETRIZES DE ARQUITETURA:
1. Limite estrito de 200 linhas por arquivo (AGENTS.md).
2. Transporte via WebSocket nativo para eliminar o risco de Erro 99 da WAF no Android 4.4.4.
3. Backend seguro em api/room.ts com Prepared Statements e autorização obrigatória de Controlador.
4. Auto-escala dinâmica de fonte para acomodar perfeitamente desde refrões curtos até leituras bíblicas densas como Ester 8:9, sem scroll vertical.

REQUISITOS PASSO A PASSO:
1. Atualizar src/types/liturgy.ts adicionando holyrics_url em Room e criando src/types/holyrics.ts.
2. Atualizar api/room.ts para persistir holyrics_url na tabela rooms com ação 'update-holyrics-url' e preservar no 'reset-service'.
3. Criar src/hooks/useHolyricsSync.ts com WebSocket e reconexão silenciosa.
4. Criar src/components/holyrics/HolyricsOverlay.tsx (Escura Solene #0B0D13, auto-fit de fonte, botão [✕ Minimizar]).
5. Criar src/components/holyrics/HolyricsReturnPill.tsx (Pill flutuante no rodapé com botão [⛶ Voltar para o Telão]).
6. Criar src/components/controlador/modals/ControladorHolyricsModal.tsx e adicionar botão de acesso no ControladorPanel.tsx.
7. Conectar os componentes no PulpitView.tsx respeitando o fluxo pastoral.

RESTRIÇÕES:
- Não utilizar <iframe> em nenhuma tela.
- Zero vazamento de credenciais no frontend.
- Zero impacto nas visões do Obreiro.
- Compilação limpa com tsc e npm run build.
```
