# Plano Mestre de Decomposição Modular — Painel do Culto (A.D. Utinga)

Guia arquitetural, mapa de engenharia e índice de execução para a decomposição dos componentes e módulos monolíticos do projeto **Painel do Culto** (totalizando mais de 6.500 linhas concentradas nos arquivos centrais), reduzindo a complexidade ciclomática, garantindo isolamento de responsabilidades em módulos coesos e testáveis (meta: componentes ≤ 180 linhas) e blindando a aplicação com as melhores práticas de **Design Patterns**, **Prompt Engineering**, **Frontend Design (A.D. Utinga / Púlpito Zen / KitKat)** e **Secure Architecture**.

---

## 1. Estrutura de Documentos em `/docs/decomposicao`

```
docs/decomposicao/
├── README.md                                         # Este documento (Visão Geral, Matriz e Governança)
├── fase-1-dominio-sincronizacao/                     # Camada de Dados, Cache Offline e Sincronização Neon
│   ├── 1.1-offline-storage-and-queue.md              # 1.031L (fatia) → Cache localStorage, Sessão e Filas Offline
│   ├── 1.2-adaptive-sync-engine.md                   # 1.031L (fatia) → Motor de Polling Adaptativo, Cold Start e Inter-Tab Broadcast
│   └── 1.3-liturgical-api-repository.md              # 319L → Repository Pattern tipado, HMAC tokens e retries resilientes
├── fase-2-orquestracao-sala-acesso/                  # Autenticação, Entrada e Contexto Reativo Central
│   ├── 2.1-join-room-modal.md                        # 401L → Formulários modulares de Join, Create e Conflito
│   └── 2.2-room-context-orchestrator.md              # 1.031L → Orquestrador enxuto (< 150 linhas) integrando sub-hooks
├── fase-3-visao-pulpito-leitura/                     # Visão Pastoral de Alta Legibilidade (Púlpito Zen & Spread)
│   ├── 3.1-use-pulpit-pagination.md                  # 1.535L (fatia) → Hook puro de particionamento e layout sem scroll
│   ├── 3.2-pulpit-spread-and-sheets.md               # 1.535L (fatia) → Folhas de leitura, Banner de Alerta e Controles
│   └── 3.3-pulpit-view-orchestrator.md               # 1.535L → Orquestrador enxuto alternando Mobile e Livro Aberto
├── fase-4-visao-obreiro-edicao/                      # Edição Litúrgica em Lote e Rascunhos de Apoio
│   ├── 4.1-use-draft-batch-reducer.md                # 1.682L (fatia) → Reducer unificado para rascunhos de visitantes e oração
│   ├── 4.2-obreiro-section-cards.md                  # 1.682L (fatia) → Cards autônomos de Visitantes, Oração, Oportunidades e Conjuntos
│   └── 4.3-obreiro-editor-orchestrator.md            # 1.682L → Orquestrador enxuto com ScrollSpy limpo e Header
└── fase-5-painel-controlador-midia/                  # Mesa de Operação, Mídia YouTube e Exportação Litúrgica
    ├── 5.1-youtube-media-pipeline.md                 # 932L (fatia) → Compressor Canvas, Clipboard e OCR/Captura YouTube
    ├── 5.2-controlador-alerts-and-meta.md            # 932L (fatia) → Toolbar de Alertas Pastorais e Edição inline de Código/Título
    ├── 5.3-liturgy-export-strategy.md                # 116L + 932L (fatia) → Strategy Pattern para Holyrics, WhatsApp e Texto Puro
    └── 5.4-controlador-panel-orchestrator.md         # 932L → Orquestrador enxuto da mesa de controle (< 150 linhas)
```

---

## 2. Matriz dos Arquivos Monolíticos e Metas de Redução

