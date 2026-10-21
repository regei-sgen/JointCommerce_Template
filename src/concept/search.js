// One search index over the listing datasets. `search(q, cat)` returns ranked matches per category;
// `stockedAt(cat, item)` returns the dispensaries that carry an item, so every category can be drawn
// on the same map.
import { allDispensaries, allBrands, allStrains, allDeals } from '../listingData.js';
import { dispensaryDetails } from '../data.js';
import { milesBetween } from './geo.js';

export const CATS = [
  { key: 'dispensaries', label: 'Dispensaries', one: 'dispensary', placeholder: 'Search dispensaries by name or city' },
  { key: 'deals', label: 'Deals', one: 'deal', placeholder: 'Search deals by product, brand or store' },
  { key: 'brands', label: 'Brands', one: 'brand', placeholder: 'Search brands by name or product type' },
  { key: 'products', label: 'Products', one: 'product', placeholder: 'Search products by name, brand or category' },
  { key: 'strains', label: 'Strains', one: 'strain', placeholder: 'Search strains by name, lineage or effect' },
];
export const CAT_KEYS = CATS.map((c) => c.key);
export const isCat = (k) => CAT_KEYS.includes(k);
export const catInfo = (key) => CATS.find((c) => c.key === key) || CATS[0];

export const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const stateOf = (city) => (city.split(', ')[1] || '').trim();

// ---- data registry ----
// `DATA` starts with the sample set and is replaced by `setData()` when the API snapshot loads
// (src/concept/jcData.js). Every function below reads DATA at call time.
const FEATURED = new Set(['natures-remedy-tyngsboro', 'ascend-boston', 'hashery', 'wyld', 'kiva', 'blue-dream', 'runtz']);
const stateOfCity = (city) => (city.split(', ')[1] || '').trim();

// A copy of `d` with `miles` measured from `origin` ({lat,lng}); without coordinates the sample value stands.
export const located = (d, origin) => (origin && typeof origin.lat === 'number' && typeof d.lat === 'number' ? { ...d, miles: Math.round(milesBetween(origin, d) * 10) / 10 } : d);

