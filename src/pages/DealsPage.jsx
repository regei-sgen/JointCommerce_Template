import { useEffect, useMemo, useState } from 'react';
import { allDeals } from '../listingData.js';
import { site } from '../data.js';
import { pics } from '../images.js';
import { Tag, Clock, Check, ChevronRight, Store } from '../icons.jsx';
import ListHeader from '../components/ListHeader.jsx';
import { Footer } from '../components/Footer.jsx';
import { useReveal } from '../hooks/useReveal.js';

const CATS = ['All', 'Flower', 'Pre-rolls', 'Vapes', 'Edibles', 'Concentrates'];

function useCountdown() {
  const [t, setT] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now); end.setHours(23, 59, 59, 0);
      const s = Math.max(0, Math.floor((end - now) / 1000));
      setT(`${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return t;
}

export default function DealsPage() {
  const [cat, setCat] = useState('All');
  const [sort, setSort] = useState('pct');
  const left = useCountdown();
  const list = useMemo(() => allDeals
    .filter((d) => cat === 'All' || d.category === cat)
    .sort((a, b) => (sort === 'price' ? a.price - b.price : b.pct - a.pct)), [cat, sort]);
  useReveal([list.length, sort]);
  const best = Math.max(...allDeals.map((d) => d.pct));

  return (
    <div className="dark dealspage">
      <ListHeader
        crumbs={[{ label: 'Deals' }]}
        eyebrow={<><Tag />Today's deals</>}
        title={`Up to ${best}% off on live menus near you`}
        sub="Discounts are read straight off dispensary menus this morning, so every price here is the shelf price."
        stats={[{ value: site.dealsLive.toLocaleString(), label: 'deals live' }, { value: allDeals.filter((d) => d.ends === 'Tonight').length, label: 'end tonight' }, { value: `${best}%`, label: 'best discount' }]}
      >
        <div className="countdown" aria-live="off">
          <span className="countdown-label"><Clock className="ic14" />Tonight's deals end in</span>
          <span className="countdown-num">{left}</span>
          <span className="countdown-sub">Prices refresh at 7 AM</span>
        </div>
      </ListHeader>

      <div className="filterbar filterbar-dark">
        <div className="wrap filterbar-inner">
          <div className="filterbar-chips" role="tablist">
            {CATS.map((c) => <button key={c} type="button" role="tab" aria-selected={cat === c} className={`chip-btn${cat === c ? ' on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          <div className="filterbar-right">
            <span className="muted filterbar-count">{list.length} deal{list.length === 1 ? '' : 's'}</span>
            <label className="sort"><span>Sort</span><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="pct">Biggest discount</option><option value="price">Lowest price</option></select></label>
          </div>
        </div>
      </div>

      <section className="sec sec-last">
        <div className="wrap">
          <div className="postergrid">
            {list.map((d, i) => (
              <a key={d.name} href="#" className="poster dealposter" data-reveal style={{ '--i': i % 8 }}>
                <div className="ph ph-img poster-photo"><img src={pics.deals[d.pic % pics.deals.length]} alt="" loading="lazy" decoding="async" /></div>
                <div className="poster-top"><span className="deal-badge">-{d.pct}%</span><span className={`deal-ends${d.ends === 'Tonight' ? ' soon' : ''}`}><Clock className="ic14" />Ends {d.ends.toLowerCase()}</span></div>
                <div className="poster-body">
                  <div className="poster-name">{d.name}</div>
                  <div className="poster-lineage">{d.meta}</div>
                  <div className="deal-store"><Store className="ic14" />{d.store}</div>
                  <div className="deal-price"><strong>${d.price}</strong><s>${d.was}</s><span className="deal-save">Save ${d.was - d.price}</span></div>
                  <span className="poster-cta"><Check className="ic14" />Claim deal<ChevronRight className="ic14 ic-after" /></span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
