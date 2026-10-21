import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Wordmark from '../components/Wordmark.jsx';
import { Home, Store, Truck, Tag, Star, Grid, Leaf, Book, User } from '../icons.jsx';
import { LocationModal, LoginModal, SignupModal } from '../components/AuthModals.jsx';
import WhereToBuy, { useFinderCat } from './WhereToBuy.jsx';
import { DEFAULT_PLACE, resolvePlace, placePath } from './geo.js';
import './concept.css';

// The logo mark from public/img, resolved against Vite's base so it also works on a subpath host.
const MARK = `${import.meta.env.BASE_URL}img/logo-icon.png`;

// `cat` items get the location path appended (/in/united-states/<state>/<city>) when the place has one.
const NAV = [
  { to: '/', label: 'Home', icon: Home, active: (l) => l.pathname === '/' },
  { cat: 'dispensaries', label: 'Dispensaries', icon: Store, active: (l) => l.pathname.startsWith('/dispensaries') && !/\bf=delivery\b/.test(l.search) },
  { cat: 'dispensaries', query: '?f=delivery', label: 'Deliveries', icon: Truck, active: (l) => l.pathname.startsWith('/dispensaries') && /\bf=delivery\b/.test(l.search) },
  { cat: 'deals', label: 'Deals', icon: Tag, active: (l) => l.pathname.startsWith('/deals') },
  { cat: 'brands', label: 'Brands', icon: Star, active: (l) => l.pathname.startsWith('/brands') },
  { cat: 'products', label: 'Products', icon: Grid, active: (l) => l.pathname.startsWith('/products') },
  { cat: 'strains', label: 'Strains', icon: Leaf, active: (l) => l.pathname.startsWith('/strains') },
  { to: '/learn', label: 'Learn', icon: Book, active: (l) => l.pathname === '/learn' },
];
const navTo = (item, locPath) => item.to || `/${item.cat}${locPath}${item.query || ''}`;
const TABBAR = ['Home', 'Dispensaries', 'Deals', 'Brands', 'Strains'];

// Module-scope so its identity is stable across Shell renders (focus survives navigation).
function Item({ item, className, location, locPath }) {
  const Ic = item.icon;
  const on = item.active(location);
  return (
    <Link to={navTo(item, locPath)} className={`${className}${on ? ' on' : ''}`} aria-current={on ? 'page' : undefined}>
      <Ic className="ic18" /><span>{item.label}</span>
    </Link>
  );
}

// Layout: fixed left sidebar (categories), sticky top bar (search tool, location, account), content.
// `place` ({ name, lat, lng }) is the origin every distance and heading uses.
export default function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const cat = useFinderCat();
  const [place, setPlace] = useState(DEFAULT_PLACE);
  const locPath = placePath(place);
  const [modal, setModal] = useState(null); // 'location' | 'login' | 'signup'
  const hide = () => setModal(null);
  useEffect(() => {
    document.documentElement.classList.add('cx-on');
    return () => document.documentElement.classList.remove('cx-on');
  }, []);

  // A typed place resolves against the known list; an unknown string is rejected (the modal
  // reports it). Geolocation hands over coordinates directly.
  // After a change the current category (or dispensaries from home/learn) opens at the place's path.
  const goToPlace = (p, { fromUrl = false } = {}) => {
    if (fromUrl) return;
    const onCat = /^\/[a-z]+/.test(location.pathname) && !location.pathname.startsWith('/learn');
    const k = onCat ? cat : 'dispensaries';
    const base = `/${k}${placePath(p)}`;
    const qs = location.search && onCat ? location.search : '';
    navigate(base + qs);
  };
  const applyPlace = (v, opts) => {
    if (v && typeof v === 'object') { const p = { name: v.name, lat: v.lat, lng: v.lng }; setPlace(p); goToPlace(p, opts); return true; }
    const hit = resolvePlace(v);
    if (!hit) return false;
    setPlace(hit);
    goToPlace(hit, opts);
    return true;
  };

  return (
    <div className="cx">
      <aside className="cx-sb">
        <Link to="/" className="cx-brand" aria-label="JointCommerce home">
          <img className="cx-mark" src={MARK} alt="" width="36" height="36" />
          <Wordmark height={20} />
        </Link>
        <nav className="cx-nav" aria-label="Browse">
          {NAV.map((item) => <Item key={item.label} item={item} location={location} locPath={locPath} className="cx-link" />)}
        </nav>
        <div className="cx-sb-foot">
          <span>© 2026 JointCommerce</span>
        </div>
      </aside>

      <div className="cx-main">
        <header className="cx-top">
          <Link to="/" className="cx-top-brand" aria-label="JointCommerce home"><img className="cx-top-mark" src={MARK} alt="" width="36" height="36" /><Wordmark height={18} /></Link>
          <WhereToBuy place={place} onLocation={() => setModal('location')} />
          <div className="cx-acct">
            <button type="button" className="btn plain sm" onClick={() => setModal('login')}><User className="ic14" /><span className="nav-login-text">Log in</span></button>
            <button type="button" className="btn ink sm" onClick={() => setModal('signup')}>Sign up</button>
          </div>
        </header>
        <Outlet context={{ place, setPlace: applyPlace, openLocation: () => setModal('location') }} />
      </div>

      <nav className="cx-tabbar" aria-label="Browse">
        {NAV.filter((n) => TABBAR.includes(n.label)).map((item) => <Item key={item.label} item={item} location={location} locPath={locPath} className="cx-tab" />)}
      </nav>

      <LocationModal open={modal === 'location'} onClose={hide} onSet={applyPlace} />
      <LoginModal open={modal === 'login'} onClose={hide} onSwitch={() => setModal('signup')} />
      <SignupModal open={modal === 'signup'} onClose={hide} onSwitch={() => setModal('login')} />
    </div>
  );
}
