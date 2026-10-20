export const nav = ['Dispensaries', 'Brands', 'Strains', 'Deals', 'Forum', 'Blog', 'Resources'];

export const navMenu = [
  {
    label: 'Dispensaries',
    items: [
      { icon: 'store', title: 'All dispensaries', text: 'Browse every store near you', to: '/dispensaries' },
      { icon: 'truck', title: 'Delivery services', text: 'Cannabis delivered to your door', to: '/dispensaries?type=delivery' },
      { icon: 'map', title: 'Find by state', text: 'Explore dispensaries state by state', to: '/dispensaries/state' },
      { icon: 'trophy', title: 'Best dispensaries', text: 'Top-rated stores in your area', to: '/dispensaries/best-in' },
    ],
  },
  { label: 'Brands', to: '#' },
  {
    label: 'Strains',
    items: [
      { icon: 'grid', title: 'All strains', text: 'Effects, flavors and reviews', to: '/strains' },
      { icon: 'sparkle', title: 'Match strains', text: 'Find strains that fit your mood', to: '/strains/match' },
      { icon: 'scale', title: 'Compare strains', text: 'See strains side by side', to: '/strains/compare' },
    ],
  },
  { label: 'Deals', to: '#' },
  { label: 'Forum', to: '#' },
  { label: 'Blog', to: '#' },
  {
    label: 'Resources',
    items: [
      { icon: 'mail', title: 'Contact us', text: 'Questions, support and partnerships', to: '/legal/contact' },
      { icon: 'file', title: 'Terms', text: 'Terms of service and policies', to: '/legal/terms' },
    ],
  },
];

// A slide with `lat`/`lng` shows the map behind the hero; one without falls back to the leaf photo.
export const heroSlides = [
  { slug: 'natures-remedy-tyngsboro', code: 'NR', name: "Nature's Remedy", city: 'Tyngsboro, MA', status: 'Open until 9pm', tag: 'Blue Dream in stock', tagType: 'hyb', lat: 42.6765, lng: -71.4245, miles: 2.4, rating: 4.8, reviews: 312 },
  { slug: 'happy-days', code: 'HD', name: 'Happy Days', city: 'Hopkinton, MA', status: 'Live menu · until 8pm', tag: '50% off today', tagType: 'sat', lat: 42.2287, lng: -71.5226, miles: 6.1, rating: 4.7, reviews: 188 },
  { slug: '420-central', code: '420', name: '420 Central', city: 'Santa Ana, CA', status: 'Open until 10pm', tag: 'Pre-rolls from $8', tagType: 'hyb', lat: 33.7455, lng: -117.8677, miles: 3.8, rating: 4.6, reviews: 541 },
  { slug: 'rebud', code: 'RB', name: 'Rebud', city: 'North Hollywood, CA', status: 'Open until 10pm', tag: 'Pickup in 15 min', tagType: 'ind', lat: 34.172, lng: -118.3787, miles: 1.2, rating: 4.9, reviews: 97 },
];

export const mapPoints = [
  { name: "Nature's Remedy", city: 'Tyngsboro, MA', lat: 42.6765, lng: -71.4245, status: 'Open now' },
  { name: "Nature's Remedy", city: 'Millbury, MA', lat: 42.194, lng: -71.76, status: 'Open now' },
  { name: 'Happy Days', city: 'Hopkinton, MA', lat: 42.2287, lng: -71.5226, status: 'Live menu' },
  { name: 'Ascend Boston', city: 'Boston, MA', lat: 42.3601, lng: -71.0589, status: 'Open now' },
  { name: 'Rebud', city: 'Cambridge, MA', lat: 42.3736, lng: -71.1097, status: 'Pickup' },
];

export const openNearYou = [
  { code: 'NR', name: "Nature's Remedy", city: 'Tyngsboro, MA', until: 'until 9pm', tag: 'Blue Dream in stock', tagType: 'hyb' },
  { code: 'HD', name: 'Happy Days', city: 'Hopkinton, MA', until: 'until 8pm', tag: '50% off today', tagType: 'sat' },
  { code: 'AS', name: 'Ascend Boston', city: 'Boston, MA', until: 'until 9pm', note: 'Live menu' },
  { code: 'RB', name: 'Rebud', city: 'Cambridge, MA', until: 'until 10pm', note: 'Pickup' },
];

