import { useState, useEffect } from 'react';
import { isSmartphoneDevice } from '../utils';

export type SheetLayoutMode = 'four-views' | 'two-sheets' | 'single-sheet';
export type PulpitActiveTab = 'prayers' | 'opps' | 'visitors' | 'alerts';

export function usePulpitLayout() {
  // Escala de fonte e zoom para pregadores idosos (padrão: 100% ~ 1.0)
  const [fontScale, setFontScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pulpit_font_scale_v2');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0.7 && val <= 1.8) return val;
      }
    } catch {}
    return 1.0;
  });

  const handleFontChange = (delta: number) => {
    setFontScale((prev) => {
      const next = Math.max(0.7, Math.min(1.8, Number((prev + delta).toFixed(2))));
      try {
        localStorage.setItem('pulpit_font_scale_v2', next.toString());
      } catch {}
      return next;
    });
  };

  // Detecção reativa de smartphone (atualiza ao rotacionar a tela ou redimensionar)
  const [isMobilePhone, setIsMobilePhone] = useState<boolean>(isSmartphoneDevice);

  useEffect(() => {
    const handleResize = () => {
      setIsMobilePhone(isSmartphoneDevice());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Modo de visualização de folhas: 'four-views' vs 'two-sheets' vs 'single-sheet'
  const [sheetLayout, setSheetLayout] = useState<SheetLayoutMode>(() => {
    try {
      const saved = localStorage.getItem('pulpit_sheet_layout');
      if (saved === 'four-views' || saved === 'two-sheets' || saved === 'single-sheet') {
        return saved as SheetLayoutMode;
      }
      if (typeof window !== 'undefined' && window.innerHeight > window.innerWidth) {
        return 'four-views';
      }
    } catch {}
    return 'four-views';
  });

  const [activeTab, setActiveTab] = useState<PulpitActiveTab>('prayers');
  const [isPreachingMode, setIsPreachingMode] = useState<boolean>(false);

  const handleToggleSheetLayout = (mode: SheetLayoutMode) => {
    setSheetLayout(mode);
    try {
      localStorage.setItem('pulpit_sheet_layout', mode);
    } catch {}
  };

  const handleEnterPreachingMode = () => setIsPreachingMode(true);
  const handleExitPreachingMode = () => setIsPreachingMode(false);

  const effectiveLayout = isMobilePhone && sheetLayout === 'two-sheets' ? 'four-views' : sheetLayout;

  return {
    fontScale,
    handleFontChange,
    isMobilePhone,
    sheetLayout,
    effectiveLayout,
    activeTab,
    setActiveTab,
    isPreachingMode,
    setIsPreachingMode,
    handleEnterPreachingMode,
    handleExitPreachingMode,
    handleToggleSheetLayout,
  };
}

