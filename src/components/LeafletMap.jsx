import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};
// Drawn over the satellite imagery: place names and boundaries, then roads.
const SAT_LABELS = [
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
];
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
// The base tile layer(s) for a `tiles` mode, not yet added to a map.
function baseLayers(tiles) {
  // detectRetina: on HiDPI screens Leaflet requests tiles one zoom deeper and draws them at half size, and it
  // lowers the layer's maxZoom by one; MAX_ZOOM + 1 keeps the layer drawing up to the map's own MAX_ZOOM.
  const tileOpts = { maxZoom: MAX_ZOOM + 1, detectRetina: true, updateWhenIdle: true, keepBuffer: 1 };
  if (tiles === 'positron') return [L.tileLayer(TILES.positron, { ...tileOpts, attribution: ATTR_CARTO, subdomains: 'abcd', className: 'tiles-positron' })];
  if (tiles === 'satellite') {
    return [
      L.tileLayer(TILES.satellite, { ...tileOpts, attribution: `${ATTR}, Maxar, Earthstar Geographics`, className: 'tiles-sat' }),
      ...SAT_LABELS.map((url, i) => L.tileLayer(url, { ...tileOpts, className: 'tiles-sat-labels', opacity: i === 0 ? 0.7 : 1 })),
    ];
  }
  const url = RECOLOR[tiles] ? TILES.streets : TILES[tiles] || TILES.dark;
  const cls = tiles === 'light' ? 'tiles-light' : tiles === 'streets' ? 'tiles-streets' : tiles === 'brand' ? 'tiles-brand' : tiles === 'night' ? 'tiles-night' : tiles === 'topo' || tiles === 'natgeo' ? 'tiles-topo' : 'tiles-ink';
  const layer = L.tileLayer(url, { ...tileOpts, attribution: ATTR, className: cls });
  // Past the service's deepest zoom Leaflet scales those tiles up; under the retina offset the request is one deeper.
  if (TILE_MAX_NATIVE[tiles]) layer.options.maxNativeZoom = TILE_MAX_NATIVE[tiles] - layer.options.zoomOffset;
  return [layer];
}

