// Turns the raw API snapshot in data/crawl/ into the compact JSON the app loads from public/data/jc/.
// usage: node scripts/build-jc-data.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IN = path.join(ROOT, 'data', 'crawl');
const OUT = path.join(ROOT, 'public', 'data', 'jc');
await mkdir(OUT, { recursive: true });

const read = async (n) => (existsSync(path.join(IN, n)) ? JSON.parse(await readFile(path.join(IN, n), 'utf8')) : null);
const write = async (n, d) => { const s = JSON.stringify(d); await writeFile(path.join(OUT, n), s); console.log(n.padEnd(18), (s.length / 1024).toFixed(0).padStart(6), 'KB'); };

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== false));
const initials = (name) => { const w = String(name || '').replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean); if (!w.length) return '?'; if (/^\d+$/.test(w[0])) return w[0].slice(0, 3); return w.length === 1 ? w[0].slice(0, 2).toUpperCase() : (w[0][0] + w[1][0]).toUpperCase(); };
const slugify = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const CAT = (c) => { const n = String(c || '').toLowerCase(); if (/pre[- ]?roll/.test(n)) return 'Pre-rolls'; if (/vape|cart/.test(n)) return 'Vapes'; if (/edible|gumm|chocolate|drink|beverage/.test(n)) return 'Edibles'; if (/concentrate|resin|rosin|wax|shatter|dab/.test(n)) return 'Concentrates'; if (/flower|bud/.test(n)) return 'Flower'; if (/tincture/.test(n)) return 'Tinctures'; if (/topical/.test(n)) return 'Topicals'; return c ? String(c) : 'Other'; };
const TYPE = (t) => { const n = String(t || '').toLowerCase(); if (n.startsWith('sativa')) return 'sat'; if (n.startsWith('indica')) return 'ind'; if (n === 'cbd') return 'hyb'; return 'hyb'; };
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const hhmm = (s) => { if (!s) return null; const [h, m] = s.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; const hh = h % 12 || 12; return `${hh}:${String(m).padStart(2, '0')} ${ap}`; };

// menu_html → { p: provider, src: iframe URL | null, js: Dutchie embed script | null, cats: [], modes: [] }.
// Only URLs and attribute lists leave this function; no markup from the field is kept.
const attr = (h, name) => { const m = h.match(new RegExp(`${name}=["']([^"']*)["']`)); return m ? m[1] : ''; };
const firstIframeSrc = (h) => { const m = h.match(/<iframe[\s\S]*?src=["']([^"']+)["']/i); return m ? m[1].replace(/&amp;/g, '&') : ''; };
function menuEmbed(html) {
  const h = String(html || '').trim();
  if (!h) return null;
  const cats = attr(h, 'data-store-cats').split(/,\s*/).map((c) => c.trim()).filter(Boolean);
  const modes = attr(h, 'data-store-modes').split(/,\s*/).map((c) => c.trim().toLowerCase()).filter(Boolean);
  const out = (p, src, js) => clean({ p, src: src || null, js: js || null, cats, modes });
  if (!/[<>]/.test(h)) return null; // no markup at all (marker strings)
  const dj = h.match(/https:\/\/dutchie\.com\/api\/v2\/embedded-menu\/([A-Za-z0-9]+)\.js/);
  if (dj) return out('Dutchie', null, dj[0]);
  const dm = attr(h, 'data-dutchie-menu') || attr(h, 'data-dutchie-src') || attr(h, 'data-dutchie-iframe');
  if (dm) return out('Dutchie', /^https?:/.test(dm) ? dm : `https://dutchie.com/${dm.replace(/^\/+/, '')}`, null);
  const jane = attr(h, 'data-jane-src');
  if (jane) return out('Jane', jane, null);
  const src = firstIframeSrc(h);
  if (!src) return /JC HTML INSTALL|data-jc-menu/.test(h) ? out('JointCommerce', null, null) : null;
  const host = (src.match(/^https?:\/\/([^/]+)/) || ['', ''])[1].toLowerCase();
  const p = /iheartjane/.test(host) ? 'Jane' : /getmeadow/.test(host) ? 'Meadow' : /leafly/.test(host) ? 'Leafly' : /dispenseapp/.test(host) ? 'Dispense' : /sweede/.test(host) ? 'Sweede' : /dutchie/.test(host) ? 'Dutchie' : 'Store site';
  return out(p, src, null);
}

// Two crawls of the same listing: the per-state pass first, then the older paged pass (used for ids the first lacks).
const rawD = [...((await read('dispensaries-by-state.json')) || []), ...((await read('dispensaries-by-state-desc.json')) || []), ...((await read('dispensaries.json')) || [])];
const rawB = (await read('brands.json')) || [];
const rawS = (await read('strains.json')) || [];
const geo = await read('geo.json');
const links = (await read('brand-links.json')) || {};
const details = (await read('details.json')) || {};
const menus = (await read('menus.json')) || {};
const brandDetails = (await read('brand-details.json')) || {};

