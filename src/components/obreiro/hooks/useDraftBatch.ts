import { useState, useCallback } from 'react';

export interface UseDraftBatchOptions {
  storageKey: string;
  fallbackKey?: string;
  defaultLineCount?: number;
  initialUrgent?: boolean;
}

export function useDraftBatch({
  storageKey,
  fallbackKey,
  defaultLineCount = 10,
  initialUrgent = false,
}: UseDraftBatchOptions) {
  // Lê rascunho salvo inicialmente do localStorage
  const [rawText, setRawText] = useState<string>(() => {
    try {
      if (!storageKey) return '';
      return (
        localStorage.getItem(storageKey) ||
        (fallbackKey ? localStorage.getItem(fallbackKey) : null) ||
        ''
      );
    } catch {
      return '';
    }
  });

  const [lines, setLines] = useState<string[]>(() => {
    try {
      if (!storageKey) return Array(defaultLineCount).fill('');
      const saved =
        localStorage.getItem(storageKey) ||
        (fallbackKey ? localStorage.getItem(fallbackKey) : null);
      if (saved) {
        const arr = saved.split('\n');
        if (arr.length > 0) return arr;
      }
    } catch {}
    return Array(defaultLineCount).fill('');
  });

  const [isUrgent, setIsUrgent] = useState<boolean>(initialUrgent);

  // Atualiza texto bruto e reflete no localStorage
  const handleRawTextChange = useCallback(
    (text: string) => {
      setRawText(text);
      const split = text.split('\n');
      setLines(split.length > 0 ? split : Array(defaultLineCount).fill(''));
      if (storageKey) {
        try {
          if (text.trim()) {
            localStorage.setItem(storageKey, text);
          } else {
            localStorage.removeItem(storageKey);
          }
        } catch {}
      }
    },
    [storageKey, defaultLineCount]
  );

  // Atualiza linhas pautadas individuais e reflete no texto bruto
  const handleLinesChange = useCallback(
    (newLines: string[]) => {
      setLines(newLines);
      const nonBlank = newLines.map((l) => l.trim()).filter(Boolean).join('\n');
      setRawText(nonBlank);
      if (storageKey) {
        try {
          if (nonBlank) {
            localStorage.setItem(storageKey, nonBlank);
          } else {
            localStorage.removeItem(storageKey);
          }
        } catch {}
      }
    },
    [storageKey]
  );

  // Limpa o rascunho após inclusão bem-sucedida
  const handleClearBatch = useCallback(() => {
    setRawText('');
    setLines(Array(defaultLineCount).fill(''));
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch {}
    }
    if (fallbackKey) {
      try {
        localStorage.removeItem(fallbackKey);
      } catch {}
    }
  }, [storageKey, fallbackKey, defaultLineCount]);

  const hasDraft = Boolean(rawText.trim() || lines.some((l) => l.trim().length > 0));

  const linesToProcess = lines.some((l) => l.trim().length > 0)
    ? lines.map((l) => l.trim()).filter((l) => l.length > 0)
    : rawText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

  const canSubmit = linesToProcess.length > 0;

  return {
    rawText,
    lines,
    isUrgent,
    setIsUrgent,
    handleRawTextChange,
    handleLinesChange,
    handleClearBatch,
    hasDraft,
    linesToProcess,
    canSubmit,
  };
}
