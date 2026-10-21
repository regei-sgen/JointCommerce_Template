import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import LeafletMap from '../components/LeafletMap.jsx';
import { useReveal } from '../hooks/useReveal.js';
import { Map as MapIcon, ChevronLeft, Store, Pin } from '../icons.jsx';
import { search, find, stockedAt, catInfo, FILTERS, SORTS, defaultSort, itemLink, DATA, emptyFilters } from './search.js';
import { ResultRow, DispensaryRow, ItemBadge, itemSubtitle } from './cards.jsx';

// List + map for one category. State lives in the URL: q (text), f (filter keys, repeatable),
// sort, sel (selected item slug → the panel lists the dispensaries that carry it).
export default function Finder({ cat, place, home = false }) {
  const loc = place.name;
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const sel = params.get('sel');
  const sortParam = params.get('sort');
  const sort = sortParam && Object.hasOwn(SORTS[cat], sortParam) ? sortParam : defaultSort(cat);
  const filters = params.getAll('f');
  const set = (patch) => {
    const n = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      n.delete(k);
      if (Array.isArray(v)) v.forEach((x) => n.append(k, x));
      else if (v) n.set(k, v);
    }
    setParams(n);
  };
  const toggleFilter = (k) => set({ f: filters.includes(k) ? filters.filter((x) => x !== k) : [...filters, k] });

  const all = useMemo(() => search(q, cat, { filters, sort, origin: place })[cat], [q, cat, filters.join('|'), sort, place]); // eslint-disable-line react-hooks/exhaustive-deps
  // Rows and pins render in pages of PAGE; the heading still counts everything.
  const PAGE = 60;
  const [limit, setLimit] = useState(PAGE);
  useEffect(() => { setLimit(PAGE); }, [q, cat, sort, filters.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  const list = useMemo(() => all.slice(0, limit), [all, limit]);
  const navigate = useNavigate();
  const selected = sel ? find(cat, sel, place) : null;
  // An unknown `sel` is dropped from the URL instead of riding along on every later change.
  useEffect(() => { if (sel && !selected) set({ sel: null }); }, [sel, selected]); // eslint-disable-line react-hooks/exhaustive-deps
  const storesOf = useMemo(() => new Map(list.map((it) => [it.slug, stockedAt(cat, it, place)])), [list, cat, place]);
  const stores = selected ? stockedAt(cat, selected, place) : null;

  const points = useMemo(() => {
    if (stores) return stores;
    if (cat === 'dispensaries') return list;
    const seen = new Map();
    list.forEach((it) => storesOf.get(it.slug).forEach((d) => seen.set(d.slug, d)));
    return [...seen.values()];
  }, [stores, cat, list, storesOf]);

  const [hover, setHover] = useState(null);
  useReveal([cat, q, sel, sort, filters.join('|'), list.length]);

  // Hovered row → marker keys to light up; a single store also gets the camera.
  let hot = null;
  let focus;
  if (hover) {
    if (stores || cat === 'dispensaries') hot = hover;
    else hot = (storesOf.get(hover) || []).map((d) => d.slug);
    const keys = Array.isArray(hot) ? hot : [hot];
    if (keys.length === 1) {
      const d = points.find((p) => p.slug === keys[0]);
      if (d) focus = { lat: d.lat, lng: d.lng };
    }
  }

  const info = catInfo(cat);
  const liveMenus = useMemo(() => (cat === 'products' ? DATA.dispensaries.filter((d) => d.menu || d.products > 0).length : 0), [cat, DATA.loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  const mapKey = `${cat}|${sel || ''}|${points.map((p) => p.slug).sort().join(',')}`;
  const n = selected ? stores.length : all.length;

  return (
    <section className={`finder${home ? ' finder-home' : ''}`} aria-label={`${info.label} near ${loc}`}>
      <div className="finder-panel">
        <div className="finder-head">
          {selected ? (
            <>
              <button type="button" className="finder-back" onClick={() => set({ sel: null })}><ChevronLeft className="ic14" />All {info.label.toLowerCase()}</button>
              <div className="finder-sel">
                <ItemBadge cat={cat} item={selected} />
                <div className="finder-sel-copy">
                  <h2 className="finder-title">{selected.name}</h2>
                  <p className="finder-sub">{itemSubtitle(cat, selected)}</p>
                </div>
              </div>
              {cat === 'brands' && <BrandDetail b={selected} />}
              <p className="finder-sub"><Store className="ic14" /> Where to buy · <em>{n}</em> {n === 1 ? 'dispensary' : 'dispensaries'} near {loc}</p>
            </>
          ) : (
            <>
              <h2 className="finder-title"><em>{n}</em> {n === 1 ? info.one : info.label.toLowerCase()} near {loc}{q && <> for “{q}”</>}</h2>
              <div className="finder-tools">
                <div className="finder-chips" role="group" aria-label="Filters">
                  {FILTERS[cat].map(([k, label]) => (
                    <button key={k} type="button" className={`chip-btn${filters.includes(k) ? ' on' : ''}`} aria-pressed={filters.includes(k)} onClick={() => toggleFilter(k)}>{label}</button>
                  ))}
                </div>
                <label className="sort"><span className="srl">Sort</span>
                  <select value={sort} onChange={(e) => set({ sort: e.target.value === defaultSort(cat) ? null : e.target.value })}>
                    {Object.entries(SORTS[cat]).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}
                  </select>
                </label>
              </div>
            </>
          )}
        </div>
        <div className="finder-list">
          {selected ? (
            stores.length ? stores.map((d, i) => <DispensaryRow key={d.slug} d={d} i={i} hot={hover === d.slug} onHover={setHover} />)
              : <Empty text="No dispensary near you lists this yet." />
          ) : list.length ? (
            <>
              {list.map((item, i) => <ResultRow key={item.slug} cat={cat} item={item} i={i} hot={hover === item.slug} onHover={setHover} />)}
              {all.length > list.length && <button type="button" className="finder-more" onClick={() => setLimit((l) => l + PAGE)}>Show {Math.min(PAGE, all.length - list.length)} more<span className="muted"> · {list.length} of {all.length}</span></button>}
            </>
          ) : (
            <Empty text={emptyCopy(cat, info, q, filters)}>
              {cat === 'products' && liveMenus > 0 && <Link to="/dispensaries?f=menu" className="link link-sm">{liveMenus.toLocaleString()} dispensaries have a live menu</Link>}
              {(q || filters.length > 0) && <Link to={`/${cat}`} className="link link-sm">Clear search and filters</Link>}
            </Empty>
          )}
        </div>
      </div>
      <div className="finder-map">
        <LeafletMap
          key={mapKey} className="finder-leaflet" tiles="brand" pins="dom" eager fit fitControl globeBelow={4} wheel={!home}
          onSelect={(pt) => navigate(itemLink('dispensaries', pt))}
          center={[42.3, -71.5]} zoom={8} points={points} hot={hot} focus={focus} focusMode="ensure" flyDuration={0.7}
          ariaLabel={`Map of ${info.label.toLowerCase()} near ${loc}`}
        />
        <div className="finder-legend"><i />{points.length} on the map<span className="muted"> · <Pin className="ic14" />{loc}</span></div>
      </div>
    </section>
  );
}

// Empty-list copy: no rows in the category, a chip that no row in the data satisfies, a text miss, or a filter miss.
function emptyCopy(cat, info, q, filters) {
  const label = info.label.toLowerCase();
  if (DATA[cat].length === 0) return `No ${label} published yet.`;
  const none = emptyFilters(cat, filters);
  if (none.length) { const names = none.map((k) => FILTERS[cat].find(([key]) => key === k)[1].toLowerCase()); return `No ${label} offer ${names.join(' and ')} yet.`; }
  return q ? `Nothing matches “${q}”. Try another word or clear a filter.` : 'Nothing matches these filters.';
}

// Brand facts from the snapshot: first About paragraph, outbound links, parent and child brands.
const SOCIAL = [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['twitter', 'X'], ['youtube', 'YouTube'], ['linkedin', 'LinkedIn']];
function BrandDetail({ b }) {
  const about = (b.about && b.about[0]) || b.blurb || '';
  const links = [b.website ? ['Website', b.website] : null, ...SOCIAL.map(([k, label]) => (b.social && b.social[k] ? [label, b.social[k]] : null))].filter(Boolean);
  const kin = [...(b.parent ? [{ ...b.parent, rel: 'Part of' }] : []), ...((b.children || []).map((c) => ({ ...c, rel: 'Also' })))];
  if (!about && !links.length && !kin.length) return null;
  return (
    <div className="finder-brand">
      {about && <p className="finder-about">{about}</p>}
      {links.length > 0 && (
        <p className="finder-links">
          {links.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="chip chip-sm">{label}</a>)}
        </p>
      )}
      {kin.length > 0 && (
        <p className="finder-links">
          {kin.map((k) => <Link key={k.slug} to={itemLink('brands', k)} className="chip chip-sm"><span className="muted">{k.rel}</span>{k.name}</Link>)}
        </p>
      )}
    </div>
  );
}

function Empty({ text, children }) {
  return (
    <div className="finder-empty">
      <MapIcon className="ic24" />
      <strong>{text}</strong>
      {children}
    </div>
  );
}
