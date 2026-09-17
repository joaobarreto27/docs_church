export interface SlideTypographyClasses {
  fontSizeClass: string;
  lineHeightClass: string;
  containerClass: string;
}

/**
 * Calcula dinamicamente as classes de tipografia para o texto do slide,
 * garantindo que mesmo textos extensos (como Ester 8:9 com 520 caracteres)
 * caibam perfeitamente na tela do tablet sem scroll vertical.
 */
export function getSlideTypographyClasses(text: string): SlideTypographyClasses {
  const clean = String(text || '').trim();
  const charCount = clean.length;
  const lineCount = clean.split('\n').length;

  // 1. Textos curtos (< 120 caracteres ou até 3 linhas)
  if (charCount < 120 && lineCount <= 3) {
    return {
      fontSizeClass: 'text-3xl sm:text-4xl md:text-5xl',
      lineHeightClass: 'leading-relaxed',
      containerClass: 'max-w-4xl'
    };
  }

  // 2. Estrofes padrão de hinos (120 a 280 caracteres)
  if (charCount <= 280 && lineCount <= 6) {
    return {
      fontSizeClass: 'text-2xl sm:text-3xl md:text-4xl',
      lineHeightClass: 'leading-normal sm:leading-relaxed',
      containerClass: 'max-w-4xl'
    };
  }

  // 3. Textos extensos (ex: Ester 8:9 com ~520 caracteres)
  if (charCount <= 600) {
    return {
      fontSizeClass: 'text-lg sm:text-xl md:text-2xl',
      lineHeightClass: 'leading-relaxed',
      containerClass: 'max-w-5xl'
    };
  }

  // 4. Leituras bíblicas extremas (> 600 caracteres) -> 2 colunas para preservar zero scroll
  return {
    fontSizeClass: 'text-base sm:text-lg',
    lineHeightClass: 'leading-normal',
    containerClass: 'max-w-6xl columns-1 sm:columns-2 gap-8 text-justify'
  };
}
