import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from '../icons.jsx';

// A horizontally scrolling row with a heading, an optional "see all" link, prev/next arrows and an
// edge fade on whichever side still has content. Arrows disable at the ends and hide when
// nothing overflows. Touch devices swipe; the arrows are hidden there by CSS.
export default function ScrollRow({ title, to, className = '', children }) {
  const track = useRef(null);
  const [edge, setEdge] = useState({ prev: false, next: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return undefined;
    const read = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdge({ prev: el.scrollLeft > 2, next: el.scrollLeft < max - 2 });
    };
    read();
    el.addEventListener('scroll', read, { passive: true });
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', read); ro.disconnect(); };
  }, []);

  const step = (dir) => {
    const el = track.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * Math.max(200, el.clientWidth * 0.8), behavior: reduced ? 'auto' : 'smooth' });
  };
  const overflow = edge.prev || edge.next;

  return (
    <section className="hm-sec" data-reveal>
      <div className="hm-head">
        <h2 className="hm-title">{title}</h2>
        {to && <Link to={to} className="hm-more" aria-label={`See all: ${title}`}><ChevronRight className="ic18" /></Link>}
        {overflow && (
          <div className="hm-arrows">
            <button type="button" className="hm-arrow" aria-label={`Scroll ${title} back`} disabled={!edge.prev} onClick={() => step(-1)}><ChevronLeft className="ic18" /></button>
            <button type="button" className="hm-arrow" aria-label={`Scroll ${title} forward`} disabled={!edge.next} onClick={() => step(1)}><ChevronRight className="ic18" /></button>
          </div>
        )}
      </div>
      <div className={`hm-row-wrap${edge.prev ? ' has-prev' : ''}${edge.next ? ' has-next' : ''}`}>
        <div className={`hm-row ${className}`} ref={track}>{children}</div>
      </div>
    </section>
  );
}
