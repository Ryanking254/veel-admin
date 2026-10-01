// Admin backend: Supabase when configured, on-device storage otherwise.
// Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example).
// Until then, everything works locally in this browser only.

import { createClient } from '@supabase/supabase-js';

export const CATEGORIES = ['Clothing', 'Shoes', 'Accessories', 'Activewear', 'Gifts & Living'];
export const AUDIENCES = ['Women', 'Men', 'Unisex'];
export const STATUSES = ['New', 'Confirmed', 'Delivered', 'Cancelled'];

const CATALOG_KEY = 'veel-catalog-v1';
const ORDERS_KEY = 'veel-orders-v1';

export const ADMIN_OK_KEY = 'veel-admin-ok';
export const ADMIN_PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || 'veel2026';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isBackend = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let client = null;
export function backend() {
  if (!isBackend) return null;
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}

export const DEFAULT_PRODUCTS = [
  {
    id: 'adidas-lxcon',
    name: 'Adidas Originals LXCON 94 trainers in white',
    brand: 'Adidas',
    price: 42,
    was: 89,
    size: 'UK 7',
    category: 'Shoes',
    audience: 'Unisex',
    img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=600&auto=format&fit=crop',
    alt: 'Adidas LXCON 94 colourful trainers',
    desc: 'Colourful retro LXCON 94 runners, lightly worn with plenty of life left. Wiped down and laced fresh.',
  },
  {
    id: 'khaki-joggers',
    name: 'Lightweight super skinny joggers in light khaki',
    brand: 'Veel Basics',
    price: 18,
    was: null,
    size: 'M',
    category: 'Activewear',
    audience: 'Men',
    img: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?q=80&w=600&auto=format&fit=crop',
    alt: 'Person walking in light khaki joggers and trainers',
    desc: 'Featherlight skinny joggers in light khaki. Soft, stretchy, perfect for everyday runs and rest days.',
  },
  {
    id: 'orange-scarf',
    name: 'Chunky burnt-orange wool thrift scarf',
    brand: 'Vintage',
    price: 12,
    was: 24,
    size: 'One size',
    category: 'Accessories',
    audience: 'Women',
    img: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?q=80&w=600&auto=format&fit=crop',
    alt: 'Model wearing burnt orange scarf',
    desc: 'Chunky burnt-orange wool scarf, pre-loved and extra cosy. The pop of colour every winter fit needs.',
  },
  {
    id: 'white-sneakers',
    name: 'Clean white leather low-top sneakers',
    brand: 'Nike',
    price: 35,
    was: 70,
    size: 'UK 9',
    category: 'Shoes',
    audience: 'Men',
    img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop',
    alt: 'White Nike sneaker',
    desc: 'Crisp white leather low-tops, gently worn and deep-cleaned. Goes with everything.',
  },
  {
    id: 'lilac-puffer',
    name: 'Lilac cropped puffer — Winter Weekends edit',
    brand: 'Veel Rework',
    price: 55,
    was: null,
    size: 'S',
    category: 'Clothing',
    audience: 'Women',
    img: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=600&auto=format&fit=crop',
    alt: 'Model in lilac puffer jacket',
    desc: 'Cropped lilac puffer from our Rework edit. Warm, light and easy to throw over anything.',
  },
  {
    id: 'mustard-knit',
    name: 'Mustard vintage work jacket — knitwear layer',
    brand: 'Vintage',
    price: 24,
    was: 48,
    size: 'L',
    category: 'Clothing',
    audience: 'Women',
    img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop',
    alt: 'Model in mustard jacket',
    desc: 'Vintage mustard work jacket, broken in beautifully. A layering hero for knit season.',
  },
  {
    id: 'corduroy-overshirt',
    name: 'Corduroy overshirt in rust — texture edit',
    brand: 'Veel Rework',
    price: 28,
    was: null,
    size: 'M',
    category: 'Clothing',
    audience: 'Men',
    img: 'https://images.unsplash.com/photo-1520975661595-6453be3f7070?q=80&w=600&auto=format&fit=crop',
    alt: 'Model in rust corduroy overshirt',
    desc: 'Rust corduroy overshirt with that perfect worn-in texture. Wear open or buttoned.',
  },
  {
    id: 'thrift-bundle',
    name: 'Thrift bundle: 3 vintage tees + canvas tote',
    brand: 'Veel Bundle',
    price: 16,
    was: 32,
    size: 'M–L',
    category: 'Gifts & Living',
    audience: 'Unisex',
    img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=600&auto=format&fit=crop',
    alt: 'Folded vintage t-shirts',
    desc: 'Three hand-picked vintage tees plus a canvas tote. Best-value way to start your thrift rotation.',
  },
];