export const dispensaries = [
  { slug: 'natures-remedy-tyngsboro', code: 'NR', name: "Nature's Remedy", city: 'Tyngsboro, MA', status: 'Open until 9pm', miles: 2.4, rating: 4.8, reviews: 312, delivery: true },
  { slug: 'natures-remedy-millbury', code: 'NR', name: "Nature's Remedy", city: 'Millbury, MA', status: 'Open until 9pm', miles: 14.7, rating: 4.7, reviews: 204, delivery: false },
  { slug: 'happy-days', code: 'HD', name: 'Happy Days', city: 'Hopkinton, MA', status: 'Live menu · until 8pm', miles: 6.1, rating: 4.6, reviews: 188, delivery: true },
  { slug: '420-central', code: '420', name: '420 Central', city: 'Santa Ana, CA', status: 'Open until 10pm', miles: 3.8, rating: 4.8, reviews: 541, delivery: false },
  { slug: 'rebud', code: 'RB', name: 'Rebud', city: 'North Hollywood, CA', status: 'Open until 10pm', miles: 1.2, rating: 4.9, reviews: 97, delivery: true },
];

export const brands = [
  { initial: 'A', name: 'Ascend Cannabis', meta: 'Flower · On 32 menus' },
  { initial: 'S', name: 'Sunrise Mountain Farms', meta: 'Flower · On 21 menus' },
  { initial: 'D', name: 'Dime Industries', meta: 'Vapes · On 18 menus' },
  { initial: 'MP', name: 'Mother Puckers', meta: 'Edibles · On 12 menus' },
  { initial: 'L', name: 'Lowell Herb Co.', meta: 'Pre-rolls · On 27 menus' },
];

export const strains = [
  { name: 'Original Cheese', lineage: 'Skunk #1 pheno', type: 'ind', menus: 5, thc: 21, effects: ['Relaxed', 'Hungry'] },
  { name: 'Blue Dream', lineage: 'Blueberry × Haze', type: 'hyb', menus: 17, thc: 18, effects: ['Happy', 'Creative'] },
  { name: 'Super Haze', lineage: 'Haze × Skunk', type: 'sat', menus: 6, thc: 17, effects: ['Energetic', 'Focused'] },
  { name: "Sweet 'n Sour Cookies", lineage: 'GSC cross', type: 'hyb', menus: 4, thc: 24, effects: ['Euphoric', 'Relaxed'] },
  { name: 'Super Skunk Bliss', lineage: 'Skunk cross', type: 'ind', menus: 3, thc: 20, effects: ['Sleepy', 'Calm'] },
  { name: 'GG4', lineage: "Chem's Sister × Sour Dubb", type: 'hyb', menus: 11, thc: 26, effects: ['Relaxed', 'Euphoric'] },
];

export const liveMenus = [
  { initial: 'T', name: 'The Cake House · Vista', products: 412 },
  { initial: 'T', name: 'The Cake House · Santa Rosa', products: 386 },
  { initial: 'T', name: 'The Cake House · San Jose', products: 451 },
  { initial: 'U', name: 'UNB Cannabis · New Buffalo', products: 238 },
  { initial: 'L', name: 'Lovely Cannabis · New Buffalo', products: 197 },
  { initial: 'F', name: 'FLUFF Cannabis', products: 164 },
];

export const deals = [
  { name: 'Mochi', meta: 'Flower · 3.5g · Rose Brand', pct: 50, price: 25, was: 50 },
  { name: 'Hamba 24', meta: 'Flower · 3.5g', pct: 30, price: 28, was: 40 },
  { name: 'Wedding Cake pre-roll', meta: 'Pre-roll · 1g · Lowell', pct: 25, price: 9, was: 12 },
  { name: 'Apple Tartz Purple Tier', meta: 'Flower · 3.5g · Ascend', pct: 40, price: 33, was: 55 },
  { name: 'Shamara', meta: 'Vape · 0.5g', pct: 20, price: 36, was: 45 },
  { name: 'Sour Tangie', meta: 'Vape · 0.5g · Dime', pct: 35, price: 39, was: 60 },
];

export const topBrands = [
  { label: 'WYLD', name: 'WYLD', meta: 'Edibles', spaced: true, menus: 32 },
  { label: 'Rose', name: 'Rose Brand', meta: 'Flower', menus: 21 },
  { label: 'Smokiez', name: 'Smokiez Edibles', meta: 'Edibles', menus: 18 },
];

export const topStrains = [
  { name: 'Runtz', type: 'hyb', menus: 9, thc: 27 },
  { name: 'Green Crack', type: 'sat', menus: 8, thc: 22 },
];