| # | Arquivo Alvo Original | Linhas Originais | Responsabilidade Monolítica Atual | Estratégia de Decomposição | Patterns & Salvaguardas | Meta Linhas |
|---|----------------------|-----------------|-----------------------------------|----------------------------|-------------------------|-------------|
| **1.1** | `src/context/RoomContext.tsx` (Fatia Cache & Fila) | ~350 (de 1.031) | Persistência mista de sessão, cache de blocos e fila de appends offline | Extrair módulos dedicados em `src/context/storage/`: `useRoomStorage`, `offlineQueue` e serializadores | Storage Service + Single Responsibility | ~90 |
| **1.2** | `src/context/RoomContext.tsx` (Fatia Polling) | ~300 (de 1.031) | Polling adaptativo, timers de cold start e sincronização inter-abas | Extrair motor reativo em `src/context/sync/`: `useAdaptiveSync` e `intertabBroadcast` | Observer + Custom Hook | ~80 |
| **1.3** | `src/services/neon.ts` | 319 | Chamadas HTTP acopladas, helpers de retry e tokens soltos | Encapsular em `src/services/api/liturgicalRepository.ts` com tipagem estrita e headers protegidos | Repository Pattern | ~100 |
| **2.1** | `src/components/room/JoinRoomModal.tsx` | 401 | Modal duplo com lógica de entrada, criação de sala e diálogo de conflito | Extrair subcomponentes em `src/components/room/`: `JoinForm`, `CreateServiceForm` e `ConflictResolutionModal` | Composition Pattern | ~95 |
| **2.2** | `src/context/RoomContext.tsx` (Orquestrador) | 1.031 | Contexto inchado com 18 responsabilidades simultâneas | Consumir os novos hooks especializados de storage, sync e mutations, atuando puramente como facade | Facade + Provider Pattern | ~140 |
| **3.1** | `src/components/pastor/PulpitView.tsx` (Fatia Lógica) | ~400 (de 1.535) | Cálculos inline de particionamento, detecção KitKat e dimensões | Extrair `usePulpitPagination.ts` e utilitários puros em `src/components/pastor/hooks/` | Pure Calculations + Custom Hook | ~90 |
| **3.2** | `src/components/pastor/PulpitView.tsx` (Fatia UI) | ~700 (de 1.535) | Folhas de visualização, banner de alerta flutuante e botões de zoom | Extrair `PulpitSpread.tsx`, `PulpitSheet.tsx`, `AlertBanner.tsx` e `PulpitZoomControls.tsx` | Composition + Atoms | ~110 |
| **3.3** | `src/components/pastor/PulpitView.tsx` (Orquestrador) | 1.535 | Tela master com JSX quilométrico alternando modo mobile e paisagem | Orquestrador enxuto conectando `PulpitMobileView` e `PulpitLandscapeSpread` | Composition Pattern | ~130 |
| **4.1** | `src/components/obreiro/ObreiroEditor.tsx` (Fatia Estado) | ~450 (de 1.682) | 12 useStates repetitivos para rascunhos de visitantes, oração e oportunidades | Unificar lógica em `useDraftBatch.ts` com `useReducer` parametrizado por domínio | Reducer Pattern | ~110 |
| **4.2** | `src/components/obreiro/ObreiroEditor.tsx` (Fatia Cards) | ~800 (de 1.682) | Blocos de formulários repetitivos para 4 domínios litúrgicos | Extrair `VisitorsEditorSection`, `PrayersEditorSection`, `OpportunitiesEditorSection` e `ChoirsChecklistSection` | Composition Pattern | ~120/card |
| **4.3** | `src/components/obreiro/ObreiroEditor.tsx` (Orquestrador) | 1.682 | Componente com mais de 1.600 linhas com scrollspy e cabeçalho inline | Orquestrador limpo com `ObreiroHeader`, `SectionNavSticky` e seções compostas | Composition Pattern | ~150 |
| **5.1** | `src/components/controlador/ControladorPanel.tsx` (Fatia Mídia) | ~250 (de 932) | Leitor de arquivos, canvas compressor inline e captura de clipboard | Extrair `useYoutubeCapture.ts` e componente `YoutubeScreenshotUploader.tsx` em `media/` | Custom Hook + Strategy | ~90 |
| **5.2** | `src/components/controlador/ControladorPanel.tsx` (Fatia Alertas) | ~220 (de 932) | Painel de alerta pastoral em tempo real e formulários de edição de metadados | Extrair `PastoralAlertBar.tsx` e `ServiceMetadataBar.tsx` em `alerts/` | Composition Pattern | ~85 |
| **5.3** | `src/utils/liturgyExport.ts` + `ControladorPanel.tsx` (Modal) | ~280 | Geração de texto para Holyrics, WhatsApp e clipboard acoplados à tela | Extrair `src/services/export/strategies/` com Strategy Pattern e `LiturgyExportModal.tsx` | Strategy + Factory Pattern | ~80 |
| **5.4** | `src/components/controlador/ControladorPanel.tsx` (Orquestrador) | 932 | Painel master com múltiplos formulários e modais embutidos | Orquestrador enxuto agregando as barras de controle e modais modulares | Composition Pattern | ~140 |

---

## 3. As 5 Leis Invioláveis de Execução do Projeto

