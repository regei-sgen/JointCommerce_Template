// Sample card photos. Each entry is an Unsplash photo id plus a focal-point crop
// (fp-x / fp-y in 0..1, fp-z zoom), rendered through the Unsplash image CDN.
const IDS = {
  leaves: '1498671546682-94a232c26d17',
  jars: '1536819114556-1e10f967fb61',
  bud: '1603909223429-69bb7101f420',
  tincture: '1556928045-16f7f50be0f3',
  products: '1598440947619-2c35fc9aa908',
  labelJar: '1611930022073-b7a4ba5fcccd',
};

export function photo(key, { x = 0.5, y = 0.5, z = 1, w = 640, h = 480 } = {}) {
  const id = IDS[key];
  if (!id) throw new Error(`unknown photo key: ${key}`);
  const crop = z > 1 ? `&crop=focalpoint&fp-x=${x}&fp-y=${y}&fp-z=${z}` : '';
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop${crop}&w=${w}&h=${h}&q=70`;
}

const p = (key, x, y, z, size) => photo(key, { x, y, z, ...size });
const tall = { w: 640, h: 480 };
const wide = { w: 640, h: 360 };

export const pics = {
  dispensaries: [
    p('leaves', 0.3, 0.5, 1.4, wide),
    p('jars', 0.5, 0.5, 1.2, wide),
    p('tincture', 0.5, 0.5, 1.2, wide),
    p('products', 0.4, 0.5, 1.2, wide),
    p('labelJar', 0.5, 0.5, 1.2, wide),
  ],
  strains: [
    p('bud', 0.3, 0.5, 2, tall),
    p('jars', 0.5, 0.3, 2, tall),
    p('leaves', 0.2, 0.3, 2, tall),
    p('bud', 0.7, 0.5, 1.6, tall),
    p('jars', 0.85, 0.4, 2, tall),
    p('leaves', 0.8, 0.7, 2, tall),
  ],
  liveMenus: [
    p('jars', 0.5, 0.5, 1.3, wide),
    p('products', 0.5, 0.5, 1.3, wide),
    p('labelJar', 0.5, 0.5, 1.3, wide),
    p('tincture', 0.5, 0.5, 1.3, wide),
    p('leaves', 0.5, 0.5, 1.3, wide),
    p('bud', 0.5, 0.5, 1.3, wide),
  ],
  deals: [
    p('jars', 0.15, 0.5, 2, tall),
    p('products', 0.4, 0.5, 1.4, tall),
    p('labelJar', 0.5, 0.5, 1.2, tall),
    p('bud', 0.5, 0.5, 1.2, tall),
    p('tincture', 0.7, 0.5, 1.6, tall),
    p('jars', 0.5, 0.6, 1.5, tall),
  ],
  newOnMenus: [
    p('leaves', 0.5, 0.5, 1.4, tall),
    p('bud', 0.2, 0.5, 1.8, tall),
    p('jars', 0.3, 0.3, 1.8, tall),
    p('tincture', 0.4, 0.5, 1.4, tall),
    p('leaves', 0.7, 0.3, 1.8, tall),
    p('bud', 0.8, 0.6, 1.8, tall),
  ],
  topBrands: [
    p('products', 0.6, 0.5, 1.6, wide),
    p('bud', 0.5, 0.5, 1.4, wide),
    p('labelJar', 0.5, 0.4, 1.4, wide),
  ],
  topStrains: [
    p('jars', 0.4, 0.4, 1.8, wide),
    p('leaves', 0.6, 0.5, 1.6, wide),
  ],
  featuredArticle: p('bud', 0.5, 0.5, 1, { w: 1000, h: 640 }),
  articles: [
    p('leaves', 0.5, 0.5, 1.2, wide),
    p('jars', 0.6, 0.5, 1.6, wide),
    p('tincture', 0.5, 0.5, 1.2, wide),
    p('products', 0.5, 0.5, 1.2, wide),
  ],
};
