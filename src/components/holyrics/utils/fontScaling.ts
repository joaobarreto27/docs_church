export interface SlideTypographyClasses {
  fontSizeClass: string;
  lineHeightClass: string;
  containerClass: string;
}

/**
 * Calcula dinamicamente as classes de tipografia para o texto do slide,
 * com aumento adicional de ~15% (totalizando ~35% de escala ampliada)
 * para leitura rápida e sem esforço visual a metros de distância no púlpito.
 */
export function getSlideTypographyClasses(text: string): SlideTypographyClasses {
  const clean = String(text || '').trim();
  const charCount = clean.length;
  const lineCount = clean.split('\n').length;

  // 1. Textos curtos (< 120 caracteres ou até 3 linhas) - Versículos breves e refrões
  if (charCount < 120 && lineCount <= 3) {
    return {
      fontSizeClass: 'text-lg sm:text-5xl md:text-6xl lg:text-7xl',
      lineHeightClass: 'leading-snug sm:leading-tight',
      containerClass: 'max-w-6xl'
    };
  }

  // 2. Estrofes padrão de hinos / versículos médios (120 a 280 caracteres)
  if (charCount <= 280 && lineCount <= 6) {
    return {
      fontSizeClass: 'text-base sm:text-4xl md:text-5xl lg:text-6xl',
      lineHeightClass: 'leading-relaxed sm:leading-snug',
      containerClass: 'max-w-6xl'
    };
  }

  // 3. Textos extensos (ex: versículos de 280 a 600 caracteres)
  if (charCount <= 600) {
    return {
      fontSizeClass: 'text-sm sm:text-2xl md:text-3xl lg:text-4xl',
      lineHeightClass: 'leading-relaxed',
      containerClass: 'max-w-7xl'
    };
  }

  // 4. Leituras bíblicas muito extensas (> 600 caracteres)
  return {
    fontSizeClass: 'text-xs sm:text-xl md:text-2xl lg:text-3xl',
    lineHeightClass: 'leading-relaxed',
    containerClass: 'max-w-7xl'
  };
}
