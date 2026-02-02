import { useEffect, useRef, useState } from 'react';

/**
 * Hook para detectar cuando un elemento entra en el viewport.
 * Útil para animaciones fade-in al hacer scroll (Bloque 5 - Sistema de diseño).
 * Usar con clases: animate-in-view + is-visible cuando inView es true.
 */
export function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
        ...options,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.threshold, options?.rootMargin]);

  return { ref, inView };
}
