// Loads the API snapshot from public/data/jc/ (built by scripts/build-jc-data.mjs) into the search
// registry and the place list. When the files are missing, the sample data already in the registry
// stays in place and `loadData()` resolves false.
import { setData } from './search.js';
import { setPlaces } from './geo.js';

const BASE = `${import.meta.env.BASE_URL}data/jc/`;
const FILES = ['dispensaries', 'brands', 'strains', 'products', 'deals', 'menus', 'details', 'links', 'geo', 'meta'];

let promise = null;
export function loadData() {
  if (promise) return promise;
  promise = (async () => {
    try {
      const got = await Promise.all(FILES.map(async (n) => {
        const r = await fetch(`${BASE}${n}.json`);
        if (!(r.headers.get('content-type') || '').includes('json')) throw new Error(`${n}.json not json`);
        if (!r.ok) throw new Error(`${n}.json ${r.status}`);
        return r.json();
      }));
      const [dispensaries, brands, strains, products, deals, menus, details, links, geo, meta] = got;
      if (geo) setPlaces(geo);
      setData({ dispensaries, brands, strains, products, deals, menus, details, ...links, meta });
      return true;
    } catch (e) {
      console.warn('[jc] snapshot not available, using sample data:', e && e.message);
      return false;
    }
  })();
  return promise;
}
