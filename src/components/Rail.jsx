import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from '../icons.jsx';

// Horizontal, scroll-snapping row with side arrows. Column count is set in CSS per breakpoint.
// `auto` (ms) advances one card at that interval, wrapping to the start; it pauses while the pointer
// is over the rail, while it has focus, while the user is touching it, while the tab is hidden,
// while the rail is off-screen, and under prefers-reduced-motion.
export default function Rail({ children, label = 'items', auto = 0 }) {
  const track = useRef(null);
  const rail = useRef(null);
  // Scroll snapping is switched on only after the feed-in reveal has finished: snap areas follow the
  // transformed boxes, so snapping while the cards are still translated leaves the row scrolled.
  const [snap, setSnap] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = track.current;
    if (!el) return undefined;
    let timer = 0;
    const arm = () => {
      if (timer) return;
      const n = el.children.length;
      timer = window.setTimeout(() => setSnap(true), n * 110 + 1000);
    };
    if ([...el.children].some((ch) => ch.classList.contains('in'))) arm();
    const mo = new MutationObserver((muts) => {
      if (muts.some((m) => m.target.classList.contains('in'))) { arm(); mo.disconnect(); }
    });
    mo.observe(el, { attributes: true, attributeFilter: ['class'], subtree: true });
    return () => { mo.disconnect(); if (timer) window.clearTimeout(timer); };
  }, []);

  const cardStep = () => {
    const el = track.current;
    if (!el) return 0;
    const first = el.firstElementChild;
    return first ? first.getBoundingClientRect().width + 16 : el.clientWidth / 4;
  };

  const step = (dir) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * cardStep() * 2, behavior: 'smooth' });
  };

  // visibility of the rail itself
  useEffect(() => {
    if (!auto || !rail.current) return undefined;
    const io = new IntersectionObserver((es) => setVisible(es.some((e) => e.isIntersecting)), { threshold: 0.3 });
    io.observe(rail.current);
    return () => io.disconnect();
  }, [auto]);

  // auto-advance
  useEffect(() => {
    if (!auto || !snap || paused || !visible) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = window.setInterval(() => {
      const el = track.current;
      if (!el || document.hidden) return;
      const max = el.scrollWidth - el.clientWidth;
      const next = el.scrollLeft + cardStep();
      el.scrollTo({ left: next > max + 2 ? 0 : next, behavior: 'smooth' });
    }, auto);
    return () => window.clearInterval(id);
  }, [auto, snap, paused, visible]);

  const pause = () => setPaused(true);
  const resume = () => setPaused(false);

  return (
    <div
      className="rail"
      ref={rail}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
    >
      <button type="button" className="rail-btn rail-prev" aria-label={`Previous ${label}`} onClick={() => step(-1)}>
        <ChevronLeft className="ic18" />
      </button>
      <div className={`rail-track${snap ? ' snap' : ''}`} ref={track}>
        {children}
      </div>
      <button type="button" className="rail-btn rail-next" aria-label={`Next ${label}`} onClick={() => step(1)}>
        <ChevronRight className="ic18" />
      </button>
    </div>
  );
}
