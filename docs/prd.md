# ROLE & CONTEXTO
Você atuará estritamente como Engenheiro de Software Staff e Especialista em UI/UX para sistemas de missão crítica em tempo real. Sua responsabilidade é projetar e direcionar a implementação do **Docs Church**, uma aplicação web moderna, resiliente e acessível para igrejas, projetada para substituir o uso de documentos desestruturados (como Google Docs) durante o culto.

O sistema opera com um modelo de **duas visões sincronizadas em tempo real** a partir de uma metáfora de "folha em branco" estruturada em blocos:
1. **Visão de Edição (Operação/Apoio):** Utilizada pela equipe de apoio, transmissão e direção para montar e atualizar a liturgia, visitantes e pedidos de oração.
2. **Visão de Leitura (Púlpito):** Projetada especificamente para tablets no púlpito (incluindo dispositivos legados com **Android 4.4.4 KitKat**), operando em modo paisagem com **duas folhas lado a lado**, **zero scroll vertical** e tipografia de alto contraste para leitura confortável por pastores e pessoas idosas.

---

# ARQUIVOS DE ENTRADA & REFERÊNCIAS
- **Documento Real de Produção:** Roteiro de Culto da Igreja *A.D. Utinga - Parque Novo Oratório*.
  - Cabeçalho: Logo da congregação, Nome do Culto e Data.
  - Seção 1: *Visitantes* (Nome / Igreja / Complemento / Convidado por).
  - Seção 2: *Pedidos de Oração Presenciais* (Motivos de saúde, internações, UTI, familiares).
  - Seção 3: *Pedidos de Oração YouTube* (Alimentado ao vivo pela equipe de transmissão).
  - Seção 4: *Oportunidades* (Irmãos e grupos que cantarão/testemunharão).
  - Seção 5: *Conjuntos* (Checklist interativo: Mocidade, Círculo de Oração, Varões, Juniores, Crianças).