### Lei 0: Preservação Integral e Imutável de Regras de Negócio (Inviolabilidade Funcional)
- **Zero Regressão de Domínio:** A refatoração é estritamente estrutural. É expressamente proibido alterar, afrouxar, simplificar ou eliminar qualquer regra de negócio existente no aplicativo.
- **Regras de Negócio Blindadas e Congeladas:**
  1. *Autenticação e PIN:* Pastor e Obreiro acessam diretamente pelo código; Controlador exige autenticação estrita de PIN de 4 dígitos no servidor e emissão de token assinado HMAC-SHA256.
  2. *Máscara de Código de Sala:* Código padronizado de 6 caracteres alfanuméricos no formato `XXX-XXX`, com conversão automática para caixa alta.
  3. *Resolução de Conflitos de Culto:* Ao criar sala cujo código já exista, acionar obrigatoriamente diálogo com *"Abrir Existente"* (com PIN) ou *"Sobrescrever Culto"*.
  4. *Os 5 Blocos Litúrgicos Padrão:* Preservar exatamente os 5 blocos: `visitors`, `prayers`, `prayers_youtube`, `opportunities` e `choirs`.
  5. *Fila Otimista e Tolerância a Quedas de Rede:* Mutações de inclusão e exclusão refletem imediatamente na UI e são enfileiradas sequencialmente (`blockMutationQueueRef`). Se a internet oscilar, os dados ficam no `localStorage` e sofrem retry automático. Zero perda de dados.
  6. *Rascunhos Locais Sem Requisições:* A digitação em lote salva rascunhos no `localStorage` (`docs_church_draft_${domain}_${roomId}`) com zero tráfego de rede durante a digitação.
  7. *Orações Urgentes:* Preservar a flag `isUrgent` (UTI/gravidade) com destaque visual solene em vermelho `#991B1B`.
  8. *Alertas Pastorais em Tempo Real:* Mensagem enviada pelo controlador reflete de imediato no púlpito e pode ser cancelada a qualquer instante.
  9. *Zero Scroll Vertical no Púlpito:* Spread de duas páginas estilo livro aberto no tablet/paisagem, sem rolagem vertical.
  10. *Estratégias de Exportação:* Textos gerados para Holyrics e WhatsApp com suas respectivas formatações litúrgicas intactas.

### Lei 1: Fronteira Rígida do Bundle & Segurança Serverless (`/secure-architecture`)
- **Zero Drivers no Cliente:** Nenhum import de `@neondatabase/serverless`, `pg` ou credenciais diretas no diretório `src/`.
- **Apenas APIs Parametrizadas:** Toda mutação e leitura passa por rotas fechadas de negócio (`/api/room`, `/api/block`, `/api/sync`).
- **Autenticação Real com HMAC-SHA256:** O `sessionToken` gerado no servidor é obrigatório em mutações administrativas.
- **Projeção Mínima & Anti-IDOR:** Nenhuma rota de API utiliza `SELECT *` vazando o `controller_pin`, e todas as mutações filtram por `id` e `room_id`.

### Lei 2: Compatibilidade Estrita com Android 4.4.4 KitKat (`/frontend-design` & `/prd`)
- **Sem CSS Experimental:** Proibido o uso de `subgrid`, `container queries` ou funções CSS modernas que quebrem em WebViews legadas (Chrome 30-55).
- **Sem Cores em `oklch()`:** Todas as cores da folha e da interface devem ser declaradas em formato **Hexadecimal** ou **RGB** clássico.
- **ES5 Fallback:** O bundle legado gerado pelo `@vitejs/plugin-legacy` deve permanecer 100% funcional.

### Lei 3: Metáfora do Livro Aberto & Púlpito Zen
- **Zero Scroll Vertical no Modo Paisagem:** No púlpito, a tela do pastor NUNCA pode ter rolagem vertical. As páginas devem se dividir estilo livro aberto (spread de 2 páginas), avançando por paginação discreta.
- **Púlpito Zen:** Zero poluição visual, sem animações distrativas, sombras pesadas ou gradientes complexos. Tipografia em alto contraste com fontes oficiais (`Cormorant Garamond`, `Montserrat`, `Inter`).

### Lei 4: Resiliência Offline & Cold Start do Neon
- **Offline-First:** O tablet do púlpito deve salvar todo o estado em `localStorage`. Caso a rede caia durante o culto, a leitura nunca pode ser interrompida nem apresentar telas em branco.
- **Cold Start Educado:** Durante a conexão inicial ao banco Neon em repouso, exibir com clareza a mensagem: *"Conectando à igreja... Por favor aguarde uns segundos"*.

---

## 4. Guia de Execução Contínua

Ao executar cada subfase:
1. Ler o documento de especificação correspondente em `docs/decomposicao/fase-X/`.
2. Seguir a ordem de extração (tipos/hooks puros primeiro, subcomponentes em seguida, orquestrador por último).
3. Executar `npx tsc --noEmit` para assegurar 0 erros de compilação TypeScript.
4. Executar `npm run build` para garantir conformidade de bundle e integridade dos módulos legados.