/* ------------------------------ storage ------------------------------ */

function readKey(key) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeKey(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------ products ----------------------------- */

/** null = nothing saved yet (caller seeds defaults); [] = saved empty. */
export async function fetchProducts() {
  const sb = backend();
  if (!sb) return readKey(CATALOG_KEY);
  const { data, error } = await sb
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand || 'Veel',
    price: Number(p.price),
    was: p.was == null ? null : Number(p.was),
    size: p.size || 'M',
    category: p.category,
    audience: p.audience || 'Unisex',
    img: p.img,
    alt: p.alt || p.name,
    desc: p.desc || '',
  }));
}

export async function upsertProduct(product) {
  const sb = backend();
  if (!sb) {
    const list = readKey(CATALOG_KEY) || [];
    const i = list.findIndex((p) => p.id === product.id);
    const next = i >= 0 ? list.map((p) => (p.id === product.id ? product : p)) : [product, ...list];
    if (!writeKey(CATALOG_KEY, next)) throw new Error('Browser storage is full — use a smaller photo.');
    return product;
  }
  const { error } = await sb.from('products').upsert(
    {
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      was: product.was,
      size: product.size,
      category: product.category,
      audience: product.audience,
      img: product.img,
      alt: product.alt,
      desc: product.desc,
    },
    { onConflict: 'id' }
  );
  if (error) throw error;
  return product;
}

export async function removeProduct(id) {
  const sb = backend();
  if (!sb) {
    const list = readKey(CATALOG_KEY) || [];
    writeKey(
      CATALOG_KEY,
      list.filter((p) => p.id !== id)
    );
    return;
  }
  const { error } = await sb.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function resetProducts() {
  const sb = backend();
  if (!sb) {
    try {
      window.localStorage.removeItem(CATALOG_KEY);
    } catch {
      /* ignore */
    }
    return DEFAULT_PRODUCTS;
  }
  const current = await fetchProducts();
  for (const p of current || []) {
    await removeProduct(p.id);
  }
  for (const p of DEFAULT_PRODUCTS) {
    await upsertProduct({ ...p });
  }
  return fetchProducts();
}

/** Upload a product photo. Returns a URL. Offline: embedded data URL. */
export async function uploadProductImage(file) {
  const sb = backend();
  if (!sb) return fileToDataUrl(file);
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().slice(0, 4);
  const path = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from('product-images').upload(path, file, {
    contentType: file.type || 'image/jpeg',
  });
  if (error) throw error;
  const { data } = sb.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

/** Downscale an uploaded image to a compact data URL (local mode). */
export function fileToDataUrl(file, maxDim = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image'));
    };
    img.src = url;
  });
}

export function slugId(name) {
  const slug =
    String(name || 'item')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'item';
  return `${slug}-${Date.now().toString(36)}`;
}

/* ------------------------------- orders ------------------------------ */

export async function fetchOrders() {
  const sb = backend();
  if (!sb) {
    const list = readKey(ORDERS_KEY);
    return Array.isArray(list) ? list : [];
  }
  const { data, error } = await sb
    .from('orders')
    .select('*')
    .order('date', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data || []).map((o) => ({
    ref: o.ref,
    date: o.date,
    items: o.items || [],
    subtotal: Number(o.subtotal),
    phone: o.phone,
    location: o.location,
    note: o.note || '',
    status: o.status || 'New',
  }));
}

export async function setOrderStatus(ref, status) {
  const sb = backend();
  if (!sb) {
    const list = readKey(ORDERS_KEY) || [];
    const next = list.map((o) => (o.ref === ref ? { ...o, status } : o));
    writeKey(ORDERS_KEY, next);
    return next;
  }
  const { error } = await sb.from('orders').update({ status }).eq('ref', ref);
  if (error) throw error;
  return fetchOrders();
}

export async function removeOrder(ref) {
  const sb = backend();
  if (!sb) {
    const list = readKey(ORDERS_KEY) || [];
    const next = list.filter((o) => o.ref !== ref);
    writeKey(ORDERS_KEY, next);
    return next;
  }
  const { error } = await sb.from('orders').delete().eq('ref', ref);
  if (error) throw error;
  return fetchOrders();
}
