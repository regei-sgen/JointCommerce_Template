import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { liveMenus, deals, topBrands, topStrains, newOnMenus, site } from '../data.js';
import { useParallax, useReducedMotion } from '../hooks/useScroll.js';
import { Map, Tag, Store, Leaf, Sparkle, ChevronRight, Clock, Check } from '../icons.jsx';
import { SectionHeader, TypeChip, LiveDot, Photo } from './ui.jsx';
import { pics } from '../images.js';
import Rail from './Rail.jsx';

const CATS = [['Flower', 'Vapes', 'Edibles'], ['Flower', 'Pre-rolls'], ['Vapes', 'Edibles', 'Topicals'], ['Flower', 'Concentrates'], ['Flower', 'Edibles'], ['Pre-rolls', 'Vapes']];
const TIMES = ['7:02 AM', '7:14 AM', '7:31 AM', '7:48 AM', '8:05 AM', '8:22 AM'];

function Board({ title, eyebrow, icon, link, rows, max, render }) {
  return (
    <div className="board" data-reveal>
      <SectionHeader icon={icon} eyebrow={eyebrow} title={title} link={link} arrows={false} size={26} />
      <ol className="board-list">
        {rows.map((r, i) => (
          <li key={r.name} className="board-row" style={{ '--i': i }}>
            <span className="board-rank">{String(i + 1).padStart(2, '0')}</span>
            {render(r, i)}
            <span className="board-bar"><i style={{ '--v': `${Math.round((r.menus / max) * 100)}%` }} /></span>
            <span className="board-val">{r.menus} menus</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function DarkBand() {
  const glowARef = useRef(null);
  const glowBRef = useRef(null);
  const photoRef = useRef(null);

  // Photo layer parallax is relative to the band: it starts when the band enters the viewport
  // and moves at 30% of the scroll distance. The layer is 50% taller than the band so it never runs out.
  const ref = useRef(null);
  const top = useRef(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    const measure = () => { if (ref.current) top.current = ref.current.getBoundingClientRect().top + window.scrollY; };
    measure();
    window.addEventListener('resize', measure, { passive: true });
    return () => window.removeEventListener('resize', measure);
  }, []);
  useParallax((y, p) => {
    const shift = reduced ? 0 : (y + window.innerHeight - top.current) * 0.3;
    if (photoRef.current) photoRef.current.style.transform = `translate3d(0, ${(-shift).toFixed(1)}px, 0)`;
    if (glowARef.current) glowARef.current.style.transform = `translate3d(${(-p * 420).toFixed(0)}px, ${(p * 260).toFixed(0)}px, 0) scale(${(0.8 + p * 0.9).toFixed(3)})`;
    if (glowBRef.current) glowBRef.current.style.transform = `translate3d(${(p * 360).toFixed(0)}px, ${(-p * 200).toFixed(0)}px, 0)`;
  }, [reduced]);

  const brandMax = Math.max(...topBrands.map((b) => b.menus));
  const strainMax = Math.max(...topStrains.map((s) => s.menus));

  return (
    <section className="dark band" ref={ref}>
      <div className="band-photo" ref={photoRef} aria-hidden="true" />
      <div className="band-tint" aria-hidden="true" />
      <div className="layer band-glow-a" ref={glowARef} />
      <div className="layer band-glow-b" ref={glowBRef} />
      <div className="wrap">
        <div className="sh" data-reveal>
          <div>
            <LiveDot>Menus checked today</LiveDot>
            <h2 className="h2">Shop live menus</h2>
            <p className="sub">Dispensaries whose menus we checked today, with products in stock. Set your location to see the ones near you.</p>
          </div>
          <div className="sh-actions">
            <Link to="/dispensaries" className="btn"><Map />Open the map</Link>
          </div>
        </div>
        <Rail label="live menus">
          {liveMenus.map((m, i) => (
            <a key={m.name} href="#" className="menucard" data-reveal style={{ '--i': i }}>
              <Photo src={pics.liveMenus[i]} className="menucard-photo" />
              <div className="menucard-top">
                <span className="menucard-badge">{m.initial}</span>
                <span className="menucard-live"><i />Live</span>
              </div>
              <div className="menucard-body">
                <div className="menucard-name">{m.name}</div>
                <div className="menucard-meta"><Clock className="ic14" />Checked {TIMES[i % TIMES.length]} · {m.products} products</div>
                <div className="menucard-cats">{CATS[i % CATS.length].map((c) => <span key={c}>{c}</span>)}</div>
                <span className="menucard-cta"><Store className="ic14" />Shop menu<ChevronRight className="ic14 ic-after" /></span>
              </div>
            </a>
          ))}
        </Rail>

        <div className="band-gap" />
        <div className="promo" data-reveal>
          <div className="promo-photo" aria-hidden="true" />
          <div className="promo-copy">
            <span className="eyebrow"><Tag />Today's deals</span>
            <h2 className="h2 h2-lg">Up to 50% off on live menus near you.</h2>
            <p className="sub">Flower, vapes, pre-rolls and edibles on sale right now, pulled from dispensary menus this morning.</p>
            <div className="promo-row">
              <Link to="/deals" className="btn promo-btn">See all deals<ChevronRight className="ic14 ic-after" /></Link>
              <span className="promo-note"><Clock className="ic14" />Ends tonight · {site.dealsLive.toLocaleString()} deals live</span>
            </div>
          </div>
          <div className="promo-art" aria-hidden="true">
            <span className="promo-num">50<small>%</small></span>
            <span className="promo-sub">off today</span>
          </div>
        </div>
        <div className="band-gap-sm" />
        <Rail label="deals">
          {deals.map((d, i) => (
            <a key={d.name} href="#" className="poster dealposter" data-reveal style={{ '--i': i }}>
              <Photo src={pics.deals[i]} className="poster-photo" />
              <div className="poster-top">
                <span className="deal-badge">-{d.pct}%</span>
                <span className="poster-rank">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="poster-body">
                <div className="poster-name">{d.name}</div>
                <div className="poster-lineage">{d.meta}</div>
                <div className="deal-price"><strong>${d.price}</strong><s>${d.was}</s><span className="deal-save">Save {d.pct}%</span></div>
                <span className="poster-cta"><Check className="ic14" />Claim deal<ChevronRight className="ic14 ic-after" /></span>
              </div>
            </a>
          ))}
        </Rail>

        <div className="band-gap" />
        <div className="band-split boards">
          <Board
            title="Brands on the most menus" eyebrow="Brands" icon={<Store />} link="View all" to="/brands" rows={topBrands} max={brandMax}
            render={(b, i) => (
              <span className="board-main">
                <span className="board-logo"><img src={pics.topBrands[i]} alt="" loading="lazy" /><span className={b.spaced ? 'spaced' : ''}>{b.label}</span></span>
                <span className="board-copy"><span className="board-name">{b.name}</span><span className="board-meta">{b.meta}</span></span>
              </span>
            )}
          />
          <Board
            title="Strains on the most menus" eyebrow="Strains" icon={<Leaf className="ic14" />} link="Browse" to="/strains" rows={topStrains} max={strainMax}
            render={(s, i) => (
              <span className="board-main">
                <span className="board-logo"><img src={pics.topStrains[i]} alt="" loading="lazy" /></span>
                <span className="board-copy"><span className="board-name">{s.name}</span><span className="board-meta"><TypeChip type={s.type} small /><span className="thc">THC {s.thc}%</span></span></span>
              </span>
            )}
          />
        </div>

        <div className="band-gap" />
        <SectionHeader icon={<Sparkle />} eyebrow="Fresh" title="New on menus" sub="Strains first listed on dispensary menus since October 4." link="Browse all" to="/strains?new=1" arrows={false} />
        <Rail label="new strains">
          {newOnMenus.map((s, i) => (
            <a key={s.name} href="#" className={`poster poster-${s.type}`} data-reveal style={{ '--i': i }}>
              <Photo src={pics.newOnMenus[i]} className="poster-photo" />
              <div className="poster-top">
                <span className="chip new-chip"><Sparkle className="ic14" />New</span>
                <TypeChip type={s.type} />
              </div>
              <div className="poster-body">
                <div className="poster-name">{s.name}</div>
                <div className="poster-lineage">Listed {1 + (i % 4)} days ago</div>
                <div className="poster-foot"><span className="poster-thc">THC {s.thc}%</span><span className="poster-menus">{s.menus} menus</span></div>
                <span className="poster-cta">Where to buy<ChevronRight className="ic14 ic-after" /></span>
              </div>
            </a>
          ))}
        </Rail>
      </div>
    </section>
  );
}
