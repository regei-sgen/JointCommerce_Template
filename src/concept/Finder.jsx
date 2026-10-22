import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import LeafletMap from '../components/LeafletMap.jsx';
import Wordmark from '../components/Wordmark.jsx';
import { useMedia, useViewportHeight, useMapType } from './useMedia.js';
import { useReveal } from '../hooks/useReveal.js';
import { Map as MapIcon, ChevronLeft, ChevronRight, Store, Pin, Close, Navigate as NavIcon, Search, Clock, Sparkle, Tag } from '../icons.jsx';
import { search, find, stockedAt, stockSlugs, catInfo, FILTERS, SORTS, defaultSort, itemLink, DATA, emptyFilters, storeBySlug, located, withSales } from './search.js';
import { ResultRow, DispensaryRow, ItemBadge, itemSubtitle } from './cards.jsx';
import { AddButton } from './cart.jsx';
import { ShareButton } from './share.jsx';
import { milesBetween, fmtMiles } from './geo.js';

// List + map for one category. State lives in the URL: q (text), f (filter keys, repeatable),
// sort, sel (selected item slug → the panel lists the dispensaries that carry it).
//
// Map mode adds a viewport scope: after each drag or zoom the map reports the uncovered area and the list
// becomes the results inside it (auto-update on, the default) or waits behind a "Search this area" pill
// (auto-update off). A pin click highlights and scrolls to its row; a dashed ring marks the searched radius;
// a picks strip lists deals and lowest prices from the menus of the stores in view.
const PAGE = 60; // rows and pins render in pages of PAGE; the heading still counts everything
const CAP = 200; // most pins drawn for one map view; the nearest to the view centre win
const AUTO_KEY = 'jc.mapAuto';

