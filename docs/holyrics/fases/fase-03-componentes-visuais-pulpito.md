# Plano de Implementação Holyrics - Fase 03: Componentes Visuais do Púlpito

## 1. Objetivo da Fase
- Construir a interface de exibição da projeção no Púlpito seguindo a **Opção Escura Solene** (`#0B0D13`) aprovada na Fase 0 de mockups.
- Implementar o algoritmo de **auto-escala tipográfica dinâmica** para acomodar desde refrões curtos até leituras bíblicas densas como **Ester 8:9 (520 caracteres)**, garantindo a regra de **zero scroll vertical**.
- Criar o componente **Pill Flutuante** (`HolyricsReturnPill.tsx`) para permitir que o pastor alterne com facilidade entre a leitura do roteiro e a projeção do telão.
- **Impacto esperado:**
  - Zero rolagem vertical em telas paisagem de tablets (Samsung Tab E e Tab A9).
  - Eliminação de reflexo cênico branco no rosto do pregador durante momentos de adoração.
  - Fidelidade total às diretrizes de `/frontend-director` e acessibilidade para pastores idosos.

---

## 2. Escopo de Arquivos Afetados

### Arquivos que serão criados:
- `src/components/holyrics/HolyricsOverlay.tsx` — Camada em tela cheia com fundo `#0B0D13`, cabeçalho solene, botão de minimizar e renderização nativa de slide.
- `src/components/holyrics/HolyricsReturnPill.tsx` — Botão flutuante fixado no rodapé das folhas quando a projeção estiver minimizada.
- `src/components/holyrics/utils/fontScaling.ts` — Função pura que calcula as classes de tamanho de fonte a partir da contagem de caracteres.
- `src/components/holyrics/index.ts` — Barrel export para importação unificada.

### Arquivos que serão modificados:
- *Nenhum arquivo preexistente será modificado nesta fase (apenas criação dos novos componentes isolados).*

### Arquivos que serão removidos:
- *Nenhum arquivo será removido nesta fase.*

---

## 3. Padrões e Princípios Aplicados
- **Diretrizes de `/frontend-director` (Superfícies de Luxo & Microfísica Tátil):**
  - Paleta oficial: Fundo `#0B0D13`, texto `#FFFFFF`, acentos em `#C59B4B` (Dourado) e brilho solene `#D4AF37`.
  - Feedback tátil com `active:scale-95`, `transition-transform duration-150` e `cursor-pointer`.
  - Proibição do uso de `transition: all` (utilização estrita de propriedades explícitas como `transition-colors` e `transition-opacity`).
- **Princípio da Legibilidade Máxima & "Púlpito Zen":**
  - Tipografia clássica: `font-serif` (`Cormorant Garamond`) para versículos e `font-sans` (`Inter`/`Montserrat`) para hinos.
  - Alto contraste vetorial legível a mais de 2 metros de distância do púlpito.
- **Single Responsibility Principle (SRP):**
  - O cálculo do tamanho da fonte é isolado em utilitário puro (`fontScaling.ts`), desacoplado da renderização do JSX.
- **Limite de Linhas (AGENTS.md):**
  - Cada componente mantém-se entre **70 e 130 linhas**, muito abaixo do limite máximo de 200 linhas.

---

## 4. Passo a Passo Técnico de Implementação

### 4.1. Utilitário de Auto-Escala (`src/components/holyrics/utils/fontScaling.ts`)
Criar algoritmo determinístico que avalia o comprimento do texto (`length`) e quebras de linha (`\n`):
```typescript
export function getSlideTypographyClasses(text: string): {
  fontSizeClass: string;
  lineHeightClass: string;
  containerClass: string;
} {
  const clean = text.trim();
  const charCount = clean.length;
  const lineCount = clean.split('\n').length;

  // Caso 1: Textos curtos (< 120 caracteres ou até 3 linhas)
  if (charCount < 120 && lineCount <= 3) {
    return {
      fontSizeClass: 'text-3xl sm:text-4xl md:text-5xl',
      lineHeightClass: 'leading-relaxed',
      containerClass: 'max-w-4xl'
    };
  }

  // Caso 2: Estrofes padrão de hinos (120 a 280 caracteres)
  if (charCount <= 280 && lineCount <= 6) {
    return {
      fontSizeClass: 'text-2xl sm:text-3xl md:text-4xl',
      lineHeightClass: 'leading-normal sm:leading-relaxed',
      containerClass: 'max-w-4xl'
    };
  }

  // Caso 3: Textos extensos (ex: Ester 8:9 com ~520 caracteres)
  if (charCount <= 600) {
    return {
      fontSizeClass: 'text-lg sm:text-xl md:text-2xl',
      lineHeightClass: 'leading-relaxed',
      containerClass: 'max-w-5xl'
    };
  }

  // Caso 4: Leituras bíblicas extremas (> 600 caracteres) -> 2 colunas
  return {
    fontSizeClass: 'text-base sm:text-lg',
    lineHeightClass: 'leading-normal',
    containerClass: 'max-w-6xl columns-1 sm:columns-2 gap-8 text-justify'
  };
}
```

