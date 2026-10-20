// Sample content for the listing pages (/dispensaries, /brands, /strains, /deals, /dispensaries/state, /blog).
import { dispensaries, strains, deals, articles, featuredArticle } from './data.js';

export const allDispensaries = [
  ...dispensaries.map((d, i) => ({
    ...d,
    lat: [42.6765, 42.194, 42.2287, 33.7455, 34.172][i],
    lng: [-71.4245, -71.76, -71.5226, -117.8677, -118.3787][i],
    verified: i !== 1, open: true,
    products: [412, 386, 238, 451, 197][i],
    tags: [['Flower', 'Vapes'], ['Flower'], ['Edibles', 'Pre-rolls'], ['Vapes', 'Concentrates'], ['Flower', 'Edibles']][i],
  })),
  { slug: 'ascend-boston', code: 'AS', name: 'Ascend Boston', city: 'Boston, MA', status: 'Open until 9pm', miles: 24.1, rating: 4.5, reviews: 1203, delivery: true, lat: 42.3601, lng: -71.0589, verified: true, open: true, products: 522, tags: ['Flower', 'Vapes', 'Edibles'] },
  { slug: 'rebud-cambridge', code: 'RB', name: 'Rebud', city: 'Cambridge, MA', status: 'Opens 10am', miles: 25.4, rating: 4.7, reviews: 342, delivery: false, lat: 42.3736, lng: -71.1097, verified: true, open: false, products: 264, tags: ['Pre-rolls', 'Flower'] },
  { slug: 'hashery', code: 'HA', name: 'Hashery', city: 'Hackensack, NJ', status: 'Open until 5pm', miles: 180, rating: 4.6, reviews: 11, delivery: true, lat: 40.9129, lng: -74.0426, verified: true, open: true, products: 318, tags: ['Flower', 'Edibles', 'Topicals'] },
  { slug: 'the-cake-house-vista', code: 'T', name: 'The Cake House', city: 'Vista, CA', status: 'Open until 9pm', miles: 41, rating: 4.4, reviews: 76, delivery: true, lat: 33.2, lng: -117.24, verified: false, open: true, products: 412, tags: ['Flower', 'Vapes', 'Edibles'] },
  { slug: 'unb-new-buffalo', code: 'U', name: 'UNB Cannabis', city: 'New Buffalo, MI', status: 'Open until 10pm', miles: 790, rating: 4.8, reviews: 219, delivery: false, lat: 41.795, lng: -86.744, verified: true, open: true, products: 238, tags: ['Flower', 'Concentrates'] },
  { slug: 'lovely-new-buffalo', code: 'L', name: 'Lovely Cannabis', city: 'New Buffalo, MI', status: 'Closed · opens 9am', miles: 791, rating: 4.3, reviews: 58, delivery: true, lat: 41.79, lng: -86.75, verified: true, open: false, products: 197, tags: ['Edibles', 'Pre-rolls'] },
  { slug: 'fluff-cannabis', code: 'F', name: 'FLUFF Cannabis', city: 'Portland, OR', status: 'Open until 10pm', miles: 2540, rating: 4.9, reviews: 410, delivery: true, lat: 45.5152, lng: -122.6784, verified: true, open: true, products: 164, tags: ['Flower', 'Vapes'] },
];

export const allBrands = [
  { slug: 'ascend-cannabis', name: 'Ascend Cannabis', initial: 'A', category: 'Flower', menus: 32, products: 48, states: ['MA', 'NJ', 'IL'], pic: 0, tags: ['Flower', 'Pre-rolls', 'Vapes'], blurb: 'Small-batch indoor flower and live resin from Massachusetts.' },
  { slug: 'sunrise-mountain-farms', name: 'Sunrise Mountain Farms', initial: 'S', category: 'Flower', menus: 21, products: 19, states: ['CA', 'OR'], pic: 1, tags: ['Flower', 'Small batch'], blurb: 'Sun-grown craft flower from the Emerald Triangle.' },
  { slug: 'dime-industries', name: 'Dime Industries', initial: 'D', category: 'Vapes', menus: 18, products: 27, states: ['CA', 'MI'], pic: 2, tags: ['Vapes', 'Carts'], blurb: 'High-potency distillate carts and all-in-ones.' },
  { slug: 'mother-puckers', name: 'Mother Puckers', initial: 'MP', category: 'Edibles', menus: 12, products: 14, states: ['CA'], pic: 3, tags: ['Edibles', 'Gummies'], blurb: 'Sour gummies dosed at 10mg a piece.' },
  { slug: 'lowell-herb-co', name: 'Lowell Herb Co.', initial: 'L', category: 'Pre-rolls', menus: 27, products: 33, states: ['CA', 'MA'], pic: 4, tags: ['Pre-rolls', 'Flower'], blurb: 'Hand-rolled packs sorted by effect.' },
  { slug: 'wyld', name: 'WYLD', initial: 'W', category: 'Edibles', menus: 32, products: 22, states: ['CA', 'OR', 'WA', 'CO', 'MI'], pic: 5, tags: ['Edibles', 'Gummies', 'Sparkling water'], blurb: 'Real-fruit gummies in every market we list.' },
  { slug: 'rose-brand', name: 'Rose Brand', initial: 'R', category: 'Flower', menus: 21, products: 16, states: ['MA'], pic: 6, tags: ['Flower'], blurb: 'Exotic cuts grown under LED in Worcester.' },
  { slug: 'smokiez-edibles', name: 'Smokiez Edibles', initial: 'SE', category: 'Edibles', menus: 18, products: 29, states: ['CO', 'OR', 'WA'], pic: 7, tags: ['Edibles', 'Fruit chews'], blurb: 'Fruit chews and sour gummies, vegan and gluten-free.' },
  { slug: 'raw-garden', name: 'Raw Garden', initial: 'RG', category: 'Concentrates', menus: 24, products: 61, states: ['CA'], pic: 8, tags: ['Concentrates', 'Live resin', 'Vapes'], blurb: 'Single-source live resin from clean green certified farms.' },
  { slug: 'kiva', name: 'Kiva Confections', initial: 'K', category: 'Edibles', menus: 29, products: 35, states: ['CA', 'MI', 'IL', 'MA'], pic: 9, tags: ['Edibles', 'Chocolate', 'Mints'], blurb: 'Chocolate bars, mints and the Camino gummy line.' },
];

