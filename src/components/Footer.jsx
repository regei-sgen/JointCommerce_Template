import { Link } from 'react-router-dom';
import { footerColumns } from '../data.js';
import { Megaphone, Phone, Download } from '../icons.jsx';
import Wordmark from './Wordmark.jsx';

export function Advertise() {
  return (
    <section className="dark advertise">
      <div className="wrap advertise-grid" data-reveal>
        <div>
          <span className="eyebrow"><Megaphone />Advertise with us</span>
          <h2 className="h2">Reach cannabis shoppers at the moment they decide where to buy.</h2>
        </div>
        <div className="cta-actions">
          <a href="#" className="btn">Advertise on JointCommerce</a>
          <a href="#" className="btn ghost">Talk to sales</a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="dark footer">
      <div className="wrap">
        <div className="footer-grid" data-reveal>
          <div className="footer-brand">
            <Link to="/" className="brand" aria-label="JointCommerce home">
              <Wordmark height={24} />
            </Link>
            <p className="muted">Find dispensaries, compare strains and discover brands near you.</p>
            <form className="footer-form" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="nl2" className="srl">Email</label>
              <input id="nl2" type="email" placeholder="Your email" />
              <button type="submit" className="btn">Sign up</button>
            </form>
            <div className="badges">
              <a href="#" className="btn ghost sm"><Phone />App Store</a>
              <a href="#" className="btn ghost sm"><Download />Google Play</a>
            </div>
          </div>
          {footerColumns.map((c) => (
            <div key={c.title} className="ftcol">
              <strong>{c.title}</strong>
              {c.links.map((l) => <a key={l} href="#">{l}</a>)}
            </div>
          ))}
        </div>
        <div className="footer-bottom muted">
          <span>© 2026 JointCommerce. All rights reserved.</span>
          <span className="footer-links"><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Cookies</a><a href="#">English</a></span>
        </div>
      </div>
    </footer>
  );
}
