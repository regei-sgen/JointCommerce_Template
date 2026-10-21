import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TILES = {
  dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  light: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  positron: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  streets: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
};
const ATTR = 'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ';
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
 * - `tiles` is 'dark' (default, sepia-tinted), 'light' (Esri gray base), 'streets' (Esri streets, desaturated by
 *   CSS) or 'positron' (CARTO light; needs an API key on cartocdn).
 * - `onSelect(pt)` is called from the popup card's button (dom pins only).
 * - `fitControl=true` adds a button that refits the view to all points.
 * - `pins` is 'svg' (default: circle markers in the SVG renderer, which Leaflet scales during zoom
 *   animation) or 'dom' (div-icon markers, repositioned during zoom; styled by `.pin` rules).
 * - `eager` creates the map on mount; otherwise it is created when the host scrolls within 400px
 *   of the viewport, so below-the-fold maps do not fetch tiles on page load.
 */
export default function LeafletMap({
  className = '', center, zoom = 9, focus, points = [], interactive = true, focusZoom = 11, eager = false,
  hot, fit = false, tiles = 'dark', wheel = false, flyDuration = 1.6, ariaLabel, pins = 'svg', focusMode = 'fly', onSelect, fitControl = false,
}) {
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
      if (tiles === 'positron') L.tileLayer(TILES.positron, { attribution: ATTR_CARTO, subdomains: 'abcd', maxZoom: MAX_ZOOM, className: 'tiles-positron', updateWhenIdle: true, keepBuffer: 1 }).addTo(m);
      else L.tileLayer(TILES[tiles] || TILES.dark, { attribution: ATTR, maxZoom: MAX_ZOOM, className: tiles === 'light' ? 'tiles-light' : tiles === 'streets' ? 'tiles-streets' : 'tiles-ink', updateWhenIdle: true, keepBuffer: 1 }).addTo(m);
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
            card.innerHTML = `<span class="bd bd-ink pin-card-bd">${code}</span><span class="pin-card-copy"><strong>${esc(pt.name)}</strong><span>${esc([pt.city, pt.status].filter(Boolean).join(' · '))}</span></span>`;
            if (onSelectRef.current) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ink sm pin-card-btn'; b.textContent = 'Open'; b.addEventListener('click', () => onSelectRef.current && onSelectRef.current(pt)); card.appendChild(b); }
            marker.bindPopup(card, { closeButton: false, className: 'pin-pop', maxWidth: 320, offset: [0, -4] });
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
      const fitAll = (animate) => { if (points.length) m.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [48, 48], maxZoom: 12, animate }); };
      if (fit) fitAll(false);
      if (fitControl && interactive && points.length) {
        const Ctl = L.Control.extend({ onAdd() { const b = L.DomUtil.create('button', 'map-fit'); b.type = 'button'; b.title = 'Show all'; b.setAttribute('aria-label', 'Show all pins'); b.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'; L.DomEvent.disableClickPropagation(b); L.DomEvent.on(b, 'click', () => fitAll(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)); return b; } });
        new Ctl({ position: 'topleft' }).addTo(m);
      }
      if (pendingFocus.current) m.setView([pendingFocus.current.lat, pendingFocus.current.lng], focusZoom, { animate: false });
      applyHot(hot);
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

  return <div ref={el} className={`leaflet-host ${className}`} role={ariaLabel ? 'region' : undefined} aria-label={ariaLabel} />;
}
