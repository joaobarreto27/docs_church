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
      fontSizeClass: 'text-5xl sm:text-6xl md:text-7xl',
      lineHeightClass: 'leading-tight sm:leading-snug',
      containerClass: 'max-w-6xl'
    };
  }

  // 2. Estrofes padrão de hinos / versículos médios (120 a 280 caracteres)
  if (charCount <= 280 && lineCount <= 6) {
    return {
      fontSizeClass: 'text-4xl sm:text-5xl md:text-6xl',
      lineHeightClass: 'leading-snug sm:leading-relaxed',
      containerClass: 'max-w-6xl'
    };
  }

  // 3. Textos extensos (ex: versículos de 280 a 600 caracteres)
  if (charCount <= 600) {
    return {
      fontSizeClass: 'text-2xl sm:text-3xl md:text-4xl',
      lineHeightClass: 'leading-relaxed',
      containerClass: 'max-w-7xl'
    };
  }

  // 4. Leituras bíblicas muito extensas (> 600 caracteres)
  return {
    fontSizeClass: 'text-xl sm:text-2xl md:text-3xl',
    lineHeightClass: 'leading-relaxed',
    containerClass: 'max-w-7xl'
  };
}
