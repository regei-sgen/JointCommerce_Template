import { useState } from 'react';
import Modal from './Modal.jsx';
import { Pin, Navigate, Search, User, Mail, ShieldCheck, Check, Store, Tag, Leaf, ChevronRight } from '../icons.jsx';
import { LiveDot } from './ui.jsx';
import { site } from '../data.js';

const CITIES = ['Boston, MA', 'Los Angeles, CA', 'Denver, CO', 'Detroit, MI', 'Portland, OR', 'New York, NY'];
const RADII = ['5 mi', '10 mi', '25 mi', '50 mi'];

const stop = (e) => e.preventDefault();

// `onSet` receives the typed string, or `{ name, lat, lng }` from the device's geolocation.
export function LocationModal({ open, onClose, onSet }) {
  const [q, setQ] = useState('');
  const [radius, setRadius] = useState('10 mi');
  const [locating, setLocating] = useState(false);
  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); onSet?.({ name: 'Current location', lat: pos.coords.latitude, lng: pos.coords.longitude }); onClose(); },
      () => setLocating(false),
      { timeout: 8000 },
    );
  };
  return (
    <Modal open={open} onClose={onClose} eyebrow={<><Pin />Location</>} title="Where are you shopping?">
      <p className="modal-sub">Set a location to see live menus, deals and pickup options near you.</p>
      <form className="modal-form" onSubmit={stop}>
        <label htmlFor="loc-q" className="srl">City, zip code or address</label>
        <div className="field">
          <Search className="ic18" />
          <input id="loc-q" type="text" placeholder="City, zip code, or address" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        </div>
        <button type="button" className="btn ghost modal-locate" onClick={locate} disabled={locating}><Navigate />{locating ? 'Locating…' : 'Use my current location'}</button>
        <div className="modal-label">Popular near you</div>
        <div className="modal-chips">
          {CITIES.map((c) => (
            <button key={c} type="button" className={`chip-btn${q === c ? ' on' : ''}`} onClick={() => setQ(c)}><Pin className="ic14" />{c}</button>
          ))}
        </div>
        <div className="modal-label">Search radius</div>
        <div className="modal-seg" role="radiogroup" aria-label="Search radius">
          {RADII.map((r) => (
            <button key={r} type="button" role="radio" aria-checked={radius === r} className={radius === r ? 'on' : ''} onClick={() => setRadius(r)}>{r}</button>
          ))}
        </div>
        <button type="submit" className="btn modal-submit" onClick={() => { if (q.trim() && onSet) onSet(q.trim()); onClose(); }}><Pin />Set location<ChevronRight className="ic14 ic-after" /></button>
      </form>
    </Modal>
  );
}

function Social() {
  return (
    <div className="modal-social">
      <button type="button" className="btn ghost"><span className="g-mark">G</span>Continue with Google</button>
      <button type="button" className="btn ghost"><span className="a-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.8 3-.8s1.8.8 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-.9-2.5-3.6ZM14.1 5.8c.6-.8 1.1-1.9 1-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3Z"/></svg></span>Continue with Apple</button>
      <div className="modal-or"><span>or</span></div>
    </div>
  );
}

function AuthAside({ title, points }) {
  return (
    <>
      <div className="modal-aside-photo" aria-hidden="true" />
      <div className="modal-aside-body">
        <LiveDot>Live menus · checked this morning</LiveDot>
        <div className="modal-aside-title">{title}</div>
        <ul className="modal-aside-list">
          {points.map(([Icon, text]) => <li key={text}><span className="modal-aside-icon"><Icon className="ic14" /></span>{text}</li>)}
        </ul>
      </div>
    </>
  );
}

export function LoginModal({ open, onClose, onSwitch }) {
  return (
    <Modal
      open={open} onClose={onClose} size="lg" eyebrow={<><User />Welcome back</>} title="Log in to JointCommerce"
      aside={<AuthAside title="Your menus, deals and saved shops in one place." points={[[Store, 'Saved dispensaries and pickup history'], [Tag, 'Deal alerts for the strains you follow'], [Leaf, 'Strain notes synced across devices']]} />}
    >
      <Social />
      <form className="modal-form" onSubmit={stop}>
        <label className="modal-field"><span>Email</span><input type="email" placeholder="you@example.com" autoComplete="email" /></label>
        <label className="modal-field"><span>Password</span><input type="password" placeholder="••••••••" autoComplete="current-password" /></label>
        <div className="modal-row">
          <label className="modal-check"><input type="checkbox" defaultChecked /><span>Keep me logged in</span></label>
          <a href="#" className="link link-sm" onClick={stop}>Forgot password?</a>
        </div>
        <button type="submit" className="btn modal-submit" onClick={onClose}>Log in<ChevronRight className="ic14 ic-after" /></button>
      </form>
      <p className="modal-foot">New here? <button type="button" className="link" onClick={onSwitch}>Create an account</button></p>
    </Modal>
  );
}

export function SignupModal({ open, onClose, onSwitch }) {
  return (
    <Modal
      open={open} onClose={onClose} size="lg" eyebrow={<><ShieldCheck />Free account</>} title="Create your account"
      aside={<AuthAside title={`Join ${site.shoppers} shoppers finding what's in stock near them.`} points={[[Check, 'Free, no card needed'], [Tag, 'Weekly deals near you'], [Store, 'Order ahead for pickup']]} />}
    >
      <Social />
      <form className="modal-form" onSubmit={stop}>
        <div className="modal-grid2">
          <label className="modal-field"><span>First name</span><input type="text" placeholder="Jane" autoComplete="given-name" /></label>
          <label className="modal-field"><span>Last name</span><input type="text" placeholder="Doe" autoComplete="family-name" /></label>
        </div>
        <label className="modal-field"><span>Email</span><input type="email" placeholder="you@example.com" autoComplete="email" /></label>
        <label className="modal-field"><span>Password</span><input type="password" placeholder="At least 8 characters" autoComplete="new-password" /></label>
        <label className="modal-check"><input type="checkbox" /><span>I am 21 or older, or a qualified medical patient.</span></label>
        <label className="modal-check"><input type="checkbox" defaultChecked /><span>Send me deals and new strains near me.</span></label>
        <button type="submit" className="btn modal-submit" onClick={onClose}>Create account<ChevronRight className="ic14 ic-after" /></button>
        <p className="modal-legal">By signing up you agree to our <a href="#" onClick={stop}>Terms</a> and <a href="#" onClick={stop}>Privacy Policy</a>.</p>
      </form>
      <p className="modal-foot">Already have an account? <button type="button" className="link" onClick={onSwitch}>Log in</button></p>
    </Modal>
  );
}
