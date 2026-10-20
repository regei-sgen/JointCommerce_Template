import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { allStrains } from '../listingData.js';
import { typeLabel } from '../data.js';
import { pics } from '../images.js';
import { Leaf, Search, Sparkle, ChevronRight } from '../icons.jsx';
import ListHeader from '../components/ListHeader.jsx';
import { TypeChip } from '../components/ui.jsx';
import { Footer } from '../components/Footer.jsx';
import { useReveal } from '../hooks/useReveal.js';

const TYPES = ['all', 'hyb', 'sat', 'ind'];
const EFFECTS = ['Relaxed', 'Happy', 'Energetic', 'Focused', 'Euphoric', 'Sleepy', 'Creative'];

export default function StrainsPage() {
  const [params, setParams] = useSearchParams();
  const type = params.get('type') || 'all';
  const onlyNew = params.get('new') === '1';
  const [effect, setEffect] = useState(null);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('menus');
  const set = (patch) => { const n = new URLSearchParams(params); Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k))); setParams(n); };
  const list = useMemo(() => allStrains
    .filter((s) => type === 'all' || s.type === type)
    .filter((s) => !onlyNew || s.isNew)
    .filter((s) => !effect || s.effects.includes(effect))
    .filter((s) => !q || (s.name + ' ' + s.lineage).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (sort === 'thc' ? b.thc - a.thc : sort === 'name' ? a.name.localeCompare(b.name) : b.menus - a.menus)), [type, onlyNew, effect, q, sort]);
  useReveal([list.length, sort]);
  const counts = { hyb: allStrains.filter((s) => s.type === 'hyb').length, sat: allStrains.filter((s) => s.type === 'sat').length, ind: allStrains.filter((s) => s.type === 'ind').length };

  return (
    <>
      <ListHeader
        crumbs={[{ label: 'Strains' }]}
        eyebrow={<><Leaf className="ic14" />Strains</>}
        title="Every strain on a menu near you"
        sub="Type, lineage, potency and effects, with the shops that have it in stock today."
        stats={[{ value: allStrains.length, label: 'strains' }, { value: allStrains.filter((s) => s.isNew).length, label: 'new this week' }, { value: `${Math.max(...allStrains.map((s) => s.thc))}%`, label: 'top THC' }]}
      >
        <div className="typemix" aria-label="Strain type mix">
          {TYPES.slice(1).map((t) => (
            <button key={t} type="button" className={`typemix-row${type === t ? ' on' : ''}`} onClick={() => set({ type: type === t ? '' : t })}>
              <TypeChip type={t} /><span className="typemix-bar"><i className={t} style={{ '--v': `${Math.round((counts[t] / allStrains.length) * 100)}%` }} /></span><span className="typemix-n">{counts[t]}</span>
            </button>
          ))}
        </div>
      </ListHeader>

      <div className="filterbar">
        <div className="wrap filterbar-inner">
          <div className="filterbar-chips">
            <button type="button" className={`chip-btn${type === 'all' && !onlyNew ? ' on' : ''}`} onClick={() => set({ type: '', new: '' })}>All</button>
            {TYPES.slice(1).map((t) => <button key={t} type="button" className={`chip-btn${type === t ? ' on' : ''}`} onClick={() => set({ type: type === t ? '' : t })}>{typeLabel[t]}</button>)}
            <button type="button" className={`chip-btn${onlyNew ? ' on' : ''}`} onClick={() => set({ new: onlyNew ? '' : '1' })}><Sparkle className="ic14" />New on menus</button>
            <span className="filterbar-sep" />
            {EFFECTS.map((e) => <button key={e} type="button" className={`chip-btn soft${effect === e ? ' on' : ''}`} onClick={() => setEffect(effect === e ? null : e)}>{e}</button>)}
          </div>
          <div className="filterbar-right">
            <form className="filterbar-search" onSubmit={(e) => e.preventDefault()}><label htmlFor="sq" className="srl">Search strains</label><div className="field"><Search className="ic18" /><input id="sq" type="text" placeholder="Search strains" value={q} onChange={(e) => setQ(e.target.value)} /></div></form>
            <label className="sort"><span>Sort</span><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="menus">Most menus</option><option value="thc">Highest THC</option><option value="name">A to Z</option></select></label>
          </div>
        </div>
      </div>

      <section className="sec sec-last">
        <div className="wrap">
          <div className="postergrid">
            {list.map((s, i) => (
              <a key={s.name} href="#" className={`poster poster-${s.type}`} data-reveal style={{ '--i': i % 8 }}>
                <div className="ph ph-img poster-photo"><img src={pics.strains[s.pic % pics.strains.length]} alt="" loading="lazy" decoding="async" /></div>
                <div className="poster-top"><TypeChip type={s.type} />{s.isNew ? <span className="chip new-chip"><Sparkle className="ic14" />New</span> : <span className="poster-rank">{String(i + 1).padStart(2, '0')}</span>}</div>
                <div className="poster-body">
                  <div className="poster-name">{s.name}</div>
                  <div className="poster-lineage">{s.lineage}</div>
                  <div className="poster-effects">{s.effects.map((e) => <span key={e}>{e}</span>)}</div>
                  <div className="poster-foot"><span className="poster-thc"><span className="poster-bar"><i style={{ '--v': `${Math.round(s.thc * 3.2)}%` }} /></span>THC {s.thc}%</span><span className="poster-menus">{s.menus} menus</span></div>
                  <span className="poster-cta">Where to buy<ChevronRight className="ic14 ic-after" /></span>
                </div>
              </a>
            ))}
          </div>
          {list.length === 0 && <div className="glass card empty"><Leaf className="ic24" /><strong>No strains match.</strong><span className="muted">Clear a filter or search again.</span></div>}
        </div>
      </section>
      <Footer />
    </>
  );
}
