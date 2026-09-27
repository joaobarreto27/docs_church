# Guia Definitivo: Configuração do ngrok e Integração Holyrics — Painel do Culto (A.D. Utinga)

Este documento consolida todo o conhecimento técnico, decisões de arquitetura, salvaguardas de rede e passo a passo operacional para a conexão entre o **Holyrics (Projeção no Telão)** e o **Painel do Culto (docs_church)** via **ngrok**, garantindo estabilidade no tablet do púlpito (**Android 4.4.4 KitKat**) e autonomia para a equipe de transmissão.

---

## 1. Visão Geral e Arquitetura da Solução

### Por que o ngrok é necessário?
* **O App roda em HTTPS na Vercel:** O Painel do Culto é servido através de conexão segura (`https://...`). Navegadores modernos e WebViews antigas bloqueiam terminantemente qualquer requisição direta para IPs locais não criptografados (`http://192.168.x.x:8081`) por violar a política de **Mixed Content** (conteúdo misto).
* **Por que não Cloudflare Tunnel?** O Cloudflare Tunnel exige registro de um domínio personalizado (compra de domínio, alteração de Nameservers e registros DNS), o que encarece e adiciona complexidade desnecessária para a igreja.
* **Por que substituímos o Spacedesk?** O Spacedesk consome entre **30% e 70% de CPU** em um Core i3 comprimindo vídeo a 30/60 fps, além de saturar a memória RAM e travar o tablet. O ngrok consome **praticamente 0% de CPU**, pois trafega apenas texto estruturado (JSON com a letra do hino ou versículo).
* **Vantagem do ngrok:** Oferece um **domínio estático permanente e gratuito** (`.ngrok-free.app`) com certificado SSL (HTTPS) automático, sem depender de portas abertas no roteador da igreja.

### Diagrama de Fluxo dos Dados

