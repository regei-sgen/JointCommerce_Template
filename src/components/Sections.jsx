import { useMemo, useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useParallax } from '../hooks/useScroll.js';
import { Link } from 'react-router-dom';
import { dispensaries, brands, strains, states, stateCounts, featuredArticle, articles, mapPoints, featureTiles } from '../data.js';
import { Pin, Store, Info, Star, Leaf, Flag, Map, Book, User, ChevronRight } from '../icons.jsx';
import { SectionHeader, TypeChip, LiveDot, Logo, Photo, StateShape } from './ui.jsx';
import { pics } from '../images.js';
import LeafletMap from './LeafletMap.jsx';
import Rail from './Rail.jsx';
const UsMap = lazy(() => import('./UsMap.jsx'));

export function TopDispensaries() {
  return (
    <section className="sec">
      <div className="wrap">
        <SectionHeader icon={<Pin />} eyebrow="Near you" title="Top dispensaries" sub="Dispensaries in your area, menus checked today." link="View all" to="/dispensaries" arrows={false} />
        <Rail label="dispensaries" auto={3200}>
          {dispensaries.map((d, i) => (
            <Link key={d.slug} to={`/dispensaries/${d.slug}`} className="imcard" data-reveal style={{ '--i': i }}>
              <Photo src={pics.dispensaries[i]} className="imcard-photo" />
              <div className="imcard-top">
                <Logo code={d.code} size={48} />
                <span className="imcard-status"><LiveDot>{d.status}</LiveDot></span>
              </div>
              <div className="imcard-body">
                <div className="imcard-name">{d.name}</div>
                <div className="imcard-meta"><Pin className="ic14" />{d.city} · {d.miles} mi</div>
                <div className="imcard-row">
                  <span className="rating"><Star className="ic14" />{d.rating.toFixed(1)}<span> ({d.reviews})</span></span>
                  <span className="chip">Pickup</span>
                  {d.delivery && <span className="chip">Delivery</span>}
                </div>
                <div className="imcard-cta">
                  <span className="btn sm"><Store />Shop menu</span>
                  <span className="btn ghost sm"><Info className="ic14" />Store info</span>
                </div>
              </div>
            </Link>
          ))}
        </Rail>
      </div>
    </section>
  );
}