export default function Finder({ cat, place, home = false }) {
  const loc = place.name;
  const { mapMode = false, setMapMode } = useOutletContext() || {};
  const [panelOpen, setPanelOpen] = useState(true); // map mode only: the floating results panel can slide away
  // Map mode covers part of the map: the floating panel on the left (desktop) or the bottom sheet (phones).
  const phone = useMedia('(max-width: 640px)');
  const vh = useViewportHeight();
  // Phone sheet height in px (null = the stylesheet's 50vh). The handle drags it; a tap on the handle toggles it.
  const [sheetH, setSheetH] = useState(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);
  const sheetPx = sheetH ?? Math.round(vh * 0.5);
  const SHEET_MIN = 96; const SHEET_MAX = Math.max(SHEET_MIN, vh - 140);
  const onHandleDown = (e) => { if (!phone) return; drag.current = { y: e.clientY, h: panelOpen ? sheetPx : 0, moved: false }; e.currentTarget.setPointerCapture(e.pointerId); setDragging(true); };
  const onHandleMove = (e) => { const d = drag.current; if (!d) return; const dy = d.y - e.clientY; if (Math.abs(dy) > 4) d.moved = true; if (!d.moved) return; const h = Math.max(SHEET_MIN, Math.min(SHEET_MAX, d.h + dy)); setSheetH(h); if (!panelOpen) setPanelOpen(true); };
  const onHandleUp = (e) => { const d = drag.current; drag.current = null; setDragging(false); if (!d) return; if (e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); if (!d.moved) { setPanelOpen((v) => !v); return; } if (d.h + (d.y - e.clientY) < SHEET_MIN + 24) { setPanelOpen(false); setSheetH(null); } };
  // Desktop map mode: the 408px column on the left (search card + results) and the 60px chip row along the top.
  const inset = useMemo(() => (!mapMode ? undefined : phone ? { top: 120, bottom: panelOpen ? sheetPx : 0 } : { top: 60, left: panelOpen ? 408 : 0 }), [mapMode, phone, sheetPx, panelOpen]);
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const sel = params.get('sel');
  const [mapType, setMapType] = useMapType();
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

  // ---- map mode: the viewport scope ----
  const mapApi = useRef(null);
  const [view, setView] = useState(null); // the applied area: { north, south, east, west, center, zoom, radiusM }
  const [pending, setPending] = useState(null); // the map's latest area while auto-update is off
  const [auto, setAuto] = useState(() => { try { return localStorage.getItem(AUTO_KEY) !== '0'; } catch { return true; } });
  const setAutoPref = (v) => { setAuto(v); try { localStorage.setItem(AUTO_KEY, v ? '1' : '0'); } catch { /* storage unavailable */ } if (v && pending) { setView(pending); setPending(null); } };
  const applyPending = () => { if (pending) { setView(pending); setPending(null); } };
  useEffect(() => { if (!mapMode) { setView(null); setPending(null); } }, [mapMode]);
  // The first area after a mount is applied whatever the switch says; later ones follow it.
  const onViewChange = (v) => { if (!mapMode) return; if (auto || !view) { setView(v); setPending(null); } else setPending(v); };
  // Dispensary slugs inside the applied area.
  const inView = useMemo(() => {
    if (!mapMode || !view) return null;
    const { north, south, east, west } = view;
    const s = new Set();
    for (const d of DATA.dispensaries) if (typeof d.lat === 'number' && d.lat <= north && d.lat >= south && d.lng <= east && d.lng >= west) s.add(d.slug);
    return s;
  }, [mapMode, view]); // eslint-disable-line react-hooks/exhaustive-deps
  // Results inside the area, in `all`'s order, capped at CAP (dispensaries: the CAP nearest the view centre).
  const scoped = useMemo(() => {
    if (!inView) return null;
    const hits = cat === 'dispensaries' ? all.filter((d) => inView.has(d.slug)) : all.filter((it) => stockSlugs(cat, it).some((s) => inView.has(s)));
    if (hits.length <= CAP) return { items: hits, total: hits.length };
    if (cat !== 'dispensaries') return { items: hits.slice(0, CAP), total: hits.length };
    const c = view.center;
    const keep = hits.map((d, i) => [milesBetween(c, d), i]).sort((a, b) => a[0] - b[0]).slice(0, CAP).sort((a, b) => a[1] - b[1]).map(([, i]) => hits[i]);
    return { items: keep, total: hits.length };
  }, [inView, all, cat, view]);

  const base = scoped ? scoped.items : all;
  const [limit, setLimit] = useState(PAGE);
  // Not reset on `view`: a pin card's auto-pan is a view change, and dropping back to PAGE rows would drop that pin.
  useEffect(() => { setLimit(PAGE); }, [q, cat, sort, filters.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  const list = useMemo(() => base.slice(0, limit), [base, limit]);
  const navigate = useNavigate();
  const selected = sel ? find(cat, sel, place) : null;
  // An unknown `sel` is dropped from the URL instead of riding along on every later change.
  useEffect(() => { if (sel && !selected) set({ sel: null }); }, [sel, selected]); // eslint-disable-line react-hooks/exhaustive-deps
  const storesOf = useMemo(() => new Map(list.map((it) => [it.slug, stockedAt(cat, it, place)])), [list, cat, place]);
  const storesAll = useMemo(() => (selected ? stockedAt(cat, selected, place) : null), [selected, cat, place]);
  const stores = useMemo(() => (storesAll && inView ? storesAll.filter((d) => inView.has(d.slug)) : storesAll), [storesAll, inView]);

  const points = useMemo(() => {
    if (stores) return stores;
    if (cat === 'dispensaries') return scoped ? scoped.items : list;
    const seen = new Map();
    list.forEach((it) => storesOf.get(it.slug).forEach((d) => { if (!inView || inView.has(d.slug)) seen.set(d.slug, d); }));
    return [...seen.values()];
  }, [stores, cat, list, storesOf, scoped, inView]);
  // Map mode fits to the PAGE stores nearest the place (unscoped, distance order rather than `all`'s
  // featured-first order), so the camera starts local and a new search can still move it when nothing
  // matches inside the current area.
  const fitTo = useMemo(() => {
    if (!mapMode) return undefined;
    // Nearest first, at most PAGE, and past the first five nothing farther than 3× the fifth's distance
    // (25 mi at least): a handful of local matches sets the frame, outliers across the country do not.
    const nearest = (pts) => {
      const s = pts.slice().sort((a, b) => (a.miles ?? 1e9) - (b.miles ?? 1e9)).slice(0, PAGE);
      if (s.length <= 5) return s;
      const lim = Math.max(25, 3 * (s[4].miles ?? 0));
      return s.filter((p, i) => i < 5 || !(p.miles > lim));
    };
    if (storesAll) return nearest(storesAll);
    if (cat === 'dispensaries') return nearest(all);
    const seen = new Map();
    all.slice(0, PAGE).forEach((it) => stockedAt(cat, it, place).forEach((d) => seen.set(d.slug, d)));
    return nearest([...seen.values()]);
  }, [mapMode, storesAll, all, cat, place]);

  // Map mode pins carry each store's best discount and deal count (LeafletMap draws a sale tag from them).
  const pinPoints = useMemo(() => (mapMode ? withSales(points) : points), [mapMode, points]);
  const [hover, setHover] = useState(null);
  const [pickHover, setPickHover] = useState(null); // a picks-strip card under the pointer → its store's pin
  const [picked, setPicked] = useState(null); // store slug of the pin whose card is open
  useEffect(() => { setPicked(null); }, [cat, sel]);
  useReveal([cat, q, sel, sort, filters.join('|'), list.length]);

  // Hovered row → marker keys to light up; outside map mode a single store also gets the camera.
  let hot = null;
  let focus;
  if (pickHover && points.some((p) => p.slug === pickHover)) hot = pickHover; // a store without a pin would dim every pin
  else if (hover) {
    if (stores || cat === 'dispensaries') hot = hover;
    else hot = (storesOf.get(hover) || []).map((d) => d.slug);
    const keys = Array.isArray(hot) ? hot : [hot];
    if (keys.length === 1 && !mapMode) {
      const d = points.find((p) => p.slug === keys[0]);
      if (d) focus = { lat: d.lat, lng: d.lng };
    }
  } else if (picked) hot = picked;

  // The row a picked pin belongs to: the store itself, or the first item it carries.
  const pickedRow = useMemo(() => {
    if (!picked) return null;
    if (stores || cat === 'dispensaries') return picked;
    const it = list.find((x) => (storesOf.get(x.slug) || []).some((d) => d.slug === picked));
    return it ? it.slug : null;
  }, [picked, stores, cat, list, storesOf]);
  const listRef = useRef(null);
  useEffect(() => {
    if (!pickedRow || !listRef.current || typeof CSS === 'undefined') return;
    const el = listRef.current.querySelector(`[data-id="${CSS.escape(pickedRow)}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [pickedRow]);
  const rowHot = (id) => hover === id || pickedRow === id;

  const info = catInfo(cat);
  const liveMenus = useMemo(() => (cat === 'products' ? DATA.dispensaries.filter((d) => d.menu || d.products > 0).length : 0), [cat, DATA.loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  // Map mode keeps one map across pans (markers sync in place); otherwise a new point set remounts and refits.
  const mapKey = mapMode ? `${cat}|map` : `${cat}|${sel || ''}|${points.map((p) => p.slug).sort().join(',')}`;
  const fitKey = mapMode ? `${sel || ''}|${q}|${filters.join('|')}|${place.name}` : undefined;
  const ring = mapMode && view ? { lat: view.center.lat, lng: view.center.lng, radius: view.radiusM } : null;
  const radiusMi = view ? view.radiusM / 1609.344 : 0;
  const n = selected ? stores.length : scoped ? scoped.total : all.length;
  const area = !!scoped; // the heading and sub line speak about "this area"
  const showPicks = area && !selected && cat !== 'deals' && cat !== 'products';
  const floatTools = mapMode && !phone; // desktop map mode: chips and the switch float over the map, not in the panel

  const tools = (
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
  );
  const autoSwitch = (
    <button type="button" className={`area-auto${auto ? ' on' : ''}`} role="switch" aria-checked={auto} onClick={() => setAutoPref(!auto)}>
      <i aria-hidden="true" /><span>Update results when the map moves</span>
    </button>
  );

  return (
    <section className={`finder${home ? ' finder-home' : ''}${mapMode && !panelOpen ? ' panel-closed' : ''}${dragging ? ' dragging' : ''}`} style={mapMode && phone && sheetH ? { '--sheet': `${sheetH}px` } : undefined} aria-label={`${info.label} near ${loc}`}>
      <div className={`finder-panel${mapMode && !panelOpen ? ' closed' : ''}`}>
        <div className="finder-head">
          {selected ? (
            <>
              <button type="button" className="finder-back" onClick={() => set({ sel: null })}><ChevronLeft className="ic14" />All {info.label.toLowerCase()}</button>
              <div className="finder-sel">
                <ItemBadge cat={cat} item={selected} />
                <div className="finder-sel-copy">
                  <h2 className="finder-title">{selected.name}</h2>
                  <p className="finder-sub">{itemSubtitle(cat, selected)}</p>
                  <span className="finder-sel-acts">{(cat === 'products' || cat === 'deals') && <span className="finder-sel-add"><AddButton item={selected} label="Add to cart" /></span>}<ShareButton className="btn ghost sm" title={selected.name} text={selected.name} path={itemLink(cat, selected)} /></span>
                </div>
              </div>
              {cat === 'brands' && <BrandDetail b={selected} />}
              <p className="finder-sub"><Store className="ic14" /> Where to buy · <em>{n}</em> {n === 1 ? 'dispensary' : 'dispensaries'} {area ? 'in this area' : `near ${loc}`}</p>
            </>
          ) : (
            <>
              <h2 className="finder-title"><em>{n.toLocaleString()}</em> {n === 1 ? info.one : info.label.toLowerCase()} {area ? 'in this area' : `near ${loc}`}{q && <> for “{q}”</>}</h2>
              {!floatTools && tools}
            </>
          )}
          {mapMode && (
            <div className="finder-area">
              {!floatTools && autoSwitch}
              {area && (
                <span className="finder-area-info">
                  <span>within ~{fmtMiles(radiusMi)} mi of the map centre</span>
                  {scoped.total > scoped.items.length && <span> · {cat === 'dispensaries' ? 'nearest' : 'first'} {CAP} shown, zoom in for all</span>}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="finder-list" ref={listRef}>
          {showPicks && <AreaPicks inView={inView} place={place} onHover={setPickHover} />}
          {selected ? (
            stores.length ? stores.map((d, i) => <DispensaryRow key={d.slug} d={d} i={i} hot={rowHot(d.slug)} onHover={setHover} />)
              : <Empty text={area ? 'No dispensary in this area lists this yet.' : 'No dispensary near you lists this yet.'}>{area && storesAll.length > 0 && <button type="button" className="link link-sm" onClick={() => mapApi.current && mapApi.current.fit()}>Zoom out to the nearest stores</button>}</Empty>
          ) : list.length ? (
            <>
              {list.map((item, i) => <ResultRow key={item.slug} cat={cat} item={item} i={i} hot={rowHot(item.slug)} onHover={setHover} />)}
              {base.length > list.length && <button type="button" className="finder-more" onClick={() => setLimit((l) => l + PAGE)}>Show {Math.min(PAGE, base.length - list.length)} more<span className="muted"> · {list.length} of {base.length}</span></button>}
            </>
          ) : area && all.length ? (
            <Empty text={`No ${info.label.toLowerCase()} in this area${q ? ` for “${q}”` : ''}.`}>
              <button type="button" className="link link-sm" onClick={() => mapApi.current && mapApi.current.fit()}>Zoom out to the nearest {Math.min(PAGE, all.length)}</button>
            </Empty>
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
          ref={mapApi}
          key={mapKey} className="finder-leaflet" tiles={mapMode ? mapType : 'streets'} onTilesChange={mapMode ? setMapType : undefined} pins="dom" eager fit fitControl globeBelow={4} wheel={!home} inset={inset}
          onSelect={(pt) => navigate(itemLink('dispensaries', pt))}
          onPick={mapMode ? (pt) => setPicked(pt ? pt.slug : null) : undefined}
          onViewChange={mapMode ? onViewChange : undefined}
          fitTo={fitTo} fitKey={fitKey} ring={ring} controls={mapMode ? 'bottomright' : 'topleft'} pinStyle={mapMode ? 'drop' : 'dot'} cluster={mapMode}
          center={[42.3, -71.5]} zoom={8} points={pinPoints} hot={hot} focus={focus} focusMode="ensure" flyDuration={0.7}
          ariaLabel={`Map of ${info.label.toLowerCase()} near ${loc}`}
        />
        {floatTools && !selected && <div className="map-tools">{tools}</div>}
        {floatTools && <div className="map-auto">{autoSwitch}</div>}
        {mapMode && <Link to="/" className="map-brand" aria-label="JointCommerce home"><Wordmark height={18} /></Link>}
        <div className="finder-legend"><i />{points.length} on the map<span className="muted"> · <Pin className="ic14" />{loc}</span></div>
        {setMapMode && (
          <button type="button" className="map-mode-btn" aria-pressed={mapMode} onClick={() => { setMapMode(!mapMode); setPanelOpen(true); }}>
            {mapMode ? <><Close className="ic14" />Exit map mode</> : <><MapIcon className="ic14" />Map mode</>}
          </button>
        )}
        {mapMode && pending && (
          <button type="button" className="map-search-area" onClick={applyPending}><Search className="ic14" />Search this area</button>
        )}
        {mapMode && (
          <button type="button" className="map-locate" title={`Back to ${loc}`} aria-label={`Back to ${loc}`} onClick={() => mapApi.current && mapApi.current.flyTo(place.lat, place.lng, 12)}><NavIcon className="ic14" /></button>
        )}
        {mapMode && (
          <button type="button" className="map-panel-tab" aria-expanded={panelOpen} aria-label={panelOpen ? (phone ? 'Drag to resize the list, tap to hide it' : 'Hide the list') : 'Show the list'} onClick={phone ? undefined : () => setPanelOpen((v) => !v)} onPointerDown={onHandleDown} onPointerMove={onHandleMove} onPointerUp={onHandleUp} onPointerCancel={onHandleUp}>
            <ChevronLeft className={`ic14${panelOpen ? '' : ' flip-x'}`} />
          </button>
        )}
      </div>
    </section>
  );
}

// ---- picks strip (map mode) ----
// Deals at the stores in view (ending tonight first, then biggest discount), then the lowest-priced in-stock
// menu item per category across those stores. Each card names its reason.
const PICK_CATS = ['Flower', 'Pre-rolls', 'Vapes', 'Edibles', 'Concentrates'];
function areaPicks(inView) {
  const deals = [];
  for (const d of DATA.deals) if (inView.has(d.storeSlug)) deals.push(d);
  deals.sort((a, b) => (b.ends === 'Tonight') - (a.ends === 'Tonight') || b.pct - a.pct);
  const best = new Map();
  let menus = 0;
  for (const slug of inView) {
    const m = DATA.menus[slug];
    if (!m || !m.length) continue;
    menus++;
    for (const p of m) {
      if (p.inStock === false || !(p.price > 0)) continue;
      const cur = best.get(p.category);
      if (!cur || p.price < cur.price) best.set(p.category, p);
    }
  }
  const picks = deals.slice(0, 3).map((d) => ({ kind: 'deal', item: d, why: d.ends === 'Tonight' ? `Ends tonight · ${d.pct}% off` : `${d.pct}% off` }));
  for (const c of PICK_CATS) { const p = best.get(c); if (p) picks.push({ kind: 'low', item: p, why: `Lowest price · ${c}` }); }
  return { picks, menus, deals: deals.length };
}

// A sideways strip: edge state for the arrows and fades, and mouse drag-to-scroll. A drag past 5px swallows the
// click that ends it, so dragging over a card does not open it; touch keeps native swiping.
function useStrip(dep) {
  const track = useRef(null);
  const [edge, setEdge] = useState({ prev: false, next: false });
  const drag = useRef(null);
  useEffect(() => {
    const el = track.current;
    if (!el) return undefined;
    const read = () => { const max = el.scrollWidth - el.clientWidth; setEdge({ prev: el.scrollLeft > 2, next: el.scrollLeft < max - 2 }); };
    read();
    el.addEventListener('scroll', read, { passive: true });
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', read); ro.disconnect(); };
  }, [dep]);
  // A new set of items starts at the left edge; scroll snapping would otherwise follow the card it last snapped
  // to into its new position mid-strip.
  useLayoutEffect(() => { if (track.current) track.current.scrollLeft = 0; }, [dep]);
  const step = (dir) => {
    const el = track.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * Math.max(180, el.clientWidth * 0.8), behavior: reduced ? 'auto' : 'smooth' });
  };
  const handlers = {
    onPointerDown: (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('button')) return;
      drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false, id: e.pointerId };
    },
    onPointerMove: (e) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      if (!d.moved && Math.abs(dx) > 5) { d.moved = true; track.current.setPointerCapture(d.id); track.current.classList.add('dragging'); }
      if (d.moved) track.current.scrollLeft = d.left - dx;
    },
    onPointerUp: () => {
      const d = drag.current;
      drag.current = null;
      if (!d?.moved) return;
      track.current.classList.remove('dragging');
      const swallow = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
      track.current.addEventListener('click', swallow, { capture: true, once: true });
      window.setTimeout(() => track.current?.removeEventListener('click', swallow, { capture: true }), 0);
    },
    onPointerCancel: () => { drag.current = null; track.current?.classList.remove('dragging'); },
    onDragStart: (e) => e.preventDefault(), // links and images would start a native drag instead
  };
  return { track, edge, step, handlers };
}

function AreaPicks({ inView, place, onHover }) {
  const { picks, menus, deals } = useMemo(() => areaPicks(inView), [inView]);
  const strip = useStrip(picks.map((p) => p.item.slug).join('|'));
  if (!menus && !deals) return <p className="ap-none"><Sparkle className="ic14" />No prices or deals listed in this area yet. Zoom out to find some.</p>;
  if (!picks.length) return null;
  return (
    <section className="ap" aria-label="Picks in this area">
      <div className="ap-head">
        <h3 className="ap-title"><Sparkle className="ic14" />Picks in this area</h3>
        <span className="ap-sub">{[menus > 0 ? `${menus} ${menus === 1 ? 'menu' : 'menus'} with prices` : '', deals > 0 ? `${deals} ${deals === 1 ? 'deal' : 'deals'}` : ''].filter(Boolean).join(' · ')}</span>
        {(strip.edge.prev || strip.edge.next) && (
          <span className="ap-arrows">
            <button type="button" className="ap-arrow" aria-label="Previous picks" disabled={!strip.edge.prev} onClick={() => strip.step(-1)}><ChevronLeft className="ic14" /></button>
            <button type="button" className="ap-arrow" aria-label="More picks" disabled={!strip.edge.next} onClick={() => strip.step(1)}><ChevronRight className="ic14" /></button>
          </span>
        )}
      </div>
      <div className={`ap-row-wrap${strip.edge.prev ? ' has-prev' : ''}${strip.edge.next ? ' has-next' : ''}`}>
      <div className="ap-row" ref={strip.track} {...strip.handlers}>
        {picks.map(({ kind, item, why }) => {
          const store = storeBySlug(item.storeSlug);
          const miles = store ? located(store, place).miles : null;
          return (
            <div key={item.slug} className="ap-item" onMouseEnter={() => onHover(item.storeSlug)} onMouseLeave={() => onHover(null)}>
              <Link to={`/dispensaries/${item.storeSlug}`} className="ap-card" onFocus={() => onHover(item.storeSlug)} onBlur={() => onHover(null)}>
                <span className={`ap-why${kind === 'deal' ? ' deal' : ''}`}>{kind === 'deal' ? <Clock className="ic14" /> : <Tag className="ic14" />}{why}</span>
                <span className="ap-name">{item.name}</span>
                <span className="ap-meta"><Store className="ic14" />{item.store}{typeof miles === 'number' && <> · {fmtMiles(miles)} mi</>}</span>
                <span className="ap-foot"><span className="price"><strong>${item.price}</strong>{item.was && <s>${item.was}</s>}</span></span>
              </Link>
              <span className="ap-action"><AddButton item={item} /></span>
            </div>
          );
        })}
      </div>
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
