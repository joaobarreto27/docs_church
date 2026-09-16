import React from 'react';
import { ImageIcon, Check } from 'lucide-react';

interface YoutubeScreenshotUploaderProps {
  youtubeImageBase64: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onRemoveImage: () => void;
}

export const YoutubeScreenshotUploader: React.FC<YoutubeScreenshotUploaderProps> = ({
  youtubeImageBase64,
  fileInputRef,
  onFileInput,
  onPaste,
  onRemoveImage,
}) => {
  return (
    <div
      onPaste={onPaste}
      className="p-4 rounded-xl border-2 border-dashed border-red-300 bg-red-50/30 hover:bg-red-50/60 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer text-center"
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef as any}
        onChange={onFileInput}
        accept="image/*"
        className="hidden"
      />
      {youtubeImageBase64 ? (
        <div className="flex flex-col items-center gap-2">
          <img
            src={youtubeImageBase64}
            alt="Prévia do print colado"
            className="max-h-28 rounded-lg border border-red-200 shadow-xs"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Print pronto para envio!
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveImage();
              }}
              className="text-xs text-red-600 hover:underline cursor-pointer"
            >
              Remover print
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-title text-xs font-bold uppercase tracking-wider text-red-900">
              Cole o Print aqui (<strong className="font-mono">Ctrl + V</strong>) ou clique para selecionar
            </p>
            <p className="text-[11px] text-church-muted mt-0.5">
              Tire print do chat da live (Win+Shift+S ou Cmd+Shift+4) e dê Ctrl+V direto nesta caixa.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
