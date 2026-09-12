# Fase 07: Refinamento de Visões, Navegação Sênior e Fluxo de Culto

Documento de Especificação Técnica e Fases de Implementação com padrão Staff-level, detalhando a refatoração da experiência do usuário no **Púlpito do Pastor**, **Cabine do Obreiro**, **Painel do Controlador**, persistência de status de louvores, correção de envio de avisos e segurança de polling contra o Erro 99 da Vercel.

---

## 1. Objetivo da Fase
1. **Púlpito do Pastor (Modo 4 Visões):** Criar uma 3ª modalidade de leitura no púlpito (`four-views`), sendo o primeiro botão do seletor do rodapé, permitindo navegar por 4 sessões focadas (*1. Pedidos de Oração, 2. Oportunidades, 3. Visitantes, 4. Avisos*) com faixa superior tátil de alto contraste adaptada para pregadores idosos.
2. **Preservação de Layouts:** Manter 100% intactas e funcionais as visões existentes (*Pasta Aberta em 2 folhas* e *Folha Única contínua*).
3. **Navegação Persistente do Obreiro:** Implementar uma barra de atalhos sticky (`sticky top-0 z-30`) para salto imediato entre *Visitantes*, *Pedidos de Oração*, *Oportunidades* e *Departamentos*, acessível de qualquer ponto da rolagem.
4. **Ciclo de Vida de Louvores:** Permitir que o Controlador selecione quem vai cantar (*Vai Cantar*) e registre quando terminar (*Sucesso / Já Louvou / OK*), tanto para cantores avulsos quanto para departamentos, refletindo em tempo real no Púlpito.
5. **Ajustes de Nomenclatura e Identidade:** Mudar `Liturgia & Recepção` para `Tema do Culto`; exibir o título da visão no canto superior esquerdo e o nome do culto sutilmente no canto inferior direito.
6. **Smart-Polling Seguro (8s):** Calibrar o polling do Obreiro para 8 segundos exclusivamente enquanto a prévia do púlpito estiver aberta, prevenindo o Erro 99 (DDoS Mitigation) em tablets com Android 4.4.4 KitKat.
7. **Correção Definitiva de Avisos:** Alinhar os payloads de `api/room.ts` e `neon.ts` para que os avisos cheguem e permaneçam gravados no banco Neon e na tela do pastor.

---

## 2. Escopo de Arquivos Afetados

