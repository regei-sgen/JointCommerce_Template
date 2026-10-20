import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { trust, liveMenus, mapPoints, site, deals } from '../data.js';
import { Pin, Clock, Map, Star, Book, Tag, Leaf, Store, ChevronRight, Check } from '../icons.jsx';
import { LiveDot, TypeChip } from './ui.jsx';
import LeafletMap from './LeafletMap.jsx';

const icons = {
  pin: <Pin className="ic18" />,
  clock: <Clock className="ic18" />,
  map: <Map className="ic18" />,
  star: <Star className="ic18" />,
  book: <Book className="ic18" />,
  tag: <Tag className="ic18" />,
  leaf: <Leaf className="ic18" />,
  bolt: <Store className="ic18" />,
};

// Counts from 0 to `to` over 1.2s the first time the element scrolls into view.
export function CountUp({ to, suffix = '' }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(to); return undefined; }
    let raf = 0;
    const io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1200);
        const eased = 1 - Math.pow(1 - p, 3);
        setN(Math.round(to * eased));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref} className="trust-num">{n.toLocaleString()}{suffix}</span>;
}

export function TrustStrip() {
  return (
    <section className="trust">
      <div className="wrap">
        <div className="trust-card" data-reveal>
          {trust.map((t) => (
            <Link key={t.title} to={t.to} className="trust-item">
              <span className="trust-icon">{icons[t.icon]}</span>
              <span className="trust-copy">
                <span className="trust-stat"><CountUp to={t.value} suffix={t.suffix} />{t.live && <i className="trust-dot" />}</span>
                <span className="trust-title">{t.label ? `${t.title} · ${t.label}` : t.title}</span>
                <span className="muted trust-text">{t.text}</span>
              </span>
              <ChevronRight className="ic14 trust-go" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Rolling "menus checked" feed: one new row every 2.4s, newest on top, four visible.
const FEED = liveMenus.map((m, i) => ({ ...m, time: `${7 + Math.floor(i / 2)}:${String((i * 17) % 60).padStart(2, '0')} AM` }));
function CheckFeed() {
  const [head, setHead] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setHead((h) => (h + 1) % FEED.length), 2400);
    return () => window.clearInterval(id);
  }, []);
  const rows = [0, 1, 2, 3].map((k) => FEED[(head - k + FEED.length * 2) % FEED.length]);
  return (
    <ul className="feed" aria-live="off">
      {rows.map((r, k) => (
        <li key={r.name + head} className="feed-row" style={{ '--k': k }}>
          <span className="feed-avatar">{r.initial}</span>
          <span className="feed-copy">
            <span className="feed-name">{r.name}</span>
            <span className="feed-meta">Checked {r.time} · {r.products} products</span>
          </span>
          <span className="feed-ok"><Check className="ic14" /></span>
        </li>
      ))}
    </ul>
  );
}

export function WhyRow() {
  return (
    <section className="why">
      <div className="wrap">
        <div className="why-head" data-reveal>
          <span className="eyebrow"><Star />Why JointCommerce</span>
          <h2 className="h2">Why shop with JointCommerce?</h2>
          <p className="sub">Every listing is read from a live dispensary menu, so what you see is what is on the shelf.</p>
        </div>

        <div className="bento">
          <article className="bento-card bento-feed dark" data-reveal>
            <div className="bento-photo" aria-hidden="true" />
            <div className="bento-tint" aria-hidden="true" />
            <div className="bento-body">
              <LiveDot>Checked this morning</LiveDot>
              <h3 className="bento-title">Menus checked every morning</h3>
              <p className="bento-text">Stock and prices come straight from live dispensary menus. No stale listings, no guesswork.</p>
              <CheckFeed />
              <div className="bento-stat"><strong>{site.menusCheckedToday.toLocaleString()}</strong><span>menus checked today</span></div>
            </div>
          </article>

          <article className="glass bento-card bento-map" data-reveal style={{ '--i': 1 }}>
            <div className="bento-mapwrap">
              <LeafletMap className="bento-leaflet" center={[42.33, -71.4]} zoom={9} interactive={false} points={mapPoints} />
              <span className="bento-pin"><Pin className="ic14" />{site.nearYou} near you</span>
            </div>
            <div className="bento-body">
              <h3 className="bento-title sm">Shops near you</h3>
              <p className="bento-text">Every listing is mapped, with hours and pickup options.</p>
            </div>
          </article>

          <article className="glass bento-card bento-deals" data-reveal style={{ '--i': 2 }}>
            <div className="bento-body">
              <span className="bento-icon"><Tag className="ic18" /></span>
              <h3 className="bento-title sm">Real deals only</h3>
              <p className="bento-text">Discounts are read off the menu, not submitted.</p>
              <div className="deal-demo">
                <span className="deal-demo-row"><span>Blue Dream · 3.5g</span><s>$50</s><strong>$35</strong></span>
                <span className="deal-demo-row"><span>{deals[2].name}</span><s>${deals[2].was}</s><strong>${deals[2].price}</strong></span>
              </div>
            </div>
          </article>

          <article className="glass bento-card bento-strains" data-reveal style={{ '--i': 3 }}>
            <div className="bento-body">
              <span className="bento-icon"><Book className="ic18" /></span>
              <h3 className="bento-title sm">Strain guides</h3>
              <p className="bento-text">Plain-language guides for every strain on the menu.</p>
            </div>
            <div className="strain-demo">
              {[['hyb', 'Hybrid', 62, 19], ['sat', 'Sativa', 44, 14], ['ind', 'Indica', 78, 24]].map(([t, l, v, thc]) => (
                <div key={t} className="strain-demo-row">
                  <TypeChip type={t} small />
                  <span className="strain-bar"><i style={{ '--v': `${v}%` }} /></span>
                  <span className="muted strain-val">THC {thc}%</span>
                </div>
              ))}
            </div>
            <a href="#" className="link link-sm bento-link">Browse the guides<ChevronRight className="ic14 ic-after" /></a>
          </article>
        </div>
      </div>
    </section>
  );
}

export function NewsletterStrip() {
  return (
    <section className="newsletter">
      <div className="wrap newsletter-inner" data-reveal>
        <div>
          <div className="card-title newsletter-title">Join the JointCommerce newsletter</div>
          <div className="muted">Deals, new strains and menu updates near you, once a week.</div>
        </div>
        <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="nl3" className="srl">Email</label>
          <input id="nl3" type="email" placeholder="Enter your email" />
          <button type="submit" className="btn ink">Subscribe</button>
        </form>
      </div>
    </section>
  );
}
