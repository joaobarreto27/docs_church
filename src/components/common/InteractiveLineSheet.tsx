import React, { useRef, useEffect } from 'react';
import { FileText, AlignLeft, Plus, Trash2 } from 'lucide-react';

interface InteractiveLineSheetProps {
  lines: string[];
  onChange: (lines: string[]) => void;
  rawText: string;
  onChangeRawText: (text: string) => void;
  placeholders?: string[];
  title?: string;
  helperText?: string;
  minLines?: number;
  hasDraft?: boolean;
  onDiscardDraft?: () => void;
  firstEmptyPlaceholder?: string;
  showModeToggle?: boolean;
  showHeader?: boolean;
}

export const InteractiveLineSheet: React.FC<InteractiveLineSheetProps> = ({
  lines,
  onChange,
  rawText,
  onChangeRawText,
  title,
  helperText,
  minLines = 10,
  hasDraft = false,
  firstEmptyPlaceholder,
  showModeToggle = false,
  showHeader,
}) => {
  const [mode, setMode] = React.useState<'lines' | 'raw'>('lines');
  const inputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  // Garante que haja pelo menos minLines (padrão 12) e que a última linha seja sempre vazia para toque imediato
  useEffect(() => {
    let current = [...lines];
    while (current.length < minLines) {
      current.push('');
    }
    const lastLine = current[current.length - 1];
    if (lastLine && lastLine.trim() !== '') {
      current.push('');
    }
    if (current.length !== lines.length) {
      onChange(current);
    }
  }, [lines, minLines, onChange]);

  // Ajusta a altura inicial das textareas quando houver texto preenchido
  useEffect(() => {
    inputRefs.current.forEach(textarea => {
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.max(36, textarea.scrollHeight)}px`;
      }
    });
  }, [lines, mode]);

  const handleLineChange = (index: number, val: string) => {
    const updated = [...lines];
    updated[index] = val;

    // Se o usuário preencheu a última linha, cria automaticamente a próxima vazia
    if (index === updated.length - 1 && val.trim() !== '') {
      updated.push('');
    }
    onChange(updated);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Pula para a próxima linha
      const nextIndex = index + 1;
      if (nextIndex >= lines.length) {
        const updated = [...lines, ''];
        onChange(updated);
      }
      setTimeout(() => {
        inputRefs.current[nextIndex]?.focus();
      }, 30);
    } else if (e.key === 'Backspace' && lines[index] === '' && index > 0) {
      e.preventDefault();
      // Se a linha atual está vazia e apertou Backspace, foca a anterior
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.includes('\n')) {
      e.preventDefault();
      const pastedLines = pastedText
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

      if (pastedLines.length > 0) {
        const updated = [...lines];
        // Substitui a partir do índice atual
        updated.splice(index, 1, ...pastedLines);
        // Garante linha vazia no final
        if (updated[updated.length - 1].trim() !== '') {
          updated.push('');
        }
        onChange(updated);
        setTimeout(() => {
          inputRefs.current[index + pastedLines.length]?.focus();
        }, 50);
      }
    }
  };

  const handleAddExtraLine = () => {
    const updated = [...lines, ''];
    onChange(updated);
    setTimeout(() => {
      inputRefs.current[updated.length - 1]?.focus();
    }, 50);
  };

  const handleClearLine = (index: number) => {
    const updated = [...lines];
    updated[index] = '';
    onChange(updated);
    const textarea = inputRefs.current[index];
    if (textarea) {
      textarea.style.height = '36px';
      textarea.focus();
    }
  };

  // Alternar para modo texto livre sincronizando conteúdo
  const handleSwitchToRaw = () => {
    const text = lines.filter(l => l.trim() !== '').join('\n');
    onChangeRawText(text);
    setMode('raw');
  };

  // Alternar para modo linhas pautadas sincronizando conteúdo
  const handleSwitchToLines = () => {
    const splitLines = rawText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    while (splitLines.length < minLines) {
      splitLines.push('');
    }
    if (splitLines[splitLines.length - 1].trim() !== '') {
      splitLines.push('');
    }
    onChange(splitLines);
    setMode('lines');
  };

  const shouldShowHeader = showHeader ?? Boolean(title || showModeToggle);

  return (
    <div className="bg-white rounded-2xl border-2 border-church-sand/80 shadow-xs overflow-hidden focus-within:border-church-gold transition-colors">
      {/* Cabeçalho do Card de Digitação */}
      {shouldShowHeader && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-church-parchment/60 border-b border-church-sand">
          {title && (
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-church-gold-dark shrink-0" />
              <span className="font-title text-xs font-bold uppercase tracking-wider text-church-charcoal">
                {title}
              </span>
            </div>
          )}

          {/* Seletor Sutil: Linhas vs Texto Livre (Oculto por padrão para manter a tela limpa) */}
          {showModeToggle && (
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-church-sand shadow-2xs">
              <button
                type="button"
                onClick={mode === 'raw' ? handleSwitchToLines : undefined}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-title font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  mode === 'lines'
                    ? 'bg-church-gold/20 text-church-charcoal border border-church-gold/40 shadow-2xs'
                    : 'text-church-muted hover:text-church-charcoal hover:bg-church-parchment/60'
                }`}
                title="Modo Linhas: toque direto na linha sem precisar dar Enter"
              >
                <AlignLeft className="w-3 h-3 text-church-gold-dark" />
                <span>Linhas</span>
              </button>
              <button
                type="button"
                onClick={mode === 'lines' ? handleSwitchToRaw : undefined}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-title font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  mode === 'raw'
                    ? 'bg-church-gold/20 text-church-charcoal border border-church-gold/40 shadow-2xs'
                    : 'text-church-muted hover:text-church-charcoal hover:bg-church-parchment/60'
                }`}
                title="Modo Texto Livre: bloco tradicional para colar listas prontas"
              >
                <FileText className="w-3 h-3 text-church-gold-dark" />
                <span>Texto Livre</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 1. MODO LINHAS PAUTADAS (TOUCH-FRIENDLY PARA TABLET COM QUEBRA DE LINHA AUTO) */}
      {mode === 'lines' ? (
        <div className="p-2 sm:p-4 space-y-1 max-h-[460px] overflow-y-auto scrollbar-thin">
          {helperText && (
            <p className="text-[11px] text-church-muted font-sans pb-1 px-1">
              {helperText}
            </p>
          )}

          <div className="space-y-1 divide-y divide-church-sand/30">
            {lines.map((line, idx) => {
              const isFilled = line.trim().length > 0;
              const firstEmptyIndex = lines.findIndex(l => l.trim().length === 0);
              const isNextActiveEmptyLine = idx === firstEmptyIndex;

              return (
                <div 
                  key={idx} 
                  className={`flex items-start gap-2 py-1 px-1.5 rounded-lg hover:bg-church-parchment/30 focus-within:bg-church-gold/5 transition-colors group ${
                    isNextActiveEmptyLine ? 'bg-church-gold/[0.04]' : ''
                  }`}
                >
                  {/* Marcador / Número da Linha alinhado ao topo */}
                  <span 
                    className={`w-6 text-right pr-1 text-xs font-mono font-bold shrink-0 self-start pt-2 transition-colors ${
                      isFilled 
                        ? 'text-church-gold-dark' 
                        : isNextActiveEmptyLine 
                          ? 'text-church-gold' 
                          : 'text-church-muted/40'
                    }`}
                  >
                    {idx + 1}.
                  </span>

                  {/* Campo de Linha Pautada com Quebra de Linha Automática */}
                  <textarea
                    ref={el => (inputRefs.current[idx] = el)}
                    rows={1}
                    value={line}
                    onChange={e => {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.max(36, e.target.scrollHeight)}px`;
                      handleLineChange(idx, e.target.value);
                    }}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    onPaste={e => handlePaste(idx, e)}
                    placeholder={isNextActiveEmptyLine ? (firstEmptyPlaceholder || '') : ''}
                    className={`flex-1 bg-transparent py-1.5 sm:py-2 px-1 text-sm sm:text-base font-sans text-church-charcoal border-b focus:border-church-gold outline-none resize-none overflow-hidden leading-relaxed break-words transition-colors placeholder:text-church-muted/70 placeholder:font-medium ${
                      isNextActiveEmptyLine ? 'border-church-gold/60' : 'border-church-sand/60'
                    }`}
                    style={{ minHeight: '36px' }}
                  />

                  {/* Botão sutil para limpar linha se estiver preenchida */}
                  {isFilled && (
                    <button
                      type="button"
                      onClick={() => handleClearLine(idx)}
                      className="p-1.5 text-church-muted/60 hover:text-red-600 rounded-md transition-colors cursor-pointer shrink-0 self-start pt-2"
                      title="Limpar esta linha"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 px-1 flex items-center justify-start">
            <button
              type="button"
              onClick={handleAddExtraLine}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-title font-semibold text-church-gold-dark hover:bg-church-gold/10 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Adicionar outra linha</span>
            </button>
          </div>
        </div>
      ) : (
        /* 2. MODO TEXTO LIVRE (TRADICIONAL PARA COLAR BLOCOS GRANDES) */
        <div className="p-3 sm:p-4 space-y-2">
          <textarea
            rows={10}
            value={rawText}
            onChange={e => onChangeRawText(e.target.value)}
            placeholder="Digite ou cole aqui sua lista completa (1 por linha)..."
            className="w-full text-sm sm:text-base font-sans p-3 bg-white border border-church-sand rounded-xl focus:border-church-gold focus:ring-0 outline-none resize-y min-h-[220px] leading-relaxed text-church-charcoal placeholder:text-church-muted/50"
          />
        </div>
      )}

      {/* Indicador de Rascunho Salvo no Aparelho */}
      {hasDraft && (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium px-4 py-1.5 bg-emerald-50/70 border-t border-church-sand/40">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>Rascunho salvo no aparelho (não se perde se a tela desligar ou recarregar)</span>
        </div>
      )}
    </div>
  );
};
