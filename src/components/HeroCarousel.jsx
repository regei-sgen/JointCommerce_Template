import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { heroSlides, site } from '../data.js';
import { ChevronLeft, ChevronRight, Pin, Store, Info, Star } from '../icons.jsx';
import { LiveDot, Photo } from './ui.jsx';
import { pics } from '../images.js';

const INTERVAL = 4200;

export default function HeroCarousel({ active, onChange, paused: pausedProp = false }) {
  const n = heroSlides.length;
  const [hover, setHover] = useState(false);
  const [hidden, setHidden] = useState(false);
  const timer = useRef(0);
  const paused = pausedProp || hover || hidden;

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (paused) return undefined;
    timer.current = window.setTimeout(() => onChange((active + 1) % n), INTERVAL);
    return () => window.clearTimeout(timer.current);
  }, [active, paused, n, onChange]);

  const go = (d) => onChange((active + d + n) % n);

  return (
    <div
      className="carousel"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <div className="hero-side-head">
        <span className="hero-side-title">Open near you</span>
        <LiveDot>{site.openNow} open</LiveDot>
      </div>

      <div className="slides" aria-live="polite">
        {heroSlides.map((s, i) => {
          const state = i === active ? 'active' : i === (active + n - 1) % n ? 'prev' : 'next';
          return (
            <article key={s.code + s.city} className={`slide glass ${state}`} aria-hidden={i !== active}>
              <div className="slide-art">
                <Photo src={pics.dispensaries[i % pics.dispensaries.length]} className="slide-photo" tint />
                <span className="slide-logo">{s.code}</span>
              </div>
              <div className="slide-body">
                <span className={`chip ${s.tagType} slide-tag`}>{s.tag}</span>
                <div className="slide-name">{s.name}</div>
                <div className="muted slide-meta"><Pin className="ic14" />{s.city} · {s.miles} mi</div>
                <div className="slide-row"><span className="rating"><Star className="ic14" />{s.rating.toFixed(1)}<span> ({s.reviews})</span></span><LiveDot>{s.status}</LiveDot></div>
                <div className="slide-actions">
                  <Link to={`/dispensaries/${s.slug}`} className="btn sm slide-btn" tabIndex={i === active ? 0 : -1}><Store />Shop menu</Link>
                  <Link to={`/dispensaries/${s.slug}`} className="btn ghost sm slide-btn" tabIndex={i === active ? 0 : -1}><Info className="ic14" />Store info</Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="thumbs" role="tablist" aria-label="Dispensaries">
        {heroSlides.map((s, i) => (
          <button
            key={s.code + s.city}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`glass thumb${i === active ? ' active' : ''}`}
            onClick={() => onChange(i)}
          >
            <span className="thumb-text">
              <span className="thumb-name">{s.name}</span>
              <span className="muted thumb-city">{s.city}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="carousel-bar">
        <div className="carousel-ctrls">
          <button type="button" aria-label="Previous dispensary" onClick={() => go(-1)}><ChevronLeft className="ic18" /></button>
          <button type="button" aria-label="Next dispensary" onClick={() => go(1)}><ChevronRight className="ic18" /></button>
        </div>
        <div className="carousel-progress" aria-hidden="true">
          <i key={active} className={paused ? 'paused' : ''} style={{ animationDuration: `${INTERVAL}ms` }} />
        </div>
        <div className="carousel-count">
          <span className="carousel-current">{String(active + 1).padStart(2, '0')}</span>
          <span className="muted"> / {String(n).padStart(2, '0')}</span>
        </div>
      </div>
    </div>
  );
}
