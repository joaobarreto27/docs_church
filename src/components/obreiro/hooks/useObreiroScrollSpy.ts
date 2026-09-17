import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../../../types/liturgy';

export type ObreiroSectionKey = 'visitors' | 'prayers' | 'opps' | 'choirs';

export const useObreiroScrollSpy = (role?: UserRole | null) => {
  const [activeSection, setActiveSection] = useState<ObreiroSectionKey>('visitors');

  useEffect(() => {
    const sectionIds: { id: string; key: ObreiroSectionKey }[] = [
      { id: 'section-visitors', key: 'visitors' },
      { id: 'section-prayers', key: 'prayers' },
      { id: 'section-opportunities', key: 'opps' },
    ];
    if (role === 'controlador') {
      sectionIds.push({ id: 'section-choirs', key: 'choirs' });
    }

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
  }, [role]);

  const scrollToSection = useCallback((id: string, sectionKey: ObreiroSectionKey) => {
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
