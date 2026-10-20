import { useEffect, useState } from 'react';

// Scroll position as React state. Re-renders the caller on every animation frame while scrolling,
// so it is only for components that need `y`/`p` in their render output. For parallax use
// `useParallax`, which writes styles straight to the DOM with no re-render.
export function useScroll() {
  const [s, setS] = useState({ y: 0, p: 0 });

  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const y = window.scrollY || 0;
      const range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setS({ y, p: Math.min(1, Math.max(0, y / range)) });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    read();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return s;
}

// Calls `fn(y, p)` once per animation frame while scrolling (and once on mount / resize).
// `y` is window.scrollY, `p` is 0..1 progress through the document. No state, no re-render.
export function useParallax(fn, deps = []) {
  useEffect(() => {
    let raf = 0;
    const run = () => {
      raf = 0;
      const y = window.scrollY || 0;
      const range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      fn(y, Math.min(1, Math.max(0, y / range)));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on, { passive: true });
    run();
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}
