import { useState, useEffect, useRef } from 'react';
import { safeScrollBy, safeScrollToTop } from '../utils';

export function usePulpitScroll(dependencies: any[]) {
  const [hasMoreSheet1, setHasMoreSheet1] = useState(false);
  const [isSheet1Scrolled, setIsSheet1Scrolled] = useState(false);
  const sheet1ScrollRef = useRef<HTMLDivElement>(null);

  const [hasMoreSheet2, setHasMoreSheet2] = useState(false);
  const [isSheet2Scrolled, setIsSheet2Scrolled] = useState(false);
  const sheet2ScrollRef = useRef<HTMLDivElement>(null);

  const checkScrollState = () => {
    if (sheet1ScrollRef.current) {
      const el = sheet1ScrollRef.current;
      const hasOverflow = el.scrollHeight > el.clientHeight + 25;
      const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 25;
      setHasMoreSheet1(hasOverflow && !isAtBottom);
      setIsSheet1Scrolled(el.scrollTop > 30);
    }
    if (sheet2ScrollRef.current) {
      const el = sheet2ScrollRef.current;
      const hasOverflow = el.scrollHeight > el.clientHeight + 25;
      const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 25;
      setHasMoreSheet2(hasOverflow && !isAtBottom);
      setIsSheet2Scrolled(el.scrollTop > 30);
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkScrollState, 200);
    window.addEventListener('resize', checkScrollState);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollState);
    };
  }, dependencies);

  const handleScrollSheet1Down = () => safeScrollBy(sheet1ScrollRef.current, 220);
  const handleScrollSheet1Up = () => safeScrollToTop(sheet1ScrollRef.current);
  const handleScrollSheet2Down = () => safeScrollBy(sheet2ScrollRef.current, 220);
  const handleScrollSheet2Up = () => safeScrollToTop(sheet2ScrollRef.current);

  return {
    sheet1ScrollRef,
    sheet2ScrollRef,
    hasMoreSheet1,
    isSheet1Scrolled,
    hasMoreSheet2,
    isSheet2Scrolled,
    checkScrollState,
    handleScrollSheet1Down,
    handleScrollSheet1Up,
    handleScrollSheet2Down,
    handleScrollSheet2Up,
  };
}
