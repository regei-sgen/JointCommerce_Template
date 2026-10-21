import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TILES = {
  dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  light: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
};
const ATTR = 'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ';
const MAX_ZOOM = 16;
const keyOf = (pt) => pt.slug || `${pt.name}|${pt.city}`;

/**
 * Leaflet map tinted to the ink/teal palette.
 * - `focus` ({lat,lng}) flies the view to that point whenever it changes (`flyDuration` seconds).
 * - `interactive=false` disables all handlers (background use).
 * - `points` renders teal circle markers with a popup. Markers are created once, on init; remount
 *   (change `key`) to render a different set.
 * - `hot` is a point key (slug, or name|city) or an array of keys: those markers are enlarged and
 *   brought to the front while the rest dim.
 * - `fit=true` fits the initial view to all points instead of using center/zoom.
 * - `tiles` is 'dark' (default, sepia-tinted) or 'light' (untinted gray base).
 * - `eager` creates the map on mount; otherwise it is created when the host scrolls within 400px
 *   of the viewport, so below-the-fold maps do not fetch tiles on page load.
 */
export default function LeafletMap({
  className = '', center, zoom = 9, focus, points = [], interactive = true, focusZoom = 11, eager = false,
  hot, fit = false, tiles = 'dark', wheel = false, flyDuration = 1.6, ariaLabel,
}) {
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
      L.tileLayer(TILES[tiles] || TILES.dark, { attribution: ATTR, maxZoom: MAX_ZOOM, className: tiles === 'light' ? 'tiles-light' : 'tiles-ink', updateWhenIdle: true, keepBuffer: 1 }).addTo(m);
      points.forEach((pt) => {
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
      if (fit && points.length) {
        m.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [48, 48], maxZoom: 12, animate: false });
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
    pendingFocus.current = focus;
    if (!map.current || !focus) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) map.current.setView([focus.lat, focus.lng], focusZoom, { animate: false });
    else map.current.flyTo([focus.lat, focus.lng], focusZoom, { duration: flyDuration, easeLinearity: 0.3 });
  }, [focus?.lat, focus?.lng, focusZoom, flyDuration]);

  const applyHot = (h) => {
    const keys = h == null ? null : new Set(Array.isArray(h) ? h : [h]);
    markers.current.forEach(({ marker, halo }, k) => {
      const on = keys ? keys.has(k) : false;
      const dim = keys && keys.size > 0 && !on;
      marker.setStyle({ radius: on ? 11 : 8, fillColor: on ? '#0b2b26' : '#14b38a', color: on ? '#7fe0c3' : '#dcf5ee', fillOpacity: dim ? 0.45 : 1 });
      halo.setStyle({ fillOpacity: on ? 0.32 : dim ? 0.08 : 0.22 });
      if (on) marker.bringToFront();
    });
  };
  useEffect(() => { if (map.current) applyHot(hot); }, [Array.isArray(hot) ? hot.join('|') : hot]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={el} className={`leaflet-host ${className}`} role={ariaLabel ? 'region' : undefined} aria-label={ariaLabel} />;
}
