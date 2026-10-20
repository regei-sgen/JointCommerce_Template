import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { allDispensaries } from '../listingData.js';
import { site } from '../data.js';
import { pics } from '../images.js';
import { Pin, Star, Store, Search, Truck, ShieldCheck, Clock, ChevronRight, Map } from '../icons.jsx';
import ListHeader from '../components/ListHeader.jsx';
import LeafletMap from '../components/LeafletMap.jsx';
import { Logo, LiveDot, Photo } from '../components/ui.jsx';
import { Footer } from '../components/Footer.jsx';
import { useReveal } from '../hooks/useReveal.js';

const FILTERS = [
  { key: 'open', label: 'Open now', icon: Clock, test: (d) => d.open },
  { key: 'delivery', label: 'Delivery', icon: Truck, test: (d) => d.delivery },
  { key: 'verified', label: 'Verified', icon: ShieldCheck, test: (d) => d.verified },
];
const SORTS = { nearest: (a, b) => a.miles - b.miles, rated: (a, b) => b.rating - a.rating, stocked: (a, b) => b.products - a.products };

export default function DispensariesPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('nearest');
  const [hover, setHover] = useState(null);
  const active = new Set(params.getAll('type'));
  const toggle = (k) => {
    const next = new Set(active);
    next.has(k) ? next.delete(k) : next.add(k);
    setParams({ type: [...next] });
  };
  const list = useMemo(() => allDispensaries
    .filter((d) => FILTERS.every((f) => !active.has(f.key) || f.test(d)))
    .filter((d) => !q || (d.name + ' ' + d.city).toLowerCase().includes(q.toLowerCase()))
    .sort(SORTS[sort]), [params, q, sort]);
  useReveal([list.length, sort]);
  const focus = hover ? list.find((d) => d.slug === hover) : null;

  return (
    <>
      <ListHeader
        bg="map" center={[42.3, -71.5]} zoom={9} points={allDispensaries.slice(0, 7)}
        crumbs={[{ label: 'Dispensaries' }]}
        eyebrow={<><Store />Dispensaries</>}
        title="Every dispensary with a live menu"
        sub="Menus checked this morning. Filter by what matters, then shop the menu or get directions."
        stats={[{ value: allDispensaries.length, label: 'near you' }, { value: site.openNow, label: 'open now' }, { value: site.menusCheckedToday.toLocaleString(), label: 'menus checked' }]}
      >
        <form className="lhead-search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="dq" className="srl">Search dispensaries</label>
          <div className="field"><Search className="ic18" /><input id="dq" type="text" placeholder="Search by name or city" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </form>
      </ListHeader>

      <div className="filterbar">
        <div className="wrap filterbar-inner">
          <div className="filterbar-chips">
            {FILTERS.map(({ key, label, icon: Ic }) => (
              <button key={key} type="button" className={`chip-btn${active.has(key) ? ' on' : ''}`} aria-pressed={active.has(key)} onClick={() => toggle(key)}><Ic className="ic14" />{label}</button>
            ))}
          </div>
          <div className="filterbar-right">
            <span className="muted filterbar-count">{list.length} result{list.length === 1 ? '' : 's'}</span>
            <label className="sort"><span>Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="nearest">Nearest</option><option value="rated">Top rated</option><option value="stocked">Most products</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <section className="sec sec-last">
        <div className="wrap dsplit">
          <div className="dsplit-list">
            {list.length === 0 && <div className="glass card empty"><Map className="ic24" /><strong>No dispensaries match.</strong><span className="muted">Clear a filter or try another city.</span></div>}
            <div className="dgrid2">
              {list.map((d, i) => (
                <Link
                  key={d.slug} to={`/dispensaries/${d.slug}`} className={`imcard${hover === d.slug ? ' hot' : ''}`} data-reveal style={{ '--i': i % 6 }}
                  onMouseEnter={() => setHover(d.slug)} onMouseLeave={() => setHover(null)}
                >
                  <Photo src={pics.dispensaries[i % pics.dispensaries.length]} className="imcard-photo" />
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
                      {d.verified && <span className="chip"><ShieldCheck className="ic14" />Verified</span>}
                    </div>
                    <div className="imcard-cta"><span className="btn sm"><Store />Shop menu</span><span className="imcard-count">{d.products} products</span></div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <aside className="dsplit-map">
            <div className="glass map map-sticky" data-reveal>
              <LeafletMap key={list.map((d) => d.slug).join('|')} className="map-live" center={[42.3, -71.5]} zoom={8} points={list} focus={focus ? { lat: focus.lat, lng: focus.lng } : undefined} focusZoom={11} />
              <div className="map-legend"><i />{list.length} on the map<Link to="/dispensaries/state" className="link link-sm">By state<ChevronRight className="ic14 ic-after" /></Link></div>
            </div>
          </aside>
        </div>
      </section>
      <Footer />
    </>
  );
}
