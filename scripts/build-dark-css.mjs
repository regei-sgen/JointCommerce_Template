// Generates src/concept/dark.css: for every CSS declaration that names a colour in the app's stylesheets, a twin
// rule under html[data-theme="dark"] with the colour's lightness flipped and its hue kept (OKLCH). Shadows stay
// dark; 0-offset 0-blur rings flip like any colour. "Islands" (surfaces already dark, or holding logos and art)
// keep their light-mode values and get the light tokens back. Run: node scripts/build-dark-css.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = ['node_modules/leaflet/dist/leaflet.css', 'src/styles.css', 'src/concept/concept.css'];
const OUT = 'src/concept/dark.css';
const D = 'html[data-theme="dark"]';
// Classes that sit on <html> itself: a selector starting with one is compounded onto html, not nested under it.
const HTML_CLASSES = ['cx-map', 'cx-on'];
// .hm-art-logo is left out: the logo <img> keeps its white backing (.hm-tile-logo), and a tile whose logo failed
// to load flips like any other tile.
// .modal-aside-*: the auth dialog's dark side panel (photo/gradient with white copy) keeps its light-mode look.
const ISLAND = /\.(hm-banner-ink|hm-art|bd-logo|hm-tile-logo|modal-aside(?:-[\w-]+)?)(?![\w-])/;

// ---------- colour maths (sRGB <-> OKLab) ----------
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function rgbToOklch([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map((v) => toLin(v / 255));
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), (Math.atan2(B, A) * 180) / Math.PI];
}
function oklchToRgb([L, C, H]) {
  const a = C * Math.cos((H * Math.PI) / 180); const b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return rgb.map((v) => Math.round(Math.min(1, Math.max(0, toSrgb(Math.min(1, Math.max(0, v))))) * 255));
}
// Lightness map: white -> dark surface, ink -> near-white text, mid teal stays mid.
const LMAP = [[0, 0.97], [0.27, 0.93], [0.4, 0.83], [0.47, 0.77], [0.55, 0.73], [0.67, 0.69], [0.78, 0.52], [0.86, 0.4], [0.93, 0.3], [0.96, 0.255], [0.985, 0.22], [1, 0.195]];
function mapL(L) {
  for (let i = 1; i < LMAP.length; i++) {
    const [x0, y0] = LMAP[i - 1]; const [x1, y1] = LMAP[i];
    if (L <= x1) return y0 + ((L - x0) / (x1 - x0)) * (y1 - y0);
  }
  return LMAP[LMAP.length - 1][1];
}
function flip(rgba) {
  const [r, g, b, a] = rgba;
  let [L, C, H] = rgbToOklch([r, g, b]);
  const L2 = mapL(L);
  if (C < 0.015) { C = L2 < 0.5 ? 0.012 : 0.008; H = 175; } // neutrals pick up the brand's green tint
  else if (L2 < 0.42) C *= 0.6; // dark surfaces from pale tints: less saturated
  else if (L2 > 0.85) C *= 0.4; // near-white text from ink: only a hint of green
  const out = oklchToRgb([L2, C, H]);
  let a2 = a;
  if (a < 1 && L < 0.5) a2 = Math.min(1, a * 1.5); // dark-on-light washes become light-on-dark: a bit stronger
  return [...out, a2];
}
const shadowOf = ([, , , a]) => [0, 0, 0, Math.min(0.75, a * 1.7 + 0.05)];
// A semi-transparent dark background is a scrim (modal and drawer backdrops, labels over photos): it stays dark.
// Low-alpha dark washes (hover tints, lines) are not scrims and flip.
const isScrim = ([r, g, b, a]) => a >= 0.3 && a < 1 && rgbToOklch([r, g, b])[0] < 0.4;
// Semi-transparent white text or borders only appear over dark surfaces or photos: they stay as they are.
const isVeil = ([r, g, b, a]) => a < 1 && rgbToOklch([r, g, b])[0] > 0.9;

