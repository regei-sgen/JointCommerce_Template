import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { navMenu } from '../data.js';
import {
  Pin, User, Menu, Close, ChevronDown, Store, Truck, Map, Trophy, Grid, Sparkle, Scale, Mail, FileText,
} from '../icons.jsx';
import Wordmark from './Wordmark.jsx';
import { LocationModal, LoginModal, SignupModal } from './AuthModals.jsx';

const ICONS = { store: Store, truck: Truck, map: Map, trophy: Trophy, grid: Grid, sparkle: Sparkle, scale: Scale, mail: Mail, file: FileText };

// Glass navbar used on top of every dark hero band (home hero and dispensary header).
// Groups with `items` open a panel: hover opens on pointer devices, click toggles (touch/keyboard),
// Escape and outside clicks close. Below 900px the panel content is listed inline inside the menu sheet.
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [modal, setModal] = useState(null); // 'location' | 'login' | 'signup'
  const show = (m) => { setModal(m); setOpen(false); setActive(null); };
  const hide = () => setModal(null);
  const root = useRef(null);
  const closeTimer = useRef(0);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setActive(null); setOpen(false); } };
    const onDown = (e) => { if (root.current && !root.current.contains(e.target)) setActive(null); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, []);

  const enter = (label) => { window.clearTimeout(closeTimer.current); setActive(label); };
  const leave = () => { closeTimer.current = window.setTimeout(() => setActive(null), 140); };

  return (
    <div className="wrap nav-wrap" ref={root}>
      <div className="glass navbar">
        <Link to="/" className="brand" aria-label="JointCommerce home">
          <Wordmark height={22} />
        </Link>
        <nav className={`nav-links${open ? ' open' : ''}`}>
          {navMenu.map((g) => g.items ? (
            <div
              key={g.label}
              className={`nav-item has-menu${active === g.label ? ' open' : ''}`}
              onMouseEnter={() => enter(g.label)}
              onMouseLeave={leave}
            >
              <button
                type="button"
                className="nav-trigger"
                aria-haspopup="true"
                aria-expanded={active === g.label}
                onClick={() => setActive((a) => (a === g.label ? null : g.label))}
              >
                {g.label}<ChevronDown className="ic14 nav-caret" />
              </button>
              <div className="nav-menu" role="menu" aria-label={g.label}>
                {g.items.map((it) => {
                  const Ic = ICONS[it.icon] || Store;
                  return (
                    <Link key={it.title} to={it.to} className="nav-menu-item" role="menuitem" onClick={() => { setActive(null); setOpen(false); }}>
                      <span className="nav-menu-icon"><Ic className="ic18" /></span>
                      <span className="nav-menu-copy">
                        <span className="nav-menu-title">{it.title}</span>
                        <span className="nav-menu-text">{it.text}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <a key={g.label} href={g.to || '#'} className="nav-item">{g.label}</a>
          ))}
          <div className="nav-mobile-actions">
            <button type="button" className="btn ghost sm" onClick={() => show('location')}><Pin />Set location</button>
            <button type="button" className="btn sm" onClick={() => show('signup')}>Sign up</button>
          </div>
        </nav>
        <div className="nav-actions">
          <button type="button" className="btn ghost sm nav-location" onClick={() => show('location')}><Pin />Set location</button>
          <button type="button" className="nav-login" onClick={() => show('login')}><User />Log in</button>
          <button type="button" className="btn sm nav-signup" onClick={() => show('signup')}>Sign up</button>
          <button
            type="button"
            className="nav-toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <Close className="ic18" /> : <Menu className="ic18" />}
          </button>
        </div>
      </div>
      <LocationModal open={modal === 'location'} onClose={hide} />
      <LoginModal open={modal === 'login'} onClose={hide} onSwitch={() => setModal('signup')} />
      <SignupModal open={modal === 'signup'} onClose={hide} onSwitch={() => setModal('login')} />
    </div>
  );
}
