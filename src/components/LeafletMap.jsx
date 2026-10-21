import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Globe from './Globe.jsx';

const TILES = {
  dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  light: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  positron: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  streets: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  topo: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  natgeo: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
};
// Deepest zoom a service serves; deeper requests return a placeholder tile. Unlisted services serve past MAX_ZOOM + 1.
const TILE_MAX_NATIVE = { natgeo: 16 };
// Recoloured tile modes: the Esri street basemap runs through an SVG filter. A colour matrix reduces each
// pixel to one value v (same in R, G and B), then per-channel tables map v onto palette colours at evenly
// spaced stops. Pins, tooltips and popups live in other panes and keep their own colours.
// - brand: v = luminance; five stops ink → teal-deep → teal → teal-light → mint. Water (darker than land on
//   these tiles) lands on teal, land on mint, labels on ink.
// - night: v = 1 − 0.6·luminance − (B − R), which separates the street tiles' classes by colour, not only
//   by lightness: water (blue) ≈ .29, white roads ≈ .40, land (cream) ≈ .61, dark labels ≈ .86, orange and
//   yellow highways ≈ .9–1. Twenty-one stops then paint water darkest, land ink-2, roads a lighter green,
//   highways teal-bright and labels mint.
const SATURATE_0 = '0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0';
const NIGHT_MATRIX = '0.872 -0.429 -1.043 0 1  0.872 -0.429 -1.043 0 1  0.872 -0.429 -1.043 0 1  0 0 0 1 0';
const RECOLOR = {
  brand: { matrix: SATURATE_0, stops: ['#0b2b26', '#0f7a60', '#14b38a', '#7fe0c3', '#dcf5ee'] },
  night: { matrix: NIGHT_MATRIX, stops: [
    '#0d332c', '#0d332c', '#0d332c', '#0d332c', '#0d332c', '#0d332c', // v ≤ .25: water
    '#12403a', '#2a7c68', '#3a9b82', '#2b7363', // .30–.45: road casing, white roads
    '#1f5a51', '#1b5249', '#1a4f47', '#1e5850', // .50–.65: land
    '#30836e', '#63c2a7', '#abe7d3', '#e4f8f1', // .70–.85: label edges, labels
    '#8fe3c9', '#5fd8b4', '#4fd4b0', // .90–1: highways
  ] },
};
const tableFor = (mode, i) => RECOLOR[mode].stops.map((h) => (parseInt(h.slice(1 + i * 2, 3 + i * 2), 16) / 255).toFixed(3)).join(' ');
const ATTR = '&copy; <a href="https://www.esri.com/">Esri</a>';
const ATTR_CARTO = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MAX_ZOOM = 16;
const keyOf = (pt) => pt.slug || `${pt.name}|${pt.city}`;

/**
 * Leaflet map tinted to the ink/teal palette.
 * - `focus` ({lat,lng}) flies the view to that point whenever it changes (`flyDuration` seconds).
 *   With `focusMode="ensure"` the view only pans, at the current zoom, when the point is outside
 *   the visible bounds; a point already on screen leaves the camera alone.
 * - `interactive=false` disables all handlers (background use).
 * - `points` renders teal circle markers with a popup. Markers are created once, on init; remount
 *   (change `key`) to render a different set.
 * - `hot` is a point key (slug, or name|city) or an array of keys: those markers are enlarged and
 *   brought to the front while the rest dim.
 * - `fit=true` fits the initial view to all points instead of using center/zoom.
 * - `tiles` is 'dark' (default, sepia-tinted), 'light' (Esri gray base), 'streets' (Esri streets), 'topo' (Esri
 *   topographic), 'natgeo' (Esri National Geographic: tan land, hillshade, served to zoom 16), 'brand' (Esri
 *   streets recoloured to the light palette), 'night' (Esri streets recoloured to the dark palette) or
 *   'positron' (CARTO light; needs an API key on cartocdn).
 * - `onSelect(pt)` is called from the popup card's button (dom pins only).
 * - `fitControl=true` adds a button that refits the view to all points.
 * - `globeBelow=N`: while the map zoom is below N, an orthographic globe (Globe.jsx) covers the map with
 *   the same pins; zooming in on the globe sets the map view at zoom N on the globe's centre.
 * - `pins` is 'svg' (default: circle markers in the SVG renderer, which Leaflet scales during zoom
 *   animation) or 'dom' (div-icon markers, repositioned during zoom; styled by `.pin` rules).
 * - `eager` creates the map on mount; otherwise it is created when the host scrolls within 400px
 *   of the viewport, so below-the-fold maps do not fetch tiles on page load.
 */