// ---------- colour literals ----------
const NAMED = { white: [255, 255, 255, 1], black: [0, 0, 0, 1] };
const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|\b(?:white|black)\b/g;
function parseColor(s) {
  if (NAMED[s]) return NAMED[s];
  if (s[0] === '#') {
    let h = s.slice(1);
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  const p = s.replace(/rgba?\(|\)/g, '').split(/[\s,/]+/).filter(Boolean);
  if (p.length < 3 || p.some((x) => x.includes('var('))) return null;
  const v = p.map((x) => (x.endsWith('%') ? parseFloat(x) / 100 : parseFloat(x)));
  return [v[0], v[1], v[2], p[3] !== undefined ? v[3] : 1];
}
const fmt = ([r, g, b, a]) => (a >= 1 ? `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}` : `rgba(${r}, ${g}, ${b}, ${+a.toFixed(3)})`);
const mapColors = (v, fn) => v.replace(COLOR_RE, (m) => { const c = parseColor(m); return c ? fmt(fn(c)) : m; });

// Split on a separator at paren depth 0 (keeps url(), rgba(), var() intact).
function splitTop(s, sep) {
  const out = []; let depth = 0; let q = null; let cur = '';
  for (const ch of s) {
    if (q) { cur += ch; if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === '(') depth++; else if (ch === ')') depth--;
    if (ch === sep && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}
// Shadow lists: a layer with no offsets and no blur is a ring (a border) and flips; anything else stays a shadow.
function mapShadowList(v) {
  return splitTop(v, ',').map((layer) => {
    const colors = layer.match(COLOR_RE) || [];
    const lengths = layer.replace(COLOR_RE, ' ').replace(/\binset\b/, ' ').trim().split(/\s+/).filter((t) => /^-?[\d.]+(px|em|rem)?$/.test(t)).map(parseFloat);
    const ring = lengths.length >= 3 && lengths[0] === 0 && lengths[1] === 0 && lengths[2] === 0;
    return colors.length ? mapColors(layer, ring ? flip : shadowOf) : layer;
  }).join(',');
}
const looksLikeShadowList = (v) => splitTop(v, ',').some((l) => (l.replace(COLOR_RE, ' ').match(/-?[\d.]+px/g) || []).length >= 2);
const COLOR_PROPS = /^(color|background(-color|-image)?|border(-(top|right|bottom|left))?(-color)?|outline(-color)?|fill|stroke|caret-color|text-decoration(-color)?|scrollbar-color|accent-color|column-rule|-webkit-text-fill-color|stop-color)$/;
const TWIN_PROPS = /^(box-shadow|text-shadow|-webkit-box-shadow|filter|-webkit-filter)$/;
function darkValue(prop, value, onScrim = false) {
  // Text on a rule's own scrim background stays as written (white on a dark pill).
  if (onScrim && prop === 'color') return value;
  // A colour declaration with no literal (var(), none, transparent, inherit) is copied unchanged: every colour
  // declaration needs a twin, or a lower-specificity twin with a literal outranks a higher-specificity light rule
  // that only uses a token (e.g. a .on state written with var(--teal)).
  if (!COLOR_RE.test(value)) { COLOR_RE.lastIndex = 0; return COLOR_PROPS.test(prop) || TWIN_PROPS.test(prop) ? value : null; }
  COLOR_RE.lastIndex = 0;
  if (/url\(/.test(value) && !/gradient/.test(value)) return null;
  if (prop === 'box-shadow' || prop === 'text-shadow' || prop === '-webkit-box-shadow') return mapShadowList(value);
  if (prop === 'filter' || prop === '-webkit-filter') return value.replace(/drop-shadow\(([^()]*(\([^()]*\))?[^()]*)\)/g, (m) => mapColors(m, shadowOf));
  if (prop.startsWith('--')) return looksLikeShadowList(value) ? mapShadowList(value) : mapColors(value, flip);
  if (/^background/.test(prop)) return mapColors(value, (c) => (isScrim(c) ? c : flip(c)));
  if (/^(color|border|outline)/.test(prop)) return mapColors(value, (c) => (isVeil(c) ? c : flip(c)));
  if (COLOR_PROPS.test(prop)) return mapColors(value, flip);
  return null;
}

// ---------- CSS parsing ----------
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
function parseBlock(s) {
  const items = []; let i = 0;
  while (i < s.length) {
    const open = s.indexOf('{', i);
    if (open < 0) break;
    const head = s.slice(i, open).trim();
    let depth = 1; let j = open + 1;
    while (j < s.length && depth) { if (s[j] === '{') depth++; else if (s[j] === '}') depth--; j++; }
    const body = s.slice(open + 1, j - 1);
    if (head.startsWith('@media') || head.startsWith('@supports')) items.push({ at: head, children: parseBlock(body) });
    else if (!head.startsWith('@')) items.push({ sel: head.replace(/^[;\s]+/, ''), decls: body });
    i = j;
  }
  return items;
}
function darkSelector(part) {
  const p = part.trim();
  if (p.startsWith(':root')) return D + p.slice(5);
  if (/^html\b/.test(p)) return D + p.slice(4);
  if (/^body\b/.test(p)) return `${D} ${p}`;
  const m = p.match(/^\.([\w-]+)/);
  if (m && HTML_CLASSES.includes(m[1])) return D + p;
  return `${D} ${p}`;
}
function emitRule(sel, decls) {
  const flipped = []; const kept = [];
  const onScrim = splitTop(decls, ';').some((d) => { const k = d.indexOf(':'); if (k < 0 || !/^\s*background(-color)?\s*$/.test(d.slice(0, k))) return false; const m = d.slice(k + 1).match(COLOR_RE); COLOR_RE.lastIndex = 0; const c = m && m.length === 1 ? parseColor(m[0]) : null; return !!c && isScrim(c); });
  for (const d of splitTop(decls, ';')) {
    const k = d.indexOf(':'); if (k < 0) continue;
    const prop = d.slice(0, k).trim(); let value = d.slice(k + 1).trim();
    const imp = /!important\s*$/.test(value); value = value.replace(/\s*!important\s*$/, '');
    const dv = darkValue(prop, value, onScrim);
    if (dv === null) continue;
    flipped.push(`${prop}: ${dv}${imp ? ' !important' : ''}`);
    kept.push(`${prop}: ${value}${imp ? ' !important' : ''}`);
  }
  if (!flipped.length) return '';
  const parts = splitTop(sel, ',').map((x) => x.trim()).filter(Boolean);
  const island = parts.filter((x) => ISLAND.test(x)); const normal = parts.filter((x) => !ISLAND.test(x));
  let out = '';
  if (normal.length) out += `${normal.map(darkSelector).join(', ')} { ${flipped.join('; ')}; }\n`;
  if (island.length) out += `${island.map(darkSelector).join(', ')} { ${kept.join('; ')}; }\n`;
  return out;
}
function emit(items, indent = '') {
  let out = '';
  for (const it of items) {
    if (it.at) { const inner = emit(it.children, `${indent}  `); if (inner.trim()) out += `${indent}${it.at} {\n${inner}${indent}}\n`; }
    else { const r = emitRule(it.sel, it.decls); if (r) out += r.split('\n').filter(Boolean).map((l) => indent + l).join('\n') + '\n'; }
  }
  return out;
}

// Light tokens, restored inside islands so var(--ink) etc. resolve to their light values there.
const lightTokens = new Map();
let body = '';
for (const f of SOURCES) {
  const css = stripComments(readFileSync(resolve(root, f), 'utf8'));
  const items = parseBlock(css);
  for (const it of items) if (it.sel && /(^|,)\s*(:root|\.cx)\s*(,|$)/.test(it.sel)) for (const d of splitTop(it.decls, ';')) { const k = d.indexOf(':'); const p = d.slice(0, k).trim(); if (p.startsWith('--')) lightTokens.set(p, d.slice(k + 1).trim()); }
  body += `/* ---- from ${f} ---- */\n${emit(items)}`;
}
const islandSel = `${D} :is(.hm-banner-ink, .hm-art, .bd-logo, .hm-tile-logo, .modal-aside)`;
const header = `/* GENERATED by scripts/build-dark-css.mjs from ${SOURCES.join(', ')}. Do not edit; edit the sources or the script. */\n${D} { color-scheme: dark; }\n${islandSel} { ${[...lightTokens].map(([k, v]) => `${k}: ${v}`).join('; ')}; color-scheme: light; }\n`;
// Hand-written dark rules that a colour flip cannot express (raster tiles and images).
const extras = `
/* ---- hand-written ---- */
${D} .leaflet-wrap:not(.map-sat) .leaflet-container .leaflet-tile-pane { filter: invert(0.9) hue-rotate(180deg) saturate(0.55) brightness(0.92) contrast(0.92); }
${D} .hm-mm-tiles img, ${D} .hm-card-ph:hover .hm-mm-tiles img { filter: invert(0.9) hue-rotate(180deg) saturate(0.5) brightness(0.92) contrast(0.92); }
${D} .map-sat ~ .map-brand { color: #fff; }
${D} .cx-top-mark, ${D} .cx-mark { background: #fff; padding: 2px; box-sizing: border-box; }
`;
writeFileSync(resolve(root, OUT), header + body + extras);
console.log(`[dark-css] wrote ${OUT}: ${(header + body + extras).split('\n').length} lines, ${lightTokens.size} light tokens restored in islands`);
