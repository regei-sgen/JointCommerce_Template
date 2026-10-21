// One search index over the listing datasets. `search(q, cat)` returns ranked matches per category;
// `stockedAt(cat, item)` returns the dispensaries that carry an item, so every category can be drawn
// on the same map.
import { allDispensaries, allBrands, allStrains, allDeals } from '../listingData.js';
import { dispensaryDetails } from '../data.js';

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

// Listings sorted first in every category. Sample set.
const FEATURED = new Set(['natures-remedy-tyngsboro', 'ascend-boston', 'hashery', 'wyld', 'kiva', 'blue-dream', 'runtz']);
export const isFeatured = (item) => FEATURED.has(item.slug);

export const dispensaries = allDispensaries.map((d) => ({ ...d, state: stateOf(d.city), featured: FEATURED.has(d.slug) }));
const bySlug = Object.fromEntries(dispensaries.map((d) => [d.slug, d]));
const byName = (name) => dispensaries.find((d) => d.name === name);

export const brands = allBrands.map((b) => ({ ...b, featured: FEATURED.has(b.slug) }));
export const strains = allStrains.map((s) => ({ ...s, slug: slugify(s.name), featured: FEATURED.has(slugify(s.name)) }));
export const deals = allDeals.map((d, i) => ({ ...d, slug: `deal-${slugify(d.name)}-${i}`, storeSlug: byName(d.store)?.slug }));
export const products = [
  ...deals.map((d) => ({ ...d, slug: `p-${d.slug}` })),
  ...dispensaryDetails.hashery.menuHighlights.map((m, i) => ({
    name: m.name, meta: m.meta, price: m.price, type: m.type, thc: m.thc, store: 'Hashery', storeSlug: 'hashery', slug: `p-hashery-${slugify(m.name)}-${i}`,
    category: { 'Pre-roll': 'Pre-rolls', Vape: 'Vapes', Edible: 'Edibles' }[m.meta.split(' · ')[0]] || m.meta.split(' · ')[0],
  })),
];

const SOURCE = { dispensaries, deals, brands, products, strains };
export const find = (cat, slug) => (SOURCE[cat] || []).find((i) => i.slug === slug) || null;

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const typeWord = { hyb: 'hybrid', sat: 'sativa', ind: 'indica' };

// Fields that take part in matching. The first is the title and ranks highest.
const FIELDS = {
  dispensaries: (d) => [d.name, d.city, ...(d.tags || [])],
  deals: (d) => [d.name, d.meta, d.store, d.category],
  brands: (b) => [b.name, b.category, ...(b.tags || []), ...(b.states || []), b.blurb],
  products: (p) => [p.name, p.meta, p.category, p.store],
  strains: (s) => [s.name, s.lineage, ...(s.effects || []), typeWord[s.type]],
};

export const SORTS = {
  dispensaries: { nearest: ['Nearest', (a, b) => a.miles - b.miles], rated: ['Top rated', (a, b) => b.rating - a.rating], stocked: ['Most products', (a, b) => b.products - a.products] },
  deals: { pct: ['Biggest discount', (a, b) => b.pct - a.pct], price: ['Lowest price', (a, b) => a.price - b.price] },
  brands: { menus: ['Most menus', (a, b) => b.menus - a.menus], name: ['A to Z', (a, b) => a.name.localeCompare(b.name)] },
  products: { price: ['Lowest price', (a, b) => a.price - b.price], pct: ['Biggest discount', (a, b) => (b.pct || 0) - (a.pct || 0)] },
  strains: { menus: ['Most menus', (a, b) => b.menus - a.menus], thc: ['Highest THC', (a, b) => b.thc - a.thc], name: ['A to Z', (a, b) => a.name.localeCompare(b.name)] },
};
export const defaultSort = (cat) => Object.keys(SORTS[cat])[0];

// Filter chips per category: [key, label, predicate].
export const FILTERS = {
  dispensaries: [['open', 'Open now', (d) => d.open], ['delivery', 'Delivery', (d) => d.delivery], ['verified', 'Verified', (d) => d.verified]],
  deals: ['Flower', 'Pre-rolls', 'Vapes', 'Edibles', 'Concentrates'].map((c) => [c.toLowerCase(), c, (d) => d.category === c]),
  brands: ['Flower', 'Pre-rolls', 'Vapes', 'Edibles', 'Concentrates'].map((c) => [c.toLowerCase(), c, (b) => b.category === c]),
  products: ['Flower', 'Pre-rolls', 'Vapes', 'Edibles', 'Concentrates'].map((c) => [c.toLowerCase(), c, (p) => p.category === c]),
  strains: [['hyb', 'Hybrid', (s) => s.type === 'hyb'], ['sat', 'Sativa', (s) => s.type === 'sat'], ['ind', 'Indica', (s) => s.type === 'ind'], ['new', 'New on menus', (s) => s.isNew]],
};
// Chips in the same group are OR-ed (category chips); dispensary chips are AND-ed.
export const FILTER_MODE = { dispensaries: 'and', deals: 'or', brands: 'or', products: 'or', strains: 'or' };

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

export function search(q, cat = 'all', { filters = [], sort } = {}) {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  const keys = cat === 'all' ? CAT_KEYS : [cat];
  const out = {};
  for (const k of keys) {
    const sortFn = (sort && Object.hasOwn(SORTS[k], sort) ? SORTS[k][sort] : SORTS[k][defaultSort(k)])[1];
    const active = FILTERS[k].filter(([key]) => filters.includes(key));
    const passes = (item) => !active.length || (FILTER_MODE[k] === 'and' ? active.every(([, , p]) => p(item)) : active.some(([, , p]) => p(item)));
    const ranked = SOURCE[k]
      .filter(passes)
      .map((item) => ({ item, s: terms.length ? score(FIELDS[k](item), terms) : 1 }))
      .filter((r) => r.s > 0)
      .sort((a, b) => (b.item.featured ? 1 : 0) - (a.item.featured ? 1 : 0) || b.s - a.s || sortFn(a.item, b.item));
    out[k] = ranked.map((r) => r.item);
  }
  return out;
}

export const total = (res) => Object.values(res).reduce((n, l) => n + l.length, 0);

// Deterministic sample subset of dispensaries for items whose source data has no store list.
function sample(seed, n) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const picked = [];
  for (let i = 0; i < dispensaries.length && picked.length < n; i++) {
    if (((h >> i) & 1) === 1 || i === h % dispensaries.length) picked.push(dispensaries[i]);
  }
  return picked.length ? picked : dispensaries.slice(0, Math.max(1, n));
}

// Dispensaries that carry `item`, nearest first.
export function stockedAt(cat, item) {
  let list;
  if (cat === 'dispensaries') list = [item];
  else if (cat === 'deals' || cat === 'products') list = item.storeSlug ? [bySlug[item.storeSlug]] : [];
  else if (cat === 'brands') list = dispensaries.filter((d) => item.states.includes(d.state));
  else list = sample(item.name, Math.min(item.menus, 6)); // strains
  return [...list].filter(Boolean).sort((a, b) => a.miles - b.miles);
}

// Where a click on a result goes: dispensaries open their page; everything else opens inside the finder.
export function itemLink(cat, item) {
  if (cat === 'dispensaries') return `/dispensaries/${item.slug}`;
  return `/concept/${cat}?sel=${encodeURIComponent(item.slug)}`;
}
