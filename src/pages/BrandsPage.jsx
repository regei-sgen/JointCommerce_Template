import { useMemo, useState } from 'react';
import { allBrands } from '../listingData.js';
import { pics } from '../images.js';

const BRAND_PHOTOS = [...pics.topBrands, ...pics.liveMenus, ...pics.deals];
import { Star, Search, Store, ChevronRight, Tag } from '../icons.jsx';
import ListHeader from '../components/ListHeader.jsx';
import { Footer } from '../components/Footer.jsx';
import { useReveal } from '../hooks/useReveal.js';

const CATS = ['All', 'Flower', 'Pre-rolls', 'Vapes', 'Edibles', 'Concentrates'];

export default function BrandsPage() {
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const list = useMemo(() => allBrands
    .filter((b) => cat === 'All' || b.category === cat)
    .filter((b) => !q || b.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.menus - a.menus), [cat, q]);
  useReveal([list.length]);
  const max = Math.max(...allBrands.map((b) => b.menus));
  const [lead, ...rest] = list;

  return (
    <>
      <ListHeader
        crumbs={[{ label: 'Brands' }]}
        eyebrow={<><Star />Brands</>}
        title="Brands on live menus near you"
        sub="Ranked by how many dispensary menus list them this morning."
        stats={[{ value: allBrands.length, label: 'brands' }, { value: allBrands.reduce((a, b) => a + b.products, 0), label: 'products' }, { value: 5, label: 'categories' }]}
      >
        <form className="lhead-search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="bq" className="srl">Search brands</label>
          <div className="field"><Search className="ic18" /><input id="bq" type="text" placeholder="Search brands" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </form>
      </ListHeader>

      <div className="filterbar">
        <div className="wrap filterbar-inner">
          <div className="filterbar-chips" role="tablist">
            {CATS.map((c) => <button key={c} type="button" role="tab" aria-selected={cat === c} className={`chip-btn${cat === c ? ' on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          <span className="muted filterbar-count">{list.length} brand{list.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      <section className="sec sec-last">
        <div className="wrap">
          {lead && (
            <a href="#" className="glass tile tile-lead" data-reveal>
              <div className="tile-copy">
                <span className="eyebrow"><Star />#1 in {cat === 'All' ? 'all categories' : cat}</span>
                <div className="tile-title">{lead.name}</div>
                <p className="muted tile-text">{lead.blurb}</p>
                <div className="tile-tags">{lead.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>
                <div className="tile-stat"><strong>{lead.menus}</strong><span>live menus · {lead.products} products · {lead.states.join(', ')}</span></div>
                <span className="btn ink sm tile-btn">Where to buy<ChevronRight className="ic14 ic-after" /></span>
              </div>
              <div className="tile-art tile-art-photo"><img src={BRAND_PHOTOS[lead.pic % BRAND_PHOTOS.length]} alt="" /><span className="tile-badge">{lead.initial}</span></div>
            </a>
          )}
          <div className="brandgrid">
            {rest.map((b, i) => (
              <a key={b.slug} href="#" className="glass card brandcard" data-reveal style={{ '--i': (i % 6) + 1 }}>
                <div className="brandcard-art"><img src={BRAND_PHOTOS[b.pic % BRAND_PHOTOS.length]} alt="" loading="lazy" /><span className="brandcard-badge">{b.initial}</span><span className="chip brandcard-cat"><Tag className="ic14" />{b.category}</span></div>
                <div className="brandcard-body">
                  <div className="card-title card-title-lg">{b.name}</div>
                  <p className="muted brandcard-blurb">{b.blurb}</p>
                  <div className="brandcard-bar"><span className="board-bar"><i style={{ '--v': `${Math.round((b.menus / max) * 100)}%` }} /></span><span className="brandcard-menus"><Store className="ic14" />{b.menus} menus</span></div>
                  <div className="brandcard-foot"><span className="muted">{b.products} products</span><span className="muted">{b.states.join(' · ')}</span></div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
