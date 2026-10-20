import { useState, useCallback, useRef } from 'react';
import { heroSlides, site } from '../data.js';
import { Search } from '../icons.jsx';
import { LiveDot, Logo } from './ui.jsx';
import { useParallax, useReducedMotion } from '../hooks/useScroll.js';
import HeroCarousel from './HeroCarousel.jsx';
import LeafletMap from './LeafletMap.jsx';
import Navbar from './Navbar.jsx';

export default function Hero() {
  const reduced = useReducedMotion();
  const photoRef = useRef(null);
  const mapRef = useRef(null);
  const glowRef = useRef(null);
  const sideRef = useRef(null);
  const [active, setActive] = useState(0);
  const onSlide = useCallback((i) => setActive(i), []);
  const slide = heroSlides[active];
  const hasMap = (s) => typeof s.lat === 'number' && typeof s.lng === 'number';
  const showMap = hasMap(slide);
  const mapSlides = heroSlides.filter(hasMap);
  const firstMap = mapSlides[0] || { lat: 42.4, lng: -71.4 };
  // Parallax is written straight to the DOM once per frame; no React re-render while scrolling.
  useParallax((y, p) => {
    const k = reduced ? 0 : 1;
    if (photoRef.current) {
      photoRef.current.style.transform = `translate3d(0, ${(y * 0.25 * k).toFixed(1)}px, 0) scale(${(1.08 + p * 0.04).toFixed(3)})`;
      photoRef.current.style.filter = `blur(${(2.5 + Math.min(6, (y * k) / 140)).toFixed(1)}px) brightness(${(1 - Math.min(0.2, (y * k) / 3000)).toFixed(3)})`;
    }
    if (mapRef.current) mapRef.current.style.transform = `translate3d(0, ${(y * 0.12 * k).toFixed(1)}px, 0)`;
    if (glowRef.current) glowRef.current.style.transform = `translate3d(${(y * 0.1 * k).toFixed(1)}px, ${(-y * 0.15 * k).toFixed(1)}px, 0)`;
    if (sideRef.current) sideRef.current.style.transform = `translate3d(0, ${(-y * 0.08 * k).toFixed(1)}px, 0)`;
  }, [reduced]);

  return (
    <section className={`hero${showMap ? ' map-on' : ''}`}>
      <div className="photo" ref={photoRef} />
      <div className={`bg-map${showMap ? ' on' : ''}`} ref={mapRef}>
        <LeafletMap
          className="bg-map-art"
          center={[firstMap.lat, firstMap.lng]}
          zoom={11}
          focus={showMap ? { lat: slide.lat, lng: slide.lng } : undefined}
          focusZoom={11}
          interactive={false}
          eager
          points={mapSlides}
        />
      </div>
      <div className="tint" />
      <div className="layer glow-a" ref={glowRef} />

      <Navbar />

      <div className="wrap hero-grid">
        <div className="hero-copy hero-in">
          <LiveDot className="glass pill">Live menus · checked this morning</LiveDot>
          <h1>
            Where to buy your favorite strains from brands at{' '}
            <span className="grad">nearby dispensaries</span>
          </h1>
          <p className="lede">
            Search live dispensary menus, compare today's deals and see exactly which shop near you has it in stock.
          </p>
          <div className="search-panel">
            <div className="tabs">
              <button type="button" className="btn ink sm active">Dispensaries</button>
              <button type="button" className="btn sm plain">Brands</button>
            </div>
            <form className="search-form" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="q" className="srl">Search</label>
              <div className="field">
                <Search className="ic18" />
                <input id="q" type="text" placeholder="City, zip code, or address" />
              </div>
              <button type="submit" className="btn search-btn">Search</button>
            </form>
          </div>
          <div className="filters">
            <span className="chip hyb">Hybrid</span>
            <span className="chip sat">Sativa</span>
            <span className="chip ind">Indica</span>
            <span className="filters-hint">Filter by type, effect or brand</span>
          </div>
          <div className="hero-proof">
            <span className="hero-avatars">
              {heroSlides.slice(0, 3).map((s) => <Logo key={s.code} code={s.code} size={34} />)}
            </span>
            <span className="hero-proof-copy">
              <LiveDot>{site.openNow} dispensaries open now</LiveDot>
              <span className="muted">Menus checked this morning at {site.checkedAt}</span>
            </span>
          </div>
        </div>

        <aside className="hero-side" ref={sideRef}>
          <HeroCarousel active={active} onChange={onSlide} paused={reduced} />
        </aside>
      </div>
    </section>
  );
}
