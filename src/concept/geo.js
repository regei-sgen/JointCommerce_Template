// Places the location field resolves, and the distance maths every "near you" number uses.
export const DEFAULT_PLACE = { name: 'Boston, MA', lat: 42.3601, lng: -71.0589 };

const PLACES = [
  DEFAULT_PLACE,
  { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
  { name: 'Denver, CO', lat: 39.7392, lng: -104.9903 },
  { name: 'Detroit, MI', lat: 42.3314, lng: -83.0458 },
  { name: 'Portland, OR', lat: 45.5152, lng: -122.6784 },
  { name: 'New York, NY', lat: 40.7128, lng: -74.006 },
  { name: 'Cambridge, MA', lat: 42.3736, lng: -71.1097 },
  { name: 'Worcester, MA', lat: 42.2626, lng: -71.8023 },
  { name: 'Tyngsboro, MA', lat: 42.6765, lng: -71.4245 },
  { name: 'Hopkinton, MA', lat: 42.2287, lng: -71.5226 },
  { name: 'Millbury, MA', lat: 42.194, lng: -71.76 },
  { name: 'Hackensack, NJ', lat: 40.8859, lng: -74.0435 },
  { name: 'Newark, NJ', lat: 40.7357, lng: -74.1724 },
  { name: 'Santa Ana, CA', lat: 33.7455, lng: -117.8677 },
  { name: 'North Hollywood, CA', lat: 34.172, lng: -118.3787 },
  { name: 'San Diego, CA', lat: 32.7157, lng: -117.1611 },
  { name: 'Vista, CA', lat: 33.2, lng: -117.2425 },
  { name: 'San Jose, CA', lat: 37.3382, lng: -121.8863 },
  { name: 'Oakland, CA', lat: 37.8044, lng: -122.2712 },
  { name: 'New Buffalo, MI', lat: 41.795, lng: -86.744 },
  { name: 'Ann Arbor, MI', lat: 42.2808, lng: -83.743 },
  { name: 'Grand Rapids, MI', lat: 42.9634, lng: -85.6681 },
  { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
  { name: 'Seattle, WA', lat: 47.6062, lng: -122.3321 },
  { name: 'Miami, FL', lat: 25.7617, lng: -80.1918 },
  { name: 'Boulder, CO', lat: 40.015, lng: -105.2705 },
  { name: 'Oklahoma City, OK', lat: 35.4676, lng: -97.5164 },
  { name: 'Albuquerque, NM', lat: 35.0844, lng: -106.6504 },
];

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// "Boston", "boston ma" or "Boston, MA" → the matching place, or null. Prefix matches need
// three or more characters; zip codes are not in the list and resolve to null.
export function resolvePlace(q) {
  const n = norm(q);
  if (!n) return null;
  const exact = PLACES.find((p) => norm(p.name) === n);
  if (exact) return exact;
  const city = PLACES.find((p) => norm(p.name.split(',')[0]) === n);
  if (city) return city;
  if (n.length < 3) return null;
  return PLACES.find((p) => norm(p.name).startsWith(n)) || null;
}

// Great-circle distance in miles.
export function milesBetween(a, b) {
  const R = 3958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const fmtMiles = (m) => (m < 10 ? m.toFixed(1) : String(Math.round(m)));