export const newOnMenus = [
  { name: 'Watermelon', type: 'ind', menus: 3, thc: 21 },
  { name: 'Blueberry', type: 'ind', menus: 4, thc: 19 },
  { name: 'Pineapple', type: 'sat', menus: 2, thc: 24 },
  { name: 'Mango', type: 'hyb', menus: 2, thc: 20 },
  { name: 'Gelato', type: 'hyb', menus: 6, thc: 25 },
  { name: 'Blue Dream', type: 'hyb', menus: 5, thc: 18 },
];

export const states = [
  'California', 'Oklahoma', 'Michigan', 'Colorado', 'Oregon', 'New York',
  'New Mexico', 'Florida', 'Washington', 'Massachusetts', 'Maine', 'New Jersey',
];
export const stateCounts = {
  California: { dispensaries: 1184, menus: 902 }, Oklahoma: { dispensaries: 2071, menus: 1310 }, Michigan: { dispensaries: 743, menus: 611 },
  Colorado: { dispensaries: 680, menus: 540 }, Oregon: { dispensaries: 812, menus: 655 }, 'New York': { dispensaries: 142, menus: 128 },
  'New Mexico': { dispensaries: 631, menus: 402 }, Florida: { dispensaries: 589, menus: 571 }, Washington: { dispensaries: 497, menus: 418 },
  Massachusetts: { dispensaries: 331, menus: 304 }, Maine: { dispensaries: 206, menus: 161 }, 'New Jersey': { dispensaries: 118, menus: 104 },
};
export const site = { openNow: 38, menusCheckedToday: 4312, dealsLive: 1286, nearYou: 24, shoppers: '120,000', checkedAt: '7:02 AM' };

export const featuredArticle = {
  tag: 'Hybrid · Strain guide',
  title: 'Girl Scout Cookies (GSC): the dessert hybrid that started the Cookie family',
  meta: '6 min read',
};

export const articles = [
  { type: 'sat', title: "AJ's Sour Diesel: the original East Coast fuel cut", meta: '5 min read' },
  { type: 'hyb', title: 'Garlic Cookies: the pungent GMO cut explained', meta: '5 min read' },
  { type: 'hyb', title: 'Blue Dream: the sweet berry hybrid behind a modern classic', meta: '6 min read' },
  { type: 'sat', title: 'Jack Herer: the three-way Haze cross', meta: '7 min read' },
];

export const typeLabel = { hyb: 'Hybrid', sat: 'Sativa', ind: 'Indica' };

export const trust = [
  { icon: 'bolt', title: 'Live menus', text: 'Checked every morning' },
  { icon: 'tag', title: 'Verified deals', text: 'Pulled from real menus' },
  { icon: 'leaf', title: 'Strain data', text: 'Type, lineage and potency' },
  { icon: 'pin', title: 'Pickup & delivery', text: 'Filter by how you shop' },
];

export const featureTiles = [
  { eyebrow: 'Featured brand', title: 'Ascend Cannabis', text: 'Flower, pre-rolls and vapes on 32 menus near you.', cta: 'Where to buy', initial: 'A', tags: ['Flower', 'Pre-rolls', 'Vapes'], menus: 32 },
  { eyebrow: 'Featured brand', title: 'Sunrise Mountain Farms', text: 'Small-batch flower on 21 live menus this week.', cta: 'Where to buy', initial: 'S', tags: ['Flower', 'Small batch'], menus: 21 },
];

export const why = [
  { icon: 'clock', title: 'Menus checked daily', text: 'Stock and prices come from live dispensary menus.' },
  { icon: 'map', title: 'Shops near you', text: 'Every listing is mapped, with hours and pickup options.' },
  { icon: 'star', title: 'Real deals only', text: 'Discounts are read off the menu, not submitted.' },
  { icon: 'book', title: 'Strain guides', text: 'Plain-language guides for every strain on the menu.' },
];

export const footerColumns = [
  { title: 'Company', links: ['About us', 'Careers', 'Press', 'Legal'] },
  { title: 'Support', links: ['Help center', 'Contact', 'Terms of service', 'Privacy policy'] },
  { title: 'Dispensaries', links: ['California', 'Colorado', 'Michigan', 'Massachusetts', 'All states'] },
  { title: 'Resources', links: ['Blog', 'Forum', 'Strain guide', 'Claim your dispensary', 'Claim your brand'] },
];

// Dispensary detail pages (/dispensaries/:slug). Unknown slugs fall back to the first entry's layout.
const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hours = (open, close, days = WEEK) => days.map((day) => ({ day, open, close }));