```
┌────────────────────────────────────────────────────────┐
│               PC DA IGREJA (WINDOWS)                   │
│                                                        │
│  [ Holyrics ] ──> HTTP Local (:8081/stage_view_data)   │
│         │                                              │
│         ▼                                              │
│  [ ngrok.exe ] ──> Túnel Seguro de Saída (Minimizado)  │
└──────────────────────────┬─────────────────────────────┘
                           │ Túnel HTTPS
                           ▼
┌────────────────────────────────────────────────────────┐
│                   NUVEM (VERCEL)                       │
│                                                        │
│  api/holyrics.ts (Proxy Serverless + Cache RAM)        │
│  - Recebe requisições com roomId                       │
│  - Consulta URL da sala salva no Neon PostgreSQL       │
│  - Injeta cabeçalho "ngrok-skip-browser-warning: true" │
└──────────────────────────┬─────────────────────────────┘
                           │ JSON Nativo (~700ms - 900ms)
                           ▼
┌────────────────────────────────────────────────────────┐
│             TABLET DO PÚLPITO (ANDROID 4.4.4)          │
│                                                        │
│  - Renderização 100% Nativa em React (Zero <iframe>)   │
│  - Opção Escura Solene (#0B0D13) com Auto-Escala       │
│  - Botão [✕ Minimizar] e Pill Flutuante de Retorno     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Conta ngrok e Reserva do Domínio Estático Gratuito

A configuração da conta é realizada **uma única vez** pelo navegador:

1. **Criar Conta Gratuita:**
   - Acesse [ngrok.com](https://ngrok.com) e clique em **Sign up for free**.
   - Pode utilizar o login com Google ou e-mail da igreja.
2. **Obter o Token de Autenticação (AUTHTOKEN):**
   - No menu lateral esquerdo do Dashboard, acesse:  
     👉 **Getting Started > Your Authtoken** (ou [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)).
   - Clique em **Copy** para copiar a sua chave pessoal.
   - *Nota de Segurança:* Este token pertence exclusivamente ao computador da igreja e **nunca** deve ser inserido no código-fonte ou no frontend da aplicação.
3. **Reservar o Domínio Estático Gratuito (Static Domain):**
   - No menu lateral esquerdo, acesse:  
     👉 **Cloud Edge > Domains**.
   - O ngrok disponibiliza 1 domínio permanente gratuito por conta (exemplo: `ad-utinga-projecao.ngrok-free.app`).
   - Copie esse domínio. Ele será o endereço fixo que nunca mudará.

---

## 3. Configuração no Windows da Igreja (100% Automático)

Para que os operadores voluntários não precisem digitar comandos de terminal antes do culto, o ngrok deve iniciar automaticamente em segundo plano ao ligar o computador.

### Passo 1: Organizar a Pasta
1. Abra o **Explorador de Arquivos** no disco local `C:\`.
2. Crie uma pasta chamada **`ngrok`** (caminho final: `C:\ngrok`).
3. Baixe o `ngrok.exe` para Windows (64-bit) no site oficial e coloque o arquivo dentro de `C:\ngrok`.

### Passo 2: Registrar o Authtoken no Computador
1. No teclado, aperte `Windows + R`, digite `cmd` e pressione `Enter`.
2. Execute o comando abaixo substituindo pelo seu token:
   ```cmd
   C:\ngrok\ngrok.exe config add-authtoken SEU_AUTHTOKEN_AQUI
   ```
3. O ngrok salvará a credencial em `%USERPROFILE%\AppData\Local\ngrok\ngrok.yml`. Feche a janela preta.

### Passo 3: Criar o Script de Execução Automática (`iniciar_ngrok.bat`)
1. Abra o **Bloco de Notas**.
2. Digite as seguintes linhas (substitua pelo seu domínio reservado e a porta do Holyrics, geralmente `8081`):
   ```bat
   @echo off
   cd /d C:\ngrok
   ngrok http 8081 --url=SEU-DOMINIO-AQUI.ngrok-free.app
   ```
3. No Bloco de Notas, vá em **Arquivo > Salvar como...**.
4. Em *Tipo*, selecione **Todos os arquivos (*.*)**.
5. Salve com o nome: `iniciar_ngrok.bat` dentro de `C:\ngrok`.

### Passo 4: Iniciar com o Windows em Modo Minimizado
1. No teclado, pressione `Windows + R`, digite exatamente:
   ```text
   shell:startup
   ```
   e pressione `Enter`. Isso abrirá a pasta de Inicialização do Windows.
2. Na pasta `C:\ngrok`, clique com o botão direito no arquivo `iniciar_ngrok.bat` e selecione **Criar atalho**.
3. Mova ou copie esse atalho para dentro da pasta `shell:startup`.
4. Clique com o botão direito no atalho dentro de `shell:startup` > **Propriedades**.
5. Na aba **Atalho**, no campo **Executar**, altere de *Janela normal* para **Minimizado**.
6. Clique em **Aplicar** e **OK**.

> **Resultado:** Sempre que o computador da igreja for ligado, o ngrok inicializará silenciosamente na barra de tarefas, mantendo o link ativo durante todo o culto sem intervenção humana.

---

## 4. Configuração no Mac (Ambiente de Testes / Casa)

Caso queira testar a projeção em casa com o Holyrics para macOS:

1. **Instalar o ngrok via Homebrew:**
   ```bash
   brew install ngrok/ngrok/ngrok
   ```
   *(Ou baixe o binário para macOS no site do ngrok e mova para `/usr/local/bin`)*.
2. **Adicionar o token:**
   ```bash
   ngrok config add-authtoken SEU_AUTHTOKEN_AQUI
   ```
3. **Iniciar o túnel para a porta do Holyrics:**
   ```bash
   ngrok http 8081 --url=SEU-DOMINIO-AQUI.ngrok-free.app
   ```

---

## 5. Configuração no Software Holyrics

No computador onde o Holyrics está instalado (seja Windows ou Mac):

1. Abra o Holyrics e vá em: **Ferramentas > Plugin Holyrics** (ou *Arquivo > Configurações > Servidor / API*).
2. Verifique se o servidor está **Habilitado**.
3. Defina a porta de escuta para **8081** (porta padrão do plugin).
4. Em permissões, certifique-se de que a leitura de slides e visualização esteja liberada para conexões locais.
5. **Teste de Verificação Imediata:**
   - Projete uma música ou versículo no Holyrics.
   - Abra o navegador e acesse:
     ```text
     http://localhost:8081/stage_view_data
     ```
   - Ou acesse via link público com o parâmetro anti-alerta:
     ```text
     https://SEU-DOMINIO-AQUI.ngrok-free.app/stage_view_data?ngrok-skip-browser-warning=true
     ```
   - Se a tela exibir um JSON estruturado com o texto projetado (`{"text": "..."}`), a integração está pronta. Ao limpar a tela (F5 no Holyrics), o campo `text` deve retornar vazio.

---

## 6. Integração com o Painel do Culto (`docs_church`)

A arquitetura do `docs_church` foi projetada segundo o princípio de **Zero Hardcode** e **Segurança Caixa Preta**:

### 1. Cadastro Centralizado no Painel do Controlador
- O operador da mesa de som/direção abre o painel do **Controlador** (autenticado com PIN de 4 dígitos).
- Clica no botão **`[🎵 Holyrics]`** na barra superior.
- Cola a URL do ngrok (`https://ad-utinga-projecao.ngrok-free.app`).
- Clica em **"Testar Conexão"**: o sistema dispara um healthcheck de 2 segundos para validar se a porta 8081 está respondendo.
- Clica em **"Salvar na Sala"**.

