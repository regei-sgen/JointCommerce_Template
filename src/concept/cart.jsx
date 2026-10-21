// Cart: a React context holding line items (persisted in localStorage under `jc.cart`), the drawer that
// lists them grouped by store with quantity controls, the top-bar button with a count, an Add button for
// rows, and a short toast after each add. Checkout is not wired: each store group links to that store's
// menu on its page.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Cart as CartIcon, Close, Check, Store } from '../icons.jsx';

const KEY = 'jc.cart';
const CartContext = createContext(null);

const load = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.filter((x) => x && x.key && x.qty > 0) : []; } catch { return []; } };
const save = (items) => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable */ } };

// A product or deal row becomes a line: key, name, meta, price, was, store, storeSlug, category.
export const lineFrom = (item) => ({
  key: item.slug, name: item.name, meta: item.meta || '', price: Number(item.price) || 0, was: item.was ? Number(item.was) : null,
  store: item.store || '', storeSlug: item.storeSlug || '', category: item.category || '',
});

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null); // { name, at }
  const timer = useRef(0);
  useEffect(() => { save(items); }, [items]);

  const add = useCallback((item, qty = 1) => {
    const line = lineFrom(item);
    setItems((prev) => {
      const i = prev.findIndex((x) => x.key === line.key);
      if (i < 0) return [...prev, { ...line, qty }];
      const next = prev.slice(); next[i] = { ...next[i], qty: next[i].qty + qty }; return next;
    });
    window.clearTimeout(timer.current);
    setToast({ name: line.name, at: Date.now() });
    timer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);
  const setQty = useCallback((key, qty) => setItems((prev) => (qty > 0 ? prev.map((x) => (x.key === key ? { ...x, qty } : x)) : prev.filter((x) => x.key !== key))), []);
  const remove = useCallback((key) => setItems((prev) => prev.filter((x) => x.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => { setOpen(true); setToast(null); }, []);
  const closeCart = useCallback(() => setOpen(false), []);

  const value = useMemo(() => {
    const count = items.reduce((n, x) => n + x.qty, 0);
    const subtotal = items.reduce((n, x) => n + x.qty * x.price, 0);
    const qtyOf = (key) => (items.find((x) => x.key === key) || { qty: 0 }).qty;
    return { items, count, subtotal, qtyOf, add, setQty, remove, clear, open, openCart, closeCart, toast };
  }, [items, add, setQty, remove, clear, open, openCart, closeCart, toast]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
      <CartToast />
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

const money = (n) => `$${(Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '')}`;

// Top-bar button: bag icon with the line count.
export function CartButton({ className = '' }) {
  const cart = useCart();
  if (!cart) return null;
  return (
    <button type="button" className={`btn plain sm cx-cart ${className}`} onClick={cart.openCart} aria-label={`Cart, ${cart.count} ${cart.count === 1 ? 'item' : 'items'}`}>
      <CartIcon className="ic14" /><span className="cx-cart-text">Cart</span>
      {cart.count > 0 && <span className="cx-cart-n" aria-hidden="true">{cart.count > 99 ? '99+' : cart.count}</span>}
    </button>
  );
}

// Add button for a product or deal. Stops the click from reaching a surrounding link.
export function AddButton({ item, className = '', label = 'Add' }) {
  const cart = useCart();
  if (!cart || !(item.price > 0)) return null;
  const n = cart.qtyOf(item.slug);
  return (
    <button type="button" className={`btn sm menu-add ${className}`} aria-label={`Add ${item.name} to cart`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); cart.add(item); }}>
      <Check className="ic14" />{n > 0 ? `In cart · ${n}` : label}
    </button>
  );
}

function CartDrawer() {
  const cart = useCart();
  const navigate = useNavigate();
  const panel = useRef(null);
  const opener = useRef(null);
  const { open, closeCart } = cart;
  useEffect(() => {
    if (!open) return undefined;
    opener.current = document.activeElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeCart(); } };
    document.addEventListener('keydown', onKey, true);
    const t = window.setTimeout(() => panel.current?.querySelector('button, [href]')?.focus(), 30);
    return () => { document.removeEventListener('keydown', onKey, true); document.body.style.overflow = prev; window.clearTimeout(t); opener.current?.focus?.(); };
  }, [open, closeCart]);
  if (!open) return null;

  const groups = [];
  for (const x of cart.items) { let g = groups.find((y) => y.storeSlug === x.storeSlug); if (!g) { g = { store: x.store, storeSlug: x.storeSlug, items: [] }; groups.push(g); } g.items.push(x); }

  return createPortal(
    <div className="cart-root" onMouseDown={(e) => { if (e.target === e.currentTarget) closeCart(); }}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" ref={panel}>
        <header className="cart-head">
          <h2 id="cart-title" className="cart-title"><CartIcon className="ic18" />Your cart<span className="dcount">{cart.count}</span></h2>
          <button type="button" className="modal-close cart-close" aria-label="Close" onClick={closeCart}><Close className="ic18" /></button>
        </header>
        <div className="cart-body">
          {groups.length === 0 ? (
            <div className="finder-empty cart-empty"><CartIcon className="ic24" /><strong>Your cart is empty.</strong><span className="muted small">Add products or deals from any menu.</span></div>
          ) : groups.map((g) => (
            <section key={g.storeSlug || g.store} className="cart-store">
              <h3 className="cart-store-name"><Store className="ic14" />{g.storeSlug ? <Link to={`/dispensaries/${g.storeSlug}`} onClick={closeCart}>{g.store}</Link> : g.store}</h3>
              <ul className="cart-list">
                {g.items.map((x) => (
                  <li key={x.key} className="cart-item">
                    <div className="cart-item-copy">
                      <span className="cart-item-name">{x.name}</span>
                      {x.meta && <span className="cart-item-meta">{x.meta}</span>}
                    </div>
                    <div className="cart-qty" role="group" aria-label={`Quantity of ${x.name}`}>
                      <button type="button" aria-label="Remove one" onClick={() => cart.setQty(x.key, x.qty - 1)}>−</button>
                      <span aria-live="polite">{x.qty}</span>
                      <button type="button" aria-label="Add one" onClick={() => cart.setQty(x.key, x.qty + 1)}>+</button>
                    </div>
                    <span className="cart-item-price"><strong>{money(x.price * x.qty)}</strong>{x.was && <s>{money(x.was * x.qty)}</s>}</span>
                    <button type="button" className="cart-remove" aria-label={`Remove ${x.name}`} onClick={() => cart.remove(x.key)}><Close className="ic14" /></button>
                  </li>
                ))}
              </ul>
              {g.storeSlug && <Link to={`/dispensaries/${g.storeSlug}#menu`} className="link link-sm" onClick={closeCart}>Order from {g.store}</Link>}
            </section>
          ))}
        </div>
        {groups.length > 0 && (
          <footer className="cart-foot">
            <div className="cart-sub"><span>Subtotal</span><strong>{money(cart.subtotal)}</strong></div>
            <p className="muted small">Taxes and pickup details are set by each store when you order.</p>
            <div className="cart-actions">
              <button type="button" className="btn ghost sm" onClick={closeCart}>Keep browsing</button>
              <button type="button" className="link link-sm cart-clear" onClick={cart.clear}>Clear cart</button>
              <button type="button" className="btn ink sm" onClick={() => { closeCart(); navigate('/checkout'); }}>Checkout</button>
            </div>
          </footer>
        )}
      </aside>
    </div>,
    document.body,
  );
}

function CartToast() {
  const cart = useCart();
  if (!cart.toast || cart.open) return null;
  return createPortal(
    <div className="cart-toast" role="status" aria-live="polite">
      <Check className="ic14" /><span>Added <strong>{cart.toast.name}</strong></span>
      <button type="button" className="link link-sm" onClick={cart.openCart}>View cart</button>
    </div>,
    document.body,
  );
}
