import { useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { allArticles } from '../listingData.js';
import { Store, Star, Tag, Leaf, ChevronRight, ShieldCheck, Clock, Pin, Book, Map as MapIcon } from '../icons.jsx';
import { LiveDot, TypeChip } from '../components/ui.jsx';
import { typeLabel } from '../data.js';
import { useReveal } from '../hooks/useReveal.js';
import { search, itemLink, isDemo, openNow, DATA } from './search.js';
import { fmtMiles, placePath, topPlaces, topStates, statePath } from './geo.js';
import { Badge } from './cards.jsx';
import { CAT_ICONS } from './catIcons.jsx';
import { useCart } from './cart.jsx';
import ScrollRow from './ScrollRow.jsx';

// Card header for a store: the 2×2 block of Esri street tiles around its coordinates at zoom 14, offset so the
// store sits at the header's centre, with a pin there. Without coordinates the header is the plain ink gradient.
const TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile';
const MM_ZOOM = 14;
function MiniMap({ lat, lng, children }) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return <span className="hm-ph">{children}</span>;
  const n = 2 ** MM_ZOOM;
  const fx = ((lng + 180) / 360) * n;
  const r = (lat * Math.PI) / 180;
  const fy = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n;
  // The 2×2 block starts one tile back on an axis when the point is in that tile's first half, so the point
  // always lies 128–384px into the 512px block and a centred 236×128 window stays inside it.
  const tx0 = Math.floor(fx) - (fx % 1 < 0.5 ? 1 : 0);
  const ty0 = Math.floor(fy) - (fy % 1 < 0.5 ? 1 : 0);
  const px = Math.round((fx - tx0) * 256);
  const py = Math.round((fy - ty0) * 256);
  const tiles = [[0, 0], [1, 0], [0, 1], [1, 1]];
  return (
    <span className="hm-ph hm-mm">
      <span className="hm-mm-tiles" style={{ marginLeft: -px, marginTop: -py }} aria-hidden="true">
        {tiles.map(([dx, dy]) => <img key={`${dx}${dy}`} src={`${TILE_URL}/${MM_ZOOM}/${ty0 + dy}/${tx0 + dx}`} alt="" loading="lazy" decoding="async" style={{ left: dx * 256, top: dy * 256 }} onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />)}
      </span>
      <span className="hm-mm-pin" aria-hidden="true" />
      {children}
    </span>
  );
}

// Card header for a deal: a colour panel per product category with that category's icon as a watermark.
const DEAL_TONE = { Flower: 'flower', 'Pre-rolls': 'preroll', Vapes: 'vape', Edibles: 'edible', Concentrates: 'conc' };
function DealArt({ category, children }) {
  const Ic = CAT_ICONS[category] || CAT_ICONS.All;
  return (
    <span className={`hm-ph hm-art c-${DEAL_TONE[category] || 'all'}`}>
      <Ic className="hm-art-ic" />
      {children}
    </span>
  );
}

const CATS = [
  { label: 'Flower', to: '/products?f=flower' },
  { label: 'Pre-rolls', to: '/products?f=pre-rolls' },
  { label: 'Vapes', to: '/products?f=vapes' },
  { label: 'Edibles', to: '/products?f=edibles' },
  { label: 'Concentrates', to: '/products?f=concentrates' },
  { label: 'All', text: 'All products', to: '/products' },
];
const STRAIN_TYPES = ['ind', 'sat', 'hyb'];

const Row = ScrollRow;

// Rating only when the store has reviews; status only when the snapshot has the store's hours.
function StoreFacts({ d }) {
  const status = openNow(d.slug);
  return (
    <>
      <span className="hm-card-meta"><Pin className="ic14" />{d.city}{d.reviews > 0 && <><span className="dot" /><span className="rating"><Star className="ic14" />{d.rating.toFixed(1)}</span></>}</span>
      <span className="hm-card-foot">{status ? <LiveDot off={!status.open}>{status.label}</LiveDot> : d.menu ? <span className="chip chip-sm"><Store className="ic14" />Live menu</span> : <span className="muted small">{d.type || 'Dispensary'}</span>}</span>
    </>
  );
}

