import { useState, useEffect, useCallback } from 'react';
import { ControladorSectionKey } from '../nav';

export const useControladorScrollSpy = () => {
  const [activeSection, setActiveSection] = useState<ControladorSectionKey>('music');

  useEffect(() => {
    const sectionIds: { id: string; key: ControladorSectionKey }[] = [
      { id: 'section-visitors', key: 'visitors' },
      { id: 'section-prayers', key: 'prayers' },
      { id: 'section-youtube', key: 'youtube' },
      { id: 'section-music', key: 'music' },
    ];

    const handleScrollSpy = () => {
      const scrollPos = window.scrollY + 140;
      for (const item of sectionIds) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(item.key);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, []);

  const scrollToSection = useCallback((id: string, sectionKey: ControladorSectionKey) => {
    setActiveSection(sectionKey);
    const element = document.getElementById(id);
    if (element) {
      try {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {
        // Android 4.4.4 (Chrome 30) e WebViews legados
        element.scrollIntoView(true);
      }
    }
  }, []);

  return { activeSection, scrollToSection };
};
