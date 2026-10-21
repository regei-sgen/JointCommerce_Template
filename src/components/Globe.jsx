import { useEffect, useRef } from 'react';
import { geoOrthographic, geoPath, geoGraticule10, geoDistance } from 'd3-geo';
import { feature } from 'topojson-client';
import land110 from 'world-atlas/land-110m.json';

const LAND = feature(land110, land110.objects.land);
const GRATICULE = geoGraticule10();
const keyOf = (pt) => pt.slug || `${pt.name}|${pt.city}`;

/**
 * Orthographic globe on a canvas, drawn with d3-geo. Drag to rotate, slow idle rotation
 * (none under prefers-reduced-motion), pins projected from `points`; `hot` keys are enlarged.
 * `center` ([lat, lng]) sets the initial rotation. Wheel-up, double-click or the Zoom in button
 * calls `onZoomIn([lat, lng])` with the point under the globe centre; clicking a pin calls `onSelect(pt)`.
 */
// Two palettes: light (mint ocean, pale land) and dark (near-black green ocean, ink land, teal glow).
const PALETTE = {
  light: { ocean0: '#dcf5ee', ocean1: '#b9e6d6', grat: 'rgba(11,43,38,0.07)', land: '#eef9f5', coast: 'rgba(11,43,38,0.18)', limb: 'rgba(11,43,38,0.22)', glow: 'rgba(11,43,38,0.06)', ring: '#fff', labelBg: '#fff', labelLine: 'rgba(11,43,38,0.14)' },
  dark: { ocean0: '#124740', ocean1: '#0d332c', grat: 'rgba(127,224,195,0.08)', land: '#1a4f47', coast: 'rgba(127,224,195,0.4)', limb: 'rgba(31,201,156,0.55)', glow: 'rgba(31,201,156,0.14)', ring: '#0d332c', labelBg: '#0b2b26', labelLine: 'rgba(127,224,195,0.4)' },
};

