/**
 * Comprime uma imagem ou print usando a API de Canvas do navegador.
 * Gera JPEG em Base64 (~30-45KB) com largura máxima de 600px.
 * Totalmente compatível com Android 4.4.4 KitKat e WebViews legadas.
 */
export function compressImageFile(
  file: File | Blob,
  maxWidth = 600,
  quality = 0.65
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const scale = Math.min(1, maxWidth / img.width);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Contexto 2D do Canvas indisponível'));
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', quality);
          resolve(base64);
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Falha ao renderizar canvas'));
        }
      };
      img.onerror = () => reject(new Error('Erro ao processar imagem'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo de imagem'));
    reader.readAsDataURL(file);
  });
}
