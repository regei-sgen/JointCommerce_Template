import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Share, Check, Mail, Globe } from '../icons.jsx';

// Share a page. Touch devices with the Web Share API get the system sheet directly; everything else gets a
// small menu: copy link, a few direct targets, and the system sheet when the browser has one. The menu is
// portalled to <body> with fixed coordinates so scroll containers and clipped cards cannot cut it off.
const coarse = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

// The textarea copy runs synchronously inside the click, so it never waits on a clipboard permission; the async
// Clipboard API is the fallback, capped at 1.5s because it can stay pending while the document is unfocused.
function copySync(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch { return false; }
}
function copyText(text) {
  if (copySync(text)) return Promise.resolve(true);
  if (!navigator.clipboard?.writeText) return Promise.resolve(false);
  return Promise.race([
    navigator.clipboard.writeText(text).then(() => true, () => false),
    new Promise((r) => { window.setTimeout(() => r(false), 1500); }),
  ]);
}

// `path` is site-relative ("/dispensaries/x"); the current page is shared when it is left out.
export function ShareButton({ title, text, path, className = 'btn ghost sm', label = 'Share' }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(null); // null | 'ok' | 'fail'
  const root = useRef(null);
  const menu = useRef(null);
  const [pos, setPos] = useState(null);
  const timer = useRef(0);
  const url = path ? new URL(path, window.location.origin).href : window.location.href;
  const msg = text || title || '';

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (!root.current?.contains(e.target) && !menu.current?.contains(e.target)) setOpen(false); };
    const shut = (e) => { if (!menu.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', shut, true);
    window.addEventListener('resize', shut);
    return () => {
      document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', shut, true); window.removeEventListener('resize', shut);
    };
  }, [open]);

  // Below the button, right edges aligned; flipped above when it would run off the bottom, clamped to the viewport.
  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    const b = root.current.getBoundingClientRect();
    const m = menu.current.getBoundingClientRect();
    const gap = 6, pad = 8;
    const below = b.bottom + gap + m.height <= window.innerHeight - pad;
    const top = below ? b.bottom + gap : Math.max(pad, b.top - gap - m.height);
    const left = Math.min(Math.max(pad, b.right - m.width), window.innerWidth - m.width - pad);
    setPos({ top, left });
  }, [open]);

  const native = async () => {
    try { await navigator.share({ title, text: msg, url }); } catch { /* dismissed */ }
    setOpen(false);
  };
  const copy = async () => {
    setOpen(false);
    const ok = await copyText(url);
    setCopied(ok ? 'ok' : 'fail');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 2200);
  };
  const onClick = () => {
    if (navigator.share && coarse()) { native(); return; }
    setOpen((v) => !v);
  };

  const enc = encodeURIComponent;
  const targets = [
    ['WhatsApp', `https://wa.me/?text=${enc(`${msg} ${url}`.trim())}`],
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`],
    ['X', `https://twitter.com/intent/tweet?text=${enc(msg)}&url=${enc(url)}`],
  ];

  return (
    <span className={`share${open ? ' open' : ''}`} ref={root}>
      <button type="button" className={`${className} share-btn${copied === 'ok' ? ' done' : ''}`} aria-haspopup="menu" aria-expanded={open} onClick={onClick}>
        {copied === 'ok' ? <Check /> : <Share />}{label && <span>{copied === 'ok' ? 'Link copied' : copied === 'fail' ? 'Copy failed' : label}</span>}
      </button>
      <span className="srl" role="status" aria-live="polite">{copied === 'ok' ? 'Link copied' : copied === 'fail' ? 'Copy failed' : ''}</span>
      {open && createPortal(
        <span className="share-menu" role="menu" ref={menu} style={pos ? { top: pos.top, left: pos.left } : { visibility: 'hidden' }}>
          <button type="button" role="menuitem" onClick={copy}><Share className="ic14" />Copy link</button>
          {targets.map(([name, href]) => (
            <a key={name} role="menuitem" href={href} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}><Globe className="ic14" />{name}<span className="srl"> (opens in a new tab)</span></a>
          ))}
          <a role="menuitem" href={`mailto:?subject=${enc(title || '')}&body=${enc(`${msg}\n${url}`.trim())}`} onClick={() => setOpen(false)}><Mail className="ic14" />Email</a>
          {navigator.share && <button type="button" role="menuitem" onClick={native}><Share className="ic14" />More options…</button>}
        </span>,
        document.body,
      )}
    </span>
  );
}
