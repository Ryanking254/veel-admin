'use client';

import { useEffect, useRef, useState } from 'react';
import './globals.css';
import {
  ADMIN_OK_KEY,
  ADMIN_PASSCODE,
  AUDIENCES,
  CATEGORIES,
  DEFAULT_PRODUCTS,
  STATUSES,
  fetchOrders,
  fetchProducts,
  isBackend,
  removeOrder,
  removeProduct,
  resetProducts,
  setOrderStatus,
  slugId,
  uploadProductImage,
  upsertProduct,
} from './lib/backend';

const EMPTY_FORM = {
  name: '',
  brand: 'Veel',
  price: '',
  was: '',
  size: 'M',
  category: 'Clothing',
  audience: 'Unisex',
  desc: '',
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [tab, setTab] = useState('products');
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [imgError, setImgError] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const reloadProducts = async () => {
    try {
      const list = await fetchProducts();
      setItems(list == null ? DEFAULT_PRODUCTS : list);
    } catch {
      setMsg('Could not load products — check your connection.');
    }
  };

  const reloadOrders = async () => {
    try {
      setOrders(await fetchOrders());
    } catch {
      setMsg('Could not load orders — check your connection.');
    }
  };

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(ADMIN_OK_KEY) === '1') setAuthed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    Promise.all([reloadProducts(), reloadOrders()]).finally(() => setLoading(false));
  }, [authed]);

  // Live-ish inbox: refresh orders every 15s while on the orders tab.
  useEffect(() => {
    if (!authed || tab !== 'orders') return;
    const t = setInterval(reloadOrders, 15000);
    return () => clearInterval(t);
  }, [authed, tab]);

  const unlock = (e) => {
    e.preventDefault();
    if (code.trim() === ADMIN_PASSCODE) {
      try {
        window.sessionStorage.setItem(ADMIN_OK_KEY, '1');
      } catch {
        /* ignore */
      }
      setAuthed(true);
      setCodeError('');
    } else {
      setCodeError('Wrong passcode — ask Veel for the correct one.');
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onFile = (file) => {
    setImgError('');
    setPhotoFile(null);
    if (!file) {
      if (!editingId) setPhotoPreview('');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setImgError('Please choose an image file.');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const startAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPhotoFile(null);
    setPhotoPreview('');
    setImgError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name || '',
      brand: p.brand || 'Veel',
      price: String(p.price ?? ''),
      was: p.was == null ? '' : String(p.was),
      size: p.size || 'M',
      category: p.category || 'Clothing',
      audience: p.audience || 'Unisex',
      desc: p.desc || '',
    });
    setPhotoFile(null);
    setPhotoPreview(p.img || '');
    setImgError('');
    if (fileRef.current) fileRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitProduct = async (e) => {
    e.preventDefault();
    const price = Number(form.price);
    const was = form.was === '' ? null : Number(form.was);
    if (!form.name.trim()) return setMsg('Give the item a name.');
    if (!Number.isFinite(price) || price <= 0) return setMsg('Enter a valid price.');
    if (form.was !== '' && (!Number.isFinite(was) || was <= 0))
      return setMsg('Enter a valid old price (or leave it empty).');
    if (!photoFile && !photoPreview) return setMsg('Add a photo of the item.');
    setSaving(true);
    setMsg('');
    try {
      let img = photoPreview;
      if (photoFile) img = await uploadProductImage(photoFile);
      const product = {
        id: editingId || slugId(form.name),
        name: form.name.trim(),
        brand: form.brand.trim() || 'Veel',
        price: Math.round(price),
        was: was == null ? null : Math.round(was),
        size: form.size.trim() || 'M',
        category: form.category,
        audience: form.audience,
        img,
        alt: form.name.trim(),
        desc: form.desc.trim(),
      };
      await upsertProduct(product);
      await reloadProducts();
      setMsg(editingId ? 'Item updated — live on the shop now.' : 'Item added — live on the shop now.');
      startAdd();
    } catch (err) {
      setMsg(err?.message || 'Could not save — check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Remove this item from the shop?')) return;
    try {
      await removeProduct(id);
      await reloadProducts();
      setMsg('Item removed.');
    } catch {
      setMsg('Could not delete — check your connection.');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset the shop back to the original 8 items?')) return;
    try {
      setItems(await resetProducts());
      startAdd();
      setMsg('Catalog reset to defaults.');
    } catch {
      setMsg('Could not reset — check your connection.');
    }
  };

  if (!authed) {
    return (
      <div className="adm-wrap">
        <div className="adm-gate">
          <h1>Veel Admin</h1>
          <p className="muted">Enter the shop passcode to manage products and orders.</p>
          <form onSubmit={unlock} className="adm-gate-form">
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Passcode"
              aria-label="Admin passcode"
            />
            <button type="submit" className="pill-btn dark">Unlock</button>
          </form>
          {codeError && <p className="adm-err">{codeError}</p>}
        </div>
      </div>
    );
  }

  const newCount = orders.filter((o) => (o.status || 'New') === 'New').length;

  return (
    <div className="adm-wrap">
      <header className="adm-head">
        <span className="adm-brand">
          <strong>Veel Admin</strong>
          <span className={`adm-status ${isBackend ? 'on' : 'off'}`}>
            {isBackend ? '● Connected — shop syncs live' : '● Local mode — set up Supabase to sync'}
          </span>
        </span>
        <div className="seg">
          <button className={tab === 'products' ? 'on' : ''} onClick={() => setTab('products')}>
            Products ({items.length})
          </button>
          <button
            className={tab === 'orders' ? 'on' : ''}
            onClick={() => {
              setTab('orders');
              reloadOrders();
            }}
          >
            Orders ({orders.length}{newCount ? ` · ${newCount} new` : ''})
          </button>
        </div>
      </header>

      {msg && (
        <p className="adm-msg" role="status">
          {msg} <button className="link" onClick={() => setMsg('')}>Dismiss</button>
        </p>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : tab === 'products' ? (
        <>
          <section className="adm-card">
            <h2>{editingId ? 'Edit item' : 'Add a new item'}</h2>
            <form onSubmit={submitProduct} className="adm-form">
              <div className="adm-photo">
                {photoPreview ? (
                  <img src={photoPreview} alt="Item preview" />
                ) : (
                  <span className="muted">Photo preview</span>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFile(e.target.files?.[0])}
                  aria-label="Item photo"
                />
                {imgError && <p className="adm-err">{imgError}</p>}
              </div>
              <div className="adm-fields">
                <label>Item name*<input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Vintage denim jacket" /></label>
                <label>Description<textarea value={form.desc} onChange={(e) => set('desc', e.target.value)} placeholder="Condition, fit, fabric — what should shoppers know?" rows={3} /></label>
                <div className="adm-row">
                  <label>Brand<input value={form.brand} onChange={(e) => set('brand', e.target.value)} /></label>
                  <label>Size<input value={form.size} onChange={(e) => set('size', e.target.value)} placeholder="M / UK 9…" /></label>
                </div>
                <div className="adm-row">
                  <label>Price ($)*<input type="number" min="1" value={form.price} onChange={(e) => set('price', e.target.value)} /></label>
                  <label>Old price ($)<input type="number" min="0" value={form.was} onChange={(e) => set('was', e.target.value)} placeholder="Optional" /></label>
                </div>
                <div className="adm-row">
                  <label>Category
                    <select value={form.category} onChange={(e) => set('category', e.target.value)}>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>Section
                    <select value={form.audience} onChange={(e) => set('audience', e.target.value)}>
                      {AUDIENCES.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="adm-actions">
                  <button type="submit" className="pill-btn dark" disabled={saving}>
                    {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add to shop'}
                  </button>
                  {editingId && (
                    <button type="button" className="pill-btn" onClick={startAdd}>Cancel edit</button>
                  )}
                  <button type="button" className="link danger" onClick={handleReset}>Reset to defaults</button>
                </div>
              </div>
            </form>
          </section>

          <section className="adm-list">
            {items.map((p) => (
              <article key={p.id} className="adm-item">
                <img src={p.img} alt="" />
                <div>
                  <strong>{p.name}</strong>
                  <span className="muted">{p.brand} · {p.category} · {p.audience} · {p.size} · ${p.price}</span>
                </div>
                <div className="adm-item-btns">
                  <button className="pill-btn" onClick={() => startEdit(p)}>Edit</button>
                  <button className="link danger" onClick={() => handleDeleteProduct(p.id)}>Delete</button>
                </div>
              </article>
            ))}
            {items.length === 0 && <p className="muted">No items yet — add your first find above.</p>}
          </section>
        </>
      ) : (
        <section className="adm-card">
          <div className="adm-orders-head">
            <h2>Customer orders</h2>
            <button className="pill-btn" onClick={reloadOrders}>Refresh</button>
          </div>
          {orders.length === 0 && (
            <p className="muted">No orders yet. New guest checkouts (phone + location) will appear here.</p>
          )}
          {orders.map((o) => (
            <article key={o.ref} className={`adm-order ${(o.status || 'New') === 'New' ? 'fresh' : ''}`}>
              <div className="adm-order-top">
                <strong>{o.ref}</strong>
                {(o.status || 'New') === 'New' && <span className="adm-new">NEW</span>}
                <span className="muted">
                  {o.date ? new Date(o.date).toLocaleString() : ''} · ${Number(o.subtotal || 0).toFixed(0)}
                </span>
                <select
                  value={o.status || 'New'}
                  onChange={async (e) => {
                    try {
                      setOrders(await setOrderStatus(o.ref, e.target.value));
                    } catch {
                      setMsg('Could not update status — check your connection.');
                    }
                  }}
                  aria-label={`Status for order ${o.ref}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <p className="adm-order-contact">
                📞 <a href={`tel:${(o.phone || '').replace(/\s+/g, '')}`}>{o.phone}</a>
                {'  '}· 📍 {o.location}
                {o.note ? <span className="muted"> · “{o.note}”</span> : null}
              </p>
              <ul className="adm-order-items">
                {(o.items || []).map((it, i) => (
                  <li key={i}>{it.qty}× {it.name} ({it.size}) — ${(it.price * it.qty).toFixed(0)}</li>
                ))}
              </ul>
              <button
                className="link danger"
                onClick={async () => {
                  if (!window.confirm(`Delete order ${o.ref}?`)) return;
                  try {
                    setOrders(await removeOrder(o.ref));
                  } catch {
                    setMsg('Could not delete — check your connection.');
                  }
                }}
              >
                Delete order
              </button>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
