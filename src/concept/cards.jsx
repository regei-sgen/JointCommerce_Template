// List rows for the finder panel and the home columns. No photography: each row leads with a
// typographic badge (initials, type, discount), then two lines of text.
import { Link } from 'react-router-dom';
import { Pin, Star, Store, ShieldCheck, Truck, ChevronRight, Clock, Sparkle, Tag } from '../icons.jsx';
import { LiveDot, TypeChip } from '../components/ui.jsx';
import { typeLabel } from '../data.js';
import { itemLink } from './search.js';
import { fmtMiles } from './geo.js';
import { AddButton } from './cart.jsx';

const pct = (n) => `${Math.round(n)}%`;

export function Badge({ children, tone = 'ink', className = '' }) {
  return <span className={`bd bd-${tone} ${className}`}>{children}</span>;
}

// Brand badge: the brand's logo when the data has one (the initial stays underneath and shows if
// the image fails), otherwise the initial alone.
export function BrandMark({ b, className = '' }) {
  return (
    <Badge tone="mint" className={`${b.logo ? 'bd-logo' : ''} ${className}`}>
      {b.initial}
      {b.logo && <img src={b.logo} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.remove(); }} />}
    </Badge>
  );
}

const brandPlace = (b) => (b.city ? `${b.city}${b.states && b.states[0] ? `, ${b.states[0]}` : ''}` : (b.states || []).join(', ') || b.country || '');

function Row({ to, hot, onHover, id, badge, title, meta, foot, aside, i = 0, featured, action }) {
  const over = onHover ? () => onHover(id) : undefined;
  const out = onHover ? () => onHover(null) : undefined;
  const link = (
    <Link to={to} className={`frow${hot ? ' hot' : ''}${featured ? ' featured' : ''}`} data-reveal style={{ '--i': i % 8 }}
      onMouseEnter={over} onMouseLeave={out} onFocus={over} onBlur={out}>
      {badge}
      <span className="frow-copy">
        <span className="frow-title">{title}{featured && <span className="frow-feat"><Star className="ic14" />Featured</span>}</span>
        {meta && <span className="frow-meta">{meta}</span>}
        {foot && <span className="frow-foot">{foot}</span>}
      </span>
      <span className="frow-aside">{aside}<ChevronRight className="ic14 frow-go" /></span>
    </Link>
  );
  // `action` (an Add button) sits beside the link, not inside it, so the row stays one anchor.
  return action ? <div className={`frow-outer${hot ? ' hot' : ''}`}>{link}<span className="frow-action">{action}</span></div> : link;
}

export function DispensaryRow({ d, i, hot, onHover, to }) {
  return (
    <Row
      to={to || itemLink('dispensaries', d)} id={d.slug} hot={hot} onHover={onHover} i={i} featured={d.featured}
      badge={<Badge tone="ink">{d.code}</Badge>}
      title={<>{d.name}{d.verified && <><ShieldCheck className="ic14 frow-verified" /><span className="srl">Verified</span></>}</>}
      meta={<><Pin className="ic14" />{d.city} · {fmtMiles(d.miles)} mi<span className="dot" /><span className="rating"><Star className="ic14" />{d.rating.toFixed(1)}</span><span className="muted"> ({d.reviews})</span></>}
      foot={<><LiveDot>{d.status}</LiveDot>{d.delivery && <span className="chip chip-sm"><Truck className="ic14" />Delivery</span>}{d.products > 0 ? <span className="chip chip-sm">{d.products} products</span> : d.menu ? <span className="chip chip-sm"><Store className="ic14" />Live menu</span> : <span className="muted small">No menu yet</span>}</>}
    />
  );
}

export function BrandRow({ b, i, hot, onHover }) {
  return (
    <Row
      to={itemLink('brands', b)} id={b.slug} hot={hot} onHover={onHover} i={i} featured={b.featured}
      badge={<BrandMark b={b} />}
      title={b.name}
      meta={<><Tag className="ic14" />{b.type || b.category}<span className="dot" />{b.products} products{b.reviews > 0 && <><span className="dot" /><Star className="ic14" /><strong>{b.rating.toFixed(1)}</strong> ({b.reviews})</>}</>}
      foot={<>{b.verified && <span className="chip chip-sm"><ShieldCheck className="ic14" />Verified</span>}<span className="chip chip-sm"><Store className="ic14" />{b.menus} menus</span><span className="muted small">{brandPlace(b)}</span></>}
    />
  );
}