// Background style for a thumbnail of `url`'s tile around [lat, lng]: the tile drawn at TILE_PX, shifted so the
// point sits in the middle of a THUMB px square.
const TILE_PX = 160;
const THUMB = 64;
function thumbStyle(url, [lat, lng], zoom) {
  const z = Math.max(2, Math.min(15, Math.round(zoom) - 1));
  const n = 2 ** z;
  const fx = ((lng + 180) / 360) * n;
  const r = (Math.max(-85, Math.min(85, lat)) * Math.PI) / 180;
  const fy = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n;
  const x = Math.floor(fx); const y = Math.floor(fy);
  return {
    backgroundImage: `url(${url.replace('{z}', z).replace('{y}', y).replace('{x}', x)})`,
    backgroundSize: `${TILE_PX}px ${TILE_PX}px`,
    backgroundPosition: `${THUMB / 2 - (fx - x) * TILE_PX}px ${THUMB / 2 - (fy - y) * TILE_PX}px`,
  };
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MAX_ZOOM = 16;
const CLUSTER_UNTIL = 14; // pins stand alone from this zoom (where their labels also show)
const CELL = 56; // px grid square that groups pins below CLUSTER_UNTIL
const NO_INSET = { top: 0, right: 0, bottom: 0, left: 0 };
const keyOf = (pt) => pt.slug || `${pt.name}|${pt.city}`;

/**
 * Leaflet map tinted to the ink/teal palette.
 * - `focus` ({lat,lng}) flies the view to that point whenever it changes (`flyDuration` seconds).
 *   With `focusMode="ensure"` the view only pans, at the current zoom, when the point is outside
 *   the visible bounds; a point already on screen leaves the camera alone.
 * - `interactive=false` disables all handlers (background use).
 * - `points` renders teal circle markers with a popup (see the sync note below for later changes).
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
 * - After init, a changed `points` array is synced in place: markers for new keys are added (dom pins get a
 *   `pin-new` class for one render), markers for keys no longer present are removed. The view is left alone.
 * - `fitTo` (array of points) is what `fit`, the fit control and `fitKey` fit to; it defaults to `points`.
 *   A change of `fitKey` after init refits the view (animated unless reduced motion is on).
 * - `onViewChange({ north, south, east, west, center, zoom, radiusM })` fires ~120ms after each move or zoom
 *   ends, describing the uncovered area (the container minus `inset`); `radiusM` is the metres from its centre
 *   to its nearer edge.
 * - `onPick(pt)` fires when a dom pin is clicked; `onPick(null)` when its card closes.
 * - `ring` ({ lat, lng, radius } metres) draws a dashed circle under the pins; null removes it.
 * - The ref exposes `flyTo(lat, lng, zoom)`, `fit(animate)` and `getView()`.
 */
const LeafletMap = forwardRef(function LeafletMap({
  className = '', center, zoom = 9, focus, points = [], interactive = true, focusZoom = 11, eager = false,
  hot, fit = false, tiles = 'dark', wheel = false, flyDuration = 1.6, ariaLabel, pins = 'svg', focusMode = 'fly', onSelect, fitControl = false, globeBelow = 0,
  inset = NO_INSET, fitTo, fitKey, onViewChange, onPick, ring = null, controls = 'topleft', pinStyle = 'dot', cluster = false, onTilesChange,
}, ref) {
  // `onTilesChange(mode)`: when given, a thumbnail toggle between 'streets' and 'satellite' sits beside the zoom control.
  const base = useRef(null); // { tiles, layers } currently on the map
  const onTilesChangeRef = useRef(onTilesChange);
  onTilesChangeRef.current = onTilesChange;
  const [typeHost, setTypeHost] = useState(null);
  // `cluster` (dom pins only): below zoom CLUSTER_UNTIL, pins that fall in the same CELL px grid square are hidden
  // and drawn as one count bubble; a click on the bubble zooms to its pins. A pin with an open card is never grouped.
  const clusterLayer = useRef(null);
  const clusters = useRef([]); // [{ marker, keys }]
  const ringTimer = useRef(0);
  const [zoomLevel, setZoomLevel] = useState(null);
  const [globeCenter, setGlobeCenter] = useState(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const onViewChangeRef = useRef(onViewChange);
  onViewChangeRef.current = onViewChange;
  const hotRef = useRef(hot);
  hotRef.current = hot;
  const pointsRef = useRef(points);
  pointsRef.current = points;
  const fitRef = useRef(fitTo || points);
  fitRef.current = fitTo || points;
  const fitAllRef = useRef(null);
  const ringLayer = useRef(null);
  const viewTimer = useRef(0);
  const el = useRef(null);
  const map = useRef(null);
  const markers = useRef(new Map());
  const pendingFocus = useRef(focus);
  // `inset` = { top, right, bottom, left } px of the container covered by floating panels. Fitting pads by it,
  // centring puts the target at the centre of the uncovered area, and "ensure" tests the uncovered area.
  const insetRef = useRef(inset);
  insetRef.current = { ...NO_INSET, ...(inset || {}) };
  const visibleOffset = () => { const i = insetRef.current; return L.point((i.right - i.left) / 2, (i.bottom - i.top) / 2); };
  const centerFor = (m, latlng, z) => m.unproject(m.project(L.latLng(latlng), z).add(visibleOffset()), z);
  const isVisible = (m, latlng) => { const p = m.latLngToContainerPoint(L.latLng(latlng)); const s = m.getSize(); const i = insetRef.current; const pad = 24; return p.x > i.left + pad && p.x < s.x - i.right - pad && p.y > i.top + pad && p.y < s.y - i.bottom - pad; };
  // The uncovered area as geography: its corner bounds, its centre and the metres from the centre to the nearer edge.
  const viewOf = (m) => {
    const s = m.getSize(); const i = insetRef.current;
    const x0 = i.left; const y0 = i.top; const x1 = Math.max(x0 + 1, s.x - i.right); const y1 = Math.max(y0 + 1, s.y - i.bottom);
    const nw = m.containerPointToLatLng([x0, y0]); const se = m.containerPointToLatLng([x1, y1]);
    const cx = (x0 + x1) / 2; const cy = (y0 + y1) / 2;
    const c = m.containerPointToLatLng([cx, cy]);
    const half = Math.min((x1 - x0) / 2, (y1 - y0) / 2);
    const radiusM = m.distance(c, m.containerPointToLatLng([cx + half, cy]));
    return { north: nw.lat, south: se.lat, east: se.lng, west: nw.lng, center: { lat: c.lat, lng: c.lng }, zoom: m.getZoom(), radiusM };
  };

  // One marker for `pt`. `fresh` marks a pin added after init so it can animate in.
  const addPoint = (m, pt, fresh) => {
    const key = keyOf(pt);
    if (markers.current.has(key)) return;
    if (pins === 'dom') {
      const code = esc((pt.code || String(pt.name || '?').slice(0, 2)).slice(0, 3).toUpperCase());
      const drop = pinStyle === 'drop'; // teardrop pin: the body sits 12px above the anchor, so the card and tip rise with it
      const marker = L.marker([pt.lat, pt.lng], {
        icon: L.divIcon({ className: `pin${drop ? ' pin-drop' : ''}${pt.featured ? ' featured' : ''}${pt.sale ? ' on-sale' : ''}${fresh ? ' pin-new' : ''}`, html: `<i class="pin-halo"></i><span class="pin-dot">${code}</span>${pt.sale ? `<span class="pin-sale">-${Math.round(pt.sale)}%</span>` : ''}<span class="pin-label">${esc(pt.name)}</span>`, iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, drop ? -34 : -18], tooltipAnchor: [0, drop ? -32 : -16] }),
        keyboard: false, interactive, riseOnHover: true,
      }).addTo(m);
      if (interactive) {
        marker.bindTooltip(esc(pt.name), { direction: 'top', className: 'pin-tip', opacity: 1 });
        const card = document.createElement('div');
        card.className = 'pin-card';
        const miles = typeof pt.miles === 'number' ? `${pt.miles < 10 ? pt.miles.toFixed(1) : Math.round(pt.miles)} mi` : '';
        const rating = typeof pt.rating === 'number' && pt.rating > 0 ? `<span class="pin-card-rating">★ ${pt.rating.toFixed(1)}${pt.reviews ? ` <em>(${pt.reviews})</em>` : ''}</span>` : '';
        const sale = pt.sale ? `<div class="pin-card-sale"><b>-${Math.round(pt.sale)}%</b>${pt.deals > 1 ? `Up to ${Math.round(pt.sale)}% off · ${pt.deals} deals` : '1 deal on the menu'}</div>` : '';
        const chips = [pt.delivery ? 'Delivery' : '', pt.pickup !== false ? 'Pickup' : '', pt.verified ? 'Verified' : ''].filter(Boolean).map((c) => `<span class="pin-card-chip">${c}</span>`).join('');
        card.innerHTML = `<div class="pin-card-head"><span class="bd bd-ink pin-card-bd">${code}</span><div class="pin-card-copy"><strong>${esc(pt.name)}</strong><span>${esc([pt.city, miles].filter(Boolean).join(' · '))}</span></div></div>` +
          sale + `<div class="pin-card-row">${rating}${pt.status ? `<span class="pin-card-live${pt.open ? '' : ' off'}"><i></i>${esc(pt.status)}</span>` : ''}</div>` + (chips ? `<div class="pin-card-chips">${chips}</div>` : '');
        if (onSelectRef.current) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ink sm pin-card-btn'; b.textContent = 'Open menu'; b.addEventListener('click', () => onSelectRef.current && onSelectRef.current(pt)); card.appendChild(b); }
        marker.bindPopup(card, { closeButton: true, className: 'pin-pop', maxWidth: 300, minWidth: 240, offset: [0, -6] });
        // no name tooltip while the card is open
        const tip = { direction: 'top', className: 'pin-tip', opacity: 1 };
        marker.on('popupopen', () => { marker.closeTooltip(); marker.unbindTooltip(); });
        marker.on('popupclose', () => { marker.bindTooltip(esc(pt.name), tip); if (onPickRef.current) onPickRef.current(null); });
        // Runs after bindPopup's own click toggle, so a second click that closed the card reports nothing here.
        marker.on('click', () => { if (onPickRef.current && marker.isPopupOpen()) onPickRef.current(pt); });
      }
      markers.current.set(key, { marker, dom: true, pt });
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
    markers.current.set(key, { marker, halo, rings: [ring1, ring2] });
  };
  const removePoint = (key) => {
    const e = markers.current.get(key);
    if (!e) return;
    e.marker.remove();
    if (e.halo) e.halo.remove();
    if (e.rings) e.rings.forEach((r) => r.remove());
    markers.current.delete(key);
  };

  // Regroup the dom pins for the current zoom (see `cluster`). Cells are in projected pixels, so a pan keeps them.
  const recluster = (m) => {
    if (!cluster || pins !== 'dom') return;
    if (!clusterLayer.current) clusterLayer.current = L.layerGroup().addTo(m);
    clusterLayer.current.clearLayers();
    clusters.current = [];
    const z = m.getZoom();
    const cells = new Map();
    markers.current.forEach((e, k) => {
      if (!e.dom) return;
      if (z >= CLUSTER_UNTIL || e.marker.isPopupOpen()) { if (!m.hasLayer(e.marker)) e.marker.addTo(m); return; }
      const p = m.project(e.marker.getLatLng(), z);
      const c = `${Math.floor(p.x / CELL)}|${Math.floor(p.y / CELL)}`;
      if (!cells.has(c)) cells.set(c, []);
      cells.get(c).push([k, e]);
    });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cells.forEach((group) => {
      if (group.length === 1) { const e = group[0][1]; if (!m.hasLayer(e.marker)) e.marker.addTo(m); return; }
      group.forEach(([, e]) => { if (m.hasLayer(e.marker)) m.removeLayer(e.marker); });
      const lls = group.map(([, e]) => e.marker.getLatLng());
      const lat = lls.reduce((s, l) => s + l.lat, 0) / lls.length;
      const lng = lls.reduce((s, l) => s + l.lng, 0) / lls.length;
      const n = group.length;
      const sales = group.filter(([, e]) => e.pt && e.pt.sale).length;
      const size = n < 10 ? 34 : n < 50 ? 40 : 46;
      const cm = L.marker([lat, lng], {
        icon: L.divIcon({ className: 'pin-cluster', html: `<span>${n}</span>${sales ? `<i class="pin-cluster-sale" title="${sales} with deals">%</i>` : ''}`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] }),
        keyboard: false, riseOnHover: true, title: `${n} stores here${sales ? `, ${sales} with deals` : ''}, click to zoom in`, zIndexOffset: 500,
      });
      cm.on('click', () => {
        const b = L.latLngBounds(lls);
        const i = insetRef.current;
        if (b.getNorthEast().equals(b.getSouthWest())) { const zz = Math.min(MAX_ZOOM, CLUSTER_UNTIL); m.setView(centerFor(m, [lat, lng], zz), zz, { animate: !reduced }); return; }
        m.fitBounds(b, { paddingTopLeft: [64 + i.left, 64 + i.top], paddingBottomRight: [64 + i.right, 64 + i.bottom], maxZoom: CLUSTER_UNTIL, animate: !reduced });
      });
      cm.addTo(clusterLayer.current);
      clusters.current.push({ marker: cm, keys: group.map(([k]) => k) });
    });
  };

  useEffect(() => {
    if (!el.current || map.current) return undefined;
    let io = null;
    let ro = null;
    const init = () => {
      if (map.current || !el.current) return;
      const m = L.map(el.current, {
        center: center || [42.4, -71.4],
        zoom,
        zoomControl: false, // added below at `controls`
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
      if (interactive) L.control.zoom({ position: controls }).addTo(m);
      if (controls !== 'topleft') m.attributionControl.setPosition('bottomleft'); // the corner the zoom control took
      base.current = { tiles, layers: baseLayers(tiles) };
      base.current.layers.forEach((l) => l.addTo(m));
      if (onTilesChangeRef.current) { // a corner control the map-type toggle is portalled into
        const Ctl = L.Control.extend({ onAdd() { const d = L.DomUtil.create('div', 'map-type-host'); L.DomEvent.disableClickPropagation(d); L.DomEvent.disableScrollPropagation(d); return d; } });
        const ctl = new Ctl({ position: controls }).addTo(m);
        setTypeHost(ctl.getContainer());
      }
      pointsRef.current.forEach((pt) => addPoint(m, pt, false));
      map.current = m;
      m.on('zoomend moveend', () => {
        setZoomLevel(m.getZoom()); const c = m.getCenter(); setGlobeCenter([c.lat, c.lng]);
        if (!onViewChangeRef.current) return;
        window.clearTimeout(viewTimer.current);
        viewTimer.current = window.setTimeout(() => { if (map.current === m && onViewChangeRef.current) onViewChangeRef.current(viewOf(m)); }, 120);
      });
      const fitAll = (animate) => { const pts = fitRef.current; if (pts.length) { const i = insetRef.current; m.fitBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lng])), { paddingTopLeft: [48 + i.left, 48 + i.top], paddingBottomRight: [48 + i.right, 48 + i.bottom], maxZoom: 12, animate }); } };
      fitAllRef.current = fitAll;
      if (fit) fitAll(false);
      else { const i = insetRef.current; if (i.top || i.right || i.bottom || i.left) m.setView(centerFor(m, m.getCenter(), m.getZoom()), m.getZoom(), { animate: false }); }
      if (fitControl && interactive) { // fitAll is a no-op while there is nothing to fit
        const Ctl = L.Control.extend({ onAdd() { const b = L.DomUtil.create('button', 'map-fit'); b.type = 'button'; b.title = 'Show all'; b.setAttribute('aria-label', 'Show all pins'); b.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'; L.DomEvent.disableClickPropagation(b); L.DomEvent.on(b, 'click', () => fitAll(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)); return b; } });
        new Ctl({ position: controls }).addTo(m);
      }
      if (pendingFocus.current) m.setView(centerFor(m, [pendingFocus.current.lat, pendingFocus.current.lng], focusZoom), focusZoom, { animate: false });
      recluster(m);
      m.on('zoomend', () => { recluster(m); applyHot(hotRef.current); });
      // The search ring (`.view-ring`) shows while the map moves and fades out 1.4s after it stops.
      const host = el.current;
      m.on('movestart zoomstart', () => { window.clearTimeout(ringTimer.current); host.classList.add('ring-on'); });
      m.on('moveend', () => { window.clearTimeout(ringTimer.current); ringTimer.current = window.setTimeout(() => host.classList.remove('ring-on'), 1400); });
      applyHot(hotRef.current);
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
      window.clearTimeout(viewTimer.current);
      window.clearTimeout(ringTimer.current);
      if (map.current) { map.current.remove(); map.current = null; }
      markers.current.clear();
      clusterLayer.current = null;
      clusters.current = [];
      ringLayer.current = null;
      fitAllRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the markers in step with `points` after init: add the new keys, drop the missing ones, re-apply `hot`.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const want = new Map(points.map((pt) => [keyOf(pt), pt]));
    let changed = false;
    [...markers.current.keys()].forEach((k) => { if (!want.has(k)) { removePoint(k); changed = true; } });
    want.forEach((pt, k) => { if (!markers.current.has(k)) { addPoint(m, pt, true); changed = true; } });
    if (changed) { recluster(m); applyHot(hotRef.current); }
  }, [points]); // eslint-disable-line react-hooks/exhaustive-deps

  // A changed `fitKey` refits the view to `fitTo` (or `points`).
  const fitKeyRef = useRef(fitKey);
  useEffect(() => {
    if (fitKeyRef.current === fitKey) return;
    fitKeyRef.current = fitKey;
    if (fitAllRef.current) fitAllRef.current(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, [fitKey]);

  // The dashed search ring: created on first use, then moved and resized in place.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!ring) { if (ringLayer.current) { ringLayer.current.remove(); ringLayer.current = null; } return; }
    if (!ringLayer.current) {
      ringLayer.current = L.circle([ring.lat, ring.lng], { radius: ring.radius, className: 'view-ring', interactive: false, color: '#0f7a60', weight: 1.5, opacity: 0.7, dashArray: '6 6', fillColor: '#14b38a', fillOpacity: 0.05 }).addTo(m);
      ringLayer.current.bringToBack();
    } else {
      ringLayer.current.setLatLng([ring.lat, ring.lng]);
      ringLayer.current.setRadius(ring.radius);
    }
  }, [ring?.lat, ring?.lng, ring?.radius]); // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(ref, () => ({
    flyTo(lat, lng, z) {
      const m = map.current; if (!m) return;
      const zz = typeof z === 'number' ? z : m.getZoom();
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) m.setView(centerFor(m, [lat, lng], zz), zz, { animate: false });
      else m.flyTo(centerFor(m, [lat, lng], zz), zz, { duration: 0.8, easeLinearity: 0.3 });
    },
    fit(animate = true) { if (fitAllRef.current) fitAllRef.current(animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches); },
    getView() { return map.current ? viewOf(map.current) : null; },
  }));

  useEffect(() => {
    pendingFocus.current = focusMode === 'ensure' ? undefined : focus;
    if (!map.current || !focus) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = [focus.lat, focus.lng];
    if (focusMode === 'ensure') {
      if (isVisible(map.current, target)) return;
      map.current.panTo(centerFor(map.current, target, map.current.getZoom()), { animate: !reduced, duration: flyDuration, easeLinearity: 0.3 });
      return;
    }
    if (reduced) map.current.setView(centerFor(map.current, target, focusZoom), focusZoom, { animate: false });
    else map.current.flyTo(centerFor(map.current, target, focusZoom), focusZoom, { duration: flyDuration, easeLinearity: 0.3 });
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
    // A bubble is hot when it holds a hot pin, dim when something else is hot.
    clusters.current.forEach(({ marker, keys: ks }) => {
      const on = keys ? ks.some((k) => keys.has(k)) : false;
      const node = marker.getElement();
      if (node) { node.classList.toggle('hot', on); node.classList.toggle('dim', Boolean(keys && keys.size > 0 && !on)); }
      marker.setZIndexOffset(on ? 1500 : 500);
    });
  };
  useEffect(() => { if (map.current) applyHot(hot); }, [Array.isArray(hot) ? hot.join('|') : hot]); // eslint-disable-line react-hooks/exhaustive-deps

  // A new `tiles` swaps the base layers in place; the map, its view and its markers stay.
  useEffect(() => {
    const m = map.current;
    if (!m || !base.current || base.current.tiles === tiles) return;
    base.current.layers.forEach((l) => m.removeLayer(l));
    base.current = { tiles, layers: baseLayers(tiles) };
    base.current.layers.forEach((l) => l.addTo(m));
  }, [tiles]);

  const sat = tiles === 'satellite';
  const typeToggle = typeHost && onTilesChange && globeCenter && zoomLevel !== null && createPortal(
    <button type="button" className={`map-type${sat ? ' is-sat' : ''}`} style={thumbStyle(sat ? TILES.streets : TILES.satellite, globeCenter, zoomLevel)} aria-pressed={sat} aria-label={sat ? 'Show map' : 'Show satellite'} title={sat ? 'Map' : 'Satellite'} onClick={() => onTilesChange(sat ? 'streets' : 'satellite')}>
      <span>{sat ? 'Map' : 'Satellite'}</span>
    </button>,
    typeHost,
  );

  const showGlobe = globeBelow > 0 && zoomLevel !== null && zoomLevel < globeBelow;
  const zoomInFromGlobe = ([lat, lng]) => { if (map.current) map.current.setView([lat, lng], globeBelow, { animate: false }); };
  return (
    <div className={`leaflet-wrap${tiles === 'night' ? ' map-night' : ''}${sat ? ' map-sat' : ''}${zoomLevel !== null && zoomLevel >= 14 ? ' z-near' : ''} ${className}`} role={ariaLabel ? 'region' : undefined} aria-label={ariaLabel}>
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
      {typeToggle}
      {showGlobe && <Globe points={points} hot={hot} center={globeCenter} onZoomIn={zoomInFromGlobe} onSelect={onSelect} dark={tiles === 'night'} />}
    </div>
  );
});

export default LeafletMap;
