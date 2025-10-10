// Minimal admin integration for products/users with cookies
async function safeJson(res) {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const t = await res.text();
    throw new Error(`Non-JSON response: ${t.slice(0,200)}`);
  }
  return res.json();
}

async function loadProducts() {
  const r = await fetch('/api/admin/products', { credentials: 'include' });
  const d = await safeJson(r);
  const list = d.products || d || [];
  const el = document.getElementById('products-list');
  if (!list.length) { el.innerHTML = '<p class="no-products">No products</p>'; return; }
  el.innerHTML = list.map(p => `<div>${p.name} - $${Number(p.price).toFixed(2)}</div>`).join('');
}

async function addProduct(payload) {
  const r = await fetch('/api/admin/products', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    credentials:'include',
    body: JSON.stringify(payload)
  });
  const d = await safeJson(r);
  if (!r.ok || d.success === false) throw new Error(d.error || 'Failed');
  await loadProducts();
}

// example hook if form exists
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('products-list')) loadProducts();
});
