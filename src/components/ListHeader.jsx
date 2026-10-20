import { Link } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import LeafletMap from './LeafletMap.jsx';
import { Home, ChevronRight } from '../icons.jsx';

// Dark page header shared by the listing pages. `bg` is 'map' (Leaflet behind) or 'photo' (leaf photo).
export default function ListHeader({ crumbs = [], eyebrow, title, sub, stats = [], bg = 'photo', center = [40.5, -98], zoom = 4, points = [], children }) {
  return (
    <section className={`dark dhead lhead lhead-bg-${bg}`}>
      {bg === 'map' ? (
        <div className="dhead-map" aria-hidden="true">
          <LeafletMap className="bg-map-art" center={center} zoom={zoom} interactive={false} eager points={points} />
        </div>
      ) : (
        <div className="lhead-photo" aria-hidden="true" />
      )}
      <div className="tint dhead-tint" />
      <Navbar />
      <div className="wrap dhead-body">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/"><Home className="ic14" />Home</Link>
          {crumbs.map((c) => (
            <span key={c.label} className="crumbs-seg">
              <ChevronRight className="ic14" />
              {c.to ? <Link to={c.to}>{c.label}</Link> : <span>{c.label}</span>}
            </span>
          ))}
        </nav>
        <div className="lhead-grid">
          <div className="lhead-copy">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h1 className="lhead-title">{title}</h1>
            {sub && <p className="lhead-sub">{sub}</p>}
            {stats.length > 0 && (
              <div className="lhead-stats">
                {stats.map((s) => <span key={s.label} className="lhead-stat"><strong>{s.value}</strong>{s.label}</span>)}
              </div>
            )}
          </div>
          {children && <div className="lhead-side">{children}</div>}
        </div>
      </div>
    </section>
  );
}