export default function LeafletMap({
  className = '', center, zoom = 9, focus, points = [], interactive = true, focusZoom = 11, eager = false,
  hot, fit = false, tiles = 'dark', wheel = false, flyDuration = 1.6, ariaLabel, pins = 'svg', focusMode = 'fly', onSelect, fitControl = false, globeBelow = 0,
}) {
  const [zoomLevel, setZoomLevel] = useState(null);
  const [globeCenter, setGlobeCenter] = useState(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const el = useRef(null);
  const map = useRef(null);
  const markers = useRef(new Map());
  const pendingFocus = useRef(focus);

  useEffect(() => {
    if (!el.current || map.current) return undefined;
    let io = null;
    let ro = null;
    const init = () => {
      if (map.current || !el.current) return;
      const m = L.map(el.current, {
        center: center || [42.4, -71.4],
        zoom,
        zoomControl: interactive,
        attributionControl: true,
        dragging: interactive,
        scrollWheelZoom: interactive && wheel,
        doubleClickZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
        touchZoom: interactive,
        tap: interactive,
        preferCanvas: false, // SVG renderer so marker halos can be animated with CSS
        maxZoom: MAX_ZOOM,
        fadeAnimation: true,
        zoomAnimation: true,
      });
      m.attributionControl.setPrefix(false); // corner label carries the tile credit only, no "Leaflet" prefix
      // detectRetina: on HiDPI screens Leaflet requests tiles one zoom deeper and draws them at half size, and it
      // lowers the layer's maxZoom by one; MAX_ZOOM + 1 keeps the layer drawing up to the map's own MAX_ZOOM.
      const tileOpts = { maxZoom: MAX_ZOOM + 1, detectRetina: true, updateWhenIdle: true, keepBuffer: 1 };
      if (tiles === 'positron') L.tileLayer(TILES.positron, { ...tileOpts, attribution: ATTR_CARTO, subdomains: 'abcd', className: 'tiles-positron' }).addTo(m);
      else {
        const url = RECOLOR[tiles] ? TILES.streets : TILES[tiles] || TILES.dark;
        const cls = tiles === 'light' ? 'tiles-light' : tiles === 'streets' ? 'tiles-streets' : tiles === 'brand' ? 'tiles-brand' : tiles === 'night' ? 'tiles-night' : tiles === 'topo' || tiles === 'natgeo' ? 'tiles-topo' : 'tiles-ink';
        const layer = L.tileLayer(url, { ...tileOpts, attribution: ATTR, className: cls });
        // Past the service's deepest zoom Leaflet scales those tiles up; under the retina offset the request is one deeper.
        if (TILE_MAX_NATIVE[tiles]) layer.options.maxNativeZoom = TILE_MAX_NATIVE[tiles] - layer.options.zoomOffset;
        layer.addTo(m);
      }
      points.forEach((pt) => {
        if (pins === 'dom') {
          const code = esc((pt.code || String(pt.name || '?').slice(0, 2)).slice(0, 3).toUpperCase());
          const marker = L.marker([pt.lat, pt.lng], {
            icon: L.divIcon({ className: `pin${pt.featured ? ' featured' : ''}`, html: `<i class="pin-halo"></i><span class="pin-dot">${code}</span>`, iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, -18], tooltipAnchor: [0, -16] }),
            keyboard: false, interactive, riseOnHover: true,
          }).addTo(m);
          if (interactive) {
            marker.bindTooltip(esc(pt.name), { direction: 'top', className: 'pin-tip', opacity: 1 });
            const card = document.createElement('div');
            card.className = 'pin-card';
            const miles = typeof pt.miles === 'number' ? `${pt.miles < 10 ? pt.miles.toFixed(1) : Math.round(pt.miles)} mi` : '';
            const rating = typeof pt.rating === 'number' && pt.rating > 0 ? `<span class="pin-card-rating">★ ${pt.rating.toFixed(1)}${pt.reviews ? ` <em>(${pt.reviews})</em>` : ''}</span>` : '';
            const chips = [pt.delivery ? 'Delivery' : '', pt.pickup !== false ? 'Pickup' : '', pt.verified ? 'Verified' : ''].filter(Boolean).map((c) => `<span class="pin-card-chip">${c}</span>`).join('');
            card.innerHTML = `<div class="pin-card-head"><span class="bd bd-ink pin-card-bd">${code}</span><div class="pin-card-copy"><strong>${esc(pt.name)}</strong><span>${esc([pt.city, miles].filter(Boolean).join(' · '))}</span></div></div>` +
              `<div class="pin-card-row">${rating}${pt.status ? `<span class="pin-card-live"><i></i>${esc(pt.status)}</span>` : ''}</div>` + (chips ? `<div class="pin-card-chips">${chips}</div>` : '');
            if (onSelectRef.current) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ink sm pin-card-btn'; b.textContent = 'Open menu'; b.addEventListener('click', () => onSelectRef.current && onSelectRef.current(pt)); card.appendChild(b); }
            marker.bindPopup(card, { closeButton: true, className: 'pin-pop', maxWidth: 300, minWidth: 240, offset: [0, -6] });
            // no name tooltip while the card is open
            const tip = { direction: 'top', className: 'pin-tip', opacity: 1 };
            marker.on('popupopen', () => { marker.closeTooltip(); marker.unbindTooltip(); });
            marker.on('popupclose', () => { marker.bindTooltip(esc(pt.name), tip); });
          }
          markers.current.set(keyOf(pt), { marker, dom: true });
          return;
        }
        const marker = L.circleMarker([pt.lat, pt.lng], {
          radius: 8, color: '#dcf5ee', weight: 2, fillColor: '#14b38a', fillOpacity: 1, className: 'mk',
        }).addTo(m);
        const halo = L.circleMarker([pt.lat, pt.lng], { radius: 18, color: '#14b38a', weight: 0, fillColor: '#14b38a', fillOpacity: 0.22, interactive: false, className: 'mk-halo' }).addTo(m);
        const ring1 = L.circleMarker([pt.lat, pt.lng], { radius: 22, color: '#7fe0c3', weight: 1.5, fill: false, interactive: false, className: 'mk-ping' }).addTo(m);
        const ring2 = L.circleMarker([pt.lat, pt.lng], { radius: 22, color: '#7fe0c3', weight: 1.5, fill: false, interactive: false, className: 'mk-ping mk-ping-2' }).addTo(m);
        ring1.bringToBack(); ring2.bringToBack(); halo.bringToBack();
        if (interactive) marker.bindPopup(`<strong>${pt.name}</strong><br>${pt.city} · ${pt.status}`);
        markers.current.set(keyOf(pt), { marker, halo });
      });
      map.current = m;
      m.on('zoomend moveend', () => { setZoomLevel(m.getZoom()); const c = m.getCenter(); setGlobeCenter([c.lat, c.lng]); });
      const fitAll = (animate) => { if (points.length) m.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [48, 48], maxZoom: 12, animate }); };
      if (fit) fitAll(false);
      if (fitControl && interactive && points.length) {
        const Ctl = L.Control.extend({ onAdd() { const b = L.DomUtil.create('button', 'map-fit'); b.type = 'button'; b.title = 'Show all'; b.setAttribute('aria-label', 'Show all pins'); b.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'; L.DomEvent.disableClickPropagation(b); L.DomEvent.on(b, 'click', () => fitAll(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)); return b; } });
        new Ctl({ position: 'topleft' }).addTo(m);
      }
      if (pendingFocus.current) m.setView([pendingFocus.current.lat, pendingFocus.current.lng], focusZoom, { animate: false });
      applyHot(hot);
      { const c = m.getCenter(); setZoomLevel(m.getZoom()); setGlobeCenter([c.lat, c.lng]); }
      ro = new ResizeObserver(() => m.invalidateSize());
      ro.observe(el.current);
    };
    if (eager || typeof IntersectionObserver === 'undefined') {
      init();
    } else {
      io = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) { io.disconnect(); io = null; init(); }
      }, { rootMargin: '400px 0px' });
      io.observe(el.current);
    }
    return () => {
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      if (map.current) { map.current.remove(); map.current = null; }
      markers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    pendingFocus.current = focusMode === 'ensure' ? undefined : focus;
    if (!map.current || !focus) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = [focus.lat, focus.lng];
    if (focusMode === 'ensure') {
      if (map.current.getBounds().pad(-0.08).contains(target)) return;
      map.current.panTo(target, { animate: !reduced, duration: flyDuration, easeLinearity: 0.3 });
      return;
    }
    if (reduced) map.current.setView(target, focusZoom, { animate: false });
    else map.current.flyTo(target, focusZoom, { duration: flyDuration, easeLinearity: 0.3 });
  }, [focus?.lat, focus?.lng, focusZoom, flyDuration, focusMode]);

  const applyHot = (h) => {
    const keys = h == null ? null : new Set(Array.isArray(h) ? h : [h]);
    markers.current.forEach(({ marker, halo, dom }, k) => {
      const on = keys ? keys.has(k) : false;
      const dim = keys && keys.size > 0 && !on;
      if (dom) {
        const node = marker.getElement();
        if (node) { node.classList.toggle('hot', on); node.classList.toggle('dim', Boolean(dim)); }
        marker.setZIndexOffset(on ? 1000 : 0);
        return;
      }
      marker.setStyle({ radius: on ? 11 : 8, fillColor: on ? '#0b2b26' : '#14b38a', color: on ? '#7fe0c3' : '#dcf5ee', fillOpacity: dim ? 0.45 : 1 });
      halo.setStyle({ fillOpacity: on ? 0.32 : dim ? 0.08 : 0.22 });
      if (on) marker.bringToFront();
    });
  };
  useEffect(() => { if (map.current) applyHot(hot); }, [Array.isArray(hot) ? hot.join('|') : hot]); // eslint-disable-line react-hooks/exhaustive-deps

  const showGlobe = globeBelow > 0 && zoomLevel !== null && zoomLevel < globeBelow;
  const zoomInFromGlobe = ([lat, lng]) => { if (map.current) map.current.setView([lat, lng], globeBelow, { animate: false }); };
  return (
    <div className={`leaflet-wrap${tiles === 'night' ? ' map-night' : ''} ${className}`} role={ariaLabel ? 'region' : undefined} aria-label={ariaLabel}>
      <div ref={el} className="leaflet-host" />
      {RECOLOR[tiles] && (
        <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
          <filter id={`jc-recolor-${tiles}`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={RECOLOR[tiles].matrix} />
            <feComponentTransfer>
              <feFuncR type="table" tableValues={tableFor(tiles, 0)} />
              <feFuncG type="table" tableValues={tableFor(tiles, 1)} />
              <feFuncB type="table" tableValues={tableFor(tiles, 2)} />
            </feComponentTransfer>
          </filter>
        </svg>
      )}
      {showGlobe && <Globe points={points} hot={hot} center={globeCenter} onZoomIn={zoomInFromGlobe} onSelect={onSelect} dark={tiles === 'night'} />}
    </div>
  );
}
