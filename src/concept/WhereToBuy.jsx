import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Pin, Close, ChevronRight } from '../icons.jsx';
import { CATS, CAT_KEYS, isCat, catInfo, search, itemLink } from './search.js';
import { ItemBadge, itemSubtitle } from './cards.jsx';

// Category from the current URL (/concept/:cat); 'dispensaries' elsewhere.
export function useFinderCat() {
  const { pathname } = useLocation();
  const m = pathname.match(/^\/concept\/([a-z]+)/);
  return m && isCat(m[1]) ? m[1] : 'dispensaries';
}

// The search tool: category tabs, one text field with grouped typeahead, location, submit.
// Submitting navigates to /concept/<cat>?q=…; picking a suggestion navigates to that item.
export default function WhereToBuy({ loc, onLocation }) {
  const navigate = useNavigate();
  const location = useLocation();
  const cat = useFinderCat();
  const urlQ = new URLSearchParams(location.search).get('q') || '';
  const [text, setText] = useState(urlQ);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(-1);
  const input = useRef(null);
  const root = useRef(null);
  useEffect(() => { setText(urlQ); }, [urlQ, location.pathname]);

  useEffect(() => {
    const onDown = (e) => { if (root.current && !root.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);

  const go = (k = cat, t = text) => {
    const q = t.trim();
    navigate(`/concept/${k}${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    setOpen(false);
    setIdx(-1);
  };

  const flat = useMemo(() => {
    if (text.trim().length < 2) return [];
    const res = search(text, 'all');
    const order = [cat, ...CAT_KEYS.filter((k) => k !== cat)];
    return order.flatMap((k) => res[k].slice(0, k === cat ? 4 : 2).map((item) => ({ k, item })));
  }, [text, cat]);
  const showDrop = open && text.trim().length >= 2;

  const pick = ({ k, item }) => { navigate(itemLink(k, item)); setOpen(false); setIdx(-1); input.current?.blur(); };

  const onKey = (e) => {
    if (e.key === 'Escape') { setOpen(false); setIdx(-1); return; }
    if (!showDrop) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(flat.length, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(-1, i - 1)); }
    else if (e.key === 'Enter' && idx >= 0) { e.preventDefault(); if (idx < flat.length) pick(flat[idx]); else go(); }
  };

  const info = catInfo(cat);
  let lastGroup = null;

  return (
    <form className="wtb" role="search" ref={root} onSubmit={(e) => { e.preventDefault(); go(); }}>
      <div className="wtb-tabs" role="tablist" aria-label="Search category">
        {CATS.map((c) => (
          <button key={c.key} type="button" role="tab" aria-selected={c.key === cat} className={c.key === cat ? 'on' : ''} onClick={() => go(c.key)}>{c.label}</button>
        ))}
      </div>
      <div className="wtb-field">
        <Search className="ic18" />
        <label htmlFor="wtb-q" className="srl">{info.placeholder}</label>
        <input
          id="wtb-q" ref={input} type="text" value={text} placeholder={info.placeholder} autoComplete="off"
          role="combobox" aria-expanded={showDrop} aria-controls="wtb-list" aria-autocomplete="list"
          aria-activedescendant={idx >= 0 ? `wtb-opt-${idx}` : undefined}
          onChange={(e) => { setText(e.target.value); setOpen(true); setIdx(-1); }}
          onFocus={() => setOpen(true)} onKeyDown={onKey}
        />
        {text && <button type="button" className="wtb-clear" aria-label="Clear search" onClick={() => { setText(''); setIdx(-1); input.current?.focus(); if (urlQ) go(cat, ''); }}><Close className="ic14" /></button>}
        {showDrop && (
          <div className="wtb-drop" id="wtb-list" role="listbox">
            {flat.map((r, i) => {
              const head = r.k !== lastGroup ? <div key={`g-${r.k}`} className="wtb-group">{catInfo(r.k).label}</div> : null;
              lastGroup = r.k;
              return (
                <div key={`${r.k}-${r.item.slug}`}>
                  {head}
                  <button type="button" id={`wtb-opt-${i}`} role="option" aria-selected={idx === i} className={`wtb-item${idx === i ? ' on' : ''}`} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(r)}>
                    <ItemBadge cat={r.k} item={r.item} />
                    <span className="wtb-item-copy"><span className="wtb-item-title">{r.item.name}</span><span className="wtb-item-meta">{itemSubtitle(r.k, r.item)}</span></span>
                  </button>
                </div>
              );
            })}
            {flat.length === 0 && <div className="wtb-group">No matches for “{text.trim()}”</div>}
            <button type="button" id={`wtb-opt-${flat.length}`} role="option" aria-selected={idx === flat.length} className={`wtb-item wtb-all${idx === flat.length ? ' on' : ''}`} onMouseDown={(e) => e.preventDefault()} onClick={() => go()}>
              <Search className="ic18" />Search {info.label.toLowerCase()} for “{text.trim()}”<ChevronRight className="ic14 ic-after" />
            </button>
          </div>
        )}
      </div>
      <button type="button" className="wtb-loc" onClick={onLocation} aria-label={`Location: ${loc}. Change location`}><Pin className="ic14" /><span>{loc}</span></button>
      <button type="submit" className="btn ink sm wtb-go">Search</button>
    </form>
  );
}