### 2. Persistência Isolada por Sala (Neon PostgreSQL)
- A URL é salva exclusivamente na linha daquela sala no banco Neon (`UPDATE rooms SET holyrics_url = ... WHERE id = roomId`).
- **Isolamento Total:** Se uma nova sala for criada para outro culto, ela começa limpa (`holyrics_url = NULL`). Uma sala nunca interfere na URL de outra.
- **Continuidade:** O operador pode desconectar ou alterar o link a qualquer momento sem afetar o histórico do culto.

### 3. Padrão "Caixa Preta" e Proxy Serverless (`api/holyrics.ts`)
- A URL do ngrok **nunca é transmitida** para o tablet do pastor ou celular dos obreiros (proteção contra IDOR e vazamento de rotas internas).
- Os clientes recebem apenas a flag booleana `has_holyrics: true`.
- As requisições de consulta passam pela rota serverless `/api/holyrics?roomId=...` na Vercel, que injeta automaticamente o cabeçalho `ngrok-skip-browser-warning: true` e mantém cache em memória RAM para latência ultra-rápida.

---

## 7. Blindagem Contra o Erro 99 da WAF & Android 4.4.4 KitKat

Durante a concepção técnica, foram superados os desafios críticos de hardware e rede da congregação:

### 1. Fim do `<iframe>` (Renderização Nativa React)
- O tablet do púlpito (Samsung Galaxy Tab E) possui apenas 1.5 GB de RAM e WebView Chromium legada (versões 30-39).
- Embutir um `<iframe>` externo causava falta de memória (OOM) e congelamento de tela.
- **A Solução:** O app lê apenas o texto via JSON e desenha nativamente na tela com componentes React estilizados (paleta Escura Solene `#0B0D13`), garantindo consumo de memória desprezível.

### 2. Auto-Ajuste Tipográfico Dinâmico (Sem Scroll Vertical)
- No modo paisagem do púlpito, **é proibido haver barra de rolagem vertical**.
- O componente calcula a extensão do texto e ajusta a fonte automaticamente:
  - Refrões curtos (< 120 caracteres): Fonte grande (~38px - 44px).
  - Estrofes comuns (120 - 300 caracteres): Fonte padrão (~26px - 30px).
  - Leituras bíblicas densas (300 - 600 caracteres, ex: Ester 8:9): Fonte balanceada (~18px - 20px) com entrelinhas solene, 100% legível e sem cortes.

### 3. O Fenômeno do Erro 99 e Redes 2.4 GHz vs 5 GHz
- **Atenção:** Mesmo que o tablet do obreiro esteja conectado na rede Wi-Fi `2.4 GHz` e o tablet do púlpito na rede `5 GHz`, **ambos saem para a internet através do mesmo roteador e do mesmo IP público da igreja**.
- Se um dos aparelhos fizer requisições em excesso (polling agressivo de menos de 1 segundo), a Cloudflare/Vercel identificará o User-Agent legado do Android como tráfego suspeito e aplicará um desafio de bloqueio (Erro 99) no **IP inteiro da igreja**, derrubando todos os aparelhos simultaneamente.
- **Como evitamos o bloqueio:**
  - Polling seguro de **1.100 ms** no púlpito durante o culto.
  - Pausa inteligente: quando a tela do tablet apaga, o intervalo passa para **4.000 ms**.
  - Cache em memória na rota `/api/holyrics`, aliviando o tráfego de saída.

