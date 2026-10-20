import { lazy, Suspense, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { states, stateCounts } from '../data.js';
import { stateCities } from '../listingData.js';
import { Flag, Pin, ChevronRight, Store } from '../icons.jsx';
import ListHeader from '../components/ListHeader.jsx';
import { StateShape } from '../components/ui.jsx';
import { Footer } from '../components/Footer.jsx';
import { useReveal } from '../hooks/useReveal.js';

const UsMap = lazy(() => import('../components/UsMap.jsx'));

export default function StatesPage() {
  const [hover, setHover] = useState(null);
  const [picked, setPicked] = useState(states[0]);
  const active = useMemo(() => new Set(states), []);
  useReveal();
  const current = hover || picked;
  const totals = states.reduce((a, s) => ({ d: a.d + stateCounts[s].dispensaries, m: a.m + stateCounts[s].menus }), { d: 0, m: 0 });
  const sorted = [...states].sort((a, b) => stateCounts[b].dispensaries - stateCounts[a].dispensaries);
  const max = stateCounts[sorted[0]].dispensaries;

  return (
    <>
      <ListHeader
        crumbs={[{ label: 'Dispensaries', to: '/dispensaries' }, { label: 'By state' }]}
        eyebrow={<><Flag />By state</>}
        title="Dispensaries by state"
        sub="Twelve states with live menus today. Pick one to see its shops and cities."
        stats={[{ value: states.length, label: 'states' }, { value: totals.d.toLocaleString(), label: 'dispensaries' }, { value: totals.m.toLocaleString(), label: 'live menus' }]}
      />

      <section className="sec">
        <div className="wrap statesplit">
          <div className="glass usmap usmap-xl" data-reveal>
            <Suspense fallback={<div className="usmap-svg" style={{ minHeight: 460 }} />}>
              <UsMap active={active} hover={current} onHover={setHover} onSelect={setPicked} />
            </Suspense>
            <div className="usmap-legend"><i className="on" />Live menus<i />Coming soon</div>
          </div>
          <aside className="statepanel" data-reveal style={{ '--i': 1 }}>
            <div className="statepanel-head">
              <span className="state-row-art big"><StateShape name={current} size={44} /></span>
              <span>
                <span className="statepanel-title">{current}</span>
                <span className="muted card-meta">{stateCounts[current].dispensaries.toLocaleString()} dispensaries · {stateCounts[current].menus.toLocaleString()} live menus</span>
              </span>
            </div>
            <div className="statepanel-label">Top cities</div>
            <ul className="citylist">
              {stateCities[current].map((c, i) => (
                <li key={c}><Link to="/dispensaries" className="cityrow"><span className="cityrow-n">{i + 1}</span><Pin className="ic14" /><span className="cityrow-name">{c}</span><span className="muted">{Math.max(4, Math.round(stateCounts[current].dispensaries / (3 + i * 2)))} shops</span><ChevronRight className="ic14" /></Link></li>
              ))}
            </ul>
            <Link to="/dispensaries" className="btn ink statepanel-btn"><Store />Browse {current} dispensaries</Link>
          </aside>
        </div>
      </section>

      <section className="sec sec-last">
        <div className="wrap">
          <div className="sh" data-reveal><div><span className="eyebrow"><Store />Ranked</span><h2 className="h2">Most dispensaries</h2></div></div>
          <ol className="stateboard">
            {sorted.map((s, i) => (
              <li key={s} data-reveal style={{ '--i': i % 6 }}>
                <button type="button" className={`stateboard-row${current === s ? ' hot' : ''}`} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(null)} onClick={() => setPicked(s)}>
                  <span className="board-rank">{String(i + 1).padStart(2, '0')}</span>
                  <span className="state-row-art"><StateShape name={s} size={30} /></span>
                  <span className="stateboard-copy"><span className="card-title">{s}</span><span className="muted card-meta">{stateCities[s].slice(0, 3).join(' · ')}</span></span>
                  <span className="board-bar"><i style={{ '--v': `${Math.round((stateCounts[s].dispensaries / max) * 100)}%` }} /></span>
                  <span className="stateboard-n">{stateCounts[s].dispensaries.toLocaleString()}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <Footer />
    </>
  );
}
