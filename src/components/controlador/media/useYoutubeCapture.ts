import { useState, useRef, useCallback } from 'react';
import { compressImageFile } from './canvasCompressor';

interface UseYoutubeCaptureOptions {
  onSuccessFeedback?: (msg: string) => void;
  onErrorFeedback?: (msg: string) => void;
}

export const useYoutubeCapture = (options?: UseYoutubeCaptureOptions) => {
  const [youtubeText, setYoutubeText] = useState('');
  const [youtubeImageBase64, setYoutubeImageBase64] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = useCallback(
    async (file: File | Blob) => {
      setIsCompressing(true);
      try {
        const compressed = await compressImageFile(file);
        setYoutubeImageBase64(compressed);
        options?.onSuccessFeedback?.('Print capturado e otimizado com sucesso!');
      } catch (err) {
        console.error(err);
        options?.onErrorFeedback?.('Falha ao processar print do chat.');
      } finally {
        setIsCompressing(false);
      }
    },
    [options]
  );

  const handlePasteEvent = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            await handleProcessFile(file);
            break;
          }
        }
      }
    },
    [handleProcessFile]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await handleProcessFile(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleProcessFile]
  );

  const clearCapture = useCallback(() => {
    setYoutubeText('');
    setYoutubeImageBase64(null);
  }, []);

  const removeImage = useCallback(() => {
    setYoutubeImageBase64(null);
  }, []);

  return {
    youtubeText,
    setYoutubeText,
    youtubeImageBase64,
    isCompressing,
    fileInputRef,
    handlePasteEvent,
    handleFileInput,
    clearCapture,
    removeImage,
  };
};
