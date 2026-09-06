---
description: Vercel Web Interface Guidelines — Regras e Checklist de Auditoria
---

# Web Interface Guidelines (Vercel)

Checklist de qualidade técnica e conformidade visual/UX para interfaces web modernas.

## Regras e Verificações

### Accessibility (Acessibilidade)
- Botões que contêm apenas ícone DEVEM ter `aria-label` descritivo.
- Controles de formulário DEVEM ter `<label>` associado ou `aria-label`.
- Elementos interativos DEVEM ter handlers de teclado (`onKeyDown` / `onKeyUp`).
- Usar `<button>` para ações e `<a>` / `<Link>` para navegação (NUNCA `<div onClick>`).
- Imagens DEVEM ter `alt` (ou `alt=""` se for estritamente decorativa).
- Ícones puramente decorativos DEVEM ter `aria-hidden="true"`.
- Atualizações assíncronas (toasts, validações dinâmicas) DEVEM usar `aria-live="polite"`.
- Priorizar HTML semântico (`<button>`, `<a>`, `<label>`, `<table>`) antes de apelar para atributos ARIA.
- Hierarquia estrita de títulos `<h1>` a `<h6>`.
- Âncoras e cabeçalhos devem ter `scroll-margin-top` para não ficarem ocultos sob barras fixas.

### Focus States (Estados de Foco)
- Elementos interativos precisam de foco visível e nítido: `focus-visible:ring-*` ou equivalente.
- NUNCA usar `outline-none` / `outline: none` sem um anel de substituição em `:focus-visible`.
- Usar `:focus-visible` em vez de `:focus` (evita o anel feio de clique com mouse).
- Agrupar foco com `:focus-within` para controles compostos.
- Headers/footers fixos ou overlays NÃO devem cobrir o elemento focado por teclado.

### Forms (Formulários & Inputs)
- Inputs precisam de `autocomplete` e `name` significativos.
- Usar `type` correto (`email`, `tel`, `url`, `number`) e `inputmode="numeric"` ou similar.
- NUNCA bloquear colar (`onPaste` com `preventDefault`).
- Labels clicáveis (`htmlFor` ou envolvendo o controle).
- Desativar corretor em emails, códigos, chaves e usernames: `spellCheck={false}`.
- Checkboxes/radios: o label e o controle compartilham um único target de clique amplo (sem zonas mortas).
- Botão de submit permanece habilitado até o envio iniciar; spinner de feedback visual durante requisição.
- Erros inline ao lado dos campos; focar o primeiro erro no submit inválido.
- Placeholders terminam com reticências reais `…` e mostram padrão de exemplo.
- `autocomplete="off"` em campos não autenticados para evitar popups indesejados de gerenciadores de senha.

### Animation (Animações & Motion)
- Respeitar obrigatoriamente `prefers-reduced-motion` (desativar ou usar variante suave de fade).
- Animar APENAS propriedades do compositor: `transform` e `opacity`.
- NUNCA usar `transition: all` — listar propriedades explicitamente (ex: `transition-colors`, `transition-transform`).
- Definir `transform-origin` correto.
- Animações interrompíveis pelo usuário.

### Typography (Tipografia & Formatação)
- Usar reticências reais `…` (caractere Unicode `…`) e não três pontos `...`.
- Aspas tipográficas curvas quando aplicável.
- Espaços não-quebráveis (`&nbsp;`): `10&nbsp;MB`, `⌘&nbsp;K`.
- Estados de loading terminam com `…`: `"Carregando…"`, `"Salvando…"`.
- Valores contábeis, numéricos e tabelas DEVEM usar `tabular-nums` / `font-variant-numeric: tabular-nums`.
- Títulos com `text-wrap: balance` ou `text-pretty` para evitar linhas órfãs.

### Content Handling (Resiliência de Conteúdo)
- Containers de texto preparados para overflow: `truncate`, `line-clamp-*` ou `break-words`.
- Flex children precisam de `min-w-0` para permitir truncamento de texto sem estourar o container.
- Estados vazios limpos e elegantes — nunca renderizar UI quebrada para listas vazias ou strings vazias.

### Images & Media (Mídia e Imagens)
- `<img>` precisa de `width` e `height` explícitos (evita Layout Shift / CLS).
- Imagens abaixo da dobra: `loading="lazy"`.
- Imagens críticas acima da dobra: `priority` ou `fetchpriority="high"`.

### Performance & DOM
- Listas longas (>50 itens): virtualização (`virtua`, `content-visibility: auto`).
- Zero leituras de layout durante render (`getBoundingClientRect`, `offsetHeight`, `offsetWidth`, `scrollTop`).
- Inputs não controlados ou controlados ultraleves para não travar digitação rápida.

### Navigation & State (URL como Fonte de Verdade)
- URL reflete filtros, abas ativas, paginação e modais quando fizer sentido funcional.
- Links usam `<a>` / `<Link>` para suportar Ctrl/Cmd+click e clique com botão do meio.
- Ações destrutivas precisam de diálogo de confirmação ou janela de desfazer (undo) — nunca execução imediata irreversível.

### Safe Areas & Interações Touch
- `touch-action: manipulation` para remover atraso de clique duplo em mobile.
- `overscroll-behavior: contain` em modais, gavetas (drawers) e sheets para evitar scroll chaining no body.
- Respeitar `env(safe-area-inset-*)` em layouts full-bleed mobile.

### Dark Mode & Theming
- `color-scheme: dark` no `<html>` para temas escuros (corrige barras de rolagem nativas e inputs).
- `<meta name="theme-color">` sincronizado com o fundo da página.

### Hydration Safety (Next.js / SSR)
- Inputs com `value` exigem `onChange` (ou usar `defaultValue` para componentes não-controlados).
- Datas e horários formatados com guards para evitar hydration mismatch entre servidor e cliente.
