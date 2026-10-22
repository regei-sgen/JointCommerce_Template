import { useEffect, useState } from 'react';

// True while the media query matches; re-renders on change.
export function useMedia(query) {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

// The window's inner height, updated on resize (phone sheets are sized in vh).
export function useViewportHeight() {
  const [h, setH] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800));
  useEffect(() => {
    const on = () => setH(window.innerHeight);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return h;
}

// The map base layer, 'streets' or 'satellite', kept in localStorage `jc.mapType` and shared by every map on the page.
const MAP_TYPE_KEY = 'jc.mapType';
const readMapType = () => { try { return localStorage.getItem(MAP_TYPE_KEY) === 'satellite' ? 'satellite' : 'streets'; } catch { return 'streets'; } };
export function useMapType() {
  const [type, setType] = useState(readMapType);
  useEffect(() => {
    const on = () => setType(readMapType());
    window.addEventListener('jc-maptype', on);
    return () => window.removeEventListener('jc-maptype', on);
  }, []);
  const set = (v) => {
    try { localStorage.setItem(MAP_TYPE_KEY, v); } catch { /* the choice lasts for this page only */ }
    setType(v);
    window.dispatchEvent(new Event('jc-maptype'));
  };
  return [type, set];
}