export function FeaturedBrands() {
  return (
    <section className="sec">
      <div className="wrap">
        <SectionHeader icon={<Star />} eyebrow="Featured" title="Featured brands" sub="Shop products from top cannabis brands." link="View all brands" to="/brands" arrows={false} />
        <div className="tiles">
          {featureTiles.map((t, i) => (
            <a key={t.title} href="#" className="glass tile" data-reveal style={{ '--i': i }}>
              <div className="tile-copy">
                <span className="eyebrow"><Star />{t.eyebrow}</span>
                <div className="tile-title">{t.title}</div>
                <p className="muted tile-text">{t.text}</p>
                <div className="tile-tags">{t.tags.map((g) => <span key={g} className="chip">{g}</span>)}</div>
                <div className="tile-stat"><strong>{t.menus}</strong><span>live menus near you</span></div>
                <span className="btn ink sm tile-btn">{t.cta}<ChevronRight className="ic14 ic-after" /></span>
              </div>
              <div className="tile-art tile-art-photo">
                <img src={pics.topBrands[i]} alt="" loading="lazy" />
                <span className="tile-badge">{t.initial}</span>
              </div>
            </a>
          ))}
        </div>
        <div className="brand-strip" data-reveal>
          {brands.map((b) => (
            <a key={b.name} href="#" className="glass brand-pill">
              <span className="brand-pill-disc">{b.initial}</span>
              <span>
                <span className="card-title card-title-sm">{b.name}</span>
                <span className="muted card-meta">{b.meta}</span>
              </span>
              <ChevronRight className="ic14 brand-pill-go" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PopularStrains() {
  return (
    <section className="sec sec-last">
      <div className="wrap">
        <SectionHeader icon={<Leaf className="ic14" />} eyebrow="Strains" title="Popular strains" sub="Strains in our database, with type, potency and where they're on the menu." link="Browse all strains" to="/strains" arrows={false} />
        <Rail label="strains">
          {strains.map((s, i) => (
            <a key={s.name} href="#" className={`poster poster-${s.type}`} data-reveal style={{ '--i': i }}>
              <Photo src={pics.strains[i]} className="poster-photo" />
              <div className="poster-top">
                <TypeChip type={s.type} />
                <span className="poster-rank">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="poster-body">
                <div className="poster-name">{s.name}</div>
                <div className="poster-lineage">{s.lineage}</div>
                <div className="poster-effects">{s.effects.map((e) => <span key={e}>{e}</span>)}</div>
                <div className="poster-foot">
                  <span className="poster-thc"><span className="poster-bar"><i style={{ '--v': `${Math.round(s.thc * 3.2)}%` }} /></span>THC {s.thc}%</span>
                  <span className="poster-menus">{s.menus} menus</span>
                </div>
                <span className="poster-cta">Where to buy<ChevronRight className="ic14 ic-after" /></span>
              </div>
            </a>
          ))}
        </Rail>
      </div>
    </section>
  );
}

export function StatesSection() {
  const [hover, setHover] = useState(null);
  const active = useMemo(() => new Set(states), []);
  // The map chunk (~53KB) is only requested once the section is within 600px of the viewport.
  const host = useRef(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (!host.current || typeof IntersectionObserver === 'undefined') { setNear(true); return undefined; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); } }, { rootMargin: '600px 0px' });
    io.observe(host.current);
    return () => io.disconnect();
  }, []);
  return (
    <section className="sec">
      <div className="wrap">
        <SectionHeader icon={<Flag />} eyebrow="By state" title="Dispensaries in" sub="Pick a state to see every menu we check there." link="Browse all states" to="/dispensaries/state" arrows={false} />
        <div className="usmap-grid">
          <div className="glass usmap" data-reveal ref={host}>
            {near ? (
              <Suspense fallback={<div className="usmap-svg" style={{ minHeight: 380 }} />}>
                <UsMap active={active} hover={hover} onHover={setHover} onSelect={setHover} />
              </Suspense>
            ) : <div className="usmap-svg" style={{ minHeight: 380 }} />}
            <div className={`usmap-tip${hover ? ' on' : ''}`} aria-live="polite">
              <StateShape name={hover || states[0]} size={36} />
              <span>
                <span className="card-title">{hover || 'Hover a state'}</span>
                <span className="muted card-meta">{hover ? `${stateCounts[hover].dispensaries.toLocaleString()} dispensaries · ${stateCounts[hover].menus.toLocaleString()} live menus` : '12 states with live menus'}</span>
              </span>
            </div>
            <div className="usmap-legend"><i className="on" />Live menus<i />Coming soon</div>
          </div>
          <ul className="state-list" data-reveal style={{ '--i': 1 }}>
            {states.map((st) => (
              <li key={st}>
                <a
                  href="#"
                  className={`state-row${hover === st ? ' hot' : ''}`}
                  onMouseEnter={() => setHover(st)}
                  onMouseLeave={() => setHover(null)}
                >
                  <span className="state-row-art"><StateShape name={st} size={30} /></span>
                  <span className="state-row-copy">
                    <span className="card-title">{st}</span>
                    <span className="muted card-meta">{stateCounts[st].dispensaries.toLocaleString()} dispensaries</span>
                  </span>
                  <ChevronRight className="ic14 state-go" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function MapSection() {
  return (
    <section className="sec">
      <div className="wrap">
        <SectionHeader
          icon={<Map />}
          eyebrow="Map"
          title="Explore the map"
          sub="Browse dispensaries near you."
          arrows={false}
          action={<Link to="/dispensaries" className="btn ink"><Map />Open the map</Link>}
        />
        <div className="glass map" data-reveal>
          <LeafletMap className="map-live" center={[42.4, -71.35]} zoom={9} points={mapPoints} />
          <Link to="/dispensaries/natures-remedy-tyngsboro" className="glass card map-card">
            <Logo code="NR" size={44} />
            <span>
              <div className="card-title card-title-sm">Nature's Remedy</div>
              <div className="muted card-meta">Tyngsboro, MA · Open now</div>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Education() {
  return (
    <section className="sec">
      <div className="wrap">
        <SectionHeader icon={<Book />} eyebrow="Learn" title="Cannabis education" sub="Tips, strain guides and industry news." link="Read all articles" to="/blog" arrows={false} />
        <div className="edu">
          <a href="#" className="poster edu-feature" data-reveal>
            <Photo src={pics.featuredArticle} className="poster-photo" />
            <div className="poster-top">
              <span className="chip hyb">{featuredArticle.tag}</span>
              <span className="edu-read"><Book className="ic14" />{featuredArticle.meta}</span>
            </div>
            <div className="poster-body">
              <div className="poster-name">{featuredArticle.title}</div>
              <span className="poster-cta">Read the guide<ChevronRight className="ic14 ic-after" /></span>
            </div>
          </a>
          <div className="edu-grid">
            {articles.map((a, i) => (
              <a key={a.title} href="#" className="glass card card-tight" data-reveal style={{ '--i': i + 1 }}>
                <Photo src={pics.articles[i]} className="ph-short" />
                <TypeChip type={a.type} />
                <div className="card-title card-title-sm edu-title">{a.title}</div>
                <div className="muted card-meta">{a.meta}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function OwnerCta() {
  const glow = useRef(null);
  useParallax((y, p) => {
    if (glow.current) glow.current.style.transform = `translate3d(${(-p * 160).toFixed(0)}px, ${(p * 120).toFixed(0)}px, 0)`;
  });
  return (
    <section className="sec sec-last">
      <div className="wrap">
        <div className="dark cta" data-reveal>
          <div className="layer cta-glow" ref={glow} />
          <div className="cta-copy">
            <span className="eyebrow"><User />For owners</span>
            <h2 className="h2 h2-lg">Are you a dispensary or brand owner?</h2>
            <p className="sub">Claim your profile, keep your live menu in sync and reach shoppers nearby.</p>
          </div>
          <div className="cta-actions">
            <a href="#" className="btn">Claim your dispensary</a>
            <a href="#" className="btn ghost">Claim your brand</a>
          </div>
        </div>
      </div>
    </section>
  );
}
