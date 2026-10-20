import { useEffect } from 'react';

// Adds the `in` class to every [data-reveal] element the first time it enters the viewport,
// and to anything the viewport has already passed (fast scrolls, anchor jumps, reloads mid-page).
// `deps` re-runs the scan, e.g. after a tab switch mounts new [data-reveal] elements.
export function useReveal(deps = []) {
  useEffect(() => {
    const pending = new Set(document.querySelectorAll('[data-reveal]'));
    if (!pending.size) return undefined;

    const revealed = new WeakSet();
    const reveal = (el) => {
      el.classList.add('in');
      revealed.add(el);
      pending.delete(el);
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      pending.forEach(reveal);
      return undefined;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
            io.unobserve(entry.target);
            reveal(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    pending.forEach((el) => io.observe(el));

    // Elements mounted later (tab switches, hot reloads) join the same observer.
    const mo = new MutationObserver((muts) => {
      muts.forEach((m) => {
        // A React re-render that rewrites className drops the imperatively added `in`; put it back.
        if (m.type === 'attributes') {
          const el = m.target;
          if (revealed.has(el) && !el.classList.contains('in')) el.classList.add('in');
          return;
        }
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          const els = n.matches('[data-reveal]') ? [n] : [...n.querySelectorAll('[data-reveal]')];
          els.forEach((el) => { if (!el.classList.contains('in') && !pending.has(el)) { pending.add(el); io.observe(el); } });
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

    // Catch elements the viewport jumped over without ever intersecting them.
    let raf = 0;
    const sweep = () => {
      raf = 0;
      const limit = window.innerHeight;
      pending.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top < limit * 0.94) {
          io.unobserve(el);
          reveal(el);
        }
      });
    };
    const onScroll = () => {
      if (!raf && pending.size) raf = requestAnimationFrame(sweep);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
