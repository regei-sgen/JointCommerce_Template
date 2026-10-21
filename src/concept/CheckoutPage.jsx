// Checkout: the cart grouped by pickup store, contact details, a pickup time drawn from the store's hours,
// payment at pickup, notes, and an order summary. Placing the order writes it to localStorage (jc.orders),
// clears the cart and opens the confirmation page. Nothing is sent to a store: the API has no ordering
// endpoint, and the pages say so.
import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Store, Pin, Clock, Banknote, CreditCard, Check, ChevronLeft, Phone, Info } from '../icons.jsx';
import { LiveDot } from '../components/ui.jsx';
import { useCart } from './cart.jsx';
import { storeBySlug, detailsFor, openNow } from './search.js';
import { Badge } from './cards.jsx';

const ORDERS_KEY = 'jc.orders';
const money = (n) => `$${(Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '')}`;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const minutesOf = (t) => { const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(t || '').trim()); if (!m) return null; let h = Number(m[1]) % 12; if (m[3].toUpperCase() === 'PM') h += 12; return h * 60 + Number(m[2]); };
const clock = (mins) => { const h = Math.floor(mins / 60) % 24; const m = mins % 60; const ap = h >= 12 ? 'PM' : 'AM'; return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ap}`; };

// Pickup options for a store: ASAP while open, then half-hour slots until close today; otherwise
// tomorrow's slots. Without hours, ASAP plus a "store confirms" option.
function pickupSlots(details) {
  const now = new Date();
  const todayName = DAYS[now.getDay()];
  const t = now.getHours() * 60 + now.getMinutes();
  const dayHours = (name) => details.hours.find((h) => h.day === name);
  const slotsFor = (h, label, from) => {
    const open = minutesOf(h.open); const close = minutesOf(h.close);
    if (open === null || close === null) return [];
    const out = []; const start = Math.max(open, from); const first = Math.ceil(start / 30) * 30;
    for (let m = first; m + 15 <= close && out.length < 8; m += 30) out.push({ key: `${label}-${m}`, label: `${label} ${clock(m)}` });
    return out;
  };
  const today = dayHours(todayName);
  const status = today ? (() => { const o = minutesOf(today.open); const c = minutesOf(today.close); return o !== null && c !== null && t >= o && t < c; })() : false;
  const opts = [];
  if (status) opts.push({ key: 'asap', label: 'As soon as possible (about 20 minutes)' });
  if (today) opts.push(...slotsFor(today, 'Today', t + 30));
  if (opts.length < 3) { const tm = dayHours(DAYS[(now.getDay() + 1) % 7]); if (tm) opts.push(...slotsFor(tm, 'Tomorrow', 0)); }
  if (!opts.length) opts.push({ key: 'confirm', label: 'Store confirms a time with you' });
  return opts;
}

const loadOrders = () => { try { const v = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
const saveOrders = (list) => { try { localStorage.setItem(ORDERS_KEY, JSON.stringify(list.slice(-20))); } catch { /* storage unavailable */ } };
const orderId = () => `JC-${Date.now().toString(36).toUpperCase().slice(-5)}${Math.floor(Math.random() * 36).toString(36).toUpperCase()}`;

export default function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const groups = useMemo(() => {
    const out = [];
    for (const x of cart.items) { let g = out.find((y) => y.storeSlug === x.storeSlug); if (!g) { const d = storeBySlug(x.storeSlug); g = { store: x.store, storeSlug: x.storeSlug, d, details: d ? detailsFor(x.storeSlug, d) : null, items: [], subtotal: 0 }; out.push(g); } g.items.push(x); g.subtotal += x.qty * x.price; }
    return out;
  }, [cart.items]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '', payment: 'cash', pickup: {} });
  const [errors, setErrors] = useState({});
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const slots = useMemo(() => Object.fromEntries(groups.map((g) => [g.storeSlug, g.details ? pickupSlots(g.details) : [{ key: 'confirm', label: 'Store confirms a time with you' }]])), [groups]);

  if (!cart.items.length) {
    return (
      <div className="co">
        <nav className="dp-crumbs" aria-label="Breadcrumb"><Link to="/dispensaries"><ChevronLeft className="ic14" />Dispensaries</Link></nav>
        <div className="finder-empty co-empty"><Store className="ic24" /><strong>Your cart is empty.</strong><span className="muted small">Add products or deals from any menu, then come back to check out.</span><Link to="/products" className="btn ink sm">Browse products</Link></div>
      </div>
    );
  }

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Your name is needed for pickup.';
    if (!form.phone.trim() && !form.email.trim()) e.phone = 'A phone number or email is needed so the store can reach you.';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'That email does not look right.';
    for (const g of groups) if (!form.pickup[g.storeSlug]) e[`pickup-${g.storeSlug}`] = 'Choose a pickup time.';
    return e;
  };
  const place = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) { document.querySelector('.co-err')?.scrollIntoView({ block: 'center' }); return; }
    const order = {
      id: orderId(), at: new Date().toISOString(),
      contact: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() }, payment: form.payment, notes: form.notes.trim(),
      pickups: groups.map((g) => ({ store: g.store, storeSlug: g.storeSlug, address: g.details ? [g.details.address, g.details.zip].filter(Boolean).join(', ') : '', when: (slots[g.storeSlug].find((s) => s.key === form.pickup[g.storeSlug]) || {}).label || '', items: g.items.map((x) => ({ name: x.name, meta: x.meta, qty: x.qty, price: x.price })), subtotal: g.subtotal })),
      subtotal: cart.subtotal,
    };
    saveOrders([...loadOrders(), order]);
    cart.clear();
    navigate(`/checkout/done/${order.id}`);
  };

  return (
    <div className="co">
      <nav className="dp-crumbs" aria-label="Breadcrumb"><button type="button" className="link" onClick={cart.openCart}><ChevronLeft className="ic14" />Back to cart</button></nav>
      <h1 className="co-title">Checkout</h1>
      <p className="co-note"><Info className="ic14" />Pickup orders only. This preview records the order in your browser and does not send it to the store.</p>
      <form className="co-grid" onSubmit={place} noValidate>
        <div className="co-main">
          {groups.map((g, i) => {
            const status = g.d ? openNow(g.storeSlug) : null;
            return (
              <section key={g.storeSlug || g.store} className="dp-sec co-sec">
                <h2 className="dp-h2"><Store className="ic18" />{groups.length > 1 ? `Pickup ${i + 1} of ${groups.length}: ` : 'Pickup at '}{g.store}</h2>
                {g.d && (
                  <div className="co-store">
                    <Badge tone="ink">{g.d.code}</Badge>
                    <div className="co-store-copy">
                      <span className="co-store-name">{g.store}</span>
                      <span className="muted small"><Pin className="ic14" />{[g.details?.address, g.d.city, g.details?.zip].filter(Boolean).join(', ')}</span>
                      <span className="co-store-foot">{status && <LiveDot off={!status.open}>{status.label}</LiveDot>}{g.details?.phone && <span className="muted small"><Phone className="ic14" />{g.details.phone}</span>}</span>
                    </div>
                    <Link to={`/dispensaries/${g.storeSlug}`} className="link link-sm">Store page</Link>
                  </div>
                )}
                <ul className="co-items">
                  {g.items.map((x) => (
                    <li key={x.key} className="co-item"><span className="co-item-qty">{x.qty}×</span><span className="co-item-copy"><span className="co-item-name">{x.name}</span>{x.meta && <span className="muted small">{x.meta}</span>}</span><span className="co-item-price">{money(x.price * x.qty)}</span></li>
                  ))}
                </ul>
                <fieldset className="co-field">
                  <legend><Clock className="ic14" />Pickup time</legend>
                  <div className="co-slots" role="radiogroup" aria-label={`Pickup time at ${g.store}`}>
                    {slots[g.storeSlug].map((s) => (
                      <button key={s.key} type="button" role="radio" aria-checked={form.pickup[g.storeSlug] === s.key} className={`chip-btn${form.pickup[g.storeSlug] === s.key ? ' on' : ''}`} onClick={() => { set('pickup', { ...form.pickup, [g.storeSlug]: s.key }); setErrors((e) => ({ ...e, [`pickup-${g.storeSlug}`]: undefined })); }}>{s.label}</button>
                    ))}
                  </div>
                  {errors[`pickup-${g.storeSlug}`] && <p className="co-err" role="alert">{errors[`pickup-${g.storeSlug}`]}</p>}
                </fieldset>
              </section>
            );
          })}

          <section className="dp-sec co-sec">
            <h2 className="dp-h2"><Phone className="ic18" />Your details</h2>
            <div className="co-fields">
              <label className="modal-field co-f"><span>Name</span><input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" placeholder="Name for the order" aria-invalid={!!errors.name} />{errors.name && <span className="co-err" role="alert">{errors.name}</span>}</label>
              <label className="modal-field co-f"><span>Phone</span><input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" placeholder="(555) 555-0100" aria-invalid={!!errors.phone} />{errors.phone && <span className="co-err" role="alert">{errors.phone}</span>}</label>
              <label className="modal-field co-f"><span>Email</span><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} />{errors.email && <span className="co-err" role="alert">{errors.email}</span>}</label>
            </div>
            <p className="muted small co-hint">Bring a valid ID. Pickup is in person at the counter.</p>
          </section>

          <section className="dp-sec co-sec">
            <h2 className="dp-h2"><Banknote className="ic18" />Payment at pickup</h2>
            <div className="co-pay" role="radiogroup" aria-label="Payment">
              {[['cash', 'Cash', Banknote], ['debit', 'Debit card', CreditCard]].map(([k, label, Ic]) => (
                <button key={k} type="button" role="radio" aria-checked={form.payment === k} className={`co-pay-opt${form.payment === k ? ' on' : ''}`} onClick={() => set('payment', k)}><Ic className="ic18" /><span>{label}</span>{form.payment === k && <Check className="ic14 co-pay-check" />}</button>
              ))}
            </div>
            <p className="muted small co-hint">You pay the store when you collect. Nothing is charged here.</p>
          </section>

          <section className="dp-sec co-sec">
            <h2 className="dp-h2"><Info className="ic18" />Notes for the store</h2>
            <label className="modal-field co-f"><span className="srl">Notes</span><textarea rows="3" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Anything the store should know (optional)" /></label>
          </section>
        </div>

        <aside className="co-side">
          <div className="dp-card co-summary">
            <h2 className="dp-h3">Order summary</h2>
            <ul className="co-sum-list">
              {groups.map((g) => <li key={g.storeSlug || g.store}><span>{g.store}<span className="muted small"> · {g.items.reduce((n, x) => n + x.qty, 0)} {g.items.reduce((n, x) => n + x.qty, 0) === 1 ? 'item' : 'items'}</span></span><span>{money(g.subtotal)}</span></li>)}
            </ul>
            <div className="co-sum-row"><span>Subtotal</span><span>{money(cart.subtotal)}</span></div>
            <div className="co-sum-row muted small"><span>Taxes and fees</span><span>Set by the store</span></div>
            <div className="co-sum-total"><span>Due at pickup</span><strong>{money(cart.subtotal)}</strong></div>
            <button type="submit" className="btn ink co-place"><Check className="ic14" />Place pickup order</button>
            <button type="button" className="link link-sm" onClick={cart.openCart}>Edit cart</button>
          </div>
        </aside>
      </form>
    </div>
  );
}

export function OrderDonePage() {
  const { id } = useParams();
  const order = loadOrders().find((o) => o.id === id);
  if (!order) return <Navigate to="/checkout" replace />;
  const placed = new Date(order.at);
  return (
    <div className="co co-done">
      <div className="co-done-head">
        <span className="co-done-ic"><Check className="ic24" /></span>
        <h1 className="co-title">Order placed</h1>
        <p className="muted">Order <strong>{order.id}</strong> · {placed.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at {placed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
        <p className="co-note"><Info className="ic14" />Recorded in this browser only. In the live product the store would confirm by text or email.</p>
      </div>
      <div className="co-done-grid">
        {order.pickups.map((p) => (
          <section key={p.storeSlug || p.store} className="dp-sec co-sec">
            <h2 className="dp-h2"><Store className="ic18" />{p.store}</h2>
            {p.address && <p className="muted small co-done-line"><Pin className="ic14" />{p.address}</p>}
            {p.when && <p className="co-done-line"><Clock className="ic14" />Pickup: <strong>{p.when}</strong></p>}
            <ul className="co-items">
              {p.items.map((x, i) => <li key={i} className="co-item"><span className="co-item-qty">{x.qty}×</span><span className="co-item-copy"><span className="co-item-name">{x.name}</span>{x.meta && <span className="muted small">{x.meta}</span>}</span><span className="co-item-price">{money(x.price * x.qty)}</span></li>)}
            </ul>
            <div className="co-sum-total"><span>Due at pickup · {order.payment === 'cash' ? 'cash' : 'debit card'}</span><strong>{money(p.subtotal)}</strong></div>
            {p.storeSlug && <Link to={`/dispensaries/${p.storeSlug}`} className="btn ghost sm">Store page and directions</Link>}
          </section>
        ))}
        <section className="dp-sec co-sec">
          <h2 className="dp-h2"><Phone className="ic18" />Contact</h2>
          <p className="co-done-line">{order.contact.name}</p>
          {order.contact.phone && <p className="muted small co-done-line">{order.contact.phone}</p>}
          {order.contact.email && <p className="muted small co-done-line">{order.contact.email}</p>}
          {order.notes && <p className="muted small co-done-line">Notes: {order.notes}</p>}
          <Link to="/" className="btn ink sm">Back to home</Link>
        </section>
      </div>
    </div>
  );
}