export const allStrains = [
  ...strains.map((s, i) => ({ ...s, pic: i, isNew: false })),
  { name: 'Runtz', lineage: 'Zkittlez × Gelato', type: 'hyb', menus: 9, thc: 27, effects: ['Euphoric', 'Giggly'], pic: 1, isNew: false },
  { name: 'Green Crack', lineage: 'Skunk #1 × Afghani', type: 'sat', menus: 8, thc: 22, effects: ['Energetic', 'Focused'], pic: 2, isNew: false },
  { name: 'Watermelon', lineage: 'Watermelon Zkittlez pheno', type: 'ind', menus: 3, thc: 21, effects: ['Relaxed', 'Sleepy'], pic: 5, isNew: true },
  { name: 'Blueberry', lineage: 'Afghani × Thai', type: 'ind', menus: 4, thc: 19, effects: ['Relaxed', 'Happy'], pic: 3, isNew: true },
  { name: 'Pineapple', lineage: 'Pineapple Express pheno', type: 'sat', menus: 2, thc: 24, effects: ['Uplifted', 'Creative'], pic: 4, isNew: true },
  { name: 'Gelato', lineage: 'Sunset Sherbet × Thin Mint GSC', type: 'hyb', menus: 6, thc: 25, effects: ['Relaxed', 'Euphoric'], pic: 0, isNew: true },
];

export const allDeals = [
  ...deals.map((d, i) => ({
    ...d,
    category: ['Flower', 'Flower', 'Pre-rolls', 'Flower', 'Vapes', 'Vapes'][i],
    store: ["Nature's Remedy", 'Happy Days', 'Rebud', 'Ascend Boston', '420 Central', 'Hashery'][i],
    ends: ['Tonight', 'Tonight', 'Sunday', 'Tonight', 'Friday', 'Sunday'][i],
    pic: i,
  })),
  { name: 'Camino gummies 2 for 1', meta: 'Edible · 100mg · Kiva', pct: 50, price: 22, was: 44, category: 'Edibles', store: 'Ascend Boston', ends: 'Tonight', pic: 2 },
  { name: 'Live resin 1g', meta: 'Concentrate · 1g · Raw Garden', pct: 20, price: 40, was: 50, category: 'Concentrates', store: 'The Cake House', ends: 'Friday', pic: 3 },
];

export const allArticles = [
  { ...featuredArticle, type: 'hyb', kind: 'Strain guide', pic: 'featured', featured: true },
  ...articles.map((a, i) => ({ ...a, kind: 'Strain guide', pic: i })),
  { type: 'ind', title: 'How to read a dispensary menu: THC, terpenes and tiers', meta: '4 min read', kind: 'Basics', pic: 1 },
  { type: 'sat', title: 'Pickup vs delivery: what changes about your order', meta: '3 min read', kind: 'Basics', pic: 2 },
  { type: 'hyb', title: 'Edibles dosing: start low, wait two hours', meta: '5 min read', kind: 'Basics', pic: 3 },
  { type: 'ind', title: 'Why live resin costs more than distillate', meta: '6 min read', kind: 'Products', pic: 0 },
];

export const stateCities = {
  California: ['Los Angeles', 'San Diego', 'San Jose', 'Santa Ana', 'Oakland'], Oklahoma: ['Oklahoma City', 'Tulsa', 'Norman'], Michigan: ['Detroit', 'Ann Arbor', 'New Buffalo', 'Grand Rapids'],
  Colorado: ['Denver', 'Boulder', 'Colorado Springs'], Oregon: ['Portland', 'Eugene', 'Bend'], 'New York': ['New York', 'Buffalo', 'Albany'],
  'New Mexico': ['Albuquerque', 'Santa Fe', 'Las Cruces'], Florida: ['Miami', 'Tampa', 'Orlando', 'Jacksonville'], Washington: ['Seattle', 'Spokane', 'Tacoma'],
  Massachusetts: ['Boston', 'Worcester', 'Cambridge', 'Tyngsboro'], Maine: ['Portland', 'Bangor'], 'New Jersey': ['Hackensack', 'Jersey City', 'Newark'],
};