export default function Globe({ points = [], hot, center, onZoomIn, onSelect, className = '', dark = false }) {
  const canvas = useRef(null);
  const state = useRef({ rot: [0, 0], drag: null, raf: 0, idle: true, hoverKey: null });
  const propsRef = useRef({ points, hot, onZoomIn, onSelect, dark });
  propsRef.current = { points, hot, onZoomIn, onSelect, dark };

  useEffect(() => {
    if (center) state.current.rot = [-center[1], -center[0]];
  }, [center && center[0], center && center[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = canvas.current;
    if (!el) return undefined;
    const ctx = el.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const st = state.current;
    let w = 0; let h = 0; let r = 0; let last = performance.now();
    const projection = geoOrthographic().clipAngle(90);
    const path = geoPath(projection, ctx);
    const styles = getComputedStyle(document.documentElement);
    const ink = styles.getPropertyValue('--ink').trim() || '#0b2b26';
    const teal = styles.getPropertyValue('--teal').trim() || '#14b38a';
    const mint = styles.getPropertyValue('--mint').trim() || '#dcf5ee';

    const resize = () => {
      const box = el.parentElement.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.max(1, Math.floor(box.width)); h = Math.max(1, Math.floor(box.height));
      el.width = w * dpr; el.height = h * dpr; el.style.width = `${w}px`; el.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      r = Math.min(w, h) * 0.42;
      projection.translate([w / 2, h / 2]).scale(r);
    };

    const pinAt = (x, y) => {
      const { points: pts } = propsRef.current;
      let best = null; let bd = 14;
      for (const pt of pts) {
        if (typeof pt.lat !== 'number') continue;
        if (geoDistance([pt.lng, pt.lat], [-st.rot[0], -st.rot[1]]) > Math.PI / 2) continue;
        const p = projection([pt.lng, pt.lat]); if (!p) continue;
        const d = Math.hypot(p[0] - x, p[1] - y);
        if (d < bd) { bd = d; best = pt; }
      }
      return best;
    };

    const draw = () => {
      const { points: pts, hot: h0, dark: isDark } = propsRef.current;
      const c = isDark ? PALETTE.dark : PALETTE.light;
      const hotKeys = h0 == null ? new Set() : new Set(Array.isArray(h0) ? h0 : [h0]);
      projection.rotate(st.rot);
      ctx.clearRect(0, 0, w, h);
      // ocean
      const g = ctx.createRadialGradient(w / 2 - r * 0.35, h / 2 - r * 0.35, r * 0.1, w / 2, h / 2, r);
      g.addColorStop(0, c.ocean0); g.addColorStop(1, c.ocean1);
      ctx.beginPath(); ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      // graticule
      ctx.beginPath(); path(GRATICULE); ctx.strokeStyle = c.grat; ctx.lineWidth = 0.6; ctx.stroke();
      // land
      ctx.beginPath(); path(LAND); ctx.fillStyle = c.land; ctx.fill(); ctx.strokeStyle = c.coast; ctx.lineWidth = 0.7; ctx.stroke();
      // limb
      ctx.beginPath(); ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2); ctx.strokeStyle = c.limb; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(w / 2, h / 2, r + 10, 0, Math.PI * 2); ctx.strokeStyle = c.glow; ctx.lineWidth = 12; ctx.stroke();
      // pins (front hemisphere only), hot/featured on top
      const front = pts.filter((pt) => typeof pt.lat === 'number' && geoDistance([pt.lng, pt.lat], [-st.rot[0], -st.rot[1]]) <= Math.PI / 2);
      const ordered = [...front].sort((a, b) => (hotKeys.has(keyOf(a)) ? 1 : 0) - (hotKeys.has(keyOf(b)) ? 1 : 0));
      const dim = hotKeys.size > 0;
      for (const pt of ordered) {
        const p = projection([pt.lng, pt.lat]); if (!p) continue;
        const key = keyOf(pt); const isHot = hotKeys.has(key) || st.hoverKey === key;
        const rad = isHot ? 9 : pt.featured ? 6.5 : 5;
        ctx.globalAlpha = dim && !isHot ? 0.45 : 1;
        ctx.beginPath(); ctx.arc(p[0], p[1], rad + 2, 0, Math.PI * 2); ctx.fillStyle = c.ring; ctx.fill();
        ctx.beginPath(); ctx.arc(p[0], p[1], rad, 0, Math.PI * 2); ctx.fillStyle = isDark ? (isHot || pt.featured ? mint : teal) : (isHot || pt.featured ? ink : teal); ctx.fill();
        if (isHot && pt.name) {
          ctx.globalAlpha = 1; ctx.font = '600 12px Inter, system-ui, sans-serif';
          const label = String(pt.name); const tw = ctx.measureText(label).width + 16;
          const lx = p[0] - tw / 2; const ly = p[1] - rad - 30;
          ctx.fillStyle = c.labelBg; ctx.strokeStyle = c.labelLine; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(lx, ly, tw, 24, 8); ctx.fill(); ctx.stroke();
          ctx.fillStyle = isDark ? mint : ink; ctx.textBaseline = 'middle'; ctx.fillText(label, lx + 8, ly + 12);
        }
      }
      ctx.globalAlpha = 1;
    };

    const tick = (now) => {
      const dt = Math.min(50, now - last); last = now;
      if (st.idle && !st.drag && !reduced) st.rot = [st.rot[0] + dt * 0.004, st.rot[1]];
      draw();
      st.raf = requestAnimationFrame(tick);
    };

    const onDown = (e) => { st.drag = { x: e.clientX, y: e.clientY, rot: [...st.rot] }; st.idle = false; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; };
    const onMove = (e) => {
      if (st.drag) {
        const k = 0.35 * (300 / r);
        st.rot = [st.drag.rot[0] + (e.clientX - st.drag.x) * k, Math.max(-85, Math.min(85, st.drag.rot[1] - (e.clientY - st.drag.y) * k))];
        return;
      }
      const box = el.getBoundingClientRect();
      const pt = pinAt(e.clientX - box.left, e.clientY - box.top);
      st.hoverKey = pt ? keyOf(pt) : null; st.idle = !pt;
      el.style.cursor = pt ? 'pointer' : 'grab';
    };
    const onUp = (e) => {
      if (!st.drag) return;
      const moved = Math.hypot(e.clientX - st.drag.x, e.clientY - st.drag.y) > 4;
      st.drag = null; el.style.cursor = 'grab';
      if (!moved) { const box = el.getBoundingClientRect(); const pt = pinAt(e.clientX - box.left, e.clientY - box.top); if (pt && propsRef.current.onSelect) propsRef.current.onSelect(pt); }
      setTimeout(() => { st.idle = !st.hoverKey; }, 1500);
    };
    const onLeave = () => { st.hoverKey = null; st.idle = true; };
    const zoomIn = () => propsRef.current.onZoomIn && propsRef.current.onZoomIn([-st.rot[1], -st.rot[0]]);
    const onWheel = (e) => { e.preventDefault(); if (e.deltaY < 0) zoomIn(); };
    const onDbl = () => zoomIn();

    resize(); st.raf = requestAnimationFrame(tick);
    const ro = new ResizeObserver(resize); ro.observe(el.parentElement);
    el.addEventListener('pointerdown', onDown); el.addEventListener('pointermove', onMove); el.addEventListener('pointerup', onUp);
    el.addEventListener('pointerleave', onLeave); el.addEventListener('wheel', onWheel, { passive: false }); el.addEventListener('dblclick', onDbl);
    el.style.cursor = 'grab';
    return () => {
      cancelAnimationFrame(st.raf); ro.disconnect();
      el.removeEventListener('pointerdown', onDown); el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointerleave', onLeave); el.removeEventListener('wheel', onWheel); el.removeEventListener('dblclick', onDbl);
    };
  }, []);

  return (
    <div className={`globe ${className}`}>
      <canvas ref={canvas} role="img" aria-label="Globe with store locations" />
      <button type="button" className="globe-zoom" onClick={() => onZoomIn && onZoomIn([-state.current.rot[1], -state.current.rot[0]])} aria-label="Zoom in to the map">Zoom in</button>
    </div>
  );
}