// Home: two promo tiles, a cart reminder, category and strain-type tiles, brands, dispensaries, live
// menus, deals, strains, effects, cities, states and guides, all relative to the chosen place.
export default function HomePage() {
  const { place } = useOutletContext();
  const cart = useCart();
  useReveal();
  const res = search('', 'all', { origin: place });
  const stores = res.dispensaries.slice(0, 8);
  const live = res.dispensaries.filter((d) => d.menu || d.products > 0).slice(0, 8);
  const brands = res.brands.slice(0, 8);
  const tonight = res.deals.filter((d) => d.ends === 'Tonight');
  const deals = [...tonight, ...res.deals.filter((d) => d.ends !== 'Tonight')].slice(0, 8);
  // Strains: the ranked list (most menus first) with plausible THC, skipping very short names (those collide
  // with the sample menus' flavour words), alternating indica, sativa and hybrid.
  const strains = useMemo(() => {
    const ok = res.strains.filter((s) => s.thc > 0 && s.thc <= 40 && s.name.length >= 7);
    const lists = ['ind', 'sat', 'hyb'].map((t) => ok.filter((s) => s.type === t));
    const picked = [];
    for (let i = 0; picked.length < 8 && lists.some((l) => l.length); i++) { const l = lists[i % 3]; if (l.length) picked.push(l.shift()); }
    return picked;
  }, [res.strains]);
  const effects = useMemo(() => {
    const n = new Map();
    for (const s of DATA.strains) for (const e of s.effects || []) n.set(e, (n.get(e) || 0) + 1);
    return [...n.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [DATA.loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  const typeCounts = useMemo(() => DATA.strains.reduce((a, s) => { a[s.type] = (a[s.type] || 0) + 1; return a; }, {}), [DATA.loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  const cities = topPlaces(10);
  const states = topStates(10);
  const top = stores[0];
  const bestDeal = deals.reduce((a, b) => (b.pct > (a?.pct || 0) ? b : a), null);
  const cartStore = cart && cart.items.length ? cart.items[0] : null;
  const guides = allArticles.slice(0, 6);

  return (
    <div className="hm">
      <section className="hm-banners" data-reveal>
        {bestDeal ? (
          <Link to="/deals" className="hm-banner hm-banner-ink">
            <span className="hm-banner-kicker"><Tag className="ic14" />{tonight.length > 0 ? `${tonight.length.toLocaleString()} deals end tonight` : `Deals near ${place.name}`}</span>
            <span className="hm-banner-title">Up to {bestDeal.pct}% off today</span>
            <span className="hm-banner-text">{res.deals.length.toLocaleString()} deals {isDemo() ? 'in the sample menus' : 'read straight from live menus'}.</span>
            <span className="btn sm hm-banner-btn">Shop deals<ChevronRight className="ic14 ic-after" /></span>
          </Link>
        ) : (
          <Link to="/dispensaries" className="hm-banner hm-banner-ink">
            <span className="hm-banner-kicker"><Store className="ic14" />Dispensaries near {place.name}</span>
            <span className="hm-banner-title">{res.dispensaries.length.toLocaleString()} dispensaries on the map</span>
            <span className="hm-banner-text">Hours, delivery, pickup and reviews for every listing, nearest first.</span>
            <span className="btn sm hm-banner-btn">Open the map<ChevronRight className="ic14 ic-after" /></span>
          </Link>
        )}
        {top && (
          <Link to={itemLink('dispensaries', top)} className="hm-banner hm-banner-light">
            <span className="hm-banner-kicker"><Star className="ic14" />Featured dispensary</span>
            <span className="hm-banner-title">{top.name}</span>
            <span className="hm-banner-text"><Pin className="ic14" />{top.city} · {fmtMiles(top.miles)} mi{top.reviews > 0 && <><span className="dot" /><Star className="ic14" />{top.rating.toFixed(1)}</>}{top.menu && <><span className="dot" />Live menu</>}</span>
            <span className="btn ink sm hm-banner-btn"><Store />Shop menu</span>
            <Badge tone="ink" className="hm-banner-badge">{top.code}</Badge>
          </Link>
        )}
      </section>

      {cartStore && (
        <section className="hm-recall" data-reveal>
          <span className="hm-recall-copy"><span className="hm-recall-ic"><Store className="ic14" /></span><strong>{cart.count} {cart.count === 1 ? 'item' : 'items'}</strong> in your cart{cartStore.store && <> from {cartStore.store}</>}.</span>
          <span className="hm-recall-actions">
            {cartStore.storeSlug && <Link to={`/dispensaries/${cartStore.storeSlug}#menu`} className="btn sm ink">Continue your order</Link>}
            <button type="button" className="btn sm ghost" onClick={cart.openCart}>View cart</button>
          </span>
        </section>
      )}

      <ScrollRow title="Browse by category" className="hm-cats">
        {CATS.map((c) => { const Ic = CAT_ICONS[c.label]; return (
          <Link key={c.label} to={c.to} className="hm-cat hm-cat-lead"><span className="hm-cat-ic"><Ic className="cat-glyph" /></span><span>{c.text || c.label}</span></Link>
        ); })}
      </ScrollRow>

      <ScrollRow title="Browse strains" to="/strains" className="hm-cats hm-types">
        {STRAIN_TYPES.map((t) => (
          <Link key={t} to={`/strains?f=${t}`} className="hm-cat hm-cat-lead"><span className="hm-cat-ic"><Badge tone={t} className="hm-cat-bd">{typeLabel[t][0]}</Badge></span><span>{typeLabel[t]}<span className="hm-cat-n">{(typeCounts[t] || 0).toLocaleString()} strains</span></span></Link>
        ))}
        {effects.map(([e, n]) => (
          <Link key={e} to={`/strains?q=${encodeURIComponent(e)}`} className="hm-cat hm-cat-soft"><span>{e}<span className="hm-cat-n">{n.toLocaleString()} strains</span></span></Link>
        ))}
      </ScrollRow>

      {brands.length > 0 && <Row title="Brands" to="/brands">
        {brands.map((b) => (
          <Link key={b.slug} to={itemLink('brands', b)} className="hm-tile">
            <span className={`hm-tile-art hm-art-${(b.pic || 0) % 4}${b.logo ? ' hm-art-logo' : ''}`}>
              <span className="hm-tile-initial">{b.initial}</span>
              {b.logo && <img className="hm-tile-logo" src={b.logo} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.remove(); }} />}
            </span>
            <span className="hm-tile-name">{b.name}</span>
            <span className="hm-tile-meta"><Tag className="ic14" />{b.type || b.category}{b.states && b.states[0] && <><span className="dot" />{b.states.length > 2 ? `${b.states.length} states` : b.states.join(', ')}</>}</span>
          </Link>
        ))}
      </Row>}

      <Row title={`Dispensaries near ${place.name}`} to="/dispensaries">
        {stores.map((d) => (
          <Link key={d.slug} to={itemLink('dispensaries', d)} className="hm-card hm-card-ph">
            <MiniMap lat={d.lat} lng={d.lng}>
              {d.featured && <span className="hm-ph-tag"><Star className="ic14" />Featured</span>}
              <span className="hm-ph-pill">{fmtMiles(d.miles)} mi</span>
            </MiniMap>
            <Badge tone="ink" className="hm-ph-bd">{d.code}</Badge>
            <span className="hm-card-body hm-body-bd">
              <span className="hm-card-name">{d.name}{d.verified && <ShieldCheck className="ic14 frow-verified" />}</span>
              <StoreFacts d={d} />
            </span>
          </Link>
        ))}
      </Row>

      {live.length > 0 && <Row title="Order ahead: live menus near you" to="/dispensaries?f=menu">
        {live.map((d) => (
          <Link key={d.slug} to={`${itemLink('dispensaries', d)}#menu`} className="hm-card hm-card-ph">
            <MiniMap lat={d.lat} lng={d.lng}>
              <span className="hm-ph-tag"><Store className="ic14" />{d.products > 0 ? `${d.products} products` : `Live on ${d.menu}`}</span>
              <span className="hm-ph-pill">{fmtMiles(d.miles)} mi</span>
            </MiniMap>
            <Badge tone="ink" className="hm-ph-bd">{d.code}</Badge>
            <span className="hm-card-body hm-body-bd">
              <span className="hm-card-name">{d.name}</span>
              <StoreFacts d={d} />
            </span>
          </Link>
        ))}
      </Row>}

      {deals.length > 0 && <Row title={tonight.length > 0 ? 'Deals ending tonight' : 'Deals today'} to="/deals">
        {deals.map((d) => (
          <Link key={d.slug} to={itemLink('deals', d)} className="hm-card hm-card-ph">
            <DealArt category={d.category}>
              {d.pct > 0 && <span className="hm-ph-pct">-{d.pct}%</span>}
              <span className={`hm-ph-pill${d.ends === 'Tonight' ? ' soon' : ''}`}><Clock className="ic14" />{d.ends === 'Tonight' ? 'Ends tonight' : d.ends}</span>
            </DealArt>
            <span className="hm-card-body">
              <span className="hm-card-name">{d.name}</span>
              <span className="hm-card-meta">{d.meta}</span>
              <span className="hm-card-foot"><span className="price hm-price"><strong>${d.price}</strong>{d.was && <s>${d.was}</s>}</span><span className="muted small"><Store className="ic14" />{d.store}</span></span>
            </span>
          </Link>
        ))}
      </Row>}

      <Row title="Strains" to="/strains">
        {strains.map((s) => (
          <Link key={s.slug} to={itemLink('strains', s)} className="hm-card hm-card-ph">
            <span className={`hm-band t-${s.type}`}><TypeChip type={s.type} small /><span className="hm-band-letter" aria-hidden="true">{s.name[0]}</span><Leaf className="hm-band-leaf" /></span>
            <span className="hm-card-body">
              <span className="hm-card-name">{s.name}</span>
              <span className="hm-card-meta">{s.lineage}</span>
              <span className="hm-thc" aria-label={`THC ${s.thc}%`}><span className="hm-thc-bar"><i style={{ width: `${Math.min(100, Math.round((s.thc / 35) * 100))}%` }} /></span><span className="hm-thc-n">THC {s.thc}%</span></span>
              {s.effects && s.effects[0] && <span className="hm-chips">{s.effects.slice(0, 2).map((e) => <span key={e} className="chip chip-sm">{e}</span>)}</span>}
            </span>
          </Link>
        ))}
      </Row>

      {cities.length > 0 && <Row title="Browse by city" to="/dispensaries" className="hm-places">
        {cities.map((c) => (
          <Link key={c.name} to={`/dispensaries${placePath(c)}`} className="hm-place">
            <span className="hm-place-ic"><MapIcon className="ic18" /></span>
            <span className="hm-place-copy"><span className="hm-place-name">{c.name}</span><span className="hm-place-n">{c.count.toLocaleString()} dispensaries</span></span>
          </Link>
        ))}
      </Row>}

      {states.length > 0 && <Row title="Browse by state" to="/dispensaries" className="hm-places">
        {states.map((s) => (
          <Link key={s.abbr} to={`/dispensaries${statePath(s)}`} className="hm-place">
            <span className="hm-place-ic hm-place-ab">{s.abbr}</span>
            <span className="hm-place-copy"><span className="hm-place-name">{s.name}</span><span className="hm-place-n">{s.count.toLocaleString()} dispensaries</span></span>
          </Link>
        ))}
      </Row>}

      <Row title="Learn" to="/learn">
        {guides.map((a) => (
          <Link key={a.title} to="/learn" className="hm-card hm-card-ph hm-guide">
            <span className={`hm-band t-${a.type}`}><span className="chip chip-sm hm-band-kind"><Book className="ic14" />{a.kind}</span><span className="hm-band-letter" aria-hidden="true">{a.title[0]}</span></span>
            <span className="hm-card-body">
              <span className="hm-card-name">{a.title}</span>
              <span className="hm-card-foot"><TypeChip type={a.type} small /><span className="muted small">{a.meta}</span></span>
            </span>
          </Link>
        ))}
      </Row>

      <footer className="cx-foot">
        <span>© 2026 JointCommerce{isDemo() && <> · Sample menus and deals for testing</>} · Map tiles © Esri</span>
        <span><Link to="/learn">Learn</Link><Link to="/dispensaries">Dispensaries</Link><Link to="/brands">Brands</Link><Link to="/strains">Strains</Link></span>
      </footer>
    </div>
  );
}