function sampleData() {
  const dispensaries = allDispensaries.map((d) => ({ ...d, state: stateOfCity(d.city), featured: FEATURED.has(d.slug) }));
  const byName = (name) => dispensaries.find((d) => d.name === name);
  const brands = allBrands.map((b) => ({ ...b, featured: FEATURED.has(b.slug) }));
  const strains = allStrains.map((s) => ({ ...s, slug: slugify(s.name), featured: FEATURED.has(slugify(s.name)) }));
  const deals = allDeals.map((d, i) => { const storeSlug = byName(d.store)?.slug; return { ...d, slug: `deal-${slugify(d.name)}-${i}`, storeSlug, featured: FEATURED.has(storeSlug) }; });
  const highlights = (slug, storeName) => dispensaryDetails.hashery.menuHighlights.map((m, i) => ({
    name: m.name, meta: m.meta, price: m.price, type: m.type, thc: m.thc, store: storeName, storeSlug: slug, slug: `p-${slug}-${slugify(m.name)}-${i}`, featured: FEATURED.has(slug),
    category: { 'Pre-roll': 'Pre-rolls', Vape: 'Vapes', Edible: 'Edibles' }[m.meta.split(' · ')[0]] || m.meta.split(' · ')[0],
  }));
  const menus = Object.fromEntries(dispensaries.map((d) => [d.slug, [...deals.filter((x) => x.storeSlug === d.slug).map((x) => ({ ...x, slug: `p-${x.slug}` })), ...highlights(d.slug, d.name)]]));
  const products = [...deals.map((d) => ({ ...d, slug: `p-${d.slug}` })), ...highlights('hashery', 'Hashery')];
  const storesOfBrand = Object.fromEntries(brands.map((b) => [b.slug, dispensaries.filter((d) => b.states.includes(d.state)).map((d) => d.slug)]));
  const hash = (seed) => { let h = 0; for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const storesOfStrain = Object.fromEntries(strains.map((st) => { const h = hash(st.name); const picked = dispensaries.filter((d, i) => ((h >> i) & 1) === 1 || i === h % dispensaries.length).slice(0, Math.min(st.menus, 6)); return [st.slug, (picked.length ? picked : dispensaries.slice(0, 1)).map((d) => d.slug)]; }));
  const details = Object.fromEntries(dispensaries.map((d) => { const t = dispensaryDetails[d.slug] || null; return [d.slug, t ? { hours: t.hours, about: t.about, amenities: t.amenities, address: t.address, zip: t.zip, phone: t.phone, website: t.website } : null]; }).filter(([, v]) => v));
  return { dispensaries, brands, strains, deals, products, menus, embeds: {}, details, storesOfBrand, storesOfStrain, brandsOfStore: invert(storesOfBrand), strainsOfStore: invert(storesOfStrain), loaded: false };
}
function invert(map) { const out = {}; for (const [k, list] of Object.entries(map)) for (const s of list) (out[s] ||= []).push(k); return out; }

export const DATA = sampleData();
let bySlug = Object.fromEntries(DATA.dispensaries.map((d) => [d.slug, d]));
export function setData(next) {
  Object.assign(DATA, next, { loaded: true });
  bySlug = Object.fromEntries(DATA.dispensaries.map((d) => [d.slug, d]));
}
export const isLoaded = () => DATA.loaded;
// True when the snapshot was built with --demo-menus (sample products and deals on real stores).
export const isDemo = () => !!(DATA.meta && DATA.meta.demoMenus);
export const storeBySlug = (slug) => bySlug[slug] || null;

const SOURCE = DATA; // cat → list
export const find = (cat, slug, origin) => { const it = (SOURCE[cat] || []).find((i) => i.slug === slug) || null; return it && cat === 'dispensaries' ? located(it, origin) : it; };

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const typeWord = { hyb: 'hybrid', sat: 'sativa', ind: 'indica' };

// Fields that take part in matching. The first is the title and ranks highest.
const FIELDS = {
  dispensaries: (d) => [d.name, d.city, ...(d.tags || [])],
  deals: (d) => [d.name, d.meta, d.store, d.category],
  brands: (b) => [b.name, b.type || b.category, b.city, b.stateName, ...(b.tags || []), ...(b.states || []), b.blurb],
  products: (p) => [p.name, p.meta, p.category, p.store],
  strains: (s) => [s.name, s.lineage, ...(s.effects || []), typeWord[s.type]],
};

export const SORTS = {
  dispensaries: { nearest: ['Nearest', (a, b) => (a.miles ?? 1e9) - (b.miles ?? 1e9)], rated: ['Top rated', (a, b) => b.rating - a.rating], stocked: ['Most products', (a, b) => b.products - a.products] },
  deals: { pct: ['Biggest discount', (a, b) => b.pct - a.pct], price: ['Lowest price', (a, b) => a.price - b.price] },
  brands: {
    rated: ['Highest rated', (a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviews || 0) - (a.reviews || 0)],
    products: ['Most products', (a, b) => (b.products || 0) - (a.products || 0)],
    reviews: ['Most reviewed', (a, b) => (b.reviews || 0) - (a.reviews || 0)],
    menus: ['Most menus', (a, b) => b.menus - a.menus],
    name: ['Name A to Z', (a, b) => a.name.localeCompare(b.name)],
    nameDesc: ['Name Z to A', (a, b) => b.name.localeCompare(a.name)],
  },
  products: { price: ['Lowest price', (a, b) => a.price - b.price], pct: ['Biggest discount', (a, b) => (b.pct || 0) - (a.pct || 0)] },
  strains: { menus: ['Most menus', (a, b) => b.menus - a.menus], thc: ['Highest THC', (a, b) => b.thc - a.thc], name: ['A to Z', (a, b) => a.name.localeCompare(b.name)] },
};
export const defaultSort = (cat) => Object.keys(SORTS[cat])[0];

// Filter chips per category: [key, label, predicate, mode?]. A chip with mode 'and' must pass on its
// own; the remaining chips of the category combine per FILTER_MODE.
const BRAND_TYPES = ['Cannabis', 'CBD', 'Edibles', 'Hemp', 'Vape'];
export const FILTERS = {
  dispensaries: [['open', 'Open now', (d) => d.open], ['delivery', 'Delivery', (d) => d.delivery], ['menu', 'Live menu', (d) => !!d.menu || d.products > 0], ['verified', 'Verified', (d) => d.verified]],
  deals: ['Flower', 'Pre-rolls', 'Vapes', 'Edibles', 'Concentrates'].map((c) => [c.toLowerCase(), c, (d) => d.category === c]),
  brands: [...BRAND_TYPES.map((c) => [c.toLowerCase(), c, (b) => (b.type || b.category) === c]), ['verified', 'Verified', (b) => b.verified, 'and']],
  products: ['Flower', 'Pre-rolls', 'Vapes', 'Edibles', 'Concentrates'].map((c) => [c.toLowerCase(), c, (p) => p.category === c]),
  strains: [['hyb', 'Hybrid', (s) => s.type === 'hyb'], ['sat', 'Sativa', (s) => s.type === 'sat'], ['ind', 'Indica', (s) => s.type === 'ind'], ['new', 'New on menus', (s) => s.isNew]],
};
// Chips in the same group are OR-ed (category chips); dispensary chips are AND-ed.
export const FILTER_MODE = { dispensaries: 'and', deals: 'or', brands: 'or', products: 'or', strains: 'or' };

const feat = (it) => (it.featured || it.pinned || it.premium ? 1 : 0);
export const isFeatured = (it) => feat(it) === 1;

function score(fields, terms) {
  const [title, ...rest] = fields.map(norm);
  let total = 0;
  for (const t of terms) {
    let best = 0;
    if (title.startsWith(t)) best = 4;
    else if (title.split(/\s+/).some((w) => w.startsWith(t))) best = 3;
    else if (title.includes(t)) best = 2;
    else if (rest.some((f) => f.includes(t))) best = 1;
    if (!best) return 0; // every term has to hit somewhere
    total += best;
  }
  return total;
}

export function search(q, cat = 'all', { filters = [], sort, origin } = {}) {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  const keys = cat === 'all' ? CAT_KEYS : [cat];
  const out = {};
  for (const k of keys) {
    const sortFn = (sort && Object.hasOwn(SORTS[k], sort) ? SORTS[k][sort] : SORTS[k][defaultSort(k)])[1];
    const active = FILTERS[k].filter(([key]) => filters.includes(key));
    const must = active.filter(([, , , mode]) => mode === 'and');
    const rest = active.filter(([, , , mode]) => mode !== 'and');
    const passes = (item) => must.every(([, , p]) => p(item)) && (!rest.length || (FILTER_MODE[k] === 'and' ? rest.every(([, , p]) => p(item)) : rest.some(([, , p]) => p(item))));
    const ranked = (k === 'dispensaries' ? SOURCE[k].map((d) => located(d, origin)) : SOURCE[k])
      .filter(passes)
      .map((item) => ({ item, s: terms.length ? score(FIELDS[k](item), terms) : 1 }))
      .filter((r) => r.s > 0)
      .sort((a, b) => feat(b.item) - feat(a.item) || b.s - a.s || sortFn(a.item, b.item));
    out[k] = ranked.map((r) => r.item);
  }
  return out;
}

export const total = (res) => Object.values(res).reduce((n, l) => n + l.length, 0);

// Dispensaries that carry `item`, nearest first.
export function stockedAt(cat, item, origin) {
  let slugs;
  if (cat === 'dispensaries') slugs = [item.slug];
  else if (cat === 'deals' || cat === 'products') slugs = item.storeSlug ? [item.storeSlug] : [];
  else if (cat === 'brands') slugs = DATA.storesOfBrand[item.slug] || [];
  else slugs = DATA.storesOfStrain[item.slug] || [];
  return slugs.map((x) => bySlug[x]).filter(Boolean).map((d) => located(d, origin)).sort((a, b) => (a.miles ?? 1e9) - (b.miles ?? 1e9));
}

// One store's menu, deals, strains and brands.
export const menuFor = (slug) => DATA.menus[slug] || [];
// Third-party menu embed for a store: { p: provider, src?: iframe URL, js?: Dutchie script URL, cats?: [], modes?: [] } or null.
export const embedFor = (slug) => (DATA.embeds && DATA.embeds[slug]) || null;
// Filter keys of `cat` that no row in the data satisfies.
export const emptyFilters = (cat, keys) => keys.filter((k) => { const f = FILTERS[cat].find(([key]) => key === k); return f && !(DATA[cat] || []).some(f[2]); });
export const dealsAt = (slug) => DATA.deals.filter((d) => d.storeSlug === slug);
export const strainsAt = (slug) => { const set = new Set(DATA.strainsOfStore[slug] || []); return set.size ? DATA.strains.filter((s) => set.has(s.slug)) : []; };
export const brandsAt = (slug) => { const set = new Set(DATA.brandsOfStore[slug] || []); return set.size ? DATA.brands.filter((b) => set.has(b.slug)) : []; };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
// Minutes since midnight for "9:00 AM"; null for "Closed" or anything unparsable.
const minutesOf = (t) => { const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(t || '').trim()); if (!m) return null; let h = Number(m[1]) % 12; if (m[3].toUpperCase() === 'PM') h += 12; return h * 60 + Number(m[2]); };
// Open or closed right now from the snapshot's hours for `slug` (browser local time); null when the
// snapshot has no hours for the store, so callers can leave status out rather than guess.
export function openNow(slug) {
  const x = DATA.details[slug];
  if (!x || !x.hours || !x.hours.length) return null;
  const now = new Date();
  const today = x.hours.find((h) => h.day === DAYS[(now.getDay() + 6) % 7]);
  if (!today) return null;
  const open = minutesOf(today.open); const close = minutesOf(today.close);
  if (open === null || close === null) return { open: false, label: 'Closed today' };
  const t = now.getHours() * 60 + now.getMinutes();
  const isOpen = close > open ? t >= open && t < close : t >= open || t < close; // overnight hours wrap past midnight
  return { open: isOpen, label: isOpen ? `Open until ${today.close}` : `Closed · opens ${today.open}` };
}
// Store page details: snapshot details when present, otherwise defaults built from the listing row.
export function detailsFor(slug, d) {
  const x = DATA.details[slug] || {};
  return {
    hours: x.hours && x.hours.length ? x.hours : DAYS.map((day) => ({ day, open: '9:00 AM', close: '5:00 PM' })),
    about: x.about && x.about.length ? x.about : [],
    amenities: x.amenities || [],
    address: x.address || d.address || '', zip: x.zip || d.zip || '', phone: x.phone || d.phone || '', website: (x.website || d.website || '').replace(/^https?:\/\//, '').replace(/\/$/, ''),
  };
}

// Where a click on a result goes: dispensaries open their page; everything else opens inside the finder.
export function itemLink(cat, item) {
  if (cat === 'dispensaries') return `/dispensaries/${item.slug}`;
  return `/${cat}?sel=${encodeURIComponent(item.slug)}`;
}