### 4. Latência de Versículos Durante a Pregação
- **Cenário:** O pastor prega por 15 a 20 minutos sem que nenhum versículo seja projetado. De repente, o pregador cita um versículo e o operador dá *Enter* no Holyrics.
- **Tempo de Resposta Real:** Entre **700 ms e 900 ms** (menos de 1 segundo).
  - Espera média de ciclo: ~550 ms.
  - Viagem da rede (Tablet ➔ Vercel ➔ ngrok ➔ PC da Igreja): ~200 ms a 300 ms.
  - O versículo aparece de forma imediata e fluida no púlpito.
  - Se o pastor ligar a tela do tablet no meio da mensagem, o evento nativo `visibilitychange` executa uma checagem instantânea (0 ms de espera).

---

## 8. Checklist Operacional para o Dia de Culto

| Ordem | Ação | Responsável | Verificação |
| :---: | :--- | :---: | :--- |
| **1** | Ligar o computador da transmissão/som | Operador do Som | O ícone do ngrok abre minimizado na barra de tarefas. |
| **2** | Abrir o software Holyrics | Operador de Projeção | Garantir que o plugin está ativo (porta 8081). |
| **3** | Acessar o Painel do Culto (`docs_church`) | Controlador | Entrar com o código da sala e PIN de 4 dígitos. |
| **4** | Clicar no botão `[🎵 Holyrics]` no topo | Controlador | Verificar se a URL estática está preenchida. |
| **5** | Clicar em **"Testar Conexão"** | Controlador | Badge verde: *"✅ Conectado com sucesso!"*. |
| **6** | Liberar o tablet do Púlpito para o Pastor | Obreiro | Projeção e roteiro de folhas operando sincronizados. |

---

## 9. Guia de Resolução de Problemas (Troubleshooting)

### A. O botão "Testar Conexão" dá erro ("Não foi possível conectar")
1. **O Holyrics está aberto?** Verifique se o programa foi iniciado no PC.
2. **O plugin está ativo?** No Holyrics, vá em *Ferramentas > Plugin Holyrics* e confirme se está ligado na porta 8081.
3. **O ngrok está rodando?** Verifique se a janela do ngrok está aberta ou minimizada na barra de tarefas. Se foi fechada por engano, dê dois cliques em `C:\ngrok\iniciar_ngrok.bat`.
4. **O domínio digitado está correto?** Certifique-se de que a URL no modal começa com `https://` e termina com `.ngrok-free.app`.

### B. Aparece uma página do ngrok dizendo *"You are about to visit..."*
- Isso ocorre quando o ngrok exibe o aviso padrão para contas gratuitas acessadas via navegador.
- No `docs_church`, o backend já inclui automaticamente o cabeçalho HTTP `ngrok-skip-browser-warning: true`.
- Caso esteja testando manualmente em uma aba do navegador, basta adicionar `?ngrok-skip-browser-warning=true` no final da URL.

### C. O ngrok fecha com a mensagem *"Session Expired"* ou *"authtoken missing"*
- O token da conta não foi salvo no PC.
- Abra o prompt de comando (`cmd`) e rode novamente:
  ```cmd
  C:\ngrok\ngrok.exe config add-authtoken SEU_AUTHTOKEN_AQUI
  ```

### D. O versículo sumiu do tablet mas continua no telão
- O pastor pode ter tocado acidentalmente no botão **`[✕ Minimizar]`**.
- Basta tocar no **Pill Flutuante** no rodapé (`[ 🎵 Telão Ativo • ⛶ Voltar para o Telão ]`) para restaurar a projeção em tela cheia imediatamente.
- Se o operador limpou a projeção no Holyrics (tecla F5), a tela fecha sozinha para priorizar a leitura do roteiro de orações.