// ---- dispensaries (no descriptions; those live in details) ----
const embeds = {};
// One row per store id: the crawl pages overlap, so the same store can appear more than once.
const seenIds = new Map();
for (const d of rawD) { if (!d.slug || !d.name) continue; const prev = seenIds.get(d.id); if (!prev || (!String(prev.menu_html || '').trim() && String(d.menu_html || '').trim())) seenIds.set(d.id, d); }
console.log('raw rows', rawD.length, 'unique stores', seenIds.size);
const dispensaries = [...seenIds.values()].map((d) => {
  const embed = menuEmbed(d.menu_html);
  if (embed) embeds[d.slug] = embed;
  return clean({
    slug: d.slug, name: d.name, code: initials(d.name), city: d.city || '', state: d.state || '', zip: d.zip_code || '',
    lat: num(d.latitude), lng: num(d.longitude), rating: num(d.rating) || 0, reviews: num(d.review_count) || 0,
    open: !!d.is_open, status: d.is_open ? 'Open now' : 'Closed now', delivery: !!d.has_delivery || !!(embed && embed.modes && embed.modes.includes('delivery')), pickup: d.has_pickup !== false, verified: !!d.is_verified, claimed: !!d.is_claimed,
    pinned: !!d.is_pinned, premium: !!d.is_premium, phone: d.phone_number || '', website: d.website || '', logo: d.logo || '',
    type: d.dispensary_type && d.dispensary_type.title ? d.dispensary_type.title : '',
    products: details[d.slug] ? num(details[d.slug].menu_item_count) || 0 : 0,
    menu: embed ? embed.p : '',
  });
});
const dBySlug = Object.fromEntries(dispensaries.map((d) => [d.slug, d]));
const stateAbbrByName = {};
if (geo) for (const s of geo.states) stateAbbrByName[s.name.toLowerCase()] = s.state_id;

// ---- menus → products ----
const menusOut = {};
const products = [];
for (const [slug, items] of Object.entries(menus)) {
  const store = dBySlug[slug];
  if (!store || !Array.isArray(items)) continue;
  menusOut[slug] = items.filter((m) => m && m.name && !m.is_discontinued).map((m, i) => {
    const brand = typeof m.brand === 'string' ? m.brand : (m.brand && (m.brand.name || m.brand.label)) || '';
    const category = CAT(m.category);
    const meta = [category, m.weight, brand].filter(Boolean).join(' · ');
    const price = num(m.price); const was = num(m.original_price);
    return clean({ slug: `p-${slug}-${slugify(m.slug || m.name)}-${i}`, name: m.name, meta, category, price, was: was && price && was > price ? was : null, pct: was && price && was > price ? Math.round((1 - price / was) * 100) : null, thc: num(m.thc), type: m.strain_type ? TYPE(m.strain_type) : null, brand, inStock: m.in_stock !== false, store: store.name, storeSlug: slug, featured: !!(store.pinned || store.premium) });
  });
  products.push(...menusOut[slug]);
}

// ---- deals from store details ----
const deals = [];
for (const [slug, det] of Object.entries(details)) {
  const store = dBySlug[slug]; if (!store || !Array.isArray(det.deals)) continue;
  det.deals.forEach((x, i) => {
    if (x.is_active === false) return;
    const pct = num(x.discount_value); const end = x.end_date ? new Date(x.end_date) : null;
    const ends = end ? (end.toDateString() === new Date().toDateString() ? 'Tonight' : end.toLocaleDateString('en-US', { weekday: 'long' })) : 'Ongoing';
    deals.push(clean({ slug: `deal-${slug}-${slugify(x.slug || x.title)}-${i}`, name: x.title || x.headline || 'Deal', meta: (x.description || '').slice(0, 90), pct: pct && pct <= 100 ? pct : null, price: null, was: null, store: store.name, storeSlug: slug, ends, category: '', link: x.link || '', featured: !!(x.featured || store.pinned || store.premium) }));
  });
}

// ---- links: brand↔store, strain↔store ----
const storesOfBrand = {}; const brandsOfStore = {};
for (const b of rawB) {
  const set = new Set(((links[b.slug] && links[b.slug].stores) || []).map((s) => s.slug).filter((s) => dBySlug[s]));
  for (const [slug, items] of Object.entries(menusOut)) if (items.some((m) => m.brand && m.brand.toLowerCase() === b.name.toLowerCase())) set.add(slug);
  storesOfBrand[b.slug] = [...set];
  for (const s of set) (brandsOfStore[s] ||= []).push(b.slug);
}
const strainNames = rawS.filter((s) => s.slug && s.name && s.name.length >= 4).map((s) => [s.slug, s.name.toLowerCase()]);
const storesOfStrain = {}; const strainsOfStore = {};
for (const [slug, items] of Object.entries(menusOut)) {
  const names = items.map((m) => m.name.toLowerCase());
  for (const [sslug, sname] of strainNames) {
    if (names.some((n) => n.includes(sname))) { (storesOfStrain[sslug] ||= []).push(slug); (strainsOfStore[slug] ||= []).push(sslug); }
  }
}

