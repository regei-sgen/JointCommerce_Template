import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getDispensary, dispensaries, deals } from '../data.js';
import { pics } from '../images.js';
import {
  Pin, Phone, Globe, Star, Clock, Store, ShieldCheck, Bookmark, Share, ChevronDown, ChevronRight, Navigate,
  CreditCard, Banknote, Info, Tag, Home, Map, Leaf, Check, Truck,
} from '../icons.jsx';
import Navbar from '../components/Navbar.jsx';
import LeafletMap from '../components/LeafletMap.jsx';
import Rail from '../components/Rail.jsx';
import { Logo, LiveDot, TypeChip, Photo, SectionHeader } from '../components/ui.jsx';
import { Footer } from '../components/Footer.jsx';
import { useReveal } from '../hooks/useReveal.js';

const TABS = ['Overview', 'Menu', 'Reviews', 'Brands'];
const TODAY = new Date().toLocaleDateString('en-US', { weekday: 'long' });
const serviceIcon = { bag: <Store className="ic18" />, shield: <ShieldCheck className="ic18" /> };
const amenityIcon = (label) => (/card/i.test(label) ? <CreditCard className="ic18" /> : <Banknote className="ic18" />);

export default function DispensaryPage() {
  const { slug } = useParams();
  const d = getDispensary(slug);
  const [tab, setTab] = useState('Overview');
  const [expanded, setExpanded] = useState(false);
  const [week, setWeek] = useState(false);
  useReveal([tab]);

  const today = d.hours.find((h) => h.day === TODAY) || d.hours[0];
  const nearby = dispensaries.filter((x) => x.slug !== d.slug).slice(0, 4);
  const gallery = [pics.dispensaries[1], pics.dispensaries[3], pics.dispensaries[2]];
  const stats = [
    { icon: <Star className="ic18" />, value: d.rating.toFixed(1), label: `${d.reviews} reviews` },
    { icon: <Leaf className="ic18" />, value: String(d.products), label: 'products in stock' },
    { icon: <Tag className="ic18" />, value: String(d.dealsToday), label: 'deals today' },
    { icon: <Clock className="ic18" />, value: '15 min', label: 'pickup wait' },
  ];

  const MenuPoster = ({ m, i, tall }) => (
    <a href="#" className={`poster poster-${m.type}${tall ? '' : ' poster-short'}`} data-reveal style={{ '--i': i }}>
      <Photo src={pics.deals[i % pics.deals.length]} className="poster-photo" />
      <div className="poster-top"><TypeChip type={m.type} /><span className="poster-rank">{String(i + 1).padStart(2, '0')}</span></div>
      <div className="poster-body">
        <div className="poster-name">{m.name}</div>
        <div className="poster-lineage">{m.meta}</div>
        <div className="deal-price"><strong>${m.price}</strong><span className="poster-menus">THC {m.thc}%</span></div>
        <span className="poster-cta"><Store className="ic14" />Add to pickup<ChevronRight className="ic14 ic-after" /></span>
      </div>
    </a>
  );

  return (
    <>
      <section className="dark dhead">
        <div className="dhead-map" aria-hidden="true">
          <LeafletMap className="bg-map-art" center={[d.lat, d.lng]} zoom={14} interactive={false} eager points={[d]} />
        </div>
        <div className="tint dhead-tint" />
        <Navbar />
        <div className="wrap dhead-body">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/"><Home className="ic14" />Home</Link>
            <ChevronRight className="ic14" />
            <Link to="/">Dispensaries</Link>
            <ChevronRight className="ic14" />
            <span>{d.name}</span>
          </nav>

          <div className="glass dcard" data-reveal>
            <Logo code={d.code} size={84} />
            <div className="dcard-main">
              <div className="dcard-title-row">
                <h1 className="dcard-title">{d.name}</h1>
                {d.verified && <span className="chip verified"><ShieldCheck className="ic14" />Verified</span>}
              </div>
              <div className="dcard-meta">
                <span className="rating"><Star className="ic14" />{d.rating.toFixed(1)}<span className="muted"> ({d.reviews})</span></span>
                <span className="chip"><Store className="ic14" />Pickup</span>
                <LiveDot>Open today · {today.open} – {today.close}</LiveDot>
              </div>
              <div className="dcard-contact">
                <span><Pin className="ic14" />{d.address}, {d.zip}</span>
                <span><Phone className="ic14" />{d.phone}</span>
                <a href="#"><Globe className="ic14" />{d.website}</a>
              </div>
            </div>
            <div className="dcard-actions">
              <a href="#" className="btn"><Store />Shop menu</a>
              <a href="#" className="btn ghost"><Navigate />Directions</a>
              <button type="button" className="icon-btn" aria-label="Bookmark"><Bookmark className="ic18" /></button>
              <button type="button" className="icon-btn" aria-label="Share"><Share className="ic18" /></button>
            </div>
          </div>
        </div>
      </section>

      <div className="dtabs-wrap">
        <div className="wrap">
          <div className="dtabs" role="tablist">
            {TABS.map((t) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} className={`dtab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                {t}
                {t === 'Reviews' && <span className="dtab-count">{d.reviews}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="sec dbody">
        <div className="wrap dgrid">
          <div className="dmain">
            {tab === 'Overview' && (
              <>
                <div className="dgallery" data-reveal>
                  <a href="#" className="dgallery-main"><img src={gallery[0]} alt="" /><span className="dgallery-tag"><Store className="ic14" />Inside the store</span></a>
                  <a href="#" className="dgallery-side"><img src={gallery[1]} alt="" /></a>
                  <a href="#" className="dgallery-side"><img src={gallery[2]} alt="" /><span className="dgallery-more">+{d.photos} photos</span></a>
                </div>

                <div className="dstats" data-reveal>
                  {stats.map((s, i) => (
                    <div key={s.label} className="dstat" style={{ '--i': i }}>
                      <span className="dstat-icon">{s.icon}</span>
                      <span className="dstat-val">{s.value}</span>
                      <span className="dstat-label">{s.label}</span>
                    </div>
                  ))}
                </div>

                <article className="glass card dblock dabout-card" data-reveal>
                  <h2 className="h3"><Info className="ic18" />About {d.name}</h2>
                  <div className={`dabout${expanded ? ' open' : ''}`}>
                    {d.about.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
                  </div>
                  {d.about.length > 1 && (
                    <button type="button" className="link link-sm dmore" onClick={() => setExpanded((v) => !v)}>
                      {expanded ? 'Show less' : 'Read more'}<ChevronDown className={`ic14 ic-after${expanded ? ' flip' : ''}`} />
                    </button>
                  )}
                </article>

                <div className="glass card dblock" data-reveal>
                  <h2 className="h3"><Check className="ic18" />At a glance</h2>
                  <div className="dglance">
                    {d.services.map((s) => (
                      <div key={s.title} className="dglance-item">
                        <span className="dservice-icon">{serviceIcon[s.icon]}</span>
                        <span><span className="card-title">{s.title}</span><span className="muted card-meta">{s.text}</span></span>
                      </div>
                    ))}
                    <div className="dglance-item">
                      <span className="dservice-icon"><Truck className="ic18" /></span>
                      <span><span className="card-title">Delivery</span><span className="muted card-meta">{d.deliveryRadius} mi radius · {d.deliveryMin} min</span></span>
                    </div>
                    {d.amenities.map((a) => (
                      <div key={a} className="dglance-item">
                        <span className="dservice-icon soft">{amenityIcon(a)}</span>
                        <span><span className="card-title">{a}</span><span className="muted card-meta">Accepted in store</span></span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <SectionHeader icon={<Leaf className="ic14" />} eyebrow="Menu" title="On the menu today" sub="Checked this morning." link="Full menu" arrows={false} size={26} />
                  <Rail label="menu highlights">
                    {d.menuHighlights.map((m, i) => <MenuPoster key={m.name} m={m} i={i} />)}
                  </Rail>
                </div>

                <div>
                  <SectionHeader icon={<Tag />} eyebrow="Deals" title={`Deals at ${d.name}`} link="See all deals" arrows={false} size={26} />
                  <div className="ddeals">
                    {deals.slice(0, 3).map((dl, i) => (
                      <a key={dl.name} href="#" className="glass card ddeal" data-reveal style={{ '--i': i }}>
                        <img src={pics.deals[(i + 3) % pics.deals.length]} alt="" loading="lazy" />
                        <span className="ddeal-copy">
                          <span className="card-title">{dl.name}</span>
                          <span className="muted card-meta">{dl.meta}</span>
                          <span className="price"><strong>${dl.price}</strong> <s className="muted">${dl.was}</s></span>
                        </span>
                        <span className="deal-badge">-{dl.pct}%</span>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="tiles dexplore">
                  <a href="#" className="glass tile" data-reveal>
                    <div className="tile-copy">
                      <span className="eyebrow"><Store />Menu</span>
                      <div className="tile-title">Where to buy at {d.name}</div>
                      <p className="muted tile-text">Browse the live menu and order products directly from this retailer.</p>
                      <span className="btn ink sm tile-btn">Explore menu<ChevronRight className="ic14 ic-after" /></span>
                    </div>
                    <div className="tile-art tile-art-photo"><img src={pics.topBrands[1]} alt="" loading="lazy" /><span className="tile-badge"><Store className="ic24" /></span></div>
                  </a>
                  <a href="#" className="glass tile" data-reveal style={{ '--i': 1 }}>
                    <div className="tile-copy">
                      <span className="eyebrow"><Tag />Brands</span>
                      <div className="tile-title">Top brands at {d.name}</div>
                      <p className="muted tile-text">The most popular cannabis brands available at this location.</p>
                      <span className="btn ink sm tile-btn">View brands<ChevronRight className="ic14 ic-after" /></span>
                    </div>
                    <div className="tile-art tile-art-photo"><img src={pics.topBrands[0]} alt="" loading="lazy" /><span className="tile-badge"><Tag className="ic24" /></span></div>
                  </a>
                </div>
              </>
            )}

            {tab === 'Menu' && (
              <div className="grid g2">
                {d.menuHighlights.map((m, i) => <MenuPoster key={m.name} m={m} i={i} tall />)}
              </div>
            )}

            {tab === 'Reviews' && (
              <div className="glass card dblock" data-reveal>
                <h2 className="h3"><Star className="ic18" />Reviews</h2>
                <div className="dreview-sum">
                  <span className="dreview-big">{d.rating.toFixed(1)}</span>
                  <span>
                    <span className="stars">{'★★★★★'.slice(0, Math.round(d.rating))}<span className="muted">{'★★★★★'.slice(Math.round(d.rating))}</span></span>
                    <span className="muted card-meta">{d.reviews} reviews</span>
                  </span>
                </div>
                <ul className="dreview-list">
                  {d.reviewsList.map((r) => (
                    <li key={r.name} className="dreview">
                      <span className="dreview-avatar">{r.name.slice(0, 1)}</span>
                      <span className="dreview-body">
                        <span className="dreview-head"><strong>{r.name}</strong><span className="stars sm">{'★★★★★'.slice(0, r.stars)}</span><span className="muted">{r.when}</span></span>
                        <span className="dreview-text">{r.text}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === 'Brands' && (
              <div className="brand-strip dbrands">
                {d.brands.map((b, i) => (
                  <a key={b} href="#" className="glass brand-pill" data-reveal style={{ '--i': i }}>
                    <span className="brand-pill-disc">{b.slice(0, 1)}</span>
                    <span><span className="card-title card-title-sm">{b}</span><span className="muted card-meta">On the menu</span></span>
                    <ChevronRight className="ic14 brand-pill-go" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <aside className="dside">
            <div className="glass card dblock" data-reveal>
              <h2 className="h3"><Clock className="ic18" />Hours</h2>
              <ul className={`dhours${week ? ' open' : ''}`}>
                {d.hours.map((h) => (
                  <li key={h.day} className={h.day === today.day ? 'today' : ''}>
                    <span>{h.day}{h.day === today.day && <span className="chip chip-sm">Today</span>}</span>
                    <span>{h.open} – {h.close}</span>
                  </li>
                ))}
              </ul>
              <button type="button" className="link link-sm dmore" onClick={() => setWeek((v) => !v)}>
                {week ? 'Hide full week' : 'Show full week'}<ChevronDown className={`ic14 ic-after${week ? ' flip' : ''}`} />
              </button>
            </div>

            <div className="dark dstock" data-reveal>
              <div className="dstock-photo" aria-hidden="true" />
              <div className="dstock-body">
                <LiveDot>Live menu</LiveDot>
                <div className="dstock-title">Looking for what's in stock?</div>
                <p>Browse the live menu to see exactly where to buy products today.</p>
                <a href="#" className="btn"><Store />View menu</a>
              </div>
            </div>

            <div className="glass card dblock" data-reveal>
              <h2 className="h3"><Map className="ic18" />Contact &amp; location</h2>
              <div className="glass dmini">
                <LeafletMap className="dmini-map" center={[d.lat, d.lng]} zoom={13} points={[d]} />
              </div>
              <ul className="dcontact">
                <li><Pin className="ic14" /><span>{d.address}<span className="muted">{d.zip}</span></span></li>
                <li><Phone className="ic14" /><span>{d.phone}</span></li>
                <li><Globe className="ic14" /><a href="#" className="link">Visit website</a></li>
              </ul>
              <a href="#" className="btn ghost sm"><Navigate />Get directions</a>
            </div>

            <button type="button" className="glass card dreviews-btn" onClick={() => setTab('Reviews')} data-reveal>
              <Star className="ic18" />
              <span><span className="card-title">Read reviews</span><span className="muted card-meta">{d.reviews} reviews · {d.rating.toFixed(1)} average</span></span>
              <ChevronRight className="ic14" />
            </button>
          </aside>
        </div>
      </section>

      <section className="sec sec-last">
        <div className="wrap">
          <SectionHeader icon={<Pin />} eyebrow="Nearby" title="More dispensaries" sub="Other menus checked today." link="View all" arrows={false} />
          <Rail label="nearby dispensaries">
            {nearby.map((n, i) => (
              <Link key={n.slug} to={`/dispensaries/${n.slug}`} className="imcard" data-reveal style={{ '--i': i }}>
                <Photo src={pics.dispensaries[i % pics.dispensaries.length]} className="imcard-photo" />
                <div className="imcard-top">
                  <Logo code={n.code} size={48} />
                  <span className="imcard-status"><LiveDot>{n.status}</LiveDot></span>
                </div>
                <div className="imcard-body">
                  <div className="imcard-name">{n.name}</div>
                  <div className="imcard-meta"><Pin className="ic14" />{n.city} · {n.miles} mi</div>
                  <div className="imcard-row"><span className="rating"><Star className="ic14" />{n.rating.toFixed(1)}<span> ({n.reviews})</span></span><span className="chip">Pickup</span></div>
                  <div className="imcard-cta"><span className="btn sm"><Store />Shop menu</span></div>
                </div>
              </Link>
            ))}
          </Rail>
          <p className="muted legal">
            For use only by adults 21 years of age and older, or qualified patients as permitted by applicable state law. Keep out of reach of children.
            Cannabis may impair concentration, coordination, and judgment. Do not operate a vehicle or machinery under the influence of cannabis.
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
