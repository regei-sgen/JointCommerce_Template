// List rows for the finder panel and the home columns. No photography: each row leads with a
// typographic badge (initials, type, discount), then two lines of text.
import { Link } from 'react-router-dom';
import { Pin, Star, Store, ShieldCheck, Truck, ChevronRight, Clock, Sparkle, Tag } from '../icons.jsx';
import { LiveDot, TypeChip } from '../components/ui.jsx';
import { typeLabel } from '../data.js';
import { itemLink } from './search.js';

const pct = (n) => `${Math.round(n)}%`;

export function Badge({ children, tone = 'ink', className = '' }) {
  return <span className={`bd bd-${tone} ${className}`}>{children}</span>;
}

function Row({ to, hot, onHover, id, badge, title, meta, foot, aside, i = 0, featured }) {
  const over = onHover ? () => onHover(id) : undefined;
  const out = onHover ? () => onHover(null) : undefined;
  return (
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
}

export function DispensaryRow({ d, i, hot, onHover, to }) {
  return (
    <Row
      to={to || itemLink('dispensaries', d)} id={d.slug} hot={hot} onHover={onHover} i={i} featured={d.featured}
      badge={<Badge tone="ink">{d.code}</Badge>}
      title={<>{d.name}{d.verified && <><ShieldCheck className="ic14 frow-verified" /><span className="srl">Verified</span></>}</>}
      meta={<><Pin className="ic14" />{d.city} · {d.miles} mi<span className="dot" /><span className="rating"><Star className="ic14" />{d.rating.toFixed(1)}</span><span className="muted"> ({d.reviews})</span></>}
      foot={<><LiveDot>{d.status}</LiveDot>{d.delivery && <span className="chip chip-sm"><Truck className="ic14" />Delivery</span>}<span className="chip chip-sm">{d.products} products</span></>}
    />
  );
}

export function BrandRow({ b, i, hot, onHover }) {
  return (
    <Row
      to={itemLink('brands', b)} id={b.slug} hot={hot} onHover={onHover} i={i} featured={b.featured}
      badge={<Badge tone="mint">{b.initial}</Badge>}
      title={b.name}
      meta={<><Tag className="ic14" />{b.category}<span className="dot" />{b.products} products</>}
      foot={<><span className="chip chip-sm"><Store className="ic14" />{b.menus} menus</span><span className="muted small">{b.states.join(' · ')}</span></>}
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
      to={itemLink('products', p)} id={p.slug} hot={hot} onHover={onHover} i={i}
      badge={p.pct ? <Badge tone="teal">-{p.pct}%</Badge> : <Badge tone={p.type || 'mint'}>{p.category[0]}</Badge>}
      title={p.name}
      meta={p.meta}
      foot={<><span className="price"><strong>${p.price}</strong>{p.was && <s>${p.was}</s>}</span>{typeof p.thc === 'number' && <span className="thc">THC {p.thc}%</span>}<span className="muted small"><Store className="ic14" />{p.store}</span></>}
    />
  );
}

export function DealRow({ d, i, hot, onHover }) {
  return (
    <Row
      to={itemLink('deals', d)} id={d.slug} hot={hot} onHover={onHover} i={i}
      badge={<Badge tone="teal">-{d.pct}%</Badge>}
      title={d.name}
      meta={d.meta}
      foot={<><span className="price"><strong>${d.price}</strong><s>${d.was}</s></span><span className="muted small"><Store className="ic14" />{d.store}</span><span className={`muted small${d.ends === 'Tonight' ? ' soon' : ''}`}><Clock className="ic14" />Ends {d.ends.toLowerCase()}</span></>}
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
  if (cat === 'brands') return <Badge tone="mint" className={className}>{item.initial}</Badge>;
  if (cat === 'strains') return <Badge tone={item.type} className={className}>{typeLabel[item.type][0]}</Badge>;
  if (item.pct) return <Badge tone="teal" className={className}>-{item.pct}%</Badge>;
  return <Badge tone={item.type || 'mint'} className={className}>{item.category[0]}</Badge>;
}
export function itemSubtitle(cat, item) {
  if (cat === 'dispensaries') return `${item.city} · ${item.miles} mi · ${item.status}`;
  if (cat === 'brands') return `${item.category} · ${item.menus} menus · ${item.states.join(', ')}`;
  if (cat === 'strains') return `${typeLabel[item.type]} · ${item.lineage} · THC ${item.thc}%`;
  return `${item.meta} · ${item.store}`;
}

export { pct };
