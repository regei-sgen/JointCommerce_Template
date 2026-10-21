import { Link, useOutletContext } from 'react-router-dom';
import { site, footerColumns } from '../data.js';
import { Store, Star, Tag, Leaf, ChevronRight, ShieldCheck, Clock, Pin } from '../icons.jsx';
import { LiveDot, TypeChip } from '../components/ui.jsx';
import { useReveal } from '../hooks/useReveal.js';
import { search, itemLink } from './search.js';
import { fmtMiles } from './geo.js';
import { Badge } from './cards.jsx';
import { CAT_ICONS } from './catIcons.jsx';

const CATS = [
  { label: 'Flower', to: '/products?f=flower' },
  { label: 'Pre-rolls', to: '/products?f=pre-rolls' },
  { label: 'Vapes', to: '/products?f=vapes' },
  { label: 'Edibles', to: '/products?f=edibles' },
  { label: 'Concentrates', to: '/products?f=concentrates' },
  { label: 'All', text: 'All products', to: '/products' },
];

function Row({ title, to, children }) {
  return (
    <section className="hm-sec" data-reveal>
      <div className="hm-head">
        <h2 className="hm-title">{title}</h2>
        <Link to={to} className="hm-more" aria-label={`See all: ${title}`}><ChevronRight className="ic18" /></Link>
      </div>
      <div className="hm-row">{children}</div>
    </section>
  );
}

// Home: two promo tiles, category tiles, featured brands, then dispensaries, deals and strains near the place.
export default function HomePage() {
  const { place } = useOutletContext();
  useReveal();
  const res = search('', 'all', { origin: place });
  const stores = res.dispensaries.slice(0, 8);
  const brands = res.brands.slice(0, 8);
  const deals = res.deals.slice(0, 8);
  const strains = res.strains.slice(0, 8);
  const top = stores[0];
  const bestDeal = deals.reduce((a, b) => (b.pct > (a?.pct || 0) ? b : a), null);

  return (
    <div className="hm">
      <section className="hm-banners" data-reveal>
        <Link to="/deals" className="hm-banner hm-banner-ink">
          <span className="hm-banner-kicker"><Tag className="ic14" />Deals near {place.name}</span>
          <span className="hm-banner-title">Up to {bestDeal ? bestDeal.pct : 50}% off today</span>
          <span className="hm-banner-text">{site.dealsLive.toLocaleString()} deals read straight from live menus this morning.</span>
          <span className="btn sm hm-banner-btn">Shop deals<ChevronRight className="ic14 ic-after" /></span>
        </Link>
        {top && (
          <Link to={itemLink('dispensaries', top)} className="hm-banner hm-banner-light">
            <span className="hm-banner-kicker"><Star className="ic14" />Featured dispensary</span>
            <span className="hm-banner-title">{top.name}</span>
            <span className="hm-banner-text"><Pin className="ic14" />{top.city} · {fmtMiles(top.miles)} mi<span className="dot" /><LiveDot>{top.status}</LiveDot></span>
            <span className="btn ink sm hm-banner-btn"><Store />Shop menu</span>
            <Badge tone="ink" className="hm-banner-badge">{top.code}</Badge>
          </Link>
        )}
      </section>

      <section className="hm-sec" data-reveal>
        <div className="hm-head"><h2 className="hm-title">Browse by category</h2></div>
        <div className="hm-row hm-cats">
          {CATS.map((c) => { const Ic = CAT_ICONS[c.label]; return (
            <Link key={c.label} to={c.to} className="hm-cat"><span>{c.text || c.label}</span><Ic /></Link>
          ); })}
        </div>
      </section>

      <Row title="Featured brands" to="/brands">
        {brands.map((b) => (
          <Link key={b.slug} to={itemLink('brands', b)} className="hm-tile">
            <span className={`hm-tile-art hm-art-${b.pic % 4}`}><span className="hm-tile-initial">{b.initial}</span></span>
            <span className="hm-tile-name">{b.name}</span>
            <span className="hm-tile-meta"><Store className="ic14" />{b.menus} menus<span className="dot" />{b.category}</span>
          </Link>
        ))}
      </Row>

      <Row title={`Dispensaries near ${place.name}`} to="/dispensaries">
        {stores.map((d) => (
          <Link key={d.slug} to={itemLink('dispensaries', d)} className="hm-card">
            <span className="hm-card-top"><Badge tone="ink">{d.code}</Badge>{d.featured && <span className="frow-feat"><Star className="ic14" />Featured</span>}</span>
            <span className="hm-card-name">{d.name}{d.verified && <ShieldCheck className="ic14 frow-verified" />}</span>
            <span className="hm-card-meta">{d.city} · {fmtMiles(d.miles)} mi<span className="dot" /><span className="rating"><Star className="ic14" />{d.rating.toFixed(1)}</span></span>
            <span className="hm-card-foot"><LiveDot>{d.status}</LiveDot></span>
          </Link>
        ))}
      </Row>

      <Row title="Deals today" to="/deals">
        {deals.map((d) => (
          <Link key={d.slug} to={itemLink('deals', d)} className="hm-card">
            <span className="hm-card-top"><Badge tone="teal">-{d.pct}%</Badge><span className="hm-card-ends"><Clock className="ic14" />{d.ends}</span></span>
            <span className="hm-card-name">{d.name}</span>
            <span className="hm-card-meta">{d.meta}</span>
            <span className="hm-card-foot"><span className="price"><strong>${d.price}</strong><s>${d.was}</s></span><span className="muted small"><Store className="ic14" />{d.store}</span></span>
          </Link>
        ))}
      </Row>

      <Row title="Strains on menus near you" to="/strains">
        {strains.map((s) => (
          <Link key={s.slug} to={itemLink('strains', s)} className="hm-card">
            <span className="hm-card-top"><Badge tone={s.type}>{s.name[0]}</Badge><TypeChip type={s.type} small /></span>
            <span className="hm-card-name">{s.name}</span>
            <span className="hm-card-meta">{s.lineage}</span>
            <span className="hm-card-foot"><span className="thc">THC {s.thc}%</span><span className="muted small"><Leaf className="ic14" />{s.menus} menus</span></span>
          </Link>
        ))}
      </Row>

      <footer className="cx-foot">
        <span>© 2026 JointCommerce · Menus checked every morning at {site.checkedAt}</span>
        <span>{footerColumns[1].links.map((l) => <a key={l} href="#">{l}</a>)}</span>
      </footer>
    </div>
  );
}