// ---- brands ----
const brands = rawB.filter((b) => b.slug && b.name).map((b, i) => {
  const det = brandDetails[b.slug] || {};
  const stores = storesOfBrand[b.slug] || [];
  const states = [...new Set(stores.map((s) => dBySlug[s].state).filter(Boolean))];
  const own = b.state ? stateAbbrByName[String(b.state).toLowerCase()] || (String(b.state).length === 2 ? b.state : null) : null;
  if (own && !states.includes(own)) states.push(own);
  const type = b.brand_type_display || 'Other';
  const social = Object.fromEntries(Object.entries(det.social || {}).filter(([, v]) => v));
  const about = String(det.description || b.description || '').split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean).slice(0, 6);
  const parent = det.parent_brand && det.parent_brand.slug !== b.slug ? { name: det.parent_brand.name, slug: det.parent_brand.slug } : null;
  const children = (det.child_brands || []).filter((c) => c && c.slug).map((c) => ({ name: c.name, slug: c.slug }));
  return clean({ slug: b.slug, name: b.name, initial: initials(b.name), type, category: type, menus: stores.length, products: num(b.product_count) || (links[b.slug] ? links[b.slug].products.length : 0), states, blurb: (b.description || '').replace(/\s+/g, ' ').slice(0, 140), about, verified: !!b.is_verified, claimed: !!b.is_claimed, logo: b.logo || '', website: b.website || '', social: Object.keys(social).length ? social : null, parent, children: children.length ? children : null, address: b.address || '', city: b.city || '', stateName: b.state || '', country: b.country || '', rating: num(b.rating) || 0, reviews: num(b.review_count) || 0, featured: !!(b.is_verified || b.is_claimed), pic: i % 4, tags: [] });
});

// ---- strains ----
const strains = rawS.filter((s) => s.slug && s.name).map((s) => clean({
  slug: s.slug, name: s.name, type: TYPE(s.strain_type), typeLabel: s.strain_type_display || '', thc: num(s.thc_max) || num(s.thc_min) || 0, cbd: num(s.cbd_max) || 0,
  effects: (s.top_effects || []).map((e) => e.effect && e.effect.name).filter(Boolean).slice(0, 3),
  flavors: (s.top_flavors || []).map((f) => (f.flavor && f.flavor.name) || f.name).filter(Boolean).slice(0, 3),
  lineage: s.strain_type_display || '', menus: (storesOfStrain[s.slug] || []).length, isNew: false, rating: num(s.avg_rating) || 0, blurb: (s.short_description || '').slice(0, 140), featured: false,
}));

// ---- details (hours, about, amenities, contact) for crawled stores ----
const detailsOut = {};
for (const [slug, det] of Object.entries(details)) {
  const h = det.hours || {};
  const hours = DAYS.map((day) => { const x = h[day] || {}; return { day: cap(day), open: x.open === false ? 'Closed' : hhmm(x.start) || '9:00 AM', close: x.open === false ? '' : hhmm(x.end) || '5:00 PM' }; });
  const about = String(det.description || '').split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean).slice(0, 6);
  const amenities = (det.amenities || []).map((a) => (typeof a === 'string' ? a : a.amenity || a.name)).filter(Boolean);
  detailsOut[slug] = clean({ hours, about, amenities, address: det.address || '', address2: det.address2 || '', zip: det.zip_code || '', phone: det.phone_number || '', website: det.website || '', deliveryRadius: num(det.delivery_radius_miles), menuCount: num(det.menu_item_count) || 0, license: det.license_number || '' });
}

// ---- geo ----
const geoOut = geo ? {
  states: geo.states.filter((s) => s.dispensary_count > 0).map((s) => ({ abbr: s.state_id, name: s.name, slug: s.slug, lat: num(s.latitude), lng: num(s.longitude), count: s.dispensary_count })),
  cities: Object.fromEntries(Object.entries(geo.cities).map(([ab, list]) => [ab, (list || []).filter((c) => c.name && num(c.latitude) !== null).map((c) => ({ name: c.name, slug: c.slug || slugify(c.name), lat: num(c.latitude), lng: num(c.longitude), count: c.dispensary_count || 0 }))])),
} : null;

await write('dispensaries.json', dispensaries);
await write('brands.json', brands);
await write('strains.json', strains);
await write('products.json', products);
await write('deals.json', deals);
await write('menus.json', menusOut);
await write('embeds.json', embeds);
await write('details.json', detailsOut);
await write('links.json', { storesOfBrand, brandsOfStore, storesOfStrain, strainsOfStore });
if (geoOut) await write('geo.json', geoOut);
await write('meta.json', { builtAt: new Date().toISOString(), counts: { dispensaries: dispensaries.length, brands: brands.length, strains: strains.length, products: products.length, deals: deals.length, menus: Object.keys(menusOut).length, embeds: Object.keys(embeds).length, delivery: dispensaries.filter((d) => d.delivery).length, details: Object.keys(detailsOut).length, cities: geoOut ? Object.values(geoOut.cities).reduce((n, l) => n + l.length, 0) : 0 } });
console.log('done');
