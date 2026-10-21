import { useMemo, useState } from 'react';
import { Link, Navigate, useOutletContext, useParams } from 'react-router-dom';
import { typeLabel } from '../data.js';
import { Pin, Phone, Globe, Star, Clock, Store, ShieldCheck, Truck, Navigate as NavIcon, ChevronLeft, ChevronDown, Tag, Leaf, Info, CreditCard, Banknote, Check } from '../icons.jsx';
import LeafletMap from '../components/LeafletMap.jsx';
import { LiveDot, TypeChip } from '../components/ui.jsx';
import { useReveal } from '../hooks/useReveal.js';
import { find, menuFor, dealsAt, strainsAt, brandsAt, detailsFor } from './search.js';
import { fmtMiles } from './geo.js';
import { Badge, DealRow, StrainRow, BrandRow } from './cards.jsx';

const TODAY = new Date().toLocaleDateString('en-US', { weekday: 'long' });
const CATS = ['Flower', 'Pre-rolls', 'Vapes', 'Edibles', 'Concentrates'];
const TYPES = ['hyb', 'sat', 'ind'];
const SORTS = { price: ['Lowest price', (a, b) => a.price - b.price], thc: ['Highest THC', (a, b) => (b.thc || 0) - (a.thc || 0)], name: ['A to Z', (a, b) => a.name.localeCompare(b.name)] };

// /dispensaries/:slug — one store inside the shell: header, today's deals, the menu with
// category/type filters and sort, strains and brands on the menu, and a side column (map, hours, contact).
export default function DispensaryConceptPage() {
  const { slug } = useParams();
  const { place } = useOutletContext();
  const d = find('dispensaries', slug, place);
  if (!d) return <Navigate to="/dispensaries" replace />;
  // key={slug}: a slug change remounts the body (filter state, side map, reveals).
  return <Store_ key={slug} d={d} details={detailsFor(slug, d)} slug={slug} />;
}

