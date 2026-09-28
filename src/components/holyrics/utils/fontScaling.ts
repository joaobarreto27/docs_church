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
      fontSizeClass: 'text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl',
      lineHeightClass: 'leading-snug sm:leading-tight',
      containerClass: 'max-w-xl sm:max-w-3xl md:max-w-4xl lg:max-w-6xl'
    };
  }

  // 2. Estrofes padrão / versículos médios (120 a 220 caracteres, ex: João 3:16 ou estrofe de louvor)
  if (charCount <= 220 && lineCount <= 5) {
    return {
      fontSizeClass: 'text-xl xs:text-2xl sm:text-2xl md:text-3xl lg:text-5xl',
      lineHeightClass: 'leading-relaxed sm:leading-snug',
      containerClass: 'max-w-xl sm:max-w-3xl md:max-w-4xl lg:max-w-6xl'
    };
  }

  // 3. Textos extensos (220 a 500 caracteres, ex: 1 Coríntios 13:4-7)
  if (charCount <= 500) {
    return {
      fontSizeClass: 'text-lg xs:text-xl sm:text-2xl md:text-2xl lg:text-4xl',
      lineHeightClass: 'leading-relaxed sm:leading-snug',
      containerClass: 'max-w-xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl'
    };
  }

  // 4. Leituras bíblicas muito extensas (> 500 caracteres)
  return {
    fontSizeClass: 'text-base xs:text-lg sm:text-xl md:text-xl lg:text-3xl',
    lineHeightClass: 'leading-relaxed',
    containerClass: 'max-w-2xl sm:max-w-4xl lg:max-w-6xl'
  };
}