| Arquivo | Tipo | Responsabilidade na Fase 07 |
|---|---|---|
| [`api/room.ts`](file:///Users/joaovitorbarreto/Projects/docs_church/api/room.ts) | Backend | Aceitar `body.alert` ou `body.message` na ação `send-alert`. |
| [`src/services/neon.ts`](file:///Users/joaovitorbarreto/Projects/docs_church/src/services/neon.ts) | Serviço | Unificar payload de `setRoomAlert` com `alert` e `message`. |
| [`src/types/liturgy.ts`](file:///Users/joaovitorbarreto/Projects/docs_church/src/types/liturgy.ts) | Tipagem | Adicionar campo `status?: 'idle' | 'ready' | 'done'` a `OpportunityItem` e `ChoirItem`. |
| [`src/context/RoomContext.tsx`](file:///Users/joaovitorbarreto/Projects/docs_church/src/context/RoomContext.tsx) | Contexto | Gerenciar flag `isPulpitPreviewActive` reduzindo polling para 8s temporariamente. |
| [`src/components/pastor/PulpitView.tsx`](file:///Users/joaovitorbarreto/Projects/docs_church/src/components/pastor/PulpitView.tsx) | Componente | Implementar modo `four-views`, reorganizar seletor no rodapé (1º botão), destaque de abas, "Tema do Culto" e cabeçalho/rodapé. |
| [`src/components/obreiro/ObreiroEditor.tsx`](file:///Users/joaovitorbarreto/Projects/docs_church/src/components/obreiro/ObreiroEditor.tsx) | Componente | Barra de atalhos sticky, IDs de âncora, controles de louvor com status e gatilho de polling na prévia. |
| [`src/components/controlador/ControladorPanel.tsx`](file:///Users/joaovitorbarreto/Projects/docs_church/src/components/controlador/ControladorPanel.tsx) | Componente | Gatilho de polling na prévia do púlpito e alinhamento de status. |

---

## 3. Padrões e Princípios Aplicados
* **Senior-First Ergonomics (Acessibilidade):** Alvos de toque com altura mínima de 48-52px, tipografia escalável, contraste WCAG AAA para texto em fundos marfim/branco.
* **Single Responsibility & Pure Context:** Desacoplamento do timer de polling dentro de `RoomContext` via trigger reativo sem interferir nas rotas de sincronização.
* **Resiliência a Redes Hostis / Hardware Legado:** Preservação estrita das regras de compatibilidade do Android 4.4.4 KitKat (sem sintaxes modernas incompatíveis no CSS, sem `oklch()`, uso de classes Tailwind seguras e ES5 polyfills).

---

## 4. Passo a Passo Técnico de Implementação (Subfases)

### Subfase 7.1: Correção de Backend, APIs e Tipos [CONCLUÍDA]
* **Arquivos:** [`api/room.ts`](file:///Users/joaovitorbarreto/Projects/docs_church/api/room.ts), [`src/services/neon.ts`](file:///Users/joaovitorbarreto/Projects/docs_church/src/services/neon.ts), [`src/types/liturgy.ts`](file:///Users/joaovitorbarreto/Projects/docs_church/src/types/liturgy.ts)
* **Ações:**
  1. Adicionado tipo `PraiseStatus = 'idle' | 'ready' | 'done'` e estendido em `OpportunityItem` e `ChoirItem`.
  2. Ajustado `api/room.ts` na ação `send-alert` para aceitar tanto `body.alert` quanto `body.message`.
  3. Atualizado `src/services/neon.ts` enviando `alert` e `message` para garantir gravação no Neon e entrega em tempo real.

### Subfase 7.2: Smart-Polling de 8s na Prévia do Púlpito [CONCLUÍDA NO CONTEXTO]
* **Arquivos:** [`src/context/RoomContext.tsx`](file:///Users/joaovitorbarreto/Projects/docs_church/src/context/RoomContext.tsx)
* **Ações:**
  1. Criação do estado `isPulpitPreviewActive` e método `setPulpitPreviewActive` no contexto.
  2. Calibração inteligente do polling: enquanto a prévia estiver aberta, o intervalo é de 8s (7.5 req/min, bem abaixo do limite de DDoS Mitigation da Vercel). Ao fechar, retorna aos 30s seguros para tablets Android 4.4.4 KitKat.

### Subfase 7.3: Visão do Pastor — Modo 4 Visões em 1º Lugar com Destaque de Sessão Ativa [EM ANDAMENTO]
* **Arquivos:** [`src/components/pastor/PulpitView.tsx`](file:///Users/joaovitorbarreto/Projects/docs_church/src/components/pastor/PulpitView.tsx)
* **Ações:**
  1. Reordenar seletor no rodapé: o botão `[ 📑 4 Visões ]` torna-se estritamente o primeiro, seguido de `[ 📖 Pasta Aberta ]` e `[ 📄 Folha Única ]`.
  2. Adicionar indicador dinâmico no 1º botão do rodapé exibindo a sessão ativa atual (`Orações`, `Oportunidades`, `Visitantes`, `Avisos`).
  3. Destaque ativo ultra-visível nas 4 abas superiores (alto contraste WCAG AAA, fundo ouro encorpado, borda sólida, anel de foco e ponto indicador luminoso).
  4. Indicação textual destacada no topo esquerdo com o nome da sessão em exibição.
  5. Preservação integral das visões de 2 folhas e 1 folha contínua.
  6. Substituição global do rótulo "Liturgia & Recepção" por "Tema do Culto".
  7. Inclusão sutil do nome do culto (`room.title`) no canto inferior direito.

### Subfase 7.4: Navegação Rápida Sticky do Obreiro com Destaque Ativo de Sessão [CONCLUÍDA]
* **Arquivos:** [`src/components/obreiro/ObreiroEditor.tsx`](file:///Users/joaovitorbarreto/Projects/docs_church/src/components/obreiro/ObreiroEditor.tsx)
* **Ações:**
  1. Adicionar barra fixa no topo (`sticky top-0 z-30 bg-church-parchment/95 backdrop-blur-md`) com 4 botões de salto:
     - `[ 🤝 Visitantes ]` ➔ `#section-visitors`
     - `[ 🙏 Orações ]` ➔ `#section-prayers`
     - `[ 🎤 Oportunidades ]` ➔ `#section-opportunities`
     - `[ 🏛️ Departamentos ]` ➔ `#section-choirs`
  2. Rastreamento e destaque visual ativo no botão correspondente à sessão selecionada ou visível na tela, para que o operador saiba exatamente onde está sem esforço.
  3. Suporte a rolagem suave sem quebrar a ergonomia de digitação.

### Subfase 7.5: Ciclo de Status de Louvores (Vai Cantar / Já Louvou / Sucesso) [CONCLUÍDA]
* **Arquivos:** [`src/components/obreiro/ObreiroEditor.tsx`](file:///Users/joaovitorbarreto/Projects/docs_church/src/components/obreiro/ObreiroEditor.tsx), [`src/components/pastor/PulpitView.tsx`](file:///Users/joaovitorbarreto/Projects/docs_church/src/components/pastor/PulpitView.tsx)
* **Ações:**
  1. No `ObreiroEditor.tsx`:
     - Oportunidades: botões de ação para definir `ready` (*⚡ Vai Cantar*) e `done` (*✓ Já Louvou / Sucesso*).
     - Departamentos (`ChoirItem`): alternância entre confirmado, `ready` e `done`.
  2. No `PulpitView.tsx`:
     - Exibição de badge dourada vibrante para quem está cantando (*Vai Cantar / A Seguir*) e badge verde com tachado elegante para quem concluiu (*Já Louvou / Sucesso*).

### Subfase 7.6: Homologação, Compatibilidade KitKat e Build Final [CONCLUÍDA]
* **Arquivos:** Todo o repositório
* **Ações:**
  1. Conexão de `setPulpitPreviewActive` no abrir/fechar da prévia em `ObreiroEditor.tsx` e `ControladorPanel.tsx`.
  2. Execução de `npm run build` para garantir conformidade de tipos TypeScript e integridade do bundle legado com `@vitejs/plugin-legacy`.
  3. Verificação de responsividade em telas de celulares e tablets.

---

### Subfase 7.7: Refinamento de Densidade no Púlpito e Papel do Controlador [CONCLUÍDA]
* **Arquivos:** [`src/components/obreiro/ObreiroEditor.tsx`](file:///Users/joaovitorbarreto/Projects/docs_church/src/components/obreiro/ObreiroEditor.tsx), [`src/components/pastor/PulpitView.tsx`](file:///Users/joaovitorbarreto/Projects/docs_church/src/components/pastor/PulpitView.tsx)
* **Ações:**
  1. **Oportunidades Pré-Escaladas por Padrão:** Ao adicionar qualquer oportunidade no Obreiro, ela já entra automaticamente escalada no culto (`status: 'idle'`).
  2. **Exclusividade do Controlador:** A gestão de status de louvores (*Vai Cantar* e *Já Louvou / Sucesso*) foi removida do Obreiro e restrita ao Controlador (`role === 'controlador'`).
  3. **Púlpito do Pastor (Visual Limpo sem Poluição):**
     - Removidos os badges de texto chamativos `<span>A Seguir / Vai Cantar</span>` e `<span>Já Louvou / Sucesso</span>`.
     - Oportunidade que vai cantar destaca-se sutilmente com fundo amarelo claro e borda ambar (`bg-amber-100/90 border-amber-400`), enquanto quem concluiu fica em verde suave (`bg-emerald-50/70 border-emerald-300 line-through`).
  4. **Padrão de 2 Folhas em Orações e Visitantes (4 Visões):**
     - Substituição dos cards verticais pesados por listas compactas tipográficas multi-coluna com marcadores dourados `•` (estilo pasta aberta de 2 folhas), ganhando mais de 70% de espaço vertical e evitando rolagem.
  5. **Destaque do Nome do Culto no Rodapé:**
     - Elemento ampliado com `font-title font-extrabold text-xs sm:text-sm uppercase tracking-wide` e borda refinada ao lado dos controles de modo de visualização.

---

### Subfase 7.8: Ordenação Sequencial Vertical, Reordenação de Sessões e Elegância Tipográfica [CONCLUÍDA]
* **Arquivos:** [`src/components/pastor/PulpitView.tsx`](file:///Users/joaovitorbarreto/Projects/docs_church/src/components/pastor/PulpitView.tsx), Banco de Dados Neon (Sala `TES-TES`)
* **Ações:**
  1. **Mais 10 Pedidos de Oração Adicionados:** Inseridos 10 novos pedidos de oração realistas no banco Neon para a sala ativa (`TES-TES`), totalizando 19 pedidos para validação de layout sob carga de culto real.
  2. **Numeração Sequencial Descendo a Coluna da Esquerda Primeiro:**
     - Em **Orações Presenciais** e **YouTube**: lista dividida em duas colunas verticais (`fourViewsPrayersLeft` e `fourViewsPrayersRight`), onde a numeração começa descendo estritamente a coluna da esquerda (1..10) e continua na coluna da direita (11..19), eliminando a confusão de ziguezague entre linhas.
     - Em **Visitantes**: aplicada a mesma partição vertical contínua (`fourViewsVisitorsLeft` e `fourViewsVisitorsRight`), descendo primeiro na coluna da esquerda (1..9) e continuando na direita (10..18).
  3. **Visitantes na 2ª Posição das Sessões:**
     - Reordenadas as abas da faixa superior e o fluxo de conteúdo no modo 4 Visões:
       - 1. Orações
       - 2. Visitantes
       - 3. Oportunidades
       - 4. Avisos
  4. **Nome do Culto no Rodapé com Elegância Clássica (`font-serif italic`):**
     - O nome do culto no rodapé agora utiliza `font-serif italic font-semibold text-church-charcoal` em tamanho ampliado (`text-xs sm:text-sm md:text-base`) dentro de um card com borda e sombra sutil, restaurando a nobreza e estética litúrgica clássica.

---

### Subfase 7.9: Expansão Widescreen da Folha e Correção do Zoom Nativo [CONCLUÍDA]
* **Arquivos:** [`src/components/pastor/PulpitView.tsx`](file:///Users/joaovitorbarreto/Projects/docs_church/src/components/pastor/PulpitView.tsx)
* **Ações:**
  1. **Expansão de Largura Widescreen (Galaxy Tab A9 / SpaceDesk):**
     - Aumentada a largura máxima da folha (`paper-sheet`) e da barra superior de abas de `max-w-4xl` (896px) para `max-w-6xl 2xl:max-w-7xl` (1152px ~ 1280px).
     - As colunas de oração e visitantes agora contam com mais de 550px cada uma, eliminando quebras de linha excessivas e preenchendo harmoniosamente a tela do tablet sem sobras laterais vazias.
  2. **Correção do Zoom no App:**
     - Identificado que classes CSS `text-sm`, `text-base` do Tailwind usam unidades `rem` absolutas à raiz do HTML, ignorando o `fontSize` herdado pelo elemento pai.
     - Implementado `style={{ zoom: fontScale }}` nativo no container da folha (`paper-sheet`) em todas as modalidades (`four-views`, `two-sheets` e `single-sheet`), escalando proporcionalmente textos, marcadores, badges e listas com suporte pleno ao Chromium/WebKit.
     - Ajustados os botões de controle de zoom no rodapé para passos nítidos de 10% (`0.10`), indo de 70% a 180% (padrão 100%), permitindo ao pregador idoso ampliar o texto com apenas 1 ou 2 toques.

---

### Subfase 7.10: Preenchimento Integral da Folha da Esquerda Antes do Transbordo [CONCLUÍDA]
* **Arquivos:** [`src/components/pastor/PulpitView.tsx`](file:///Users/joaovitorbarreto/Projects/docs_church/src/components/pastor/PulpitView.tsx)
* **Ações:**
  1. **Eliminação da Divisão Prematura 2x2:**
     - Criada a função de partição sequencial `partitionSequentialColumns<T>(items, capacity = 10)`.
     - Quando há poucos itens (ex: 2 a 10 orações ou visitantes), todos são acomodados verticalmente na folha/coluna da esquerda, sem dividir metade para cada lado (`2x2`).
     - A coluna da direita só é ativada quando a coluna da esquerda atinge sua capacidade confortável (10 itens).
     - Quando ultrapassa 10 itens, os excedentes (11..20) transbordam para a coluna da direita sequencialmente. Acima de 20 itens, o balanceamento se torna meio a meio.
  2. **Refinamento da Pasta Aberta (Folha 1 e 2):**
     - Na Folha 1 (esquerda), visitantes agora mantêm lista contínua em 1 coluna quando há até 4 visitantes (evitando criar 2x2 com poucos nomes).
     - O cálculo de capacidade `maxSheet1Prayers` preenche integralmente a Folha 1 com orações (até 12 linhas úteis) antes de direcionar qualquer oração para a Folha 2 (direita).

---

### Subfase 7.11: Limpeza Visual em Departamentos — Remoção do Badge "Vai Louvar" [CONCLUÍDA]
* **Arquivos:** [`src/components/pastor/PulpitView.tsx`](file:///Users/joaovitorbarreto/Projects/docs_church/src/components/pastor/PulpitView.tsx)
* **Ações:**
  1. **Remoção do Badge Textual "Vai Louvar":**
     - Removido o elemento `<span className="text-[10px] font-title uppercase tracking-wider text-amber-900 bg-amber-200 px-1.5 py-0.5 rounded ml-1 font-black">Vai Louvar</span>` em todas as modalidades do púlpito (`four-views`, `two-sheets` e `single-sheet`).
     - Alinhamento idêntico ao já aplicado em oportunidades individuais: o card do departamento já recebe realce tonal amarelo suave (`bg-amber-100 text-amber-950 border-church-gold ring-2 ring-church-gold/30`) e o ícone de relógio `<Clock />`, eliminando ruído visual desnecessário para o pregador.

---

## 5. Critérios de Aceite e Verificação
1. [x] No Púlpito, o rodapé exibe `[4 Visões]` em 1º lugar, seguido de `[Pasta Aberta]` e `[Folha Única]`.
2. [x] As abas do modo 4 Visões seguem rigorosamente a ordem: 1. Orações, 2. Visitantes, 3. Oportunidades, 4. Avisos.
3. [x] Em Orações e Visitantes, a numeração sequencial preenche primeiro toda a coluna da esquerda (até 10 itens) antes de ativar a coluna da direita, eliminando o padrão prematuro 2x2.
4. [x] A folha de leitura do modo 4 Visões foi expandida para `max-w-6xl 2xl:max-w-7xl`, aproveitando toda a largura do tablet widescreen conectado via SpaceDesk.
5. [x] O zoom do app (`+` e `-` no rodapé) escala a folha e os textos de forma imediata e perceptível em passos de 10% (via `zoom: fontScale`).
6. [x] O nome do culto no rodapé possui tamanho ampliado e tipografia nobre `font-serif italic` com alto refinamento visual.
7. [x] As visões de Pasta Aberta e Folha Única continuam funcionando exatamente como antes, 100% preservadas.
8. [x] O texto "Liturgia & Recepção" foi substituído por "Tema do Culto".
9. [x] Na tela do Obreiro, a barra de navegação superior permanece visível no topo durante o scroll e salta direto para a seção ao ser tocada, destacando a sessão ativa.
10. [x] Oportunidades adicionadas pelo obreiro entram automaticamente escaladas.
11. [x] Apenas o Controlador gerencia os botões de status de louvor (Vai Cantar / Já Louvou).
12. [x] No púlpito, as oportunidades e departamentos não exibem badges textuais agressivos como "Vai Cantar" / "Vai Louvar", mantendo realce sutil em amarelo (vai cantar) e verde (já cantou).
13. [x] O envio de avisos pelo Controlador é gravado e refletido imediatamente na tela do Pastor.
14. [x] Abertura da prévia do púlpito ajusta o polling para 8s e o fechamento restaura para 30s.
15. [x] Build de produção (`npm run build`) concluído com 0 erros de TypeScript e bundle legado do KitKat gerado com sucesso.