function Store_({ d, details, slug }) {
  const [cat, setCat] = useState('All');
  const [type, setType] = useState(null);
  const [sort, setSort] = useState('price');
  const [week, setWeek] = useState(false);
  const [more, setMore] = useState(false);
  const menu = useMemo(() => menuFor(slug), [slug]);
  const cats = CATS.filter((c) => menu.some((m) => m.category === c));
  const list = useMemo(() => menu
    .filter((m) => cat === 'All' || m.category === cat)
    .filter((m) => !type || m.type === type)
    .sort(SORTS[sort][1]), [menu, cat, type, sort]);
  const deals = dealsAt(slug);
  const strains = strainsAt(slug);
  const brands = brandsAt(slug);
  const today = details.hours.find((h) => h.day === TODAY) || details.hours[0];
  useReveal([cat, type, sort, week]);

  return (
    <div className="dp">
      <nav className="dp-crumbs" aria-label="Breadcrumb"><Link to="/dispensaries"><ChevronLeft className="ic14" />Dispensaries</Link></nav>

      <div className="dp-head" data-reveal>
        <Badge tone="ink" className="dp-badge">{d.code}</Badge>
        <div className="dp-copy">
          <h1 className="dp-title">{d.name}{d.verified && <span className="chip dp-verified"><ShieldCheck className="ic14" />Verified</span>}</h1>
          <div className="dp-meta">
            <span className="rating"><Star className="ic14" />{d.rating.toFixed(1)}<span className="muted"> ({d.reviews})</span></span>
            <span className="dot" /><Pin className="ic14" />{d.city} · {fmtMiles(d.miles)} mi
            <span className="dot" /><LiveDot>{d.status}</LiveDot>
          </div>
          <div className="dp-contact">
            <span><Pin className="ic14" />{details.address}, {details.zip}</span>
            <span><Phone className="ic14" />{details.phone}</span>
            {details.website && <a href={`https://${details.website}`} target="_blank" rel="noreferrer"><Globe className="ic14" />{details.website}<span className="srl"> (opens in a new tab)</span></a>}
          </div>
        </div>
        <div className="dp-actions">
          <a href="#menu" className="btn ink sm"><Store />Shop menu</a>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}`} target="_blank" rel="noreferrer" className="btn ghost sm"><NavIcon />Directions<span className="srl"> (opens in a new tab)</span></a>
        </div>
      </div>

      <div className="dp-grid">
        <main className="dp-main">
          {deals.length > 0 && (
            <section className="dp-sec" data-reveal>
              <h2 className="dp-h2"><Tag className="ic18" />Today's deals<span className="dcount">{deals.length}</span></h2>
              <div className="dp-rows">{deals.map((x, i) => <DealRow key={x.slug} d={x} i={i} />)}</div>
            </section>
          )}

          <section className="dp-sec" id="menu" data-reveal style={{ '--i': 1 }}>
            <h2 className="dp-h2"><Store className="ic18" />Menu<span className="dcount">{list.length}</span><LiveDot className="dp-live">Live · checked this morning</LiveDot></h2>
            <div className="dp-filters">
              <div className="finder-chips" role="group" aria-label="Category">
                {['All', ...cats].map((c) => <button key={c} type="button" className={`chip-btn${cat === c ? ' on' : ''}`} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
              </div>
              <div className="finder-chips" role="group" aria-label="Type">
                {TYPES.map((t) => <button key={t} type="button" className={`chip-btn soft${type === t ? ' on' : ''}`} aria-pressed={type === t} onClick={() => setType(type === t ? null : t)}>{typeLabel[t]}</button>)}
              </div>
              <label className="sort"><span className="srl">Sort</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)}>{Object.entries(SORTS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select>
              </label>
            </div>
            <div className="dp-rows">
              {list.map((m, i) => (
                <div key={m.slug} className="frow menu-row" data-reveal style={{ '--i': i % 8 }}>
                  {m.pct ? <Badge tone="teal">-{m.pct}%</Badge> : <Badge tone={m.type || 'mint'}>{m.category[0]}</Badge>}
                  <span className="frow-copy">
                    <span className="frow-title">{m.name}</span>
                    <span className="frow-meta">{m.meta}{m.type && <><span className="dot" /><TypeChip type={m.type} small /></>}</span>
                  </span>
                  <span className="menu-buy">
                    <span className="price"><strong>${m.price}</strong>{m.was && <s>${m.was}</s>}</span>
                    {typeof m.thc === 'number' && <span className="thc">THC {m.thc}%</span>}
                    <button type="button" className="btn sm menu-add" aria-label={`Add ${m.name}`}><Check className="ic14" />Add</button>
                  </span>
                </div>
              ))}
              {list.length === 0 && <div className="finder-empty"><Leaf className="ic24" /><strong>{menu.length ? 'Nothing in this category today.' : 'This store has not published a live menu yet.'}</strong></div>}
            </div>
          </section>

          {strains.length > 0 && (
            <section className="dp-sec" data-reveal style={{ '--i': 2 }}>
              <h2 className="dp-h2"><Leaf className="ic18" />Strains on the menu<span className="dcount">{strains.length}</span></h2>
              <div className="dp-rows">{strains.map((s, i) => <StrainRow key={s.slug} s={s} i={i} />)}</div>
            </section>
          )}

          {brands.length > 0 && (
            <section className="dp-sec" data-reveal style={{ '--i': 3 }}>
              <h2 className="dp-h2"><Star className="ic18" />Brands on the shelf<span className="dcount">{brands.length}</span></h2>
              <div className="dp-rows">{brands.map((b, i) => <BrandRow key={b.slug} b={b} i={i} />)}</div>
            </section>
          )}

          {details.about.length > 0 && <section className="dp-sec" data-reveal style={{ '--i': 4 }}>
            <h2 className="dp-h2"><Info className="ic18" />About {d.name}</h2>
            <div className={`dabout${more ? ' open' : ''}`}>{details.about.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}</div>
            {details.about.length > 1 && <button type="button" className="link link-sm dmore" onClick={() => setMore((v) => !v)}>{more ? 'Show less' : 'Read more'}<ChevronDown className={`ic14 ic-after${more ? ' flip' : ''}`} /></button>}
          </section>}
        </main>

        <aside className="dp-side">
          <div className="dp-card dp-map" data-reveal>
            <LeafletMap className="dp-leaflet" tiles="streets" pins="dom" center={[d.lat, d.lng]} zoom={13} interactive={false} eager points={[d]} ariaLabel={`Map of ${d.name}`} />
          </div>
          <div className="dp-card" data-reveal style={{ '--i': 1 }}>
            <h2 className="dp-h3"><Clock className="ic18" />Hours</h2>
            <ul className={`dhours${week ? ' open' : ''}`}>
              {details.hours.map((h) => <li key={h.day} className={h.day === today.day ? 'today' : ''}><span>{h.day}{h.day === today.day && <span className="chip chip-sm">Today</span>}</span><span>{h.open} – {h.close}</span></li>)}
            </ul>
            <button type="button" className="link link-sm dmore" onClick={() => setWeek((v) => !v)}>{week ? 'Hide week' : 'Show full week'}<ChevronDown className={`ic14 ic-after${week ? ' flip' : ''}`} /></button>
          </div>
          <div className="dp-card" data-reveal style={{ '--i': 2 }}>
            <h2 className="dp-h3"><Store className="ic18" />Services</h2>
            <div className="dp-chips">
              <span className="chip"><Store className="ic14" />Pickup</span>
              {d.delivery && <span className="chip"><Truck className="ic14" />Delivery</span>}
              {d.verified && <span className="chip"><ShieldCheck className="ic14" />Verified</span>}
              {details.amenities.map((a) => <span key={a} className="chip">{/card/i.test(a) ? <CreditCard className="ic14" /> : <Banknote className="ic14" />}{a}</span>)}
            </div>
          </div>
          <div className="dp-card" data-reveal style={{ '--i': 3 }}>
            <h2 className="dp-h3"><Pin className="ic18" />Contact</h2>
            <ul className="dcontact">
              <li><Pin className="ic14" /><span>{details.address}<span className="muted">{details.zip}</span></span></li>
              <li><Phone className="ic14" /><span>{details.phone}</span></li>
              <li><Globe className="ic14" /><span>{details.website}</span></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