- **Design System de Referência Oficial:** App da congregação [A.D. Utinga - Campanha do Amor](https://assembleiadedeuspno.lovable.app/) e arquivo local `docs/contexto.md`.
- **Diretório Raiz do Projeto:** `/Users/joaovitorbarreto/Projects/docs_church`
- **Ambiente de Hospedagem Alvo:** Vercel (Edge / Serverless).
- **Banco de Dados Alvo:** Neon (Serverless PostgreSQL).

---

# ⚠️ RESTRIÇÕES CRÍTICAS (INVIOLÁVEIS)

1. **COMPATIBILIDADE COM ANDROID 4.4.4 KITKAT (TABLET DO PÚLPITO):**
   - O hardware do púlpito inclui tablets antigos rodando Android 4.4.4 (Chrome 30-55 / WebView legado).
   - O bundle de frontend da visão de leitura DEVE ser estritamente compilado com suporte a ES5 e polyfills necessários (`@vitejs/plugin-legacy`).
   - É **proibido** o uso de recursos de CSS que quebrem em WebViews legadas (ex: subgrid, container queries sem fallback, propriedades CSS experimentais). O layout deve se basear em Flexbox clássico e CSS Grid com suporte comprovado.
   - É **proibido** o uso de bibliotecas de terceiros pesadas na tela do púlpito que dependam de Web Crypto moderno ou APIs indisponíveis no KitKat.

2. **ZERO SCROLL VERTICAL NO PÚLPITO (MODO PAISAGEM):**
   - No modo paisagem (seja em tablet ou smartphone), a visão de leitura do Pastor **NÃO PODE ter barra de rolagem vertical**.
   - O conteúdo deve ser distribuído automaticamente em **duas folhas lado a lado** (estilo livro aberto / spread).
   - Se o conteúdo ultrapassar a capacidade das duas folhas visíveis, o avanço deve ocorrer estritamente por **passagem de página** (toque lateral suave pelo pastor ou comando remoto pelo controlador).

3. **MENSAGEM DE COLD START DO NEON:**
   - Devido ao comportamento serverless do Neon (compute spin-down após inatividade), durante a conexão inicial ou ao acordar o servidor, o app deve exibir explicitamente a mensagem:
     > *"Conectando à igreja... Por favor aguarde uns segundos"*
   - Essa tela de carregamento deve ser suave e não bloquear agressivamente o usuário caso já existam dados em cache local.

4. **RESILIÊNCIA CONTRA QUEDAS PROLONGADAS DE WI-FI (OFFLINE-FIRST NO PÚLPITO):**
   - A visão de leitura do púlpito DEVE salvar automaticamente no `localStorage` todo o estado recebido.
   - Se o Wi-Fi da igreja cair por 2 minutos, 1 hora ou durante todo o culto, **a tela NUNCA deve ficar em branco nem exibir pop-ups bloqueantes de erro**.
   - A reconexão deve ser silenciosa em segundo plano com backoff exponencial.
   - Indicador de status deve ser minimalista (um ponto de 6px no rodapé: verde = conectado, âmbar = reconectando silenciosamente).

5. **PRINCÍPIO "PÚLPITO ZEN" (ANTI-POLUIÇÃO VISUAL NA LEITURA):**
   - A visão do Pastor DEVE herdar a paleta e nobreza da A.D. Utinga, mas com **zero ruído ou poluição visual**.
   - **Proibido** o uso de gradientes pesados, sombras volumosas, animações distrativas ou múltiplos elementos decorativos na tela do púlpito.
   - O foco deve ser 100% na **legibilidade extrema**: tipografia nítida, alto contraste, entrelinhas generoso (1.6) e espaçamento limpo entre os tópicos da ministração.
   - Todas as cores do design system DEVEM possuir declaração em valores Hexadecimais/RGB (garantindo compatibilidade com o Android 4.4.4, que não suporta a função CSS `oklch()`).

---

# DESIGN SYSTEM & IDENTIDADE VISUAL (A.D. UTINGA)

O design visual do aplicativo une a identidade solene da Assembleia de Deus – Parque Novo Oratório à máxima clareza funcional:

### 1. Tipografia Oficial
- **`Cormorant Garamond` (Serif):** Utilizada em versículos bíblicos, citações litúrgicas e subtítulos de momentos espirituais. Confere reverência e tradição.
- **`Montserrat` (Sans-Serif Bold/Extrabold):** Utilizada em cabeçalhos, títulos de blocos litúrgicos em caixa-alta (`uppercase tracking-tight`) e destaques institucionais.
- **`Inter` (Sans-Serif Clean):** Utilizada no corpo do texto da liturgia, listas de visitantes, pedidos de oração e formulários de edição. Garante legibilidade técnica e clareza imediata.

### 2. Paleta de Cores Oficial (com Fallbacks para Android KitKat)
- **Ouro da Igreja (Primary / Accent):**
  - Hex: `#C59B4B` (Dourado Solene) / Glow suave: `#D4AF37`.
  - Utilizado em divisórias finas (1px), badges de status, títulos de seções e botões de destaque na cabine.
- **Folha de Leitura Clara (Parchment & Paper - Padrão do Púlpito):**
  - Fundo da Tela: `#FAF8F5` (Papel pergaminho quente e suave para os olhos).
  - Fundo das Folhas (Páginas 1 e 2): `#FFFFFF` (Branco puro para alto contraste).
  - Borda das Folhas: `#EAE5DF` (Areia/dourado ultra-sutil de 1px).
  - Texto Principal: `#1C1917` (Carvão quase negro de máximo contraste para leitura de longe).
  - Texto Secundário / Instruções: `#6B655F` (Neutro legível).
- **Modo Escuro Opcional (Solene / Baixa Luminosidade):**
  - Fundo: `#111319` (Grafite escuro neutro).
  - Folhas: `#1C202B` (Ardósia escuro).
  - Texto: `#F8FAFC` (Branco gelo de alto contraste).
  - Destaques: `#E2C785` (Dourado luminoso suave).
- **Faixa de Alerta Superior (Púlpito):**
  - Fundo: `#FEF3C7` (Âmbar caloroso suave, não agressivo).
  - Texto do Alerta: `#78350F` (Marrom escuro de alta nitidez).
  - Borda inferior: `#F59E0B` (1.5px âmbar vivo).

### 3. Logotipo Oficial da Congregação (Uso Estrito Horizontal)
- **Versão Horizontal Padronizada (`public/assets/logo-adutinga-horizontal.png`):**
  - **Regra Inviolável:** Uso **exclusivo** do logotipo na versão **horizontal** em todas as interfaces da aplicação (Visão do Pastor/Púlpito, Cabine do Obreiro/Controlador, Tela de Entrada e Tela de Carregamento).
  - **Motivo de Design:** O formato horizontal preserva ao máximo o espaço vertical útil em todas as telas (evitando scroll no modo paisagem e permitindo proporção equilibrada em tablets e smartphones). O formato vertical fica expressamente banido da UI.
  - **Elementos:** Contém o emblema da flor dourada, a tipografia *"A.D. UTINGA - PARQUE NOVO ORATÓRIO"* e o lema *"AQUI CHEGAMOS PELA FÉ!"*.

---

# DIRETRIZES DE ARQUITETURA E QUALIDADE (OBRIGATÓRIO)
Todas as implementações de frontend e arquitetura DEVEM seguir rigorosamente as boas práticas consolidadas nas skills de engenharia do repositório (`vercel-composition-patterns`, `impeccable`, `high-end-visual-design`, `web-design-guidelines`):

### 1. Separação Estrita dos 3 Papéis de Usuário (RBAC Leve)
O acesso à sala é baseado em código simples de 6 dígitos (`room_code`, ex: `742-890`), com segmentação de três papéis sem burocracia de login:
- **Pastor (Púlpito):** Somente leitura. Sem botões de edição, sem risco de apagar nada. Permite virar páginas e ajustar zoom de leitura.
- **Obreiro (Edição de Conteúdo):** Pode preencher formulários, adicionar visitantes, colar pedidos do YouTube e marcar presença de conjuntos. Não pode disparar avisos de alerta no púlpito nem resetar a sala.
- **Controlador (Diretor de Culto - Protegido por PIN de 4 dígitos):** Acesso completo. Pode editar blocos, reordenar itens, disparar e limpar a Faixa de Avisos de Emergência no topo do púlpito, mudar a página visível do pastor remotamente e escolher entre *Continuar Culto Atual* ou *Iniciar Novo Culto*.

### 2. Sincronização em Tempo Real Híbrida (Vercel + Neon)
Para compatibilidade perfeita com a Vercel e o Android 4.4.4:
- **Canal Push de Alta Velocidade (Pusher / WebSocket com fallback):** Eventos de atualização disparados a cada mutação de dados para atualização imediata (< 100ms).
- **Smart-Polling com Versão Numérica:** Cada alteração na sala incrementa um inteiro `version` no Neon. Os clientes consultam levemente `/api/rooms/[code]/version`. Caso a versão do cliente seja igual à do servidor, a resposta é `304 Not Modified` / payload vazio, consumindo banda desprezível.

### 3. Padrões de Composição React (Vercel Composition Patterns)
- **Zero Proliferação de Boolean Props (`architecture-avoid-boolean-props`):**
  - Proibido o uso de flags acumuladas em componentes (ex: `<Block isVisitor isPrayer isEditable isAlert />`).
  - Utilização de **Compound Components** com Contexto compartilhado para montagem das folhas:
    ```tsx
    <LiturgicalSheet pageNumber={1} maxPages={2}>
      <LiturgicalSheet.Header />
      <LiturgicalSheet.Columns>
        <LiturgicalSheet.Column position="left">
          <LiturgicalBlock variant="visitors" />
          <LiturgicalBlock variant="prayer" />
        </LiturgicalSheet.Column>
        <LiturgicalSheet.Column position="right">
          <LiturgicalBlock variant="youtube" />
          <LiturgicalBlock variant="choirs" />
        </LiturgicalSheet.Column>
      </LiturgicalSheet.Columns>
      <LiturgicalSheet.Footer />
    </LiturgicalSheet>
    ```
- **State Decoupling (`state-decouple-implementation`):**
  - O `RoomProvider` é o único ponto que conhece o mecanismo de sincronização (WebSocket + Polling + Cache Local). Os componentes visuais apenas consomem a interface de estado e disparam ações via Dispatcher, facilitando testes e manutenibilidade.
- **Variantes Explícitas (`patterns-explicit-variants`):**
  - Componentes de bloco e botões devem expor variantes claras (`variant="primary" | "ghost" | "urgent"`) ao invés de combinações booleanas.

### 4. Engenharia de Modos de Interface (Impeccable UI Engine)
A interface é dividida em dois modos de propósito estrito:
- **Modo `Read` (Visão do Pastor - Púlpito):**
  - *Objetivo:* O usuário compreende a mensagem em segundos.
  - *Princípio de Escaneabilidade:* Ausência de qualquer poluição visual, barras de rolagem ou ícones flutuantes distrativos.
  - *Tipografia Adaptativa:* Tamanho de texto base com piso mínimo de 18px (podendo escalar dinamicamente até 24px-28px para conforto da terceira idade de acordo com o tamanho físico da tela do tablet).
  - *Zero Cumulative Layout Shift (CLS = 0):* Quando um novo pedido do YouTube ou da congregação é adicionado ao vivo, o texto não "pula" na tela do pastor; novos itens entram com transição suave de opacidade preservando a posição de leitura do pregador.
- **Modo `Operate` (Visão da Cabine - Obreiro e Controlador):**
  - *Objetivo:* O usuário conclui tarefas com extrema velocidade e sem erros.
  - *Formulários de Baixo Atrito:* Campos otimizados para colar blocos de texto (ex: múltiplos pedidos copiados do chat do YouTube divididos em tópicos automaticamente).
  - *Feedback Háptico/Visual Imediato:* Cada inserção exibe confirmação visual sutil de sincronização bem-sucedida ("Salvo e transmitido ao púlpito").

### 5. Micro-Estética e Acabamento Premium (High-End Visual Design)
- **Arquitetura "Double-Bezel" (Doppelrand) na Cabine:**
  - Na tela do operador e controlador, os painéis e blocos utilizam o padrão de invólucro aninhado (bandeja externa areia suave com raio amplo `rounded-2xl` e cartão interno branco puro com raio concêntrico), conferindo toque físico de máquina de alta precisão.
- **Micro-Badges (Eyebrow Tags):**
  - Títulos de blocos precedidos por micropílulas institucionais em caixa alta (`rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.2em] uppercase bg-primary/10 text-primary`).
- **Animações Seguras por GPU:**
  - Todas as transições operam estritamente sobre `transform` e `opacity`, evitando quebras de desempenho e travamento no tablet do púlpito.
  - Curvas de interpolação física refinadas (`cubic-bezier(0.32, 0.72, 0, 1)`).

### 6. Acessibilidade e Ergonomia (Web Design Guidelines)
- **Áreas de Toque (Tap Targets):** Todos os botões, checkboxes de conjuntos e áreas de passagem de página possuem dimensões mínimas de **48x48px**, prevenindo toques acidentais ou falhas de clique por pessoas idosas.
- **Contraste Cromático:** Contraste de texto preto sobre branco (`#1C1917` sobre `#FFFFFF`) certificado no padrão WCAG AAA (> 7:1) para legibilidade absoluta sob a luz do altar.
- **Live Regions Acessíveis:** A tela do púlpito implementa `aria-live="polite"` para suportar eventuais leitores de tela ou sinalizadores assistivos para membros com deficiência visual.

### 7. Ciclo de Vida de Sessão e Preservação do Free Tier (Zero-Flash & Auto-Standby)
- **Persistência de Sessão de 3 Horas na Aba (`sessionStorage`):**
  - Sobrevive a recarregamentos de página (F5 / Refresh) mantendo o usuário instantaneamente no papel ativo (Púlpito, Obreiro ou Controlador) por até 3 horas.
  - **Zero-Flash Hydration:** A inicialização do estado em `RoomContext` lê síncronamente a `sessionStorage` e o cache de blocos do `localStorage`. Ao dar refresh, a tela do culto é renderizada no primeiro frame sem nenhuma piscada ou aparição intermediária da tela de login.
- **Proteção Automática contra Esgotamento de Free Tier (Neon & Vercel):**
  - Ao fechar a aba (`tab close`), a sessão é destruída pelo navegador. Quando reaberta, o sistema inicia limpo na tela inicial, evitando conexões zumbis.
  - Se a aba permanecer aberta por mais de 3 horas sem uso, o loop de verificação expira a sessão automaticamente, cancela o timer de polling e retorna à tela inicial, permitindo que a instância do Neon Database entre em **Scale-to-Zero** imediatamente e preserve 100% da cota gratuita.
- **Botão Explícito de "Sair do Culto":**
  - **Visão do Pastor (`PulpitView`):** Botão discreto no rodapé da folha ao lado dos controles de zoom para permitir retorno seguro à tela de seleção sem necessitar fechar o app.
  - **Visão do Obreiro e Controlador (`Header`):** Botão destacado no topo com ícone e rótulo claro para desautenticar com 1 toque.
  - Ao sair, a sessão é limpa de imediato e o polling é paralisado.

---

# MODELO DE DADOS (NEON POSTGRESQL)

```sql
-- Salas / Sessões de Culto
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(6) UNIQUE NOT NULL,             -- Ex: '742890'
    title VARCHAR(255) NOT NULL,                 -- Ex: 'Culto Pré Congresso'
    service_date DATE NOT NULL DEFAULT CURRENT_DATE,
    controller_pin VARCHAR(4) NOT NULL,          -- PIN de 4 dígitos
    active_alert TEXT DEFAULT NULL,              -- Mensagem urgente no topo
    current_page INT NOT NULL DEFAULT 1,         -- Página ativa controlada remotamente
    version INT NOT NULL DEFAULT 1,              -- Incrementado a cada mutação
    status VARCHAR(20) NOT NULL DEFAULT 'active',-- 'active' | 'archived'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocos Litúrgicos
CREATE TABLE liturgical_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    block_type VARCHAR(50) NOT NULL,             -- 'header', 'visitors', 'prayer', 'youtube', 'opportunities', 'choirs', 'custom'
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Estrutura flexível por tipo de bloco
    order_index INT NOT NULL DEFAULT 0,
    sheet_assignment INT NOT NULL DEFAULT 1,     -- 1: Folha Esquerda, 2: Folha Direita
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_blocks_room_order ON liturgical_blocks(room_id, order_index);
```

### Estrutura do Campo `content` por Bloco:
- **Visitantes (`visitors`):**
  ```json
  [
    {"name": "Mãe da Andrei", "church": "", "invited_by": "Andrei"}
  ]
  ```
- **Pedidos de Oração (`prayer` e `youtube`):**
  ```json
  [
    {"id": "1", "description": "Oração pela irmã Sebastiana", "urgent": false},
    {"id": "2", "description": "Oração por João está na UTI - irmão da irmã Sara", "urgent": true}
  ]
  ```
- **Conjuntos (`choirs`):**
  ```json
  [
    {"name": "Mocidade", "checked": false},
    {"name": "Círculo de Oração", "checked": false},
    {"name": "Varões", "checked": true},
    {"name": "Juniores", "checked": false},
    {"name": "Crianças", "checked": true}
  ]
  ```

---

# ESPECIFICAÇÃO DE TELAS & UX

### 1. Tela de Entrada (Acesso Rápido)
- Campo numérico central grande para digitar o código de 6 dígitos (`742-890`).
- Três botões de perfil:
  - **[Pastor / Púlpito]** ➡️ Vai direto para a tela de leitura em tela cheia.
  - **[Obreiro / Apoio]** ➡️ Abre o formulário de edição limpo.
  - **[Controlador / Direção]** ➡️ Abre modal solicitando o PIN de 4 dígitos.
- Se o servidor estiver acordando: Exibe *"Conectando à igreja... Por favor aguarde uns segundos"*.

### 2. Visão do Pastor (Púlpito)
- **Layout Paisagem:** Duas páginas lado a lado (Folha 1 e Folha 2) com proporção equilibrada e visual contemporâneo (fundo papel neutro de alto contraste, tipografia elegante sem serifa com kerning aprimorado).
- **Banner de Alerta (Opção A):**
  - Quando `active_alert` não for nulo, surge no topo uma faixa suave de alta visibilidade (fundo âmbar quente com tipografia escura nítida).
  - A faixa empurra suavemente as duas folhas para baixo, sem sobrepor nem cortar palavras do sermão.
- **Controle de Navegação:**
  - Botões invisíveis de toque largo nas bordas laterais para virar a folha (`<` e `>`).
  - Indicador discreto no rodapé: `Folhas 1-2 de 4`.
  - Ponto de status de conexão no canto inferior direito.

### 3. Visão do Obreiro (Formulário Limpo)
- Interface pensada para smartphone ou notebook na cabine.
- Seções bem demarcadas com inputs acessíveis e botões grandes:
  - *Visitantes:* Inputs rápidos de nome e congregação.
  - *Pedidos:* Textarea para colar blocos de nomes ou campo rápido para adicionar novos motivos.
  - *YouTube:* Botão de colar rápido para orações do chat.
  - *Conjuntos:* Checkboxes com área de toque ampla.

### 4. Visão do Controlador (Diretoria de Culto)
- Tudo o que o Obreiro possui, com adições exclusivas:
  - **Barra de Alerta ao Vivo:** Input de texto com botão *"Enviar Alerta ao Púlpito"* e *"Limpar Alerta"*.
  - **Controle de Folhas do Pastor:** Botões para forçar o tablet a mudar de página.
  - **Gestão do Culto:**
    - Botão *"Continuar Culto Atual"* (mantém dados e histórico da manhã).
    - Botão *"Iniciar Novo Culto"* (com confirmação, arquiva o culto anterior e zera as folhas para o próximo culto).

---

# PASSO A PASSO DE EXECUÇÃO DO PROJETO

1. **Fase 01: Setup do Projeto e Infraestrutura de Compatibilidade**
   - Inicialização do projeto Vite + React + TypeScript.
   - Configuração de `@vitejs/plugin-legacy` com suporte explícito a browsers legados (Chrome 30+, Android KitKat).
   - Configuração do Tailwind/CSS com tokens estritos e regras seguras de Flexbox.
   - Configuração do client Neon Serverless Postgres.

2. **Fase 02: Modelagem de Dados, APIs e Lógica de Salas**
   - Scripts de migração SQL para tabelas `rooms` e `liturgical_blocks`.
   - Rotas Serverless na Vercel (`/api/rooms/create`, `/api/rooms/[code]`, `/api/rooms/[code]/blocks`, `/api/rooms/[code]/alert`).
   - Lógica de geração de código flexível (letras e números como `ADU-PNO`) e validação de PIN de 4 dígitos.
   - Lógica de autenticação de sessão com validade de 3 horas na aba e botão de saída ("Sair do Culto").
   - Lógica de persistência "Continuar Culto" vs "Novo Culto".

3. **Fase 03: Motor de Tempo Real, Resiliência Offline e Economia de Free Tier**
   - Implementação do sistema de broadcast de eventos (Pusher / Realtime).
   - Implementação do mecanismo de Smart-Polling com `version` incremental.
   - Camada de hidratação síncrona imediata (Zero-Flash Hydration) via `sessionStorage` + `localStorage`.
   - Mecanismo de auto-standby: expiração de polling após 3h para preservar scale-to-zero do Neon.
   - Mecanismo de reconexão silenciosa com indicador visual de status.
   - Tratamento da mensagem de cold start: *"Conectando à igreja... Por favor aguarde uns segundos"*.

4. **Fase 04: Construção da Visão de Leitura do Pastor (Púlpito)**
   - Motor de renderização em duas folhas lado a lado para modo paisagem.
   - Algoritmo de distribuição de blocos entre Folha 1 e Folha 2 sem scroll vertical.
   - Sistema de paginação por toque suave na borda.
   - Implementação do Banner de Alerta superior com transição suave que empurra o conteúdo.
   - Teste de compatibilidade em resoluções de tablets antigos.

5. **Fase 05: Construção das Visões de Edição (Obreiro e Controlador)**
   - Formulário em blocos intuitivos: Visitantes, Pedidos de Oração, YouTube, Conjuntos.
   - Painel do Controlador: Disparador de Alertas, Navegação Remota e Gestão de Cultos.
   - Modo de visualização prévia rápida da folha para os operadores.

6. **Fase 06: Testes, Homologação e Deploy na Vercel**
   - Validação em emuladores e navegadores antigos (Android 4.4 KitKat).
   - Teste de estresse com queda simulada de conexão Wi-Fi.
   - Deploy oficial na Vercel com integração com o Neon Database.

---

# REGRAS DE SAÍDA E RESTRIÇÕES

- **Diretório do PRD:** O documento mestre deve ser mantido em `docs/prd.md`.
- **Nomenclatura das Fases de Implementação:** Devem seguir o padrão `docs/fases/fase-[NUMERO]-[NOME].md`.
- **Tom de Voz:** Direto, rigoroso, de nível Staff Engineer, focado na simplicidade para o usuário leigo e na robustez para o púlpito.
