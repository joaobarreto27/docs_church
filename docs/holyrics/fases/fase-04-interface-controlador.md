# Plano de Implementação Holyrics - Fase 04: Interface do Controlador

## 1. Objetivo da Fase
- Desenvolver a interface administrativa no Painel do Controlador para configuração centralizada da URL do Holyrics/ngrok.
- Criar o subcomponente isolado `ControladorHolyricsModal.tsx` em `src/components/controlador/modals/` com teste de conexão em tempo real (Healthcheck na porta 8081).
- Integrar a mutação `updateHolyricsUrl` no `RoomContext.tsx`, persistindo o endereço com segurança no PostgreSQL Neon através do token HMAC do controlador.
- **Impacto esperado:**
  - O operador da mesa pode colar (`Ctrl + V`) a URL pública do ngrok ou IP local em 3 segundos.
  - Validação imediata de conectividade antes do início do culto através do botão "Testar Conexão".
  - Preservação da regra Anti-Bloat e limite de 150 linhas em `ControladorPanel.tsx`.

---

## 2. Escopo de Arquivos Afetados

### Arquivos que serão criados:
- `src/components/controlador/modals/ControladorHolyricsModal.tsx` — Modal de configuração com input de URL, teste de status, botão de salvar e limpar.

### Arquivos que serão modificados:
- `src/context/RoomContext.tsx` — Adicionar método `updateHolyricsUrl(url: string | null): Promise<boolean>`.
- `src/components/controlador/alerts/ServiceMetadataBar.tsx` — Adicionar botão discreto `[🎵 Holyrics]` ao lado do botão de exportação e reset.
- `src/components/controlador/ControladorPanel.tsx` — Instanciar o modal e conectar o estado `showHolyricsModal`.
- `src/components/controlador/modals/index.ts` — Barrel export do novo modal.

### Arquivos que serão removidos:
- *Nenhum arquivo será removido nesta fase.*

---

## 3. Padrões e Princípios Aplicados
- **Anti-Bloat & Zero Modais Inline (Regra 3.1 do AGENTS.md):**
  - O modal é extraído para componente 100% isolado com interface de props estrita (`isOpen`, `onClose`, `currentUrl`, `onSave`).
- **Lei 3 de `/secure-architecture` (Autorização Real via Servidor):**
  - A mutação envia o token de sessão do controlador (`controllerToken`) armazenado no `sessionStorage`. Sem esse token assinado, a API recusa a gravação.
- **Microfísica Tátil & Ergonomia (Diretrizes de `/frontend-director`):**
  - Feedback visual imediato com banner de sucesso ("URL salva com sucesso!") ou erro de rede ("Holyrics não respondeu na porta 8081").
  - Botão com estado de carregamento durante o teste de ping (`isTesting`).

---

## 4. Passo a Passo Técnico de Implementação

### 4.1. Adicionar `updateHolyricsUrl` no `RoomContext.tsx`
1. Na interface do contexto `RoomContextType`, declarar a assinatura:
```typescript
updateHolyricsUrl: (url: string | null) => Promise<boolean>;
```
2. Implementar a função que dispara POST para `/api/room` com `action: 'update-holyrics-url'`:
```typescript
const updateHolyricsUrl = async (url: string | null): Promise<boolean> => {
  if (!room) return false;
  try {
    const res = await fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: room.id,
        action: 'update-holyrics-url',
        url,
        token: controllerToken
      })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setRoom(prev => prev ? { ...prev, holyrics_url: data.holyrics_url } : null);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Erro ao atualizar URL do Holyrics:', err);
    return false;
  }
};
```

### 4.2. Construção de `ControladorHolyricsModal.tsx`
Construir o componente em `src/components/controlador/modals/ControladorHolyricsModal.tsx`:
1. **Inputs:**
   - Campo de texto para URL com placeholder explicativo: `https://igreja-pno.ngrok-free.app` ou `http://192.168.1.50:8081`.
