import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Close } from '../icons.jsx';

// Accessible dialog shell: portal to <body>, backdrop click + Escape close, focus moves into the
// dialog on open and back to the opener on close, page scroll locked while open.
export default function Modal({ open, onClose, title, eyebrow, children, size = 'md', aside }) {
  const panel = useRef(null);
  const opener = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    opener.current = document.activeElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => {
      const first = panel.current?.querySelector('input, button, [href], select, textarea');
      first?.focus();
    }, 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      opener.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="modal-root" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal modal-${size}${aside ? ' modal-split' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={panel}>
        {aside && <div className="modal-aside">{aside}</div>}
        <div className="modal-body">
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}><Close className="ic18" /></button>
          {eyebrow && <span className="eyebrow modal-eyebrow">{eyebrow}</span>}
          <h2 id="modal-title" className="modal-title">{title}</h2>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