### 4.2. Camada em Tela Cheia (`src/components/holyrics/HolyricsOverlay.tsx`)
1. Renderizar container fixo em tela cheia (`fixed inset-0 z-50 bg-[#0B0D13]`).
2. **Cabeçalho:**
   - Ícone de projeção dourado (`#C59B4B`), título do louvor ou referência bíblica.
   - Tag solene `TELÃO ATIVO` e indicador de slide (`Slide X de Y`).
   - Botão no topo direito: `[✕ Minimizar / Ver Roteiro]`, disparando a prop `onMinimize`.
3. **Área Central:**
   - Parágrafo com as classes calculadas dinamicamente por `getSlideTypographyClasses(slide.text)`.
   - Suporte a quebras de linha nativas com `whitespace-pre-line`.
4. **Rodapé:**
   - Selo da congregação: *"A.D. Utinga - PNO"*.
   - Indicador de status: *"Sincronizado via Holyrics"*.
   - Mensagem pastoral sutil: *"Toque na tela para voltar ao roteiro"*.

### 4.3. Botão Flutuante de Retorno (`src/components/holyrics/HolyricsReturnPill.tsx`)
1. Fixar no rodapé central da tela (`fixed bottom-6 left-1/2 -translate-x-1/2 z-40`).
2. Ponto pulsante verde esmeralda (`#10B981`) sinalizando que a transmissão do telão continua ativa.
3. Título resumido do louvor ou versículo em Dourado da Igreja (`#C59B4B`).
4. Botão com ícone `Maximize2` e texto: `[⛶ Voltar para o Telão]`, disparando a prop `onRestore`.
5. Animação de entrada suave com `animate-fadeIn`.

---

## 5. Exemplo de Código (Antes vs. Depois)

### Antes:
```tsx
// === Abordagem com <iframe> — Quebrava no Android 4.4.4 e poluía visualmente ===
<div id="camada-holyrics" style={{ display: isActive ? 'block' : 'none' }}>
  {/* ❌ <iframe> consome 80MB de RAM e congela WebView do KitKat */}
  {/* ❌ Barra de rolagem vertical cortando estrofes longas */}
  {/* ❌ Impossível personalizar cores e fontes nobres da A.D. Utinga */}
  <iframe src="https://igreja.ngrok-free.app/view/widescreen" className="w-full h-full" />
</div>
```

### Depois:
```tsx
// === src/components/holyrics/HolyricsOverlay.tsx — Renderização Nativa Escura Solene ===
export const HolyricsOverlay: React.FC<HolyricsOverlayProps> = ({ slide, onMinimize }) => {
  const { fontSizeClass, lineHeightClass, containerClass } = getSlideTypographyClasses(slide.text);

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0D13] text-white flex flex-col justify-between p-6 sm:p-10 select-none animate-fadeIn">
      {/* Header com botão de minimizar */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#C59B4B]/15 border border-[#C59B4B]/30 flex items-center justify-center text-[#C59B4B]">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-title text-base sm:text-lg font-bold text-white tracking-tight">
              {slide.title || 'Projeção Ativa'}
            </h2>
            <p className="text-xs text-stone-400 font-sans">
              {slide.slide_number ? `Slide ${slide.slide_number}` : 'Telão Oficial'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onMinimize}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors active:scale-95 cursor-pointer shadow-lg"
        >
          <Minimize2 className="w-4 h-4 text-[#C59B4B]" />
          <span className="font-title text-xs font-bold uppercase tracking-wider">Ver Roteiro</span>
        </button>
      </div>

      {/* Texto com Auto-Escala sem Scroll */}
      <div className={`flex-1 flex flex-col items-center justify-center text-center px-4 py-6 mx-auto w-full ${containerClass}`}>
        <p className={`font-serif ${fontSizeClass} ${lineHeightClass} text-white whitespace-pre-line tracking-wide drop-shadow-sm`}>
          {slide.text}
        </p>
      </div>

      {/* Rodapé institucional */}
      <div className="flex items-center justify-between border-t border-stone-900 pt-3 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Projeção Sincronizada
        </span>
        <span className="font-title text-[11px] text-stone-400 uppercase tracking-wider">
          A.D. Utinga — Parque Novo Oratório
        </span>
      </div>
    </div>
  );
};
```

---

## 6. Apontamento de Anomalias em Regras de Negócio
> Nenhuma anomalia identificada. O componente nativo respeita a regra inviolável de zero scroll vertical no púlpito.

---

## 7. Critérios de Aceite e Verificação
- [ ] Renderização em fundo `#0B0D13` com alto contraste e sem cortes.
- [ ] Textos de 520 caracteres (Ester 8:9) cabem na tela de 1024x600 do Galaxy Tab E sem scroll vertical.
- [ ] Clique no botão `[✕ Ver Roteiro]` dispara `onMinimize` imediatamente.
- [ ] `HolyricsReturnPill` exibe o título atualizado e pulsa suavemente no rodapé.
- [ ] Clique em `[⛶ Voltar para o Telão]` reabre a tela cheia no slide correto.
- [ ] Cada novo arquivo possui menos de 150 linhas.
- [ ] Compilação de tipos TypeScript válida (`npx tsc --noEmit`).