2. **Botão "Testar Conexão":**
   - Dispara requisição GET pontual com `AbortController` (timeout de 2500ms) para `${inputUrl}/stage_view_data?ngrok-skip-browser-warning=true`.
   - Se responder status 200/OK: exibe badge verde: *"✅ Conectado com sucesso! Holyrics respondendo na porta 8081"*.
   - Se falhar: exibe badge âmbar: *"⚠️ Não foi possível conectar. Verifique se o ngrok ou Holyrics estão iniciados"*.
3. **Botão "Salvar na Sala":**
   - Executa `onSave(inputUrl.trim())` e fecha o modal com mensagem de feedback.
4. **Botão "Limpar":**
   - Permite desativar a integração limpando a URL da sala.

### 4.3. Adição do Botão em `ServiceMetadataBar.tsx`
Adicionar botão de acesso rápido na barra de ferramentas da cabine:
```tsx
<button
  type="button"
  onClick={onOpenHolyricsModal}
  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-title font-bold transition-colors cursor-pointer"
  title="Configurar integração com o Holyrics (Telão)"
>
  <Tv className="w-3.5 h-3.5 text-purple-700" />
  <span>Holyrics</span>
</button>
```

### 4.4. Conexão no `ControladorPanel.tsx`
- Adicionar estado `const [showHolyricsModal, setShowHolyricsModal] = useState(false)`.
- Renderizar `<ControladorHolyricsModal />` no final do JSX antes do fechamento do container.

---

## 5. Exemplo de Código (Antes vs. Depois)

### Antes:
```tsx
// === src/components/controlador/ControladorPanel.tsx — Barra sem botão do Holyrics ===
<ServiceMetadataBar
  title={room.title}
  code={room.code}
  isFastSync={isFastSync}
  onUpdateTitle={updateTitle}
  onUpdateCode={updateCode}
  onOpenFullList={() => { setFullListTab('all'); setShowFullListModal(true); }}
  onOpenPulpitPreview={() => { setPulpitPreviewActive(true); setShowPulpitPreview(true); }}
  onOpenResetModal={() => setShowResetModal(true)}
  triggerFeedback={triggerFeedback}
/>
```

### Depois:
```tsx
// === src/components/controlador/ControladorPanel.tsx — Suporte à configuração do Telão ===
<ServiceMetadataBar
  title={room.title}
  code={room.code}
  isFastSync={isFastSync}
  onUpdateTitle={updateTitle}
  onUpdateCode={updateCode}
  onOpenFullList={() => { setFullListTab('all'); setShowFullListModal(true); }}
  onOpenPulpitPreview={() => { setPulpitPreviewActive(true); setShowPulpitPreview(true); }}
  onOpenResetModal={() => setShowResetModal(true)}
  onOpenHolyricsModal={() => setShowHolyricsModal(true)} // ✅ Adicionado
  triggerFeedback={triggerFeedback}
/>

{/* Modal de Configuração do Holyrics */}
{showHolyricsModal && (
  <ControladorHolyricsModal
    isOpen={showHolyricsModal}
    currentUrl={room.holyrics_url || ''}
    onClose={() => setShowHolyricsModal(false)}
    onSave={async (url) => {
      const ok = await updateHolyricsUrl(url);
      if (ok) triggerFeedback('Configuração do Holyrics salva na sala!');
      setShowHolyricsModal(false);
    }}
  />
)}
```

---

## 6. Apontamento de Anomalias em Regras de Negócio
> Nenhuma anomalia identificada. O papel de Controlador permanece protegido por PIN de 4 dígitos e token de sessão HMAC.

---

## 7. Critérios de Aceite e Verificação
- [ ] Botão `[Holyrics]` visível na barra de controle da cabine.
- [ ] Modal abre e fecha sem erros de console.
- [ ] Teste de conexão reporta status online quando o ngrok/Holyrics estiver ativo.
- [ ] Salvamento da URL atualiza o banco Neon e reflete instantaneamente em `room.holyrics_url`.
- [ ] Limpeza da URL define o campo como `NULL`.
- [ ] `ControladorPanel.tsx` e `ControladorHolyricsModal.tsx` mantêm-se abaixo de 160 linhas cada.
- [ ] Verificação de compilação sem erros: `npx tsc --noEmit`.
