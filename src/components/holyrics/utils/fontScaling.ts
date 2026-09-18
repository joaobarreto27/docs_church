export interface SlideTypographyClasses {
  fontSizeClass: string;
  lineHeightClass: string;
  containerClass: string;
}

/**
 * Calcula dinamicamente as classes de tipografia para o texto do slide,
 * com aumento de ~20% no tamanho das fontes para máxima legibilidade no púlpito,
 * preservando o alinhamento 100% centralizado ao meio e sem scroll vertical.
 */
export function getSlideTypographyClasses(text: string): SlideTypographyClasses {
  const clean = String(text || '').trim();
  const charCount = clean.length;
  const lineCount = clean.split('\n').length;

  // 1. Textos curtos (< 120 caracteres ou até 3 linhas) - Versículos breves e refrões
  if (charCount < 120 && lineCount <= 3) {
    return {
      fontSizeClass: 'text-4xl sm:text-5xl md:text-6xl',
      lineHeightClass: 'leading-snug sm:leading-tight',
      containerClass: 'max-w-5xl'
    };
  }

  // 2. Estrofes padrão de hinos / versículos médios (120 a 280 caracteres)
  if (charCount <= 280 && lineCount <= 6) {
    return {
      fontSizeClass: 'text-3xl sm:text-4xl md:text-5xl',
      lineHeightClass: 'leading-normal sm:leading-relaxed',
      containerClass: 'max-w-5xl'
    };
  }

  // 3. Textos extensos (ex: versículos de 280 a 600 caracteres)
  if (charCount <= 600) {
    return {
      fontSizeClass: 'text-xl sm:text-2xl md:text-3xl',
      lineHeightClass: 'leading-relaxed',
      containerClass: 'max-w-6xl'
    };
  }

  // 4. Leituras bíblicas muito extensas (> 600 caracteres) - Mantém centralizado ao meio
  return {
    fontSizeClass: 'text-lg sm:text-xl md:text-2xl',
    lineHeightClass: 'leading-relaxed',
    containerClass: 'max-w-6xl'
  };
}