export function StrainRow({ s, i, hot, onHover }) {
  return (
    <Row
      to={itemLink('strains', s)} id={s.slug} hot={hot} onHover={onHover} i={i} featured={s.featured}
      badge={<Badge tone={s.type}>{typeLabel[s.type][0]}</Badge>}
      title={<>{s.name}{s.isNew && <span className="chip chip-sm new-chip"><Sparkle className="ic14" />New</span>}</>}
      meta={s.lineage}
      foot={<><TypeChip type={s.type} small /><span className="thc">THC {s.thc}%</span><span className="muted small">{s.effects.join(', ')}</span></>}
      aside={<span className="frow-n"><strong>{s.menus}</strong>menus</span>}
    />
  );
}

export function ProductRow({ p, i, hot, onHover }) {
  return (
    <Row
      to={itemLink('products', p)} id={p.slug} hot={hot} onHover={onHover} i={i} featured={p.featured} action={<AddButton item={p} />}
      badge={p.pct ? <Badge tone="teal">-{p.pct}%</Badge> : <Badge tone={p.type || 'mint'}>{p.category[0]}</Badge>}
      title={p.name}
      meta={p.meta}
      foot={<><span className="price"><strong>${p.price}</strong>{p.was && <s>${p.was}</s>}</span>{typeof p.thc === 'number' && <span className="thc">THC {p.thc}%</span>}<span className="muted small"><Store className="ic14" />{p.store}</span></>}
    />
  );
}

// `inStore`: rendered on the store's own page, so the store name is left out of the foot.
export function DealRow({ d, i, hot, onHover, inStore = false }) {
  const ends = d.ends === 'Tonight' ? 'Ends tonight' : d.ends === 'Ongoing' ? 'Ongoing' : `Ends ${d.ends}`;
  return (
    <Row
      to={itemLink('deals', d)} id={d.slug} hot={hot} onHover={onHover} i={i} featured={d.featured} action={<AddButton item={d} />}
      badge={<Badge tone="teal">-{d.pct}%</Badge>}
      title={d.name}
      meta={d.meta}
      foot={<><span className="price"><strong>${d.price}</strong>{d.was && <s>${d.was}</s>}</span>{!inStore && <span className="muted small"><Store className="ic14" />{d.store}</span>}<span className={`muted small${d.ends === 'Tonight' ? ' soon' : ''}`}><Clock className="ic14" />{ends}</span></>}
    />
  );
}

export const ROW = { dispensaries: DispensaryRow, brands: BrandRow, strains: StrainRow, products: ProductRow, deals: DealRow };
export const ROW_PROP = { dispensaries: 'd', brands: 'b', strains: 's', products: 'p', deals: 'd' };

export function ResultRow({ cat, item, ...rest }) {
  const C = ROW[cat];
  const props = { [ROW_PROP[cat]]: item, ...rest };
  return <C {...props} />;
}

// Badge + one-line subtitle for an item of any category (typeahead rows, selected-item header).
export function ItemBadge({ cat, item, className }) {
  if (cat === 'dispensaries') return <Badge tone="ink" className={className}>{item.code}</Badge>;
  if (cat === 'brands') return <BrandMark b={item} className={className} />;
  if (cat === 'strains') return <Badge tone={item.type} className={className}>{typeLabel[item.type][0]}</Badge>;
  if (item.pct) return <Badge tone="teal" className={className}>-{item.pct}%</Badge>;
  return <Badge tone={item.type || 'mint'} className={className}>{item.category[0]}</Badge>;
}
export function itemSubtitle(cat, item) {
  if (cat === 'dispensaries') return `${item.city} · ${fmtMiles(item.miles)} mi · ${item.status}`;
  if (cat === 'brands') return [item.type || item.category, item.verified ? 'Verified' : null, item.menus > 0 ? `${item.menus} menus` : null, brandPlace(item)].filter(Boolean).join(' · ');
  if (cat === 'strains') return `${typeLabel[item.type]} · ${item.lineage} · THC ${item.thc}%`;
  return `${item.meta} · ${item.store}`;
}

export { pct };