export const dispensaryDetails = {
  hashery: {
    slug: 'hashery', code: 'HA', name: 'Hashery', verified: true, rating: 4.6, reviews: 11,
    city: 'Hackensack, NJ', address: '409 NJ-17', zip: 'Hackensack, NJ 07601', phone: '(201) 606-0002', website: 'hashery.com',
    lat: 40.9129, lng: -74.0426, products: 318, dealsToday: 14, photos: 23, deliveryRadius: 15, deliveryMin: 45,
    reviewsList: [
      { name: 'Maya R.', stars: 5, when: '2 days ago', text: 'Friendly staff and the menu online matched what was on the shelf. Pickup took five minutes.' },
      { name: 'Devon K.', stars: 4, when: '1 week ago', text: 'Good flower selection and fair prices. Parking can be tight on weekends.' },
      { name: 'Priya S.', stars: 5, when: '3 weeks ago', text: 'The budtender walked me through three sativas and nailed the recommendation.' },
    ],
    services: [
      { icon: 'bag', title: 'Pickup', text: 'Order ahead for in-store pickup' },
      { icon: 'shield', title: 'Verified', text: 'Licensed & verified dispensary' },
    ],
    amenities: ['Cash', 'Accepts debit cards'],
    hours: hours('9:00 AM', '5:00 PM'),
    about: [
      'Hashery, a prominent cannabis company in Hackensack, New Jersey, is making waves in the local community with its commitment to quality products and community engagement. Located in the heart of Hackensack, ZIP Code 07601, Hashery stands out not only for its diverse selection of cannabis products but also for its involvement in local health initiatives and community features that enhance the overall well-being of its patrons.',
      'Hackensack, a bustling city in Bergen County, offers a unique blend of urban and suburban living. The dispensary is served by Interstate 80, Route 4 and Route 17, and sits near key intersections and public transportation hubs, with parking available nearby and NJ Transit rail and bus service for those who prefer not to drive.',
      'Locals typically purchase cannabis by visiting the dispensary in person, where they can explore flower, edibles, tinctures and topicals with guidance from staff. An online ordering system allows customers to browse products and place orders for pickup or delivery.',
      'Hashery participates in community health fairs and educational workshops aimed at promoting safe and informed cannabis use, often in collaboration with local healthcare providers and wellness experts.',
    ],
    menuHighlights: [
      { name: 'Blue Dream', meta: 'Flower · 3.5g', type: 'hyb', price: 42, thc: 18 },
      { name: 'Wedding Cake pre-roll', meta: 'Pre-roll · 1g', type: 'hyb', price: 12, thc: 23 },
      { name: 'Sour Tangie', meta: 'Vape · 0.5g', type: 'sat', price: 45, thc: 84 },
      { name: 'Watermelon gummies', meta: 'Edible · 100mg', type: 'ind', price: 22, thc: 10 },
    ],
    brands: ['WYLD', 'Rose Brand', 'Smokiez Edibles', 'Lowell Herb Co.'],
  },
};

export function getDispensary(slug) {
  if (dispensaryDetails[slug]) return dispensaryDetails[slug];
  const base = dispensaries.find((d) => d.slug === slug) || heroSlides.find((d) => d.slug === slug);
  const point = heroSlides.find((d) => d.slug === slug) || mapPoints.find((p) => base && p.name === base.name && p.city === base.city);
  const template = dispensaryDetails.hashery;
  const name = base ? base.name : slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    ...template,
    slug, name, code: base ? base.code : name.slice(0, 2).toUpperCase(),
    city: base ? base.city : 'Boston, MA', address: `${120 + (slug.length * 37) % 880} Main St`, zip: base ? base.city : 'Boston, MA 02108',
    phone: `(${[617, 213, 714, 508][slug.length % 4]}) 555-0${String(100 + (slug.length * 53) % 900).slice(0, 3)}`, website: `${slug.replace(/-/g, '')}.com`,
    rating: base && base.rating ? base.rating : 4.5, reviews: base && base.reviews ? base.reviews : 86,
    products: 180 + (slug.length * 41) % 300, dealsToday: 4 + (slug.length % 9), photos: 8 + (slug.length % 12),
    lat: point ? point.lat : template.lat, lng: point ? point.lng : template.lng,
    about: [
      name + ' is a licensed cannabis dispensary in ' + (base ? base.city : 'Boston, MA') + '. Its live menu is checked every morning, with stock, prices and deals pulled straight from the store.',
      'Order ahead for in-store pickup, browse flower, pre-rolls, vapes and edibles by strain type, and see which brands are on the shelf today.',
    ],
  };
}
