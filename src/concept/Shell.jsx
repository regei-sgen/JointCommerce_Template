import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Wordmark from '../components/Wordmark.jsx';
import { Home, Store, Truck, Tag, Star, Grid, Leaf, Book, User } from '../icons.jsx';
import { LocationModal, LoginModal, SignupModal } from '../components/AuthModals.jsx';
import WhereToBuy from './WhereToBuy.jsx';
import { DEFAULT_PLACE, resolvePlace } from './geo.js';
import './concept.css';

const NAV = [
  { to: '/concept', label: 'Home', icon: Home, active: (l) => l.pathname === '/concept' || l.pathname === '/concept/' },
  { to: '/concept/dispensaries', label: 'Dispensaries', icon: Store, active: (l) => l.pathname.startsWith('/concept/dispensaries') && !/\bf=delivery\b/.test(l.search) },
  { to: '/concept/dispensaries?f=delivery', label: 'Deliveries', icon: Truck, active: (l) => l.pathname === '/concept/dispensaries' && /\bf=delivery\b/.test(l.search) },
  { to: '/concept/deals', label: 'Deals', icon: Tag, active: (l) => l.pathname === '/concept/deals' },
  { to: '/concept/brands', label: 'Brands', icon: Star, active: (l) => l.pathname === '/concept/brands' },
  { to: '/concept/products', label: 'Products', icon: Grid, active: (l) => l.pathname === '/concept/products' },
  { to: '/concept/strains', label: 'Strains', icon: Leaf, active: (l) => l.pathname === '/concept/strains' },
  { to: '/concept/learn', label: 'Learn', icon: Book, active: (l) => l.pathname === '/concept/learn' },
];
const TABBAR = ['Home', 'Dispensaries', 'Deals', 'Brands', 'Strains'];

// Module-scope so its identity is stable across Shell renders (focus survives navigation).
function Item({ item, className, location }) {
  const Ic = item.icon;
  const on = item.active(location);
  return (
    <Link to={item.to} className={`${className}${on ? ' on' : ''}`} aria-current={on ? 'page' : undefined}>
      <Ic className="ic18" /><span>{item.label}</span>
    </Link>
  );
}

// Layout: fixed left sidebar (categories), sticky top bar (search tool, location, account), content.
// `place` ({ name, lat, lng }) is the origin every distance and heading uses.
export default function Shell() {
  const location = useLocation();
  const [place, setPlace] = useState(DEFAULT_PLACE);
  const [modal, setModal] = useState(null); // 'location' | 'login' | 'signup'
  const hide = () => setModal(null);
  useEffect(() => {
    document.documentElement.classList.add('cx-on');
    return () => document.documentElement.classList.remove('cx-on');
  }, []);

  // A typed place resolves against the known list; an unknown string is rejected (the modal
  // reports it). Geolocation hands over coordinates directly.
  const applyPlace = (v) => {
    if (v && typeof v === 'object') { setPlace({ name: v.name, lat: v.lat, lng: v.lng }); return true; }
    const hit = resolvePlace(v);
    if (!hit) return false;
    setPlace(hit);
    return true;
  };

  return (
    <div className="cx">
      <aside className="cx-sb">
        <Link to="/concept" className="cx-brand" aria-label="JointCommerce home">
          <span className="brand-mark cx-mark" aria-hidden="true"><Leaf className="ic18" fill="#fff" /></span>
          <Wordmark height={20} />
        </Link>
        <nav className="cx-nav" aria-label="Browse">
          {NAV.map((item) => <Item key={item.label} item={item} location={location} className="cx-link" />)}
        </nav>
        <div className="cx-sb-foot">
          <span>© 2026 JointCommerce</span>
        </div>
      </aside>

      <div className="cx-main">
        <header className="cx-top">
          <Link to="/concept" className="cx-top-brand" aria-label="JointCommerce home"><Wordmark height={18} /></Link>
          <WhereToBuy place={place} onLocation={() => setModal('location')} />
          <div className="cx-acct">
            <button type="button" className="btn plain sm" onClick={() => setModal('login')}><User className="ic14" /><span className="nav-login-text">Log in</span></button>
            <button type="button" className="btn ink sm" onClick={() => setModal('signup')}>Sign up</button>
          </div>
        </header>
        <Outlet context={{ place, setPlace: applyPlace, openLocation: () => setModal('location') }} />
      </div>

      <nav className="cx-tabbar" aria-label="Browse">
        {NAV.filter((n) => TABBAR.includes(n.label)).map((item) => <Item key={item.label} item={item} location={location} className="cx-tab" />)}
      </nav>

      <LocationModal open={modal === 'location'} onClose={hide} onSet={applyPlace} />
      <LoginModal open={modal === 'login'} onClose={hide} onSwitch={() => setModal('signup')} />
      <SignupModal open={modal === 'signup'} onClose={hide} onSwitch={() => setModal('login')} />
    </div>
  );
}
